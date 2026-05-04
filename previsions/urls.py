from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import PrevisionSemaineConfigViewSet, PrevisionViewSet, ecarts_view

router = DefaultRouter()
router.register(r'', PrevisionViewSet, basename='prevision')
router.register(r'semaines', PrevisionSemaineConfigViewSet, basename='prevision-semaines')

urlpatterns = [
    path('ecarts/', ecarts_view),
    path('', include(router.urls)),
]
