from rest_framework import generics, filters
from rest_framework.permissions import AllowAny, IsAdminUser
from .models import Product
from .serializers import ProductSerializer, ProductListSerializer

class ProductListView(generics.ListAPIView):
    permission_classes   = [AllowAny]
    serializer_class     = ProductListSerializer
    filter_backends      = [filters.OrderingFilter]
    ordering_fields      = ['price', 'size', 'title']
    ordering             = ['size']

    def get_queryset(self):
        qs = Product.objects.filter(is_active=True)
        size = self.request.query_params.get('size')
        if size:
            qs = qs.filter(size=size)
        return qs


class ProductDetailView(generics.RetrieveAPIView):
    permission_classes = [AllowAny]
    serializer_class   = ProductSerializer
    queryset           = Product.objects.filter(is_active=True)
    lookup_field       = 'slug'


# Dashboard views
class DashboardProductListCreateView(generics.ListCreateAPIView):
    pagination_class = None  # return full list without pagination
    permission_classes = [IsAdminUser]
    serializer_class = ProductSerializer
    queryset = Product.objects.all().order_by('size', 'title')

class DashboardProductUpdateDeleteView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdminUser]
    serializer_class   = ProductSerializer
    queryset           = Product.objects.all()

    def get_serializer(self, *args, **kwargs):
        kwargs.setdefault('partial', True)
        return super().get_serializer(*args, **kwargs)

    def perform_destroy(self, instance):
        # Soft delete
        instance.is_active = False
        instance.save()

