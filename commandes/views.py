from datetime import date, datetime

from rest_framework import viewsets
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated

from cheques.models import DemandeCheque

from .models import Commande
from .serializers import CommandeSerializer


def get_request_person(user):
    full_name = f"{user.first_name} {user.last_name}".strip()
    return full_name or user.username


def parse_echeance_to_date(value):
    if not value:
        return date.today()

    text = str(value).strip()
    if not text:
        return date.today()

    for fmt in ('%Y-%m-%d', '%d/%m/%Y', '%d-%m-%Y'):
        try:
            return datetime.strptime(text, fmt).date()
        except ValueError:
            continue

    return date.today()


class CommandeViewSet(viewsets.ModelViewSet):
    queryset = Commande.objects.all().order_by('-created_at')
    serializer_class = CommandeSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_serializer_context(self):
        return {'request': self.request}

    def perform_create(self, serializer):
        serializer.save(personne=get_request_person(self.request.user))

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
                    commande=instance,
                    titre=instance.titre,
                    montant=instance.montant or 0,
                    categorie='Paiement fournisseur',
                    etat_signature='en_cours',
                    livre_a_equipe='en_cours',
                    livre_au_transport='en_cours',
                    etat_livraison='en_cours',
                    fournisseur=instance.fournisseur,
                    date_souhaitee_signature=parse_echeance_to_date(instance.echeance),
                    type_paiement=instance.type_paiement or '',
                )
