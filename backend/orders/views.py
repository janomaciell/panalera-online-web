import hmac
import hashlib
import mercadopago
import logging
from decimal import Decimal
from django.conf import settings
from django.db import transaction
from django.db.models import F
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from products.models import Product
from shipping.models import ShippingCycle
from .models import Order, OrderItem, Shipment
from .serializers import OrderSerializer, CreateOrderSerializer
from services.email_service import (
    send_order_confirmed,
    send_order_scheduled,
    send_order_shipped,
    send_order_delivered,
)

logger = logging.getLogger(__name__)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _build_mp_preference(order, items):
    """Build MercadoPago preference object."""
    sdk = mercadopago.SDK(settings.MP_ACCESS_TOKEN)
    mp_items = []
    for item in items:
        mp_items.append({
            'id':         str(item.product.id),
            'title':      item.product.title,
            'quantity':   item.quantity,
            'unit_price': float(item.price),
            'currency_id': 'ARS',
        })
    if order.shipping_price > 0:
        mp_items.append({
            'id':         'shipping',
            'title':      f'Envío a {order.shipping_city}',
            'quantity':   1,
            'unit_price': float(order.shipping_price),
            'currency_id': 'ARS',
        })

    frontend_url = settings.FRONTEND_URL
    backend_url  = getattr(settings, 'BACKEND_URL', None)

    # MercadoPago requires valid URLs — no localhost in production
    if settings.DEBUG and frontend_url.startswith('http://localhost'):
        frontend_url = frontend_url.replace('http://', 'https://')

    # notification_url must be an absolute URL
    if backend_url:
        notification_url = f'{backend_url}/api/orders/webhook/'
    else:
        notification_url = None

    preference_data = {
        'items': mp_items,
        'payer': {
            'email': order.contact_email,
            'name':  order.shipping_name,
        },
        'back_urls': {
            'success': f'{frontend_url}/checkout/exito?order={order.id}',
            'failure': f'{frontend_url}/checkout?error=1',
            'pending': f'{frontend_url}/checkout/exito?order={order.id}&pending=1',
        },
        'auto_return':        'approved',
        'external_reference': str(order.id),
    }
    if notification_url:
        preference_data['notification_url'] = notification_url

    result = sdk.preference().create(preference_data)
    return result['response']


def _verify_mp_signature(request) -> bool:
    """
    Verifica la firma del webhook de MercadoPago usando x-signature header.
    Si el secreto no está configurado, permite el paso (modo dev).
    Ref: https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks
    """
    secret = settings.MP_WEBHOOK_SECRET
    if not secret:
        logger.warning('[MP-WEBHOOK] MP_WEBHOOK_SECRET no configurado — saltando verificación de firma.')
        return True

    signature_header = request.headers.get('x-signature', '')
    request_id      = request.headers.get('x-request-id', '')

    # Extraer ts y v1 del header
    ts = ''
    v1 = ''
    for part in signature_header.split(','):
        if '=' in part:
            k, v = part.strip().split('=', 1)
            if k == 'ts':
                ts = v
            elif k == 'v1':
                v1 = v

    if not ts or not v1:
        return False

    data_id   = request.GET.get('data.id', '')
    template  = f'id:{data_id};request-id:{request_id};ts:{ts};'
    expected  = hmac.new(
        secret.encode(), template.encode(), hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, v1)


# ── Views ─────────────────────────────────────────────────────────────────────

class CreateOrderView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = CreateOrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # ── Validate coupon (if provided) ─────────────────────────────────
        coupon         = None
        coupon_code    = data.get('coupon_code', '').strip().upper()
        discount_amount = Decimal('0')

        if coupon_code:
            from crm.models import Coupon
            try:
                coupon = Coupon.objects.get(code=coupon_code, is_active=True)
                # Rough subtotal check (will be recalculated below)
                rough_subtotal = sum(
                    Decimal(str(i.get('quantity', 1))) for i in data['items']
                )
                valid, msg = coupon.is_valid(
                    user=request.user if request.user.is_authenticated else None,
                    order_total=rough_subtotal,
                )
                if not valid:
                    return Response({'error': f'Cupón inválido: {msg}'}, status=400)
            except Coupon.DoesNotExist:
                return Response({'error': 'Cupón no encontrado.'}, status=400)

        # ── Validate items & stock atomically ─────────────────────────────
        with transaction.atomic():
            item_objects = []
            for item_data in data['items']:
                try:
                    # select_for_update locks the row — prevents race conditions
                    product = Product.objects.select_for_update().get(
                        id=item_data['product'], is_active=True
                    )
                except Product.DoesNotExist:
                    return Response(
                        {'error': f'Producto {item_data["product"]} no encontrado.'},
                        status=400,
                    )
                if product.stock < item_data['quantity']:
                    return Response(
                        {'error': f'Stock insuficiente para {product.title}. Disponible: {product.stock}.'},
                        status=400,
                    )
                item_objects.append((product, item_data['quantity'], product.price))

            # ── Calculate totals ──────────────────────────────────────────
            subtotal = sum(p.price * qty for p, qty, _ in item_objects)
            shipping  = Decimal(str(data['shipping_price']))

            if coupon:
                discount_amount = Decimal(str(coupon.calculate_discount(subtotal)))

            total = subtotal + shipping - discount_amount

            # ── Determine shipping zone ───────────────────────────────────
            zone = None
            if not data.get('is_pickup', False):
                city = data.get('shipping_city', '').strip().lower()
                postal_code = data.get('shipping_postal', '').strip()
                from shipping.models import ShippingZone
                if city:
                    zone = ShippingZone.objects.filter(
                        city_name__iexact=city, is_active=True
                    ).first()
                if not zone and postal_code:
                    for z in ShippingZone.objects.filter(is_active=True):
                        if postal_code in (z.postal_codes or []):
                            zone = z
                            break

            # ── Get next open cycle ───────────────────────────────────────
            cycle = ShippingCycle.get_next_open()

            # ── Create order ──────────────────────────────────────────────
            order = Order.objects.create(
                user             = request.user if request.user.is_authenticated else None,
                guest_email      = data.get('guest_email', ''),
                guest_phone      = data.get('guest_phone', ''),
                shipping_name    = data['shipping_name'],
                shipping_address = data.get('shipping_address', ''),
                shipping_floor   = data.get('shipping_floor', ''),
                shipping_city    = data.get('shipping_city', ''),
                shipping_province= data.get('shipping_province', ''),
                shipping_postal  = data.get('shipping_postal', ''),
                shipping_phone   = data.get('shipping_phone', ''),
                shipping_price   = shipping,
                is_pickup        = data.get('is_pickup', False),
                recipient_type   = data.get('recipient_type', 'particular'),
                institution_name = data.get('institution_name', ''),
                room_number      = data.get('room_number', ''),
                preferred_slot   = data.get('preferred_slot', ''),
                subtotal         = subtotal,
                discount_amount  = discount_amount,
                total            = total,
                coupon_code      = coupon_code,
                shipping_zone    = zone,
                shipping_cycle   = cycle,
                notes            = data.get('notes', ''),
            )

            # ── Create items (stock NOT deducted yet — deducted on payment) ─
            for product, quantity, price in item_objects:
                OrderItem.objects.create(order=order, product=product, quantity=quantity, price=price)

            # ── Create shipment record ────────────────────────────────────
            Shipment.objects.create(order=order)

            # ── Increment coupon usage counter ────────────────────────────
            if coupon:
                Coupon.objects.filter(pk=coupon.pk).update(current_uses=F('current_uses') + 1)

        # ── Build MercadoPago preference (outside atomic to avoid MP timeout holding lock) ──
        response_data = OrderSerializer(order).data
        mp_token = settings.MP_ACCESS_TOKEN
        is_real_token = (
            mp_token
            and not mp_token.startswith('APP_USR-0000')
            and 'xxxxxxxx' not in mp_token
        )
        if is_real_token:
            try:
                pref = _build_mp_preference(order, order.items.select_related('product'))
                if pref.get('id'):
                    order.mp_preference_id = pref['id']
                    order.save(update_fields=['mp_preference_id'])

                    sandbox_mode = settings.MP_SANDBOX_MODE
                    response_data['mp_sandbox_mode'] = sandbox_mode
                    response_data['mp_public_key']   = settings.MP_PUBLIC_KEY

                    if sandbox_mode:
                        # En modo sandbox, usar siempre sandbox_init_point
                        response_data['mp_init_point']    = pref.get('sandbox_init_point')
                        response_data['mp_sandbox_point'] = pref.get('sandbox_init_point')
                        logger.info(f'[MP] Sandbox mode — usando sandbox_init_point para orden {order.id}')
                    else:
                        response_data['mp_init_point']    = pref.get('init_point')
                        response_data['mp_sandbox_point'] = pref.get('sandbox_init_point')
                else:
                    logger.error(f'[MP] Preference creation failed: {pref}')
                    response_data['mp_error'] = 'No se pudo crear la preferencia de pago.'
            except Exception as e:
                logger.error(f'[MP] Exception building preference: {e}')
                response_data['mp_error'] = str(e)
        else:
            logger.warning('[MP] Token de MercadoPago no configurado. Pedido creado sin pasarela de pago.')
            response_data['mp_error'] = 'mp_not_configured'

        return Response(response_data, status=status.HTTP_201_CREATED)


class MyOrdersView(generics.ListAPIView):
    serializer_class   = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).prefetch_related('items__product', 'shipment')


class OrderDetailView(generics.RetrieveAPIView):
    serializer_class   = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user)


@method_decorator(csrf_exempt, name='dispatch')
class MercadoPagoWebhookView(APIView):
    permission_classes     = [AllowAny]
    authentication_classes = []

    def post(self, request):
        # ── Verificar firma ───────────────────────────────────────────────
        if not _verify_mp_signature(request):
            logger.warning('[MP-WEBHOOK] Firma inválida — request rechazado.')
            return Response({'status': 'invalid_signature'}, status=400)

        data  = request.data
        topic = data.get('type') or request.query_params.get('topic', '')

        if topic == 'payment':
            payment_id = data.get('data', {}).get('id') or request.query_params.get('id')
            if payment_id:
                self._process_payment(str(payment_id))

        return Response({'status': 'ok'})

    def _process_payment(self, payment_id: str):
        try:
            sdk     = mercadopago.SDK(settings.MP_ACCESS_TOKEN)
            payment = sdk.payment().get(payment_id)['response']
            ext_ref = payment.get('external_reference')
            mp_status = payment.get('status')

            if not ext_ref:
                return

            try:
                order = Order.objects.select_related('user', 'shipping_cycle').get(id=ext_ref)
            except Order.DoesNotExist:
                logger.warning(f'[MP-WEBHOOK] Orden no encontrada: {ext_ref}')
                return

            # ── Idempotencia: si ya fue procesado, ignorar ────────────────
            if order.mp_payment_id == payment_id and order.payment_status == 'approved':
                logger.info(f'[MP-WEBHOOK] Pago {payment_id} ya procesado — ignorando.')
                return

            with transaction.atomic():
                order.mp_payment_id = payment_id

                if mp_status == 'approved' and order.payment_status != 'approved':
                    order.payment_status = 'approved'
                    order.save(update_fields=['mp_payment_id', 'payment_status'])

                    # ── Descontar stock AQUÍ (en pago aprobado) ───────────
                    for item in order.items.select_related('product').all():
                        Product.objects.filter(pk=item.product_id).update(
                            stock=F('stock') - item.quantity
                        )

                    # ── Crear envío Andreani ──────────────────────────────
                    if not order.is_pickup and not order.shipping_zone:
                        self._create_andreani_shipment(order)

                    # ── CRM: actualizar stats del usuario ─────────────────
                    self._update_user_stats(order)

                    # ── CRM: programar recordatorios de recompra ──────────
                    self._schedule_repurchase(order)

                    # ── Emails transaccionales ────────────────────────────
                    send_order_confirmed(order)
                    send_order_scheduled(order)

                elif mp_status in ('rejected', 'cancelled'):
                    order.payment_status = 'failed'
                    order.save(update_fields=['mp_payment_id', 'payment_status'])

                elif mp_status == 'refunded':
                    order.payment_status = 'refunded'
                    order.save(update_fields=['mp_payment_id', 'payment_status'])

                else:
                    order.save(update_fields=['mp_payment_id'])

        except Exception as e:
            logger.exception(f'[MP-WEBHOOK] Error procesando pago {payment_id}: {e}')

    def _create_andreani_shipment(self, order):
        """Crea envío en Andreani y persiste el resultado."""
        from services.andreani_service import AndreaniService, AndreaniAPIError
        from shipping.models import AndreaniShipment

        try:
            svc    = AndreaniService()
            result = svc.create_shipment(order)

            AndreaniShipment.objects.update_or_create(
                order=order,
                defaults={
                    'tracking_number': result['tracking_number'],
                    'label_url':       result['label_url'],
                    'service_type':    result['service_type'],
                    'cost':            result['cost'],
                    'status':          'created',
                    'raw_response':    result.get('raw', {}),
                },
            )
            logger.info(f'[ANDREANI] Envío creado: tracking={result["tracking_number"]}')
        except AndreaniAPIError as e:
            logger.error(f'[ANDREANI] No se pudo crear envío para orden {order.id}: {e}')

    def _update_user_stats(self, order):
        """Actualiza los campos CRM del usuario."""
        user = order.user
        if not user:
            return
        try:
            from django.db.models import Avg
            user.purchase_count   = Order.objects.filter(
                user=user, payment_status='approved'
            ).count()
            avg = Order.objects.filter(
                user=user, payment_status='approved'
            ).aggregate(avg=Avg('total'))['avg']
            user.avg_ticket       = avg
            user.last_purchase_at = order.created_at
            user.save(update_fields=['purchase_count', 'avg_ticket', 'last_purchase_at'])
        except Exception as e:
            logger.error(f'[CRM] Error actualizando stats usuario {user.id}: {e}')

    def _schedule_repurchase(self, order):
        """Programa recordatorios de recompra vía motor predictivo."""
        try:
            from services.repurchase_engine import repurchase_engine
            repurchase_engine.process_order(order)
        except Exception as e:
            logger.error(f'[CRM] Error programando recompra para orden {order.id}: {e}')


# ── Dashboard ─────────────────────────────────────────────────────────────────

class DashboardOrderListView(generics.ListAPIView):
    permission_classes = [IsAdminUser]
    serializer_class   = OrderSerializer

    def get_queryset(self):
        qs = Order.objects.prefetch_related(
            'items__product', 'shipment'
        ).select_related('user', 'shipping_zone', 'shipping_cycle')
        status_filter = self.request.query_params.get('status')
        cycle_filter  = self.request.query_params.get('cycle')
        if status_filter:
            qs = qs.filter(status=status_filter)
        if cycle_filter:
            qs = qs.filter(shipping_cycle__id=cycle_filter)
        return qs


class DashboardOrderStatusView(APIView):
    permission_classes = [IsAdminUser]

    def patch(self, request, pk):
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({'error': 'Pedido no encontrado.'}, status=404)

        new_status = request.data.get('status')
        notes      = request.data.get('notes', '')
        valid      = [c[0] for c in Order.STATUS_CHOICES]

        if new_status not in valid:
            return Response({'error': f'Estado inválido. Opciones: {valid}'}, status=400)

        old_status   = order.status
        order.status = new_status
        if notes:
            order.notes = notes
        order.save(update_fields=['status', 'notes'])

        # Update shipment and fire emails on transitions
        shipment = getattr(order, 'shipment', None)

        if new_status == 'shipping':
            if shipment:
                shipment.status    = 'shipped'
                shipment.shipped_at = timezone.now()
                shipment.save(update_fields=['status', 'shipped_at'])
            try:
                send_order_shipped(order)
                logger.info(f'[EMAIL] Shipped email sent for order {order.id}')
            except Exception as e:
                logger.error(f'[EMAIL] Failed to send shipped email: {e}')

        elif new_status == 'in_transit':
            try:
                _send_async = __import__('services.email_service', fromlist=['_send_async'])._send_async
                _base_context = __import__('services.email_service', fromlist=['_base_context'])._base_context
                _get_recipient = __import__('services.email_service', fromlist=['_get_recipient'])._get_recipient
                _send_async(
                    subject  = 'Tu pedido está en camino 📍',
                    to_email = _get_recipient(order),
                    template = 'order_shipped.html',
                    context  = _base_context(order),
                )
                logger.info(f'[EMAIL] In-transit email sent for order {order.id}')
            except Exception as e:
                logger.error(f'[EMAIL] Failed to send in_transit email: {e}')

        elif new_status == 'delivered':
            if shipment:
                shipment.status      = 'delivered'
                shipment.delivered_at = timezone.now()
                shipment.save(update_fields=['status', 'delivered_at'])
            try:
                send_order_delivered(order)
                logger.info(f'[EMAIL] Delivered email sent for order {order.id}')
            except Exception as e:
                logger.error(f'[EMAIL] Failed to send delivered email: {e}')

        return Response(OrderSerializer(order).data)
