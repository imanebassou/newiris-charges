from rest_framework import serializers
from .models import DemandeCheque


class DemandeChequeSerializer(serializers.ModelSerializer):
    fournisseur_nom = serializers.CharField(
        source='fournisseur.nom', read_only=True
    )

    class Meta:
        model = DemandeCheque
        fields = '__all__'