import logging
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from .models import ConsumptionProfile, RepurchaseReminder, Coupon
from .serializers import (
    ConsumptionProfileSerializer,
    RepurchaseReminderSerializer,
    CouponValidateSerializer,
    CouponSerializer,
)

logger = logging.getLogger(__name__)


class ValidateCouponView(APIView):
    """POST /api/crm/coupons/validate/ — valida un cupón y devuelve info de descuento."""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = CouponValidateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        code     = serializer.validated_data['code'].strip().upper()
        subtotal = serializer.validated_data.get('subtotal', 0)

        try:
            coupon = Coupon.objects.get(code=code)
        except Coupon.DoesNotExist:
            return Response({'error': 'Cupón no encontrado.'}, status=404)

        user  = request.user if request.user.is_authenticated else None
        valid, msg = coupon.is_valid(user=user, order_total=subtotal)
        if not valid:
            return Response({'error': msg, 'valid': False}, status=400)

        discount = coupon.calculate_discount(subtotal)
        return Response({
            'valid':          True,
            'code':           coupon.code,
            'discount_type':  coupon.discount_type,
            'discount_value': str(coupon.discount_value),
            'discount_amount': str(discount),
            'description':    coupon.description,
        })


class SaveConsumptionProfileView(APIView):
    """POST /api/crm/consumption-profile/ — guarda el perfil de consumo del cuestionario."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        product_id  = request.data.get('product')
        daily_units = request.data.get('daily_units')
        source      = request.data.get('source', 'onboarding')

        if not product_id or not daily_units:
            return Response({'error': 'product y daily_units son requeridos.'}, status=400)

        profile, created = ConsumptionProfile.objects.update_or_create(
            user=request.user,
            product_id=product_id,
            defaults={'daily_units': daily_units, 'source': source},
        )
        return Response(ConsumptionProfileSerializer(profile).data, status=201 if created else 200)


class ReorderView(APIView):
    """GET /api/crm/reorder/<order_id>/ — devuelve los items de un pedido anterior para re-compra."""
    permission_classes = [IsAuthenticated]

    def get(self, request, order_id):
        from orders.models import Order
        try:
            order = Order.objects.prefetch_related('items__product').get(
                id=order_id, user=request.user, payment_status='approved'
            )
        except Order.DoesNotExist:
            return Response({'error': 'Pedido no encontrado.'}, status=404)

        items = []
        for item in order.items.all():
            product = item.product
            if not product.is_active:
                continue
            items.append({
                'id':       str(product.id),
                'title':    product.title,
                'slug':     product.slug,
                'price':    str(product.price),
                'quantity': item.quantity,
                'stock':    product.stock,
                'image':    product.image.url if product.image else None,
                'size':     product.size,
                'category': product.category,
            })

        return Response({
            'original_order': str(order.id),
            'items':          items,
        })


class CustomerSegmentationView(APIView):
    """GET /api/dashboard/crm/segments/ — segmentación de clientes para admin."""
    permission_classes = [IsAdminUser]

    def get(self, request):
        from users.models import User
        from django.utils import timezone
        from datetime import timedelta

        now       = timezone.now()
        sixty_ago = now - timedelta(days=60)

        all_users = User.objects.filter(is_active=True, is_staff=False)
        segments = {
            'vip':        all_users.filter(purchase_count__gte=5).count(),
            'recurrente': all_users.filter(purchase_count__gte=2, purchase_count__lt=5).count(),
            'nuevo':      all_users.filter(purchase_count=1).count(),
            'inactivo':   all_users.filter(last_purchase_at__lt=sixty_ago).count(),
            'sin_compra': all_users.filter(purchase_count=0).count(),
            'institucion': all_users.filter(recipient_type='institucion').count(),
            'total':       all_users.count(),
        }
        return Response(segments)


class DashboardRemindersView(generics.ListAPIView):
    """GET /api/dashboard/crm/reminders/ — lista de recordatorios para admin."""
    permission_classes  = [IsAdminUser]
    serializer_class    = RepurchaseReminderSerializer
    pagination_class    = None

    def get_queryset(self):
        qs = RepurchaseReminder.objects.select_related('user', 'product').all()
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs[:100]


class DashboardCouponsView(generics.ListCreateAPIView):
    """GET/POST /api/dashboard/crm/coupons/ — CRUD de cupones para admin."""
    permission_classes = [IsAdminUser]
    serializer_class   = CouponSerializer
    queryset           = Coupon.objects.all().order_by('-created_at')
