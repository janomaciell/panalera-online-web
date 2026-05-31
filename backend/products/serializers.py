from rest_framework import serializers
from .models import Product


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Product
        fields = '__all__'
        read_only_fields = ['id', 'created_at']


class ProductListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for lists."""
    class Meta:
        model  = Product
        fields = ['id', 'sku', 'title', 'slug', 'category', 'price', 'compare_price', 'stock', 'images', 'image', 'size', 'quantity']
