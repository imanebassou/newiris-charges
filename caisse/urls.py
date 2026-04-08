from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SoldeCaisseViewSet, CaissePersonnelleViewSet, ActionCaisseViewSet

router = DefaultRouter()
router.register(r'caisses', CaissePersonnelleViewSet, basename='caisse-personnelle')
router.register(r'actions', ActionCaisseViewSet, basename='action-caisse')

urlpatterns = [
    path('solde/', SoldeCaisseViewSet.as_view({'get': 'list', 'put': 'update'})),
    path('', include(router.urls)),
]