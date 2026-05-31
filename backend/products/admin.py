from django.contrib import admin
from .models import Product

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display   = ['sku', 'title', 'category', 'size', 'price', 'stock', 'is_active']
    list_filter    = ['category', 'size', 'is_active']
    search_fields  = ['title', 'slug', 'sku']
    prepopulated_fields = {'slug': ('title',)}
    ordering       = ['category', 'size', 'title']
