from django.contrib import admin
from .models import ConsumptionProfile, RepurchaseReminder, Coupon


@admin.register(ConsumptionProfile)
class ConsumptionProfileAdmin(admin.ModelAdmin):
    list_display  = ['user', 'product', 'daily_units', 'source', 'updated_at']
    list_filter   = ['source']
    search_fields = ['user__email', 'user__name', 'product__title']
    raw_id_fields = ['user', 'product']


@admin.register(RepurchaseReminder)
class RepurchaseReminderAdmin(admin.ModelAdmin):
    list_display  = ['user', 'product', 'type', 'status', 'scheduled_for', 'sent_at']
    list_filter   = ['type', 'status']
    search_fields = ['user__email', 'user__name', 'product__title']
    raw_id_fields = ['user', 'product', 'origin_order']
    date_hierarchy = 'scheduled_for'


@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display  = ['code', 'discount_type', 'discount_value', 'current_uses', 'max_uses', 'is_active', 'valid_until']
    list_filter   = ['discount_type', 'is_active']
    search_fields = ['code', 'description']
    readonly_fields = ['current_uses', 'created_at']
