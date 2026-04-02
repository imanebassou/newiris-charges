from rest_framework import serializers
from .models import Salarie, ActionSalaire


class ActionSalaireSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActionSalaire
        fields = '__all__'


class SalarieSerializer(serializers.ModelSerializer):
    actions = ActionSalaireSerializer(many=True, read_only=True)

    class Meta:
        model = Salarie
        fields = '__all__'