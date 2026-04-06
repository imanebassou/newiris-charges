from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Prevision
from .serializers import PrevisionSerializer
from banque.models import SoldeInitial, ActionBanque
from decimal import Decimal


class PrevisionViewSet(viewsets.ModelViewSet):
    queryset = Prevision.objects.all()
    serializer_class = PrevisionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Prevision.objects.all()
        mois = self.request.query_params.get('mois')
        annee = self.request.query_params.get('annee')
        if mois:
            queryset = queryset.filter(mois=mois)
        if annee:
            queryset = queryset.filter(annee=annee)
        return queryset

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        old_statut = instance.statut
        response = super().update(request, *args, **kwargs)
        instance.refresh_from_db()
        if old_statut != 'traitee' and instance.statut == 'traitee':
            ActionBanque.objects.create(
                type=instance.type,
                date=instance.date_prevision,
                titre=instance.titre,
                description=instance.description,
                montant=instance.montant,
                categorie=instance.categorie,
                statut='traitee',
            )
        return response


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def ecarts_view(request):
    mois = request.query_params.get('mois')
    annee = request.query_params.get('annee')

    if not mois or not annee:
        return Response({'error': 'mois et annee requis'}, status=400)

    previsions = Prevision.objects.filter(mois=mois, annee=annee)

    # Solde basé sur actions banque traitées uniquement
    actions = ActionBanque.objects.filter(statut='traitee')
    entrees = sum(float(a.montant) for a in actions if a.type == 'entree')
    sorties = sum(float(a.montant) for a in actions if a.type == 'sortie')
    solde_base = entrees - sorties

    ecarts = {}
    solde_courant = solde_base

    for semaine in [1, 2, 3, 4]:
        prevs_semaine = previsions.filter(semaine=semaine)
        entrees_s = sum(float(p.montant) for p in prevs_semaine if p.type == 'entree')
        sorties_s = sum(float(p.montant) for p in prevs_semaine if p.type == 'sortie')
        ecart = solde_courant + entrees_s - sorties_s
        ecarts[f'semaine_{semaine}'] = {
            'entrees': entrees_s,
            'sorties': sorties_s,
            'ecart': ecart,
            'solde_debut': solde_courant,
        }
        solde_courant = ecart

    return Response({
        'solde_base': solde_base,
        'ecarts': ecarts,
    })