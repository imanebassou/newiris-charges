from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PrevisionViewSet, ecarts_view

router = DefaultRouter()
router.register(r'', PrevisionViewSet)

urlpatterns = [
    path('ecarts/', ecarts_view),
    path('', include(router.urls)),
]