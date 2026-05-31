from django.urls import path
from .views import DashboardZoneListCreateView, DashboardZoneDetailView

urlpatterns = [
    path('',           DashboardZoneListCreateView.as_view(), name='dash-zone-list'),
    path('<uuid:pk>/', DashboardZoneDetailView.as_view(),     name='dash-zone-detail'),
]
