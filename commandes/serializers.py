from rest_framework import serializers
from .models import Commande

class CommandeSerializer(serializers.ModelSerializer):
    fournisseur_nom = serializers.SerializerMethodField()
    doc_url = serializers.SerializerMethodField()

    class Meta:
        model = Commande
        fields = '__all__'

    def get_fournisseur_nom(self, obj):
        return obj.fournisseur.nom if obj.fournisseur else None

    def get_doc_url(self, obj):
        request = self.context.get('request')
        if obj.demande_achat and request:
            return request.build_absolute_uri(obj.demande_achat.url)
        return None