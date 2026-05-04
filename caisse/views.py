from django.db import transaction
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from charges_variables.models import ChargeVariable

from .models import ActionCaisse, CaissePersonnelle, SoldeCaisse
from .serializers import ActionCaisseSerializer, CaissePersonnelleSerializer


def normalize_name(value):
    return (value or '').strip().upper()


def find_matching_caisse(personne):
    if not personne:
        return None

    target = normalize_name(personne)
    for caisse in CaissePersonnelle.objects.all():
        if normalize_name(caisse.nom) == target:
            return caisse
    return None


def get_root_action(action):
    if action.source_action_id:
        return action.source_action
    return action


def should_sync_to_charge_variable(root_action):
    if root_action.statut != 'traitee':
        return False

    if root_action.type_charge != 'charge_variable':
        return False

    if not root_action.service_id:
        return False

    if root_action.is_caisse_principale:
        matched_caisse = find_matching_caisse(root_action.personne)
        return root_action.type == 'sortie' and matched_caisse is None

    if root_action.caisse_id and not root_action.source_action_id:
        return root_action.type == 'sortie'

    return False


def sync_charge_variable(root_action):
    charge = getattr(root_action, 'charge_variable_liee', None)

    if should_sync_to_charge_variable(root_action):
        payload = {
            'titre': root_action.titre,
            'service': root_action.service,
            'categorie': root_action.categorie or 'autre',
            'sous_categorie': root_action.sous_categorie or '',
            'montant': root_action.montant,
            'date': root_action.date,
            'description': root_action.personne or '',
            'statut': root_action.statut,
            'source_action_caisse': root_action,
        }

        if charge:
            ChargeVariable.objects.filter(pk=charge.pk).update(
                titre=payload['titre'],
                service=payload['service'],
                categorie=payload['categorie'],
                sous_categorie=payload['sous_categorie'],
                montant=payload['montant'],
                date=payload['date'],
                description=payload['description'],
                statut=payload['statut'],
            )
        else:
            ChargeVariable.objects.create(**payload)
    elif charge:
        charge.delete()


def sync_principale_to_personal_copy(root_action):
    if not root_action.is_caisse_principale:
        return

    matched_caisse = find_matching_caisse(root_action.personne)
    existing_copy = ActionCaisse.objects.filter(
        source_action_id=root_action.pk,
        is_caisse_principale=False,
    ).first()

    if not matched_caisse:
        if existing_copy:
            existing_copy.delete()
        return

    mirrored_type = 'entree' if root_action.type == 'sortie' else 'sortie'

    payload = {
        'caisse': matched_caisse,
        'type': mirrored_type,
        'titre': root_action.titre,
        'service': root_action.service,
        'type_charge': root_action.type_charge,
        'categorie': root_action.categorie,
        'sous_categorie': root_action.sous_categorie,
        'montant': root_action.montant,
        'date': root_action.date,
        'personne': matched_caisse.nom,
        'description': root_action.description or '',
        'photo': root_action.photo,
        'statut': root_action.statut,
        'is_caisse_principale': False,
        'source_action': root_action,
    }

    if existing_copy:
      for field, value in payload.items():
          setattr(existing_copy, field, value)
      existing_copy.save()
    else:
      ActionCaisse.objects.create(**payload)


def sync_action_caisse_relations(action):
    root_action = get_root_action(action)

    if action.pk != root_action.pk:
        ActionCaisse.objects.filter(pk=root_action.pk).update(
            type=action.type,
            titre=action.titre,
            service=action.service,
            type_charge=action.type_charge,
            categorie=action.categorie,
            sous_categorie=action.sous_categorie,
            montant=action.montant,
            date=action.date,
            personne=action.personne or root_action.personne or '',
            description=action.description or '',
            statut=action.statut,
            photo=action.photo if action.photo else root_action.photo,
        )
        root_action.refresh_from_db()

    sync_principale_to_personal_copy(root_action)
    sync_charge_variable(root_action)


class SoldeCaisseViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request):
        solde, _ = SoldeCaisse.objects.get_or_create(id=1)

        actions_principale = ActionCaisse.objects.filter(
            statut='traitee',
            is_caisse_principale=True,
        )

        total_principale = solde.montant
        for action in actions_principale:
            if action.type == 'entree':
                total_principale += action.montant
            else:
                total_principale -= action.montant

        return Response({
            'id': solde.id,
            'montant_initial': solde.montant,
            'solde_calcule': total_principale,
            'date_modification': solde.date_modification,
        })

    def update(self, request, pk=None):
        solde, _ = SoldeCaisse.objects.get_or_create(id=1)
        solde.montant = request.data.get('montant', solde.montant)
        solde.save()
        return Response({'montant': solde.montant})


class CaissePersonnelleViewSet(viewsets.ModelViewSet):
    queryset = CaissePersonnelle.objects.all()
    serializer_class = CaissePersonnelleSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_context(self):
        return {'request': self.request}


class ActionCaisseViewSet(viewsets.ModelViewSet):
    queryset = ActionCaisse.objects.all()
    serializer_class = ActionCaisseSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_context(self):
        return {'request': self.request}

    def get_queryset(self):
        qs = ActionCaisse.objects.all()
        caisse_id = self.request.query_params.get('caisse')
        principale = self.request.query_params.get('principale')

        if caisse_id:
            qs = qs.filter(caisse_id=caisse_id)

        if principale == 'true':
            qs = qs.filter(is_caisse_principale=True)

        return qs

    @transaction.atomic
    def perform_create(self, serializer):
        action = serializer.save()
        sync_action_caisse_relations(action)

    @transaction.atomic
    def perform_update(self, serializer):
        action = serializer.save()
        sync_action_caisse_relations(action)

    @transaction.atomic
    def perform_destroy(self, instance):
        root_action = get_root_action(instance)

        if getattr(root_action, 'charge_variable_liee', None):
            root_action.charge_variable_liee.delete()

        ActionCaisse.objects.filter(source_action_id=root_action.pk).delete()

        if root_action.pk != instance.pk:
            root_action.delete()
        else:
            instance.delete()
