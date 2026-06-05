from django.urls import path
from .views import ValidateCouponView, SaveConsumptionProfileView, ReorderView

urlpatterns = [
    path('coupons/validate/',    ValidateCouponView.as_view(),          name='coupon-validate'),
    path('consumption-profile/', SaveConsumptionProfileView.as_view(),  name='consumption-profile'),
    path('reorder/<uuid:order_id>/', ReorderView.as_view(),            name='reorder'),
]
