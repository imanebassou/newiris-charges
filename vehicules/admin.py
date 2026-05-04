from django.contrib import admin
from .models import Vehicule, DossierVehicule, ActionVehicule, DemandeVehicule


@admin.register(Vehicule)
class VehiculeAdmin(admin.ModelAdmin):
    list_display = ['nom', 'matricule', 'service', 'personne', 'etat_voiture', 'created_at']
    search_fields = ['nom', 'matricule']
    list_filter = ['service', 'etat_voiture', 'created_at']


@admin.register(DossierVehicule)
class DossierVehiculeAdmin(admin.ModelAdmin):
    list_display = ['vehicule', 'date_echeance_assurance', 'date_echeance_visite', 'date_echeance_vignette']
    search_fields = ['vehicule__nom', 'vehicule__matricule']


@admin.register(ActionVehicule)
class ActionVehiculeAdmin(admin.ModelAdmin):
    list_display = ['vehicule', 'type', 'date', 'montant']
    search_fields = ['vehicule__nom', 'vehicule__matricule']
    list_filter = ['type', 'date']


@admin.register(DemandeVehicule)
class DemandeVehiculeAdmin(admin.ModelAdmin):
    list_display = ['vehicule', 'attribue_a', 'demande_par', 'date_souhaitee', 'statut_validation']
    search_fields = ['vehicule__nom', 'vehicule__matricule']
    list_filter = ['statut_validation', 'date_souhaitee']
