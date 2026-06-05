from rest_framework import serializers
from .models import ConsumptionProfile, RepurchaseReminder, Coupon


class ConsumptionProfileSerializer(serializers.ModelSerializer):
    product_title = serializers.CharField(source='product.title', read_only=True)

    class Meta:
        model  = ConsumptionProfile
        fields = ['id', 'user', 'product', 'product_title', 'daily_units', 'source', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']


class RepurchaseReminderSerializer(serializers.ModelSerializer):
    product_title = serializers.CharField(source='product.title', read_only=True)

    class Meta:
        model  = RepurchaseReminder
        fields = [
            'id', 'user', 'product', 'product_title', 'origin_order',
            'type', 'status', 'scheduled_for', 'sent_at',
            'promo_code', 'discount_pct', 'created_at',
        ]
        read_only_fields = ['id', 'user', 'created_at']


class CouponValidateSerializer(serializers.Serializer):
    code     = serializers.CharField()
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, default=0)


class CouponSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Coupon
        fields = [
            'id', 'code', 'description', 'discount_type', 'discount_value',
            'min_order_total', 'max_uses', 'current_uses',
            'valid_from', 'valid_until', 'is_active', 'created_at',
        ]
        read_only_fields = ['id', 'current_uses', 'created_at']
