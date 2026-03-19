from rest_framework import serializers
from .models import ChargeFix

class ChargeFixSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChargeFix
        fields = ['id', 'service', 'categorie', 
                  'montant', 'created_at', 'updated_at']