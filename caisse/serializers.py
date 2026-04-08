from rest_framework import serializers
from .models import SoldeCaisse, CaissePersonnelle, ActionCaisse


class SoldeCaisseSerializer(serializers.ModelSerializer):
    class Meta:
        model = SoldeCaisse
        fields = '__all__'


class ActionCaisseSerializer(serializers.ModelSerializer):
    service_nom = serializers.CharField(source='service.nom', read_only=True)
    photo_url = serializers.SerializerMethodField()

    class Meta:
        model = ActionCaisse
        fields = '__all__'

    def get_photo_url(self, obj):
        if obj.photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.photo.url)
        return None


class CaissePersonnelleSerializer(serializers.ModelSerializer):
    solde_calcule = serializers.ReadOnlyField()
    actions = ActionCaisseSerializer(many=True, read_only=True)

    class Meta:
        model = CaissePersonnelle
        fields = '__all__'