from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ChantierViewSet, PlanificationChantierViewSet, MaterielChantierViewSet

router = DefaultRouter()
router.register(r'chantiers', ChantierViewSet, basename='chantier')
router.register(r'planifications', PlanificationChantierViewSet, basename='planification')
router.register(r'materiels', MaterielChantierViewSet, basename='materiel-chantier')

urlpatterns = [
    path('', include(router.urls)),
]