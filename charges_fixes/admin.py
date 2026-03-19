from django.contrib import admin
from .models import ChargeFix

@admin.register(ChargeFix)
class ChargeFixAdmin(admin.ModelAdmin):
    list_display = ['id', 'service', 'categorie', 'montant', 'created_at']
    search_fields = ['categorie']
    list_filter = ['service']