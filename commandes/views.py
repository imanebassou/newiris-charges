from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .models import Commande
from .serializers import CommandeSerializer
from cheques.models import DemandeCheque
import datetime


class CommandeViewSet(viewsets.ModelViewSet):
    queryset = Commande.objects.all().order_by('-created_at')
    serializer_class = CommandeSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_serializer_context(self):
        return {'request': self.request}

    def perform_update(self, serializer):
        old = self.get_object()
        instance = serializer.save()

        finance_ok = instance.validation_finance == 'ok'
        direction_ok = instance.validation_direction == 'ok'
        old_finance_ok = old.validation_finance == 'ok'
        old_direction_ok = old.validation_direction == 'ok'

        if finance_ok and direction_ok and not (old_finance_ok and old_direction_ok):
            existing = DemandeCheque.objects.filter(titre=instance.titre).first()
            if not existing:
                DemandeCheque.objects.create(
                    titre=instance.titre,
                    montant=instance.montant or 0,
                    categorie='Paiement fournisseur',
                    etat_signature='en_cours',
                    etat_livraison='en_cours',
                    fournisseur=instance.fournisseur,
                    date_souhaitee_signature=instance.echeance or datetime.date.today(),
                )