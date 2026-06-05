"""
CRM app — modelos para motor de recompra, perfiles de consumo y cupones.
"""
import uuid
from django.db import models
from django.conf import settings


class ConsumptionProfile(models.Model):
    """
    Perfil de consumo del usuario para un producto específico.
    Se usa para predecir cuándo volverá a comprar.
    """
    SOURCE_CHOICES = [
        ('onboarding',  'Cuestionario inicial'),
        ('calculated',  'Calculado por historial'),
        ('manual',      'Ingresado manualmente'),
    ]

    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user         = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='consumption_profiles'
    )
    product      = models.ForeignKey('products.Product', on_delete=models.CASCADE)
    daily_units  = models.FloatField(help_text='Unidades físicas consumidas por día (ej: 4)')
    source       = models.CharField(max_length=20, choices=SOURCE_CHOICES, default='onboarding')
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name        = 'Perfil de consumo'
        verbose_name_plural = 'Perfiles de consumo'
        unique_together     = ('user', 'product')

    def __str__(self):
        return f'{self.user.name} — {self.product.title}: {self.daily_units}u/día'


class RepurchaseReminder(models.Model):
    """
    Recordatorio / promoción de recompra programado para un usuario.
    """
    TYPE_CHOICES = [
        ('reminder', 'Recordatorio de stock'),
        ('promo',    'Promoción descuento'),
        ('reorder',  'Invitación a recompra'),
        ('review',   'Solicitud de reseña'),
    ]
    STATUS_CHOICES = [
        ('pending',   'Pendiente'),
        ('sent',      'Enviado'),
        ('converted', 'Convertido en compra'),
        ('skipped',   'Omitido'),
    ]

    id            = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user          = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reminders'
    )
    product       = models.ForeignKey('products.Product', on_delete=models.CASCADE)
    origin_order  = models.ForeignKey(
        'orders.Order', on_delete=models.SET_NULL, null=True, related_name='reminders'
    )
    type          = models.CharField(max_length=20, choices=TYPE_CHOICES)
    status        = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    scheduled_for = models.DateTimeField(db_index=True)
    sent_at       = models.DateTimeField(null=True, blank=True)
    promo_code    = models.CharField(max_length=50, blank=True)
    discount_pct  = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    created_at    = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name        = 'Recordatorio de recompra'
        verbose_name_plural = 'Recordatorios de recompra'
        ordering            = ['scheduled_for']
        indexes = [
            models.Index(fields=['status', 'scheduled_for']),
            models.Index(fields=['user', 'product']),
        ]

    def __str__(self):
        return f'[{self.get_type_display()}] {self.user.name} — {self.product.title} @ {self.scheduled_for.date()}'


class Coupon(models.Model):
    """
    Cupón de descuento — generado automáticamente para recompras o campañas.
    """
    TYPE_CHOICES = [
        ('percentage', 'Porcentaje'),
        ('fixed',      'Monto fijo'),
    ]

    id              = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code            = models.CharField(max_length=50, unique=True, db_index=True)
    description     = models.CharField(max_length=200, blank=True)
    discount_type   = models.CharField(max_length=20, choices=TYPE_CHOICES, default='percentage')
    discount_value  = models.DecimalField(max_digits=8, decimal_places=2)
    min_order_total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    max_uses        = models.PositiveIntegerField(null=True, blank=True, help_text='Vacío = usos ilimitados')
    current_uses    = models.PositiveIntegerField(default=0)
    user            = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='coupons',
        help_text='Si está asignado a un usuario, es de uso exclusivo'
    )
    valid_from      = models.DateTimeField()
    valid_until     = models.DateTimeField(null=True, blank=True)
    is_active       = models.BooleanField(default=True)
    created_at      = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name        = 'Cupón'
        verbose_name_plural = 'Cupones'

    def __str__(self):
        return f'{self.code} ({self.discount_value}{"%" if self.discount_type == "percentage" else " ARS"})'

    def is_valid(self, user=None, order_total=0):
        """Valida si el cupón puede usarse."""
        from django.utils import timezone
        now = timezone.now()
        if not self.is_active:
            return False, 'Cupón inactivo.'
        if self.valid_until and now > self.valid_until:
            return False, 'Cupón vencido.'
        if now < self.valid_from:
            return False, 'Cupón aún no válido.'
        if self.max_uses is not None and self.current_uses >= self.max_uses:
            return False, 'Cupón agotado.'
        if order_total < self.min_order_total:
            return False, f'Pedido mínimo requerido: ${self.min_order_total}.'
        if self.user and user and self.user != user:
            return False, 'Este cupón es de uso exclusivo.'
        return True, 'OK'

    def calculate_discount(self, subtotal):
        """Calcula el descuento sobre el subtotal."""
        if self.discount_type == 'percentage':
            return round(subtotal * self.discount_value / 100, 2)
        return min(self.discount_value, subtotal)
