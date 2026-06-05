from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/',      include('users.urls')),
    path('api/products/',  include('products.urls')),
    path('api/orders/',    include('orders.urls')),
    path('api/shipping/',  include('shipping.urls')),
    path('api/crm/',       include('crm.urls')),
    path('api/dashboard/', include('users.dashboard_urls')),
    path('api/dashboard/', include('orders.dashboard_urls')),
    path('api/dashboard/', include('shipping.dashboard_urls')),
    path('api/dashboard/', include('crm.dashboard_urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
