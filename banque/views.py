from rest_framework import viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import ActionBanque, SoldeInitial
from .serializers import ActionBanqueSerializer, SoldeInitialSerializer
from previsions.models import Prevision, PrevisionSemaineConfig


def infer_week_from_date(date_value):
    config = PrevisionSemaineConfig.objects.filter(
        mois=date_value.month,
        annee=date_value.year,
        debut_jour__lte=date_value.day,
        fin_jour__gte=date_value.day,
    ).order_by('semaine').first()

    if config:
        return config.semaine

    if date_value.day <= 7:
        return 1
    if date_value.day <= 14:
        return 2
    if date_value.day <= 22:
        return 3
    return 4


def sync_banque_to_prevision(action):
    if not action.source_prevision_id:
        return

    semaine = infer_week_from_date(action.date)

    Prevision.objects.filter(pk=action.source_prevision_id).update(
        type=action.type,
        titre=action.titre,
        description=action.description,
        montant=action.montant,
        date_prevision=action.date,
        categorie=action.categorie,
        statut=action.statut,
        semaine=semaine,
        mois=action.date.month,
        annee=action.date.year,
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def solde_view(request):
    solde_obj, _ = SoldeInitial.objects.get_or_create(id=1, defaults={'montant': 0})
    serializer = SoldeInitialSerializer(solde_obj)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def solde_calcule_view(request):
    solde_obj, _ = SoldeInitial.objects.get_or_create(id=1, defaults={'montant': 0})
    solde_base = float(solde_obj.montant)

    actions = ActionBanque.objects.filter(statut='traitee')
    entrees_banque = sum(float(a.montant) for a in actions if a.type == 'entree')
    sorties_banque = sum(float(a.montant) for a in actions if a.type == 'sortie')

    total_entrees = entrees_banque
    total_sorties = sorties_banque
    solde_final = solde_base + total_entrees - total_sorties

    return Response({
        'solde_final': solde_final,
        'entrees': total_entrees,
        'sorties': total_sorties,
    })


class ActionBanqueViewSet(viewsets.ModelViewSet):
    queryset = ActionBanque.objects.all()
    serializer_class = ActionBanqueSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        action = serializer.save()
        sync_banque_to_prevision(action)

    def perform_update(self, serializer):
        action = serializer.save()
        sync_banque_to_prevision(action)

    def perform_destroy(self, instance):
        linked_prevision = instance.source_prevision
        instance.delete()

        if linked_prevision:
            Prevision.objects.filter(pk=linked_prevision.pk).update(statut='en_cours')
