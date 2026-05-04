from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from previsions.models import Prevision
from .models import DemandeCheque
from .serializers import DemandeChequeSerializer


class DemandeChequeViewSet(viewsets.ModelViewSet):
    queryset = DemandeCheque.objects.all()
    serializer_class = DemandeChequeSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_serializer_context(self):
        return {'request': self.request}

    def get_queryset(self):
        queryset = DemandeCheque.objects.all()
        commande_id = self.request.query_params.get('commande')
        if commande_id:
            queryset = queryset.filter(commande_id=commande_id)
        return queryset.order_by('-created_at')

    def perform_create(self, serializer):
        instance = serializer.save(personne=self.request.user)
        self._sync_statut_ticket(instance)
        instance.save()

        if instance.date_echeance and instance.statut_ticket in [
            'en_attente_signature',
            'cheque_signe',
            'livre_a_equipe',
            'traitee',
        ]:
            self._creer_prevision(instance)

    def perform_update(self, serializer):
        old = self.get_object()
        old_echeance = old.date_echeance

        instance = serializer.save()
        self._sync_statut_ticket(instance)
        instance.save()

        if (
            instance.date_echeance and
            instance.statut_ticket in ['en_attente_signature', 'cheque_signe', 'livre_a_equipe', 'traitee'] and
            (not old_echeance or old_echeance != instance.date_echeance)
        ):
            self._creer_prevision(instance)

    def _sync_statut_ticket(self, instance):
        if instance.statut_ticket in ['en_validation', 'reporte']:
            return

        if instance.livre_au_transport == 'traitee':
            instance.etat_livraison = 'traitee'
            instance.statut_ticket = 'traitee'
        elif instance.livre_a_equipe == 'traitee':
            instance.etat_livraison = 'en_cours'
            instance.statut_ticket = 'livre_a_equipe'
        elif instance.etat_signature == 'traitee':
            instance.statut_ticket = 'cheque_signe'
        else:
            instance.statut_ticket = 'en_attente_signature'

    def _creer_prevision(self, demande):
        try:
            mois = demande.date_echeance.month
            annee = demande.date_echeance.year
            jour = demande.date_echeance.day

            if jour <= 7:
                semaine = 1
            elif jour <= 14:
                semaine = 2
            elif jour <= 22:
                semaine = 3
            else:
                semaine = 4

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
                    description='Cheque lie a une commande' if demande.commande_id else 'Finance',
                    montant=demande.montant,
                    date_prevision=demande.date_echeance,
                    categorie='Paiement fournisseur',
                    statut='en_cours',
                    semaine=semaine,
                    mois=mois,
                    annee=annee,
                )
        except Exception as e:
            print(f"Erreur creation prevision cheque: {e}")
