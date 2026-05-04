from rest_framework import serializers
from .models import DemandeCheque


class DemandeChequeSerializer(serializers.ModelSerializer):
    fournisseur_nom = serializers.CharField(source='fournisseur.nom', read_only=True)
    commande_titre = serializers.CharField(source='commande.titre', read_only=True)
    personne_nom = serializers.SerializerMethodField()
    po_url = serializers.SerializerMethodField()
    statut_ticket_label = serializers.CharField(source='get_statut_ticket_display', read_only=True)

    class Meta:
        model = DemandeCheque
        fields = '__all__'

    def get_personne_nom(self, obj):
        if obj.personne:
            full_name = obj.personne.get_full_name().strip()
            return full_name or obj.personne.username
        return None

    def get_po_url(self, obj):
        request = self.context.get('request')
        if obj.po and request:
            return request.build_absolute_uri(obj.po.url)
        return None
