import mercadopago
import logging
from decimal import Decimal
from django.conf import settings
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

def _build_mp_preference(order, items):
    """Build MercadoPago preference object."""
    sdk = mercadopago.SDK(settings.MP_ACCESS_TOKEN)
    mp_items = []
    for item in items:
        mp_items.append({
            'id':          str(item.product.id),
            'title':       item.product.title,
            'quantity':    item.quantity,
            'unit_price':  float(item.price),
            'currency_id': 'ARS',
        })
    if order.shipping_price > 0:
        mp_items.append({
            'id':          'shipping',
            'title':       f'Envío a {order.shipping_city}',
            'quantity':    1,
            'unit_price':  float(order.shipping_price),
            'currency_id': 'ARS',
        })
    preference_data = {
        'items': mp_items,
        'payer': {
            'email': order.contact_email,
            'name':  order.shipping_name,
        },
        'back_urls': {
            'success': f'{settings.FRONTEND_URL}/checkout/exito?order={order.id}',
            'failure': f'{settings.FRONTEND_URL}/checkout?error=1',
            'pending': f'{settings.FRONTEND_URL}/checkout/exito?order={order.id}&pending=1',
        },
        'auto_return':        'approved',
        'external_reference': str(order.id),
        'notification_url':   f'{settings.BACKEND_URL if hasattr(settings, "BACKEND_URL") else ""}/api/orders/webhook/',
    }
    result = sdk.preference().create(preference_data)
    return result['response']


class CreateOrderView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = CreateOrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # Validate items & stock
        item_objects = []
        for item_data in data['items']:
            try:
                product = Product.objects.get(id=item_data['product'], is_active=True)
            except Product.DoesNotExist:
                return Response({'error': f'Producto {item_data["product"]} no encontrado.'}, status=400)
            if product.stock < item_data['quantity']:
                return Response({'error': f'Stock insuficiente para {product.title}.'}, status=400)
            item_objects.append((product, item_data['quantity'], product.price))

        # Calculate totals
        subtotal = sum(p.price * qty for p, qty, _ in item_objects)
        shipping = Decimal(str(data['shipping_price']))
        total    = subtotal + shipping

        # Get next open cycle
        cycle = ShippingCycle.get_next_open()

        # Create order
        order = Order.objects.create(
            user             = request.user if request.user.is_authenticated else None,
            guest_email      = data.get('guest_email', ''),
            guest_phone      = data.get('guest_phone', ''),
            shipping_name    = data['shipping_name'],
            shipping_address = data.get('shipping_address', ''),
            shipping_floor   = data.get('shipping_floor', ''),
            shipping_city    = data.get('shipping_city', ''),
            shipping_postal  = data.get('shipping_postal', ''),
            shipping_phone   = data.get('shipping_phone', ''),
            shipping_price   = shipping,
            is_pickup        = data.get('is_pickup', False),
            subtotal         = subtotal,
            total            = total,
            shipping_cycle   = cycle,
            notes            = data.get('notes', ''),
        )

        # Create items & reduce stock
        for product, quantity, price in item_objects:
            OrderItem.objects.create(order=order, product=product, quantity=quantity, price=price)
            product.stock -= quantity
            product.save(update_fields=['stock'])

        # Create shipment record
        Shipment.objects.create(order=order)

        # MercadoPago preference
        response_data = OrderSerializer(order).data
        mp_token = settings.MP_ACCESS_TOKEN
        # Only attempt if it's a real token (not a placeholder)
        is_real_token = mp_token and not mp_token.startswith('APP_USR-0000') and 'xxxxxxxx' not in mp_token
        if is_real_token:
            try:
                pref = _build_mp_preference(order, order.items.select_related('product'))
                if pref.get('id'):
                    order.mp_preference_id = pref['id']
                    order.save(update_fields=['mp_preference_id'])
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
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        data = request.data
        topic = data.get('type') or request.query_params.get('topic', '')

        if topic == 'payment':
            payment_id = data.get('data', {}).get('id') or request.query_params.get('id')
            if payment_id:
                self._process_payment(str(payment_id))

        return Response({'status': 'ok'})

    def _process_payment(self, payment_id):
        try:
            sdk = mercadopago.SDK(settings.MP_ACCESS_TOKEN)
            payment = sdk.payment().get(payment_id)['response']
            ext_ref = payment.get('external_reference')
            mp_status = payment.get('status')

            if not ext_ref:
                return

            try:
                order = Order.objects.get(id=ext_ref)
            except Order.DoesNotExist:
                return

            order.mp_payment_id = payment_id
            if mp_status == 'approved':
                order.payment_status = 'approved'
                if order.status == 'pending':
                    send_order_confirmed(order)
                    send_order_scheduled(order)
            elif mp_status in ('rejected', 'cancelled'):
                order.payment_status = 'failed'
            elif mp_status == 'refunded':
                order.payment_status = 'refunded'
            order.save(update_fields=['mp_payment_id', 'payment_status'])
        except Exception:
            pass


# Dashboard
class DashboardOrderListView(generics.ListAPIView):
    permission_classes = [IsAdminUser]
    serializer_class   = OrderSerializer

    def get_queryset(self):
        qs = Order.objects.prefetch_related('items__product', 'shipment').select_related('user', 'shipping_zone', 'shipping_cycle')
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

        old_status = order.status
        order.status = new_status
        if notes:
            order.notes = notes
        order.save(update_fields=['status', 'notes'])

        # Update shipment and fire emails on transitions
        shipment = getattr(order, 'shipment', None)
        if new_status == 'shipping':
            if shipment:
                shipment.status = 'shipped'
                shipment.shipped_at = timezone.now()
                shipment.save(update_fields=['status', 'shipped_at'])
            try:
                send_order_shipped(order)
                logger.info(f'[EMAIL] Shipped email sent for order {order.id}')
            except Exception as e:
                logger.error(f'[EMAIL] Failed to send shipped email: {e}')

        elif new_status == 'in_transit':
            # Optional: notify customer their order is on its way
            try:
                from services.email_service import _send_async, _base_context, _get_recipient
                _send_async(
                    subject  = 'Tu pedido está en camino 📍',
                    to_email = _get_recipient(order),
                    template = 'order_shipped.html',  # reuse shipped template
                    context  = _base_context(order),
                )
                logger.info(f'[EMAIL] In-transit email sent for order {order.id}')
            except Exception as e:
                logger.error(f'[EMAIL] Failed to send in_transit email: {e}')

        elif new_status == 'delivered':
            if shipment:
                shipment.status = 'delivered'
                shipment.delivered_at = timezone.now()
                shipment.save(update_fields=['status', 'delivered_at'])
            try:
                send_order_delivered(order)
                logger.info(f'[EMAIL] Delivered email sent for order {order.id}')
            except Exception as e:
                logger.error(f'[EMAIL] Failed to send delivered email: {e}')

        return Response(OrderSerializer(order).data)
