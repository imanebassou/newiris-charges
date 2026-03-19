from rest_framework import serializers
from .models import ChargeVariable

class ChargeVariableSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChargeVariable
        fields = ['id', 'titre', 'service', 'categorie', 
                  'sous_categorie', 'montant', 'date', 
                  'description', 'photo', 'statut', 
                  'created_by', 'created_at', 'updated_at']
        read_only_fields = ['created_by', 'created_at', 'updated_at']