from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display  = ['email', 'name', 'recipient_type', 'purchase_count', 'avg_ticket', 'last_purchase_at', 'is_staff']
    list_filter   = ['is_staff', 'is_active', 'recipient_type']
    search_fields = ['email', 'name', 'phone']
    ordering      = ['-created_at']
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Información personal', {'fields': ('name', 'phone')}),
        ('Perfil de destinatario', {'fields': ('recipient_type', 'institution_name')}),
        ('Dirección guardada', {'fields': ('saved_address', 'saved_city', 'saved_province', 'saved_postal')}),
        ('CRM', {'fields': ('purchase_count', 'avg_ticket', 'last_purchase_at')}),
        ('Permisos', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'name', 'password1', 'password2'),
        }),
    )
    readonly_fields = ['purchase_count', 'avg_ticket', 'last_purchase_at']
