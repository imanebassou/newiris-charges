from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import SoldeInitial, ActionBanque
from .serializers import SoldeInitialSerializer, ActionBanqueSerializer
from decimal import Decimal


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def solde_view(request):
    solde, _ = SoldeInitial.objects.get_or_create(id=1, defaults={'montant': 0})

    if request.method == 'GET':
        serializer = SoldeInitialSerializer(solde)
        return Response(serializer.data)

    elif request.method == 'PUT':
        serializer = SoldeInitialSerializer(solde, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def solde_calcule_view(request):
    solde_obj, _ = SoldeInitial.objects.get_or_create(id=1, defaults={'montant': 0})
    solde_base = solde_obj.montant
    date_modif = solde_obj.date_modification

    actions_apres = ActionBanque.objects.filter(date__gte=date_modif.date())

    entrees = sum(a.montant for a in actions_apres if a.type == 'entree')
    sorties = sum(a.montant for a in actions_apres if a.type == 'sortie')

    solde_final = solde_base + Decimal(str(entrees)) - Decimal(str(sorties))

    return Response({
        'solde_base': float(solde_base),
        'solde_final': float(solde_final),
        'date_modification': date_modif,
        'entrees': float(entrees),
        'sorties': float(sorties),
    })


class ActionBanqueViewSet(viewsets.ModelViewSet):
    queryset = ActionBanque.objects.all()
    serializer_class = ActionBanqueSerializer
    permission_classes = [IsAuthenticated]