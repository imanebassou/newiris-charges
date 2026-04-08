from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import DemandeCheque
from .serializers import DemandeChequeSerializer


class DemandeChequeViewSet(viewsets.ModelViewSet):
    queryset = DemandeCheque.objects.all()
    serializer_class = DemandeChequeSerializer
    permission_classes = [IsAuthenticated]