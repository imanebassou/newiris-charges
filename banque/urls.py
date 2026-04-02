from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import solde_view, solde_calcule_view, ActionBanqueViewSet

router = DefaultRouter()
router.register(r'actions', ActionBanqueViewSet)

urlpatterns = [
    path('solde/', solde_view),
    path('solde-calcule/', solde_calcule_view),
    path('', include(router.urls)),
]