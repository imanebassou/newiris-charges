from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import SoldeInitial, ActionBanque
from .serializers import SoldeInitialSerializer, ActionBanqueSerializer
from previsions.models import Prevision


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def solde_view(request):
    solde_obj, _ = SoldeInitial.objects.get_or_create(id=1, defaults={'montant': 0})
    serializer = SoldeInitialSerializer(solde_obj)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def solde_calcule_view(request):
    # Solde de base
    solde_obj, _ = SoldeInitial.objects.get_or_create(id=1, defaults={'montant': 0})
    solde_base = float(solde_obj.montant)

    # Actions banque traitées
    actions = ActionBanque.objects.filter(statut='traitee')
    entrees_banque = sum(float(a.montant) for a in actions if a.type == 'entree')
    sorties_banque = sum(float(a.montant) for a in actions if a.type == 'sortie')

    # Prévisions traitées
    previsions_traitees = Prevision.objects.filter(statut='traitee')
    entrees_prev = sum(float(p.montant) for p in previsions_traitees if p.type == 'entree')
    sorties_prev = sum(float(p.montant) for p in previsions_traitees if p.type == 'sortie')

    total_entrees = entrees_banque + entrees_prev
    total_sorties = sorties_banque + sorties_prev
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