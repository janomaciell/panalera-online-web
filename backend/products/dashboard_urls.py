from django.urls import path
from .views import DashboardProductListCreateView, DashboardProductUpdateDeleteView

urlpatterns = [
    path('',       DashboardProductListCreateView.as_view(),  name='dash-product-list'),
    path('<uuid:pk>/', DashboardProductUpdateDeleteView.as_view(), name='dash-product-detail'),
]
