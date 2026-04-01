from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

# 🔥 ADD THIS IMPORT
from api_views import ssms_dashboard

urlpatterns = [
    path('admin/', admin.site.urls),

    path('api/auth/', include('users.urls')),
    path('api/services/', include('services.urls')),
    path('api/charges-fixes/', include('charges_fixes.urls')),
    path('api/charges-variables/', include('charges_variables.urls')),

    # 🔥 ADD THIS LINE (YOUR NEW API)
    path('api/ssms-dashboard/', ssms_dashboard),
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)