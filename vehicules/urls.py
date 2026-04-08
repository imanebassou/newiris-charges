from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    VehiculeViewSet, DossierVehiculeViewSet,
    ActionVehiculeViewSet, DemandeVehiculeViewSet
)

router = DefaultRouter()
router.register(r'vehicules', VehiculeViewSet, basename='vehicule')
router.register(r'dossiers', DossierVehiculeViewSet, basename='dossier')
router.register(r'actions', ActionVehiculeViewSet, basename='action-vehicule')
router.register(r'demandes', DemandeVehiculeViewSet, basename='demande-vehicule')

urlpatterns = [
    path('', include(router.urls)),
]