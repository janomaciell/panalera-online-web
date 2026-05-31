from django.urls import path
from .views import CreateOrderView, MyOrdersView, OrderDetailView, MercadoPagoWebhookView

urlpatterns = [
    path('',            CreateOrderView.as_view(),         name='order-create'),
    path('me/',         MyOrdersView.as_view(),            name='my-orders'),
    path('<uuid:pk>/',  OrderDetailView.as_view(),         name='order-detail'),
    path('webhook/',    MercadoPagoWebhookView.as_view(),  name='mp-webhook'),
]
