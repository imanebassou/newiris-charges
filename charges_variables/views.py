from rest_framework import generics, permissions
from django_filters.rest_framework import DjangoFilterBackend

from .models import ChargeVariable
from .serializers import ChargeVariableSerializer
from caisse.models import ActionCaisse


def sync_charge_variable_relations(charge):
    source_action = charge.source_action_caisse
    if not source_action:
        return

    reverse_category = {
        'administratif': 'administratif',
        'transport': 'transport',
        'entretien': 'entretien',
        'equipe': 'equipe',
        'autre': 'charge_variable',
    }.get(charge.categorie, 'charge_variable')

    ActionCaisse.objects.filter(pk=source_action.pk).update(
        titre=charge.titre,
        service=charge.service,
        montant=charge.montant,
        date=charge.date,
        description=charge.description or '',
        statut=charge.statut,
        categorie=reverse_category,
    )

    ActionCaisse.objects.filter(
        source_action_id=source_action.pk,
        is_caisse_principale=True,
    ).update(
        titre=charge.titre,
        service=charge.service,
        montant=charge.montant,
        date=charge.date,
        description=charge.description or '',
        statut=charge.statut,
        categorie=reverse_category,
        type=source_action.type,
        personne=source_action.personne or '',
    )


class ChargeVariableListView(generics.ListCreateAPIView):
    queryset = ChargeVariable.objects.all().order_by('-date', '-id')
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

    def perform_update(self, serializer):
        charge = serializer.save()
        sync_charge_variable_relations(charge)
