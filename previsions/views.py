from decimal import Decimal

from rest_framework import viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from banque.models import ActionBanque
from .models import Prevision, PrevisionSemaineConfig
from .serializers import PrevisionSerializer, PrevisionSemaineConfigSerializer


DEFAULT_WEEK_RANGES = [
    (1, 7),
    (8, 14),
    (15, 22),
    (23, 31),
]


def previous_month(mois, annee):
    if mois == 1:
        return 12, annee - 1
    return mois - 1, annee


def bank_running_balance():
    total = Decimal('0.00')
    for action in ActionBanque.objects.filter(statut='traitee').order_by('date', 'id'):
        if action.type == 'entree':
            total += action.montant
        else:
            total -= action.montant
    return total


def ensure_configs(mois, annee):
    configs = []
    for index, (debut, fin) in enumerate(DEFAULT_WEEK_RANGES, start=1):
        config, _ = PrevisionSemaineConfig.objects.get_or_create(
            mois=mois,
            annee=annee,
            semaine=index,
            defaults={
                'debut_jour': debut,
                'fin_jour': fin,
            },
        )
        configs.append(config)
    return PrevisionSemaineConfig.objects.filter(mois=mois, annee=annee).order_by('semaine')


def month_has_data(mois, annee):
    return (
        Prevision.objects.filter(mois=mois, annee=annee).exists()
        or PrevisionSemaineConfig.objects.filter(mois=mois, annee=annee).exists()
    )


def compute_month_summary(mois, annee, depth=0):
    configs = list(ensure_configs(mois, annee))
    previsions = list(
        Prevision.objects.filter(mois=mois, annee=annee).order_by('semaine', 'date_prevision', 'id')
    )

    if depth > 24:
        carry_start = bank_running_balance()
    else:
        prev_mois, prev_annee = previous_month(mois, annee)
        if month_has_data(prev_mois, prev_annee):
            previous_summary = compute_month_summary(prev_mois, prev_annee, depth + 1)
            carry_start = Decimal(str(previous_summary['weeks'][4]['solde_fin']))
        else:
            carry_start = bank_running_balance()

    total_entrees_mois = Decimal('0.00')
    total_sorties_mois = Decimal('0.00')
    weeks = {}
    courant = carry_start

    for config in configs:
        week_previsions = [p for p in previsions if p.semaine == config.semaine]
        week_previsions_calcul = [p for p in week_previsions if not p.exclure_du_calcul]

        entrees = sum((p.montant for p in week_previsions_calcul if p.type == 'entree'), Decimal('0.00'))
        sorties = sum((p.montant for p in week_previsions_calcul if p.type == 'sortie'), Decimal('0.00'))

        total_entrees_mois += entrees
        total_sorties_mois += sorties

        solde_debut = config.solde_debut_manuel if config.solde_debut_manuel is not None else courant
        net = entrees - sorties
        solde_fin = solde_debut + net

        weeks[config.semaine] = {
            'semaine': config.semaine,
            'debut_jour': config.debut_jour,
            'fin_jour': config.fin_jour,
            'solde_debut': float(solde_debut),
            'entrees': float(entrees),
            'sorties': float(sorties),
            'net': float(net),
            'ecart': float(net),
            'solde_fin': float(solde_fin),
            'solde_debut_manuel': float(config.solde_debut_manuel) if config.solde_debut_manuel is not None else None,
            'config_id': config.id,
        }
        courant = solde_fin

    return {
        'weeks': weeks,
        'carry_start': float(carry_start),
        'total_entrees_mois': float(total_entrees_mois),
        'total_sorties_mois': float(total_sorties_mois),
        'ecart_mois': float(total_entrees_mois - total_sorties_mois),
        'solde_fin_mois': float(courant),
    }


def sync_prevision_to_banque(prevision):
    if prevision.exclure_du_calcul:
        ActionBanque.objects.filter(source_prevision=prevision).delete()
        return

    if prevision.statut == 'traitee':
        ActionBanque.objects.update_or_create(
            source_prevision=prevision,
            defaults={
                'type': prevision.type,
                'date': prevision.date_prevision,
                'titre': prevision.titre,
                'description': prevision.description,
                'montant': prevision.montant,
                'categorie': prevision.categorie,
                'statut': prevision.statut,
            },
        )
    else:
        ActionBanque.objects.filter(source_prevision=prevision).delete()


class PrevisionViewSet(viewsets.ModelViewSet):
    queryset = Prevision.objects.all()
    serializer_class = PrevisionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Prevision.objects.all()
        mois = self.request.query_params.get('mois')
        annee = self.request.query_params.get('annee')
        semaine = self.request.query_params.get('semaine')

        if mois:
            queryset = queryset.filter(mois=mois)
        if annee:
            queryset = queryset.filter(annee=annee)
        if semaine:
            queryset = queryset.filter(semaine=semaine)

        return queryset.order_by('semaine', 'date_prevision', 'id')

    def perform_create(self, serializer):
        prevision = serializer.save()
        sync_prevision_to_banque(prevision)

    def perform_update(self, serializer):
        prevision = serializer.save()
        sync_prevision_to_banque(prevision)

    def perform_destroy(self, instance):
        ActionBanque.objects.filter(source_prevision=instance).delete()
        instance.delete()


class PrevisionSemaineConfigViewSet(viewsets.ModelViewSet):
    queryset = PrevisionSemaineConfig.objects.all()
    serializer_class = PrevisionSemaineConfigSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = PrevisionSemaineConfig.objects.all()
        mois = self.request.query_params.get('mois')
        annee = self.request.query_params.get('annee')

        if mois:
            queryset = queryset.filter(mois=mois)
        if annee:
            queryset = queryset.filter(annee=annee)

        return queryset.order_by('semaine')

    def list(self, request, *args, **kwargs):
        mois = request.query_params.get('mois')
        annee = request.query_params.get('annee')

        if mois and annee:
            ensure_configs(int(mois), int(annee))

        return super().list(request, *args, **kwargs)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def ecarts_view(request):
    mois = request.query_params.get('mois')
    annee = request.query_params.get('annee')

    if not mois or not annee:
        return Response({'error': 'mois et annee requis'}, status=400)

    mois_int = int(mois)
    annee_int = int(annee)

    summary = compute_month_summary(mois_int, annee_int)
    semaines = PrevisionSemaineConfigSerializer(
        ensure_configs(mois_int, annee_int),
        many=True
    ).data

    return Response({
        'solde_base': summary['carry_start'],
        'ecarts': {f"semaine_{key}": value for key, value in summary['weeks'].items()},
        'semaines': semaines,
        'total_entrees_mois': summary['total_entrees_mois'],
        'total_sorties_mois': summary['total_sorties_mois'],
        'ecart_mois': summary['ecart_mois'],
        'solde_fin_mois': summary['solde_fin_mois'],
    })
