from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Vehicule, DossierVehicule, ActionVehicule, DemandeVehicule
from .serializers import (
    VehiculeSerializer, DossierVehiculeSerializer,
    ActionVehiculeSerializer, DemandeVehiculeSerializer
)


class VehiculeViewSet(viewsets.ModelViewSet):
    queryset = Vehicule.objects.all()
    serializer_class = VehiculeSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        vehicule = serializer.save()
        # Créer automatiquement un dossier vide pour ce véhicule
        DossierVehicule.objects.create(vehicule=vehicule)


class DossierVehiculeViewSet(viewsets.ModelViewSet):
    queryset = DossierVehicule.objects.all()
    serializer_class = DossierVehiculeSerializer
    permission_classes = [IsAuthenticated]


class ActionVehiculeViewSet(viewsets.ModelViewSet):
    queryset = ActionVehicule.objects.all()
    serializer_class = ActionVehiculeSerializer
    permission_classes = [IsAuthenticated]


class DemandeVehiculeViewSet(viewsets.ModelViewSet):
    queryset = DemandeVehicule.objects.all()
    serializer_class = DemandeVehiculeSerializer
    permission_classes = [IsAuthenticated]