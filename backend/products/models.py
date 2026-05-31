import uuid
from django.db import models
from django.utils.text import slugify


class Product(models.Model):
    CATEGORY_CHOICES = [
        ('aposito_incontinencia', 'Apósito Incontinencia'),
        ('panal_recto',           'Pañal Recto'),
        ('panal_elastizado',      'Pañal Elastizado'),
        ('ropa_interior',         'Ropa Interior'),
        ('accesorios',            'Accesorios'),
        ('algodon',               'Algodón'),
        ('otros',                 'Otros'),
    ]

    SIZE_CHOICES = [
        ('CH',        'Chico'),
        ('MED',       'Mediano'),
        ('GDE',       'Grande'),
        ('EX_GDE',    'Extra Grande'),
        ('EX_EX_GDE', 'Extra Extra Grande'),
        ('P/M',       'Pequeño/Mediano'),
        ('G/EG',      'Grande/Extra Grande'),
        ('UNICO',     'Único'),
        ('T1',        'Talle 1'),
        ('T2',        'Talle 2'),
        ('T3',        'Talle 3'),
        ('T4',        'Talle 4'),
        ('1_PLAZA',   '1 Plaza'),
        ('2_PLAZAS',  '2 Plazas'),
    ]

    id            = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sku           = models.CharField(max_length=50, unique=True, null=True, blank=True)
    title         = models.CharField(max_length=200)
    slug          = models.SlugField(max_length=220, unique=True, blank=True)
    category      = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='otros')
    description   = models.TextField(blank=True)
    
    price         = models.DecimalField(max_digits=10, decimal_places=2)
    compare_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    stock         = models.PositiveIntegerField(default=0)
    
    # Dimensiones y logística
    quantity      = models.PositiveIntegerField(default=1, help_text='Unidades por paquete (pack)')
    units_per_box = models.PositiveIntegerField(default=1, null=True, blank=True, help_text='Unidades por bulto')
    weight_g      = models.PositiveIntegerField(null=True, blank=True, help_text='Peso en gramos')
    height_cm     = models.FloatField(null=True, blank=True, help_text='Alto en cm')
    length_cm     = models.FloatField(null=True, blank=True, help_text='Largo en cm')
    width_cm      = models.FloatField(null=True, blank=True, help_text='Ancho en cm')

    image         = models.ImageField(upload_to='products/', null=True, blank=True, help_text='Imagen de portada')
    images        = models.JSONField(default=list, blank=True)
    size          = models.CharField(max_length=20, choices=SIZE_CHOICES, default='UNICO')
    is_active     = models.BooleanField(default=True)
    created_at    = models.DateTimeField(auto_now_add=True)
    updated_at    = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name        = 'Producto'
        verbose_name_plural = 'Productos'
        ordering            = ['category', 'size', 'title']

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.title)
            if self.sku:
                self.slug = f"{base_slug}-{self.sku}"
            else:
                self.slug = base_slug
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.title} ({self.get_size_display()})'
