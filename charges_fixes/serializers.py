from rest_framework import serializers
from .models import ChargeFix, ChargeFixCategory


class ChargeFixCategorySerializer(serializers.ModelSerializer):
    type_traitement_label = serializers.CharField(source='get_type_traitement_display', read_only=True)

    class Meta:
        model = ChargeFixCategory
        fields = [
            'id',
            'nom',
            'type_traitement',
            'type_traitement_label',
            'jour_du_mois',
            'montant',
            'date_debut',
            'date_fin',
        ]


class ChargeFixSerializer(serializers.ModelSerializer):
    service_nom = serializers.CharField(source='service.nom', read_only=True)
    service_photo_url = serializers.SerializerMethodField()

    class Meta:
        model = ChargeFix
        fields = [
            'id',
            'service',
            'service_nom',
            'service_photo_url',
            'categorie',
            'montant',
            'date_debut',
            'date_fin',
            'created_at',
            'updated_at',
        ]

    def get_service_photo_url(self, obj):
        request = self.context.get('request')
        if obj.service and obj.service.photo:
            if request:
                return request.build_absolute_uri(obj.service.photo.url)
            return obj.service.photo.url
        return None
