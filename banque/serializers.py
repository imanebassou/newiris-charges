from rest_framework import serializers
from .models import SoldeInitial, ActionBanque


class SoldeInitialSerializer(serializers.ModelSerializer):
    class Meta:
        model = SoldeInitial
        fields = '__all__'


class ActionBanqueSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActionBanque
        fields = '__all__'