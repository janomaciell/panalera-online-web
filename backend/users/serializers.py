from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model  = User
        fields = ['id', 'name', 'email', 'phone', 'password']

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class LoginSerializer(serializers.Serializer):
    email    = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, data):
        user = authenticate(email=data['email'], password=data['password'])
        if not user:
            raise serializers.ValidationError('Credenciales incorrectas.')
        if not user.is_active:
            raise serializers.ValidationError('Cuenta desactivada.')
        data['user'] = user
        return data


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model  = User
        fields = [
            'id', 'name', 'email', 'phone', 'is_staff', 'created_at',
            'recipient_type', 'institution_name',
            'saved_address', 'saved_city', 'saved_province', 'saved_postal',
            'purchase_count', 'avg_ticket', 'last_purchase_at',
        ]
        read_only_fields = ['id', 'is_staff', 'created_at', 'purchase_count', 'avg_ticket', 'last_purchase_at']
