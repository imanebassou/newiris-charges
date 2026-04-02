from rest_framework import serializers
from .models import Fournisseur


class FournisseurSerializer(serializers.ModelSerializer):
    echeance = serializers.ReadOnlyField()
    etat_regularite = serializers.ReadOnlyField()

    class Meta:
        model = Fournisseur
        fields = '__all__'