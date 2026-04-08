from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ChefEquipeViewSet, TechnicienViewSet,
    MaterielViewSet, EtatMaterielTechnicienViewSet
)

router = DefaultRouter()
router.register(r'chefs', ChefEquipeViewSet, basename='chef')
router.register(r'techniciens', TechnicienViewSet, basename='technicien')
router.register(r'materiels', MaterielViewSet, basename='materiel')
router.register(r'etats', EtatMaterielTechnicienViewSet, basename='etat')

urlpatterns = [
    path('', include(router.urls)),
]