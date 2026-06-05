from rest_framework import serializers
from products.models import Product
from .models import Order, OrderItem, Shipment


class OrderItemInputSerializer(serializers.Serializer):
    product  = serializers.UUIDField()
    quantity = serializers.IntegerField(min_value=1)


class OrderItemSerializer(serializers.ModelSerializer):
    product_title = serializers.CharField(source='product.title', read_only=True)
    product_size  = serializers.CharField(source='product.size',  read_only=True)
    product_slug  = serializers.CharField(source='product.slug',  read_only=True)
    subtotal      = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    total_units   = serializers.IntegerField(read_only=True)

    class Meta:
        model  = OrderItem
        fields = [
            'id', 'product', 'product_title', 'product_size', 'product_slug',
            'quantity', 'price', 'subtotal', 'total_units',
        ]


class ShipmentSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Shipment
        fields = ['id', 'status', 'shipped_at', 'delivered_at', 'notes']


class OrderSerializer(serializers.ModelSerializer):
    items         = OrderItemSerializer(many=True, read_only=True)
    shipment      = ShipmentSerializer(read_only=True)
    user_email    = serializers.SerializerMethodField()
    cycle_display = serializers.SerializerMethodField()

    class Meta:
        model  = Order
        fields = [
            'id', 'user', 'user_email', 'guest_email', 'guest_phone',
            'status', 'payment_status',
            'subtotal', 'shipping_price', 'discount_amount', 'total',
            'coupon_code',
            'shipping_zone', 'shipping_cycle', 'cycle_display',
            'is_pickup',
            'recipient_type', 'institution_name', 'room_number', 'preferred_slot',
            'shipping_name', 'shipping_address', 'shipping_floor',
            'shipping_city', 'shipping_province', 'shipping_postal', 'shipping_phone',
            'mp_preference_id', 'mp_payment_id',
            'notes', 'items', 'shipment', 'created_at',
        ]
        read_only_fields = [
            'id', 'user', 'subtotal', 'total', 'discount_amount',
            'mp_preference_id', 'mp_payment_id', 'created_at',
        ]

    def get_user_email(self, obj):
        return obj.contact_email

    def get_cycle_display(self, obj):
        if obj.shipping_cycle:
            return str(obj.shipping_cycle.ship_date)
        return None


class CreateOrderSerializer(serializers.Serializer):
    """Input serializer for order creation."""
    items              = OrderItemInputSerializer(many=True)
    guest_email        = serializers.EmailField(required=False, allow_blank=True)
    guest_phone        = serializers.CharField(required=False, allow_blank=True)
    shipping_name      = serializers.CharField()
    shipping_address   = serializers.CharField(required=False, allow_blank=True)
    shipping_floor     = serializers.CharField(required=False, allow_blank=True)
    shipping_city      = serializers.CharField(required=False, allow_blank=True)
    shipping_province  = serializers.CharField(required=False, allow_blank=True)
    shipping_postal    = serializers.CharField(required=False, allow_blank=True)
    shipping_phone     = serializers.CharField(required=False, allow_blank=True)
    shipping_price     = serializers.DecimalField(max_digits=8, decimal_places=2, default=0)
    is_pickup          = serializers.BooleanField(default=False)
    notes              = serializers.CharField(required=False, allow_blank=True)
    # New fields
    recipient_type     = serializers.ChoiceField(
        choices=['particular', 'residencia', 'institucion'],
        default='particular', required=False,
    )
    institution_name   = serializers.CharField(required=False, allow_blank=True)
    room_number        = serializers.CharField(required=False, allow_blank=True)
    preferred_slot     = serializers.ChoiceField(
        choices=['', 'manana', 'tarde'], default='', required=False,
    )
    coupon_code        = serializers.CharField(required=False, allow_blank=True)
