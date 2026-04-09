from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import DemandeCheque
from .serializers import DemandeChequeSerializer
from previsions.models import Prevision
import datetime


class DemandeChequeViewSet(viewsets.ModelViewSet):
    queryset = DemandeCheque.objects.all()
    serializer_class = DemandeChequeSerializer
    permission_classes = [IsAuthenticated]

    def perform_update(self, serializer):
        old = self.get_object()
        old_livraison = old.etat_livraison
        old_echeance = old.date_echeance
        instance = serializer.save()

        # Si etat_livraison passe à "livre" ET date_echeance remplie → créer prévision
        if (
            old_livraison != 'livre' and
            instance.etat_livraison == 'livre' and
            instance.date_echeance
        ):
            self._creer_prevision(instance)

        # Si date_echeance vient d'être remplie ET déjà livré → créer prévision
        elif (
            not old_echeance and
            instance.date_echeance and
            instance.etat_livraison == 'livre'
        ):
            self._creer_prevision(instance)

    def _creer_prevision(self, demande):
        try:
            mois = demande.date_echeance.month
            annee = demande.date_echeance.year

            # Déterminer la semaine selon le jour
            jour = demande.date_echeance.day
            if jour <= 7:
                semaine = 1
            elif jour <= 14:
                semaine = 2
            elif jour <= 22:
                semaine = 3
            else:
                semaine = 4

            # Vérifier qu'une prévision n'existe pas déjà
            existing = Prevision.objects.filter(
                titre=demande.titre,
                montant=demande.montant,
                mois=mois,
                annee=annee,
                categorie='Paiement fournisseur',
            ).first()

            if not existing:
                Prevision.objects.create(
                    type='sortie',
                    titre=demande.titre,
                    description='Finance',
                    montant=demande.montant,
                    date_prevision=demande.date_echeance,
                    categorie='Paiement fournisseur',
                    statut='en_cours',
                    semaine=semaine,
                    mois=mois,
                    annee=annee,
                )
        except Exception as e:
            print(f"Erreur création prévision chèque: {e}")