import uuid
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra):
        if not email:
            raise ValueError('Email requerido')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra):
        extra.setdefault('is_staff', True)
        extra.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra)


class User(AbstractBaseUser, PermissionsMixin):
    RECIPIENT_TYPE_CHOICES = [
        ('particular',  'Particular'),
        ('residencia',  'Residencia geriátrica'),
        ('institucion', 'Institución / Clínica'),
    ]

    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name       = models.CharField(max_length=120)
    email      = models.EmailField(unique=True)
    phone      = models.CharField(max_length=20, blank=True)
    is_active  = models.BooleanField(default=True)
    is_staff   = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    # Recipient profile
    recipient_type   = models.CharField(
        max_length=20, choices=RECIPIENT_TYPE_CHOICES, default='particular'
    )
    institution_name = models.CharField(max_length=200, blank=True)

    # Saved delivery address (pre-fill checkout)
    saved_address  = models.CharField(max_length=255, blank=True)
    saved_city     = models.CharField(max_length=100, blank=True)
    saved_province = models.CharField(max_length=100, blank=True)
    saved_postal   = models.CharField(max_length=20,  blank=True)

    # CRM analytics (denormalised for performance)
    purchase_count   = models.PositiveIntegerField(default=0)
    avg_ticket       = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    last_purchase_at = models.DateTimeField(null=True, blank=True)

    USERNAME_FIELD  = 'email'
    REQUIRED_FIELDS = ['name']
    objects = UserManager()

    class Meta:
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'

    def __str__(self):
        return f'{self.name} <{self.email}>'
