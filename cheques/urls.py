from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DemandeChequeViewSet

router = DefaultRouter()
router.register(r'demandes', DemandeChequeViewSet, basename='demande-cheque')

urlpatterns = [
    path('', include(router.urls)),
]