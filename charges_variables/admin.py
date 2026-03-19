from django.contrib import admin
from .models import ChargeVariable

@admin.register(ChargeVariable)
class ChargeVariableAdmin(admin.ModelAdmin):
    list_display = ['id', 'titre', 'service', 'categorie', 
                    'montant', 'statut', 'created_by', 'created_at']
    search_fields = ['titre', 'categorie']
    list_filter = ['service', 'statut', 'categorie']