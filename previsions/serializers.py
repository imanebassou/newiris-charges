from rest_framework import serializers
from .models import Prevision


class PrevisionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Prevision
        fields = '__all__'