from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from .models import SoldeCaisse, CaissePersonnelle, ActionCaisse
from .serializers import (
    SoldeCaisseSerializer,
    CaissePersonnelleSerializer,
    ActionCaisseSerializer
)
from charges_variables.models import ChargeVariable
from services.models import Service


class SoldeCaisseViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request):
        solde, _ = SoldeCaisse.objects.get_or_create(id=1)
        # Ajouter les actions traitées des caisses personnelles
        actions_traitees = ActionCaisse.objects.filter(statut='traitee', caisse__isnull=False)
        total_perso = 0
        for a in actions_traitees:
            if a.type == 'entree':
                total_perso += a.montant
            else:
                total_perso -= a.montant

        # Actions caisse principale traitées
        actions_principale = ActionCaisse.objects.filter(
            statut='traitee', is_caisse_principale=True
        )
        total_principale = 0
        for a in actions_principale:
            if a.type == 'entree':
                total_principale += a.montant
            else:
                total_principale -= a.montant

        solde_total = solde.montant + total_perso + total_principale

        return Response({
            'id': solde.id,
            'montant_initial': solde.montant,
            'solde_calcule': solde_total,
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
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        old_statut = instance.statut
        response = super().update(request, *args, **kwargs)
        instance.refresh_from_db()

        # Si statut passe à traitée ET catégorie = charge_variable → créer ChargeVariable
        if (old_statut != 'traitee' and instance.statut == 'traitee'
                and instance.categorie == 'charge_variable'):
            self._creer_charge_variable(instance)

        return response

    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)

    def _creer_charge_variable(self, action):
        try:
            ChargeVariable.objects.create(
                titre=action.titre,
                service=action.service,
                categorie='autre',
                sous_categorie='',
                montant=action.montant,
                date=action.date,
                description=action.description or f'Créé depuis caisse - {action.personne}',
                statut='traitee',
            )
        except Exception as e:
            print(f"Erreur création charge variable: {e}")