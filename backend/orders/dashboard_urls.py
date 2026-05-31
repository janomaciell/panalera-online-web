from django.urls import path
from .views import DashboardOrderListView, DashboardOrderStatusView

urlpatterns = [
    path('',                  DashboardOrderListView.as_view(),  name='dash-order-list'),
    path('<uuid:pk>/status/', DashboardOrderStatusView.as_view(), name='dash-order-status'),
]
