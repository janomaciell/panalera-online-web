import uuid
from django.db import models
from django.conf import settings
from shipping.models import ShippingZone, ShippingCycle


class Order(models.Model):
    STATUS_CHOICES = [
        ('pending',    'Nuevo pedido'),
        ('preparing',  'Preparando'),
        ('shipping',   'Sale hoy'),
        ('in_transit', 'En camino'),
        ('delivered',  'Entregado'),
        ('cancelled',  'Cancelado'),
    ]
    PAYMENT_CHOICES = [
        ('pending',  'Pendiente'),
        ('approved', 'Aprobado'),
        ('failed',   'Fallido'),
        ('refunded', 'Reembolsado'),
    ]
    RECIPIENT_TYPE_CHOICES = [
        ('particular',  'Particular'),
        ('residencia',  'Residencia geriátrica'),
        ('institucion', 'Institución / Clínica'),
    ]

    id               = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user             = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='orders',
    )
    # Guest support
    guest_email      = models.EmailField(blank=True)
    guest_phone      = models.CharField(max_length=20, blank=True)

    status           = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    payment_status   = models.CharField(max_length=20, choices=PAYMENT_CHOICES, default='pending')

    subtotal         = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    shipping_price   = models.DecimalField(max_digits=8,  decimal_places=2, default=0)
    discount_amount  = models.DecimalField(max_digits=8,  decimal_places=2, default=0)
    total            = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # Coupon
    coupon_code      = models.CharField(max_length=50, blank=True)

    shipping_zone    = models.ForeignKey(ShippingZone, on_delete=models.SET_NULL, null=True, blank=True)
    shipping_cycle   = models.ForeignKey(
        ShippingCycle, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='orders',
    )
    is_pickup        = models.BooleanField(default=False)

    # Recipient type
    recipient_type   = models.CharField(
        max_length=20, choices=RECIPIENT_TYPE_CHOICES, default='particular'
    )
    institution_name = models.CharField(max_length=200, blank=True)
    room_number      = models.CharField(max_length=20, blank=True)
    preferred_slot   = models.CharField(
        max_length=20, blank=True,
        help_text='Franja horaria preferida: manana / tarde'
    )

    # Delivery address snapshot
    shipping_name      = models.CharField(max_length=120)
    shipping_address   = models.CharField(max_length=255, blank=True)
    shipping_floor     = models.CharField(max_length=20,  blank=True)
    shipping_city      = models.CharField(max_length=100, blank=True)
    shipping_province  = models.CharField(max_length=100, blank=True)
    shipping_postal    = models.CharField(max_length=20,  blank=True)
    shipping_phone     = models.CharField(max_length=20,  blank=True)

    # MercadoPago
    mp_preference_id = models.CharField(max_length=200, blank=True)
    mp_payment_id    = models.CharField(max_length=200, blank=True)

    notes            = models.TextField(blank=True)
    created_at       = models.DateTimeField(auto_now_add=True)
    updated_at       = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name        = 'Pedido'
        verbose_name_plural = 'Pedidos'
        ordering            = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['payment_status']),
            models.Index(fields=['user']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f'Pedido {str(self.id)[:8].upper()} — {self.shipping_name}'

    @property
    def contact_email(self):
        if self.user:
            return self.user.email
        return self.guest_email


class OrderItem(models.Model):
    id       = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order    = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product  = models.ForeignKey('products.Product', on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField()
    price    = models.DecimalField(max_digits=10, decimal_places=2)  # price at time of purchase

    class Meta:
        verbose_name        = 'Ítem de pedido'
        verbose_name_plural = 'Ítems de pedido'

    def __str__(self):
        return f'{self.product.title} x{self.quantity}'

    @property
    def subtotal(self):
        return self.price * self.quantity

    @property
    def total_units(self):
        """Physical units purchased: quantity of packs × units per pack."""
        return self.quantity * (self.product.quantity or 1)


class Shipment(models.Model):
    STATUS_CHOICES = [
        ('pending',    'Pendiente'),
        ('preparing',  'Preparando'),
        ('shipped',    'Enviado'),
        ('in_transit', 'En tránsito'),
        ('delivered',  'Entregado'),
        ('failed',     'Fallido'),
    ]

    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order        = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='shipment')
    status       = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    shipped_at   = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    notes        = models.TextField(blank=True)

    class Meta:
        verbose_name        = 'Envío'
        verbose_name_plural = 'Envíos'

    def __str__(self):
        return f'Envío de {self.order}'
