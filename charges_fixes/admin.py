from django.contrib import admin
from .models import ChargeFix, ChargeFixCategory


@admin.register(ChargeFixCategory)
class ChargeFixCategoryAdmin(admin.ModelAdmin):
    list_display = ['id', 'nom', 'jour_du_mois']
    search_fields = ['nom']


@admin.register(ChargeFix)
class ChargeFixAdmin(admin.ModelAdmin):
    list_display = ['id', 'service', 'categorie', 'montant', 'date_debut', 'date_fin', 'created_at']
    search_fields = ['categorie']
    list_filter = ['service', 'categorie']
