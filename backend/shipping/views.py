from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAdminUser
from .models import ShippingZone, ShippingCycle
from .serializers import ShippingZoneSerializer, ShippingCycleSerializer, CalculateShippingSerializer


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


# Dashboard
class DashboardZoneListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAdminUser]
    serializer_class   = ShippingZoneSerializer
    queryset           = ShippingZone.objects.all()


class DashboardZoneDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdminUser]
    serializer_class   = ShippingZoneSerializer
    queryset           = ShippingZone.objects.all()
