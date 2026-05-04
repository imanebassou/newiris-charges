from rest_framework import serializers
from .models import Service


class ServiceSerializer(serializers.ModelSerializer):
    photo_url = serializers.SerializerMethodField()
    responsable_nom = serializers.SerializerMethodField()

    class Meta:
        model = Service
        fields = ['id', 'nom', 'responsable', 'responsable_nom', 'photo', 'photo_url', 'created_at']

    def get_photo_url(self, obj):
        request = self.context.get('request')
        if obj.photo:
            if request:
                return request.build_absolute_uri(obj.photo.url)
            return obj.photo.url
        return None

    def get_responsable_nom(self, obj):
        if obj.responsable:
            return obj.responsable.username
        return None
