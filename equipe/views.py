from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import ChefEquipe, Technicien, Materiel, EtatMaterielTechnicien
from .serializers import (
    ChefEquipeSerializer, TechnicienSerializer,
    MaterielSerializer, EtatMaterielTechnicienSerializer
)


class ChefEquipeViewSet(viewsets.ModelViewSet):
    queryset = ChefEquipe.objects.all()
    serializer_class = ChefEquipeSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_context(self):
        return {'request': self.request}


class TechnicienViewSet(viewsets.ModelViewSet):
    queryset = Technicien.objects.all()
    serializer_class = TechnicienSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_context(self):
        return {'request': self.request}


class MaterielViewSet(viewsets.ModelViewSet):
    queryset = Materiel.objects.all()
    serializer_class = MaterielSerializer
    permission_classes = [IsAuthenticated]


class EtatMaterielTechnicienViewSet(viewsets.ModelViewSet):
    queryset = EtatMaterielTechnicien.objects.all()
    serializer_class = EtatMaterielTechnicienSerializer
    permission_classes = [IsAuthenticated]