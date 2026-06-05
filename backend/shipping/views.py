import logging
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAdminUser
from .models import ShippingZone, ShippingCycle, AndreaniShipment
from .serializers import ShippingZoneSerializer, ShippingCycleSerializer, CalculateShippingSerializer

logger = logging.getLogger(__name__)


class ShippingZoneListView(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class   = ShippingZoneSerializer
    queryset           = ShippingZone.objects.filter(is_active=True)


class CalculateShippingView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = CalculateShippingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        city        = serializer.validated_data.get('city', '').strip().lower()
        postal_code = serializer.validated_data.get('postal_code', '').strip()

        zone = None
        if city:
            zone = ShippingZone.objects.filter(
                city_name__iexact=city, is_active=True
            ).first()
        if not zone and postal_code:
            for z in ShippingZone.objects.filter(is_active=True):
                if postal_code in (z.postal_codes or []):
                    zone = z
                    break

        if not zone:
            return Response(
                {'error': 'No realizamos envíos a esa ciudad. Revisá las zonas disponibles.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        cycle = ShippingCycle.get_next_open()
        return Response({
            'zone':           ShippingZoneSerializer(zone).data,
            'shipping_price': zone.shipping_price,
            'estimated_days': zone.estimated_days,
            'next_cycle':     ShippingCycleSerializer(cycle).data if cycle else None,
        })


class NextCycleView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        cycle = ShippingCycle.get_next_open()
        if not cycle:
            return Response({'error': 'No hay ciclos activos.'}, status=503)
        return Response(ShippingCycleSerializer(cycle).data)


class AndreaniQuoteView(APIView):
    """GET /api/shipping/andreani/quote/?postal_code=7167&weight=500&value=10000"""
    permission_classes = [AllowAny]

    def get(self, request):
        postal_code = request.query_params.get('postal_code', '').strip()
        weight_g    = int(request.query_params.get('weight', 500))
        value       = float(request.query_params.get('value', 0))

        if not postal_code:
            return Response({'error': 'postal_code es requerido.'}, status=400)

        from services.andreani_service import AndreaniService, AndreaniAPIError
        try:
            svc   = AndreaniService()
            quote = svc.get_quote(postal_code, weight_g, value)
            return Response(quote)
        except AndreaniAPIError as e:
            logger.error(f'[ANDREANI] Error cotizando: {e}')
            return Response({'error': str(e)}, status=502)


class AndreaniWebhookView(APIView):
    """POST /api/shipping/andreani/webhook/ — recibe actualizaciones de estado de Andreani."""
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        tracking  = request.data.get('nroAndreani', '')
        new_state = request.data.get('estado', '')

        if not tracking:
            return Response({'ok': False}, status=400)

        try:
            shipment = AndreaniShipment.objects.select_related('order').get(
                tracking_number=tracking
            )
        except AndreaniShipment.DoesNotExist:
            logger.warning(f'[ANDREANI-WEBHOOK] Tracking no encontrado: {tracking}')
            return Response({'ok': False}, status=404)

        from services.andreani_service import AndreaniService
        mapped_status = AndreaniService.map_status(new_state)
        shipment.status = mapped_status
        shipment.save(update_fields=['status', 'updated_at'])

        # Update order status based on Andreani state
        order = shipment.order
        if mapped_status == 'delivered':
            order.status = 'delivered'
            order.save(update_fields=['status'])
            # Also update internal shipment
            internal = getattr(order, 'shipment', None)
            if internal:
                from django.utils import timezone
                internal.status       = 'delivered'
                internal.delivered_at = timezone.now()
                internal.save(update_fields=['status', 'delivered_at'])
            from services.email_service import send_order_delivered
            send_order_delivered(order)
        elif mapped_status == 'in_transit' and order.status not in ('delivered', 'cancelled'):
            order.status = 'in_transit'
            order.save(update_fields=['status'])
            from services.email_service import send_tracking_update
            send_tracking_update(order, tracking, new_state)
        elif mapped_status == 'failed':
            logger.warning(f'[ANDREANI-WEBHOOK] Envío fallido: {tracking}')

        logger.info(f'[ANDREANI-WEBHOOK] tracking={tracking} estado={new_state} → {mapped_status}')
        return Response({'ok': True})


# Dashboard
class DashboardZoneListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAdminUser]
    serializer_class   = ShippingZoneSerializer
    queryset           = ShippingZone.objects.all()


class DashboardZoneDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdminUser]
    serializer_class   = ShippingZoneSerializer
    queryset           = ShippingZone.objects.all()
