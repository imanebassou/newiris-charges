from rest_framework import serializers
from .models import ChefEquipe, Technicien, Materiel, EtatMaterielTechnicien


class TechnicienSerializer(serializers.ModelSerializer):
    chef_nom = serializers.CharField(source='chef.__str__', read_only=True)
    photo_url = serializers.SerializerMethodField()

    class Meta:
        model = Technicien
        fields = '__all__'

    def get_photo_url(self, obj):
        if obj.photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.photo.url)
        return None


class ChefEquipeSerializer(serializers.ModelSerializer):
    techniciens = TechnicienSerializer(many=True, read_only=True)
    photo_url = serializers.SerializerMethodField()

    class Meta:
        model = ChefEquipe
        fields = '__all__'

    def get_photo_url(self, obj):
        if obj.photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.photo.url)
        return None


class MaterielSerializer(serializers.ModelSerializer):
    class Meta:
        model = Materiel
        fields = '__all__'


class EtatMaterielTechnicienSerializer(serializers.ModelSerializer):
    technicien_nom = serializers.CharField(source='technicien.__str__', read_only=True)
    materiel_nom = serializers.CharField(source='materiel.nom', read_only=True)

    class Meta:
        model = EtatMaterielTechnicien
        fields = '__all__'