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
    list_display    = ['__str__', 'status', 'payment_status', 'total', 'recipient_type', 'shipping_city', 'created_at']
    list_filter     = ['status', 'payment_status', 'is_pickup', 'recipient_type']
    search_fields   = ['shipping_name', 'guest_email', 'shipping_city', 'coupon_code']
    ordering        = ['-created_at']
    inlines         = [OrderItemInline, ShipmentInline]
    readonly_fields = ['id', 'subtotal', 'discount_amount', 'total', 'mp_preference_id', 'mp_payment_id', 'created_at']
    fieldsets = (
        ('General', {
            'fields': ('id', 'user', 'guest_email', 'guest_phone', 'status', 'payment_status'),
        }),
        ('Montos', {
            'fields': ('subtotal', 'shipping_price', 'discount_amount', 'total', 'coupon_code'),
        }),
        ('Destinatario', {
            'fields': ('recipient_type', 'institution_name', 'room_number', 'preferred_slot'),
        }),
        ('Dirección de envío', {
            'fields': ('shipping_name', 'shipping_address', 'shipping_floor',
                       'shipping_city', 'shipping_province', 'shipping_postal', 'shipping_phone',
                       'is_pickup'),
        }),
        ('Logística', {
            'fields': ('shipping_zone', 'shipping_cycle'),
        }),
        ('MercadoPago', {
            'fields': ('mp_preference_id', 'mp_payment_id'),
            'classes': ('collapse',),
        }),
        ('Notas', {
            'fields': ('notes',),
        }),
        ('Fechas', {
            'fields': ('created_at',),
        }),
    )
