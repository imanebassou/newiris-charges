from rest_framework import generics, permissions
from django_filters.rest_framework import DjangoFilterBackend
from .models import ChargeVariable
from .serializers import ChargeVariableSerializer

class ChargeVariableListView(generics.ListCreateAPIView):
    queryset = ChargeVariable.objects.all()
    serializer_class = ChargeVariableSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['service', 'categorie', 'statut']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class ChargeVariableDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ChargeVariable.objects.all()
    serializer_class = ChargeVariableSerializer
    permission_classes = [permissions.IsAuthenticated]