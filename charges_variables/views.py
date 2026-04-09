from rest_framework import generics, permissions
from django_filters.rest_framework import DjangoFilterBackend
from .models import ChargeVariable
from .serializers import ChargeVariableSerializer
from banque.models import ActionBanque


class ChargeVariableListView(generics.ListCreateAPIView):
    queryset = ChargeVariable.objects.all()
    serializer_class = ChargeVariableSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['service', 'categorie', 'statut']

    def perform_create(self, serializer):
        charge = serializer.save(created_by=self.request.user)
        # Si statut traitee dès la création → créer sortie dans banque
        if charge.statut == 'traitee':
            self._creer_action_banque(charge)

    def _creer_action_banque(self, charge):
        try:
            # Vérifier qu'une action banque n'existe pas déjà pour cette charge
            existing = ActionBanque.objects.filter(
                titre=charge.titre,
                montant=charge.montant,
                date=charge.date,
                categorie='Charges variables',
            ).first()
            if not existing:
                ActionBanque.objects.create(
                    type='sortie',
                    date=charge.date,
                    titre=charge.titre,
                    description=charge.description or '',
                    montant=charge.montant,
                    categorie='Charges variables',
                    statut='traitee',
                )
        except Exception as e:
            print(f"Erreur création action banque: {e}")


class ChargeVariableDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ChargeVariable.objects.all()
    serializer_class = ChargeVariableSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_update(self, serializer):
        old_statut = self.get_object().statut
        charge = serializer.save()

        # Si statut passe à traitee → créer sortie dans banque
        if old_statut != 'traitee' and charge.statut == 'traitee':
            self._creer_action_banque(charge)
        # Si statut repasse à en_cours → supprimer l'action banque liée
        elif old_statut == 'traitee' and charge.statut != 'traitee':
            self._supprimer_action_banque(charge)

    def _creer_action_banque(self, charge):
        try:
            existing = ActionBanque.objects.filter(
                titre=charge.titre,
                montant=charge.montant,
                date=charge.date,
                categorie='Charges variables',
            ).first()
            if not existing:
                ActionBanque.objects.create(
                    type='sortie',
                    date=charge.date,
                    titre=charge.titre,
                    description=charge.description or '',
                    montant=charge.montant,
                    categorie='Charges variables',
                    statut='traitee',
                )
        except Exception as e:
            print(f"Erreur création action banque: {e}")

    def _supprimer_action_banque(self, charge):
        try:
            ActionBanque.objects.filter(
                titre=charge.titre,
                montant=charge.montant,
                date=charge.date,
                categorie='Charges variables',
            ).delete()
        except Exception as e:
            print(f"Erreur suppression action banque: {e}")