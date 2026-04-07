from rest_framework import viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Salarie, ActionSalaire
from .serializers import SalarieSerializer, ActionSalaireSerializer
import calendar
from datetime import date


class SalarieViewSet(viewsets.ModelViewSet):
    queryset = Salarie.objects.all()
    serializer_class = SalarieSerializer
    permission_classes = [IsAuthenticated]


class ActionSalaireViewSet(viewsets.ModelViewSet):
    queryset = ActionSalaire.objects.all()
    serializer_class = ActionSalaireSerializer
    permission_classes = [IsAuthenticated]


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def etat_salaires_view(request):
    mois = request.query_params.get('mois')
    annee = request.query_params.get('annee')

    salaries = Salarie.objects.all()
    result = []

    for salarie in salaries:
        # Filtrer par période
        if mois and annee:
            mois_int = int(mois)
            annee_int = int(annee)
            last_day = calendar.monthrange(annee_int, mois_int)[1]
            mois_debut = date(annee_int, mois_int, 1)
            mois_fin = date(annee_int, mois_int, last_day)

            if salarie.date_fin < mois_debut or salarie.date_debut > mois_fin:
                continue

        actions = salarie.actions.all()
        if mois and annee:
            actions = actions.filter(date__month=mois, date__year=annee)

        entrees = sum(float(a.montant) for a in actions if a.type == 'entree')
        sorties = sum(float(a.montant) for a in actions if a.type == 'sortie')
        salaire_final = float(salarie.salaire_base) + entrees - sorties
        ecart = salaire_final - float(salarie.salaire_base)

        result.append({
            'id': salarie.id,
            'nom': salarie.nom,
            'prenom': salarie.prenom,
            'salaire_base': float(salarie.salaire_base),
            'montant_ajoute': entrees,
            'montant_deduit': sorties,
            'salaire_final': salaire_final,
            'ecart': ecart,
            'date_debut': salarie.date_debut,
            'date_fin': salarie.date_fin,
        })

    return Response(result)