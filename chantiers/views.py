from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Chantier, PlanificationChantier, MaterielChantier
from .serializers import (
    ChantierSerializer, PlanificationChantierSerializer, MaterielChantierSerializer
)


class ChantierViewSet(viewsets.ModelViewSet):
    queryset = Chantier.objects.all()
    serializer_class = ChantierSerializer
    permission_classes = [IsAuthenticated]


class PlanificationChantierViewSet(viewsets.ModelViewSet):
    queryset = PlanificationChantier.objects.all()
    serializer_class = PlanificationChantierSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_context(self):
        return {'request': self.request}

    def get_queryset(self):
        qs = PlanificationChantier.objects.all()
        date = self.request.query_params.get('date')
        if date:
            qs = qs.filter(date=date)
        return qs


class MaterielChantierViewSet(viewsets.ModelViewSet):
    queryset = MaterielChantier.objects.all()
    serializer_class = MaterielChantierSerializer
    permission_classes = [IsAuthenticated]