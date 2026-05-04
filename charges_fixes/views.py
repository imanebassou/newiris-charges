from rest_framework import generics, permissions
from django_filters.rest_framework import DjangoFilterBackend
from previsions.models import Prevision
from .models import ChargeFix, ChargeFixCategory
from .serializers import ChargeFixSerializer, ChargeFixCategorySerializer
import datetime
import calendar


def get_semaine_from_day(day):
    if day <= 7:
        return 1
    if day <= 14:
        return 2
    if day <= 22:
        return 3
    return 4


def iter_months_between(date_debut, date_fin):
    current_year = date_debut.year
    current_month = date_debut.month

    while (current_year < date_fin.year) or (current_year == date_fin.year and current_month <= date_fin.month):
        yield current_year, current_month

        if current_month == 12:
            current_month = 1
            current_year += 1
        else:
            current_month += 1


class ChargeFixCategoryListCreateView(generics.ListCreateAPIView):
    queryset = ChargeFixCategory.objects.all()
    serializer_class = ChargeFixCategorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save()
        sync_fixed_charge_previsions()


class ChargeFixCategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ChargeFixCategory.objects.all()
    serializer_class = ChargeFixCategorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_update(self, serializer):
        old_instance = self.get_object()
        old_name = old_instance.nom
        instance = serializer.save()

        if old_name != instance.nom:
            ChargeFix.objects.filter(categorie=old_name).update(categorie=instance.nom)

        sync_fixed_charge_previsions()

    def perform_destroy(self, instance):
        old_name = instance.nom
        super().perform_destroy(instance)
        Prevision.objects.filter(
            type='sortie',
            categorie=old_name,
            description__startswith='Finance - Charge fixe'
        ).delete()
        sync_fixed_charge_previsions()


class ChargeFixListView(generics.ListCreateAPIView):
    queryset = ChargeFix.objects.all()
    serializer_class = ChargeFixSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['service', 'categorie']

    def perform_create(self, serializer):
        serializer.save()
        sync_fixed_charge_previsions()


class ChargeFixDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ChargeFix.objects.all()
    serializer_class = ChargeFixSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_update(self, serializer):
        serializer.save()
        sync_fixed_charge_previsions()

    def perform_destroy(self, instance):
        super().perform_destroy(instance)
        sync_fixed_charge_previsions()


def sync_fixed_charge_previsions():
    try:
        managed_categories = list(ChargeFixCategory.objects.all())
        managed_names = [c.nom for c in managed_categories]

        if managed_names:
            Prevision.objects.filter(
                type='sortie',
                categorie__in=managed_names,
                description__startswith='Finance - Charge fixe',
            ).delete()

        for category in managed_categories:
            if not category.date_debut or not category.date_fin:
                continue

            if category.date_fin < category.date_debut:
                continue

            for year, month in iter_months_between(category.date_debut, category.date_fin):
                last_day = calendar.monthrange(year, month)[1]
                day = min(max(category.jour_du_mois, 1), last_day)
                date_prevision = datetime.date(year, month, day)
                semaine = get_semaine_from_day(day)

                libelle_type = (
                    'Traitee par banque'
                    if category.type_traitement == 'traitee_par_banque'
                    else 'Traitee par caisse'
                )

                Prevision.objects.create(
                    type='sortie',
                    titre=category.nom,
                    description=f'Finance - Charge fixe - {libelle_type}',
                    montant=category.montant,
                    date_prevision=date_prevision,
                    categorie=category.nom,
                    statut='en_cours',
                    semaine=semaine,
                    mois=month,
                    annee=year,
                    exclure_du_calcul=(category.type_traitement == 'traitee_par_caisse'),
                )

    except Exception as e:
        print(f"Erreur synchronisation previsions charges fixes: {e}")
