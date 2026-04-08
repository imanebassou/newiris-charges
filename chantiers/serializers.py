from rest_framework import serializers
from .models import Chantier, PlanificationChantier, MaterielChantier


class PlanificationChantierSerializer(serializers.ModelSerializer):
    technicien_nom = serializers.CharField(source='technicien.__str__', read_only=True)
    technicien_photo = serializers.SerializerMethodField()
    chantier_nom = serializers.CharField(source='chantier.nom', read_only=True)

    class Meta:
        model = PlanificationChantier
        fields = '__all__'

    def get_technicien_photo(self, obj):
        if obj.technicien.photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.technicien.photo.url)
        return None


class ChantierSerializer(serializers.ModelSerializer):
    planifications = PlanificationChantierSerializer(many=True, read_only=True)

    class Meta:
        model = Chantier
        fields = '__all__'


class MaterielChantierSerializer(serializers.ModelSerializer):
    class Meta:
        model = MaterielChantier
        fields = '__all__'