from django.urls import path
from .views import ShippingZoneListView, CalculateShippingView, NextCycleView

urlpatterns = [
    path('zones/',       ShippingZoneListView.as_view(),    name='shipping-zones'),
    path('calculate/',   CalculateShippingView.as_view(),   name='shipping-calculate'),
    path('next-cycle/',  NextCycleView.as_view(),           name='next-cycle'),
]
