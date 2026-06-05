from django.contrib import admin
from .models import ShippingZone, ShippingCycle, AndreaniShipment


@admin.register(ShippingZone)
class ShippingZoneAdmin(admin.ModelAdmin):
    list_display  = ['city_name', 'shipping_price', 'estimated_days', 'is_active']
    list_filter   = ['is_active']
    search_fields = ['city_name']


@admin.register(ShippingCycle)
class ShippingCycleAdmin(admin.ModelAdmin):
    list_display  = ['ship_date', 'cutoff_date', 'cycle_day', 'is_active', 'is_open', 'orders_count']
    list_filter   = ['cycle_day', 'is_active']
    date_hierarchy = 'ship_date'


@admin.register(AndreaniShipment)
class AndreaniShipmentAdmin(admin.ModelAdmin):
    list_display  = ['tracking_number', 'order', 'status', 'service_type', 'cost', 'created_at']
    list_filter   = ['status']
    search_fields = ['tracking_number']
    readonly_fields = ['raw_response', 'created_at', 'updated_at']
