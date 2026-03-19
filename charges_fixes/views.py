from rest_framework import generics, permissions
from django_filters.rest_framework import DjangoFilterBackend
from .models import ChargeFix
from .serializers import ChargeFixSerializer

class ChargeFixListView(generics.ListCreateAPIView):
    queryset = ChargeFix.objects.all()
    serializer_class = ChargeFixSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['service', 'categorie']

class ChargeFixDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ChargeFix.objects.all()
    serializer_class = ChargeFixSerializer
    permission_classes = [permissions.IsAuthenticated]