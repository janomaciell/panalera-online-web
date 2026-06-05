import uuid
import calendar
from datetime import date
from django.db import models


class ShippingZone(models.Model):
    id             = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    city_name      = models.CharField(max_length=100)
    postal_codes   = models.JSONField(default=list, blank=True)
    shipping_price = models.DecimalField(max_digits=8, decimal_places=2)
    estimated_days = models.PositiveIntegerField(default=15)
    is_active      = models.BooleanField(default=True)
    created_at     = models.DateTimeField(auto_now_add=True)
    updated_at     = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name        = 'Zona de envío'
        verbose_name_plural = 'Zonas de envío'
        ordering            = ['city_name']

    def __str__(self):
        return f'{self.city_name} — ${self.shipping_price}'


class ShippingCycle(models.Model):
    CYCLE_DAY_CHOICES = [(1, 'Día 1'), (15, 'Día 15')]

    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ship_date    = models.DateField(unique=True)
    cutoff_date  = models.DateField()
    cycle_day    = models.IntegerField(choices=CYCLE_DAY_CHOICES)
    is_active    = models.BooleanField(default=True)
    notes        = models.TextField(blank=True)
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name        = 'Ciclo de envío'
        verbose_name_plural = 'Ciclos de envío'
        ordering            = ['ship_date']

    def __str__(self):
        return f'Envío {self.ship_date.strftime("%d/%m/%Y")} (cierre: {self.cutoff_date.strftime("%d/%m/%Y")})'

    @property
    def is_open(self):
        return date.today() <= self.cutoff_date

    @property
    def orders_count(self):
        return self.orders.filter(payment_status='approved').count()

    @classmethod
    def get_next_open(cls):
        """Returns the next open cycle, or None if none available."""
        today = date.today()
        return cls.objects.filter(
            cutoff_date__gte=today,
            is_active=True,
        ).order_by('ship_date').first()


class AndreaniShipment(models.Model):
    """
    Registro de un envío gestionado a través de la API de Andreani.
    """
    STATUS_CHOICES = [
        ('pending',    'Pendiente de creación'),
        ('created',    'Creado en Andreani'),
        ('in_transit', 'En tránsito'),
        ('delivered',  'Entregado'),
        ('failed',     'Fallido / No entregado'),
    ]

    id              = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order           = models.OneToOneField(
        'orders.Order', on_delete=models.CASCADE, related_name='andreani_shipment'
    )
    tracking_number = models.CharField(max_length=100, blank=True, db_index=True)
    label_url       = models.URLField(blank=True, help_text='URL de etiqueta PDF generada por Andreani')
    service_type    = models.CharField(max_length=100, blank=True, help_text='Ej: Andreani A Domicilio')
    cost            = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    estimated_days  = models.PositiveIntegerField(default=0)
    status          = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    raw_response    = models.JSONField(default=dict, blank=True, help_text='Respuesta cruda de Andreani API')
    created_at      = models.DateTimeField(auto_now_add=True)
    updated_at      = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name        = 'Envío Andreani'
        verbose_name_plural = 'Envíos Andreani'

    def __str__(self):
        return f'Andreani #{self.tracking_number or "sin tracking"} — {self.order}'
