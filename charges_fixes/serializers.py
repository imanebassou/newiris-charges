from rest_framework import serializers
from .models import ChargeFix

class ChargeFixSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChargeFix
        fields = '__all__'