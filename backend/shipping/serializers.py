from rest_framework import serializers
from .models import ShippingZone, ShippingCycle


class ShippingZoneSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ShippingZone
        fields = [
            'id', 'city_name', 'postal_codes',
            'shipping_price', 'estimated_days', 'is_active', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class ShippingCycleSerializer(serializers.ModelSerializer):
    is_open            = serializers.BooleanField(read_only=True)
    orders_count       = serializers.IntegerField(read_only=True)
    ship_date_display  = serializers.SerializerMethodField()
    cutoff_date_display = serializers.SerializerMethodField()

    class Meta:
        model  = ShippingCycle
        fields = [
            'id', 'ship_date', 'cutoff_date', 'cycle_day',
            'is_active', 'is_open', 'orders_count', 'notes',
            'ship_date_display', 'cutoff_date_display',
        ]
        read_only_fields = ['id']

    def get_ship_date_display(self, obj):
        months = ['enero','febrero','marzo','abril','mayo','junio',
                  'julio','agosto','septiembre','octubre','noviembre','diciembre']
        return f'{obj.ship_date.day} de {months[obj.ship_date.month - 1]}'

    def get_cutoff_date_display(self, obj):
        months = ['enero','febrero','marzo','abril','mayo','junio',
                  'julio','agosto','septiembre','octubre','noviembre','diciembre']
        return f'{obj.cutoff_date.day} de {months[obj.cutoff_date.month - 1]}'


class CalculateShippingSerializer(serializers.Serializer):
    city        = serializers.CharField(required=False, allow_blank=True)
    postal_code = serializers.CharField(required=False, allow_blank=True)
