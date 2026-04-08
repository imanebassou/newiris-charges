from rest_framework import serializers
from .models import Vehicule, DossierVehicule, ActionVehicule, DemandeVehicule


class DossierVehiculeSerializer(serializers.ModelSerializer):
    class Meta:
        model = DossierVehicule
        fields = '__all__'


class VehiculeSerializer(serializers.ModelSerializer):
    service_nom = serializers.CharField(source='service.nom', read_only=True)
    personne_nom = serializers.CharField(source='personne.username', read_only=True)
    dossier = DossierVehiculeSerializer(read_only=True)

    class Meta:
        model = Vehicule
        fields = '__all__'


class ActionVehiculeSerializer(serializers.ModelSerializer):
    vehicule_nom = serializers.CharField(source='vehicule.nom', read_only=True)

    class Meta:
        model = ActionVehicule
        fields = '__all__'


class DemandeVehiculeSerializer(serializers.ModelSerializer):
    vehicule_nom = serializers.CharField(source='vehicule.nom', read_only=True)
    attribue_a_nom = serializers.CharField(source='attribue_a.username', read_only=True)
    demande_par_nom = serializers.CharField(source='demande_par.username', read_only=True)

    class Meta:
        model = DemandeVehicule
        fields = '__all__'