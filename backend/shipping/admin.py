from django.contrib import admin
from .models import ShippingZone, ShippingCycle

@admin.register(ShippingZone)
class ShippingZoneAdmin(admin.ModelAdmin):
    list_display  = ['city_name', 'shipping_price', 'estimated_days', 'is_active']
    list_filter   = ['is_active']
    search_fields = ['city_name']

@admin.register(ShippingCycle)
class ShippingCycleAdmin(admin.ModelAdmin):
    list_display  = ['ship_date', 'cutoff_date', 'cycle_day', 'is_active', 'orders_count']
    list_filter   = ['cycle_day', 'is_active']
    ordering      = ['ship_date']
