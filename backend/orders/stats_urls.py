from django.urls import path
from .stats_views import DashboardStatsView

urlpatterns = [
    path('', DashboardStatsView.as_view(), name='dash-stats'),
]
