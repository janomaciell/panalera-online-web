from django.contrib import admin
from .models import Order, OrderItem, Shipment

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ['price', 'subtotal']

class ShipmentInline(admin.StackedInline):
    model = Shipment
    extra = 0

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display    = ['__str__', 'status', 'payment_status', 'total', 'shipping_city', 'created_at']
    list_filter     = ['status', 'payment_status', 'is_pickup']
    search_fields   = ['shipping_name', 'guest_email', 'shipping_city']
    ordering        = ['-created_at']
    inlines         = [OrderItemInline, ShipmentInline]
    readonly_fields = ['id', 'subtotal', 'total', 'mp_preference_id', 'mp_payment_id', 'created_at']
