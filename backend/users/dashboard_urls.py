from django.urls import path, include

# Dashboard aggregates routes from products, orders, shipping
urlpatterns = [
    path('orders/',         include('orders.dashboard_urls')),
    path('products/',       include('products.dashboard_urls')),
    path('shipping-zones/', include('shipping.dashboard_urls')),
    path('stats/',          include('orders.stats_urls')),
]
