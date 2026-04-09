from rest_framework import generics, permissions
from django_filters.rest_framework import DjangoFilterBackend
from .models import ChargeFix
from .serializers import ChargeFixSerializer
from previsions.models import Prevision
from django.db.models import Sum
import datetime


class ChargeFixListView(generics.ListCreateAPIView):
    queryset = ChargeFix.objects.all()
    serializer_class = ChargeFixSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['service', 'categorie']

    def perform_create(self, serializer):
        charge = serializer.save()
        self._creer_ou_maj_prevision(charge)

    def _creer_ou_maj_prevision(self, charge):
        try:
            # Déterminer le mois/année à partir de la date de la charge
            if charge.date:
                mois = charge.date.month
                annee = charge.date.year
            else:
                today = datetime.date.today()
                mois = today.month
                annee = today.year

            # Date par défaut = le 3 du mois
            date_prevision = datetime.date(annee, mois, 3)

            # Total des charges fixes de cette catégorie pour ce mois
            charges_categorie = ChargeFix.objects.filter(
                categorie=charge.categorie
            )
            if charge.date:
                charges_categorie = charges_categorie.filter(
                    date__month=mois,
                    date__year=annee
                )
            total = charges_categorie.aggregate(
                total=Sum('montant')
            )['total'] or 0

            # Chercher une prévision existante pour cette catégorie/mois/annee
            prevision_existante = Prevision.objects.filter(
                type='sortie',
                categorie=charge.categorie,
                mois=mois,
                annee=annee,
                semaine=1,
            ).first()

            if prevision_existante:
                # Mettre à jour le montant
                prevision_existante.montant = total
                prevision_existante.save()
            else:
                # Créer une nouvelle prévision
                Prevision.objects.create(
                    type='sortie',
                    titre=charge.categorie,
                    description='Finance',
                    montant=total,
                    date_prevision=date_prevision,
                    categorie=charge.categorie,
                    statut='en_cours',
                    semaine=1,
                    mois=mois,
                    annee=annee,
                )
        except Exception as e:
            print(f"Erreur création prévision auto: {e}")


class ChargeFixDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ChargeFix.objects.all()
    serializer_class = ChargeFixSerializer
    permission_classes = [permissions.IsAuthenticated]