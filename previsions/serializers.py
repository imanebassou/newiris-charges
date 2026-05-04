from rest_framework import serializers

from .models import Prevision, PrevisionSemaineConfig


class PrevisionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Prevision
        fields = '__all__'


class PrevisionSemaineConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrevisionSemaineConfig
        fields = '__all__'
