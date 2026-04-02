from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SalarieViewSet, ActionSalaireViewSet, etat_salaires_view

router = DefaultRouter()
router.register(r'salaries', SalarieViewSet)
router.register(r'actions', ActionSalaireViewSet)

urlpatterns = [
    path('etat/', etat_salaires_view),
    path('', include(router.urls)),
]