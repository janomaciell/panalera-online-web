from django.urls import path
from .views import CustomerSegmentationView, DashboardRemindersView, DashboardCouponsView

urlpatterns = [
    path('crm/segments/',   CustomerSegmentationView.as_view(),  name='crm-segments'),
    path('crm/reminders/',  DashboardRemindersView.as_view(),    name='crm-reminders'),
    path('crm/coupons/',    DashboardCouponsView.as_view(),      name='crm-coupons'),
]
