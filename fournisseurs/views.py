from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Fournisseur
from .serializers import FournisseurSerializer
from .notifications import notify_overdue_fournisseurs_once


class FournisseurViewSet(viewsets.ModelViewSet):
    queryset = Fournisseur.objects.all()
    serializer_class = FournisseurSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        notify_overdue_fournisseurs_once(queryset)
        return queryset

    def perform_create(self, serializer):
        fournisseur = serializer.save()
        notify_overdue_fournisseurs_once(Fournisseur.objects.filter(pk=fournisseur.pk))

    def perform_update(self, serializer):
        fournisseur = serializer.save()
        if fournisseur.etat_regularite != 'depasee' and fournisseur.regularite_depassee_notified_at:
            fournisseur.regularite_depassee_notified_at = None
            fournisseur.save(update_fields=['regularite_depassee_notified_at'])
        notify_overdue_fournisseurs_once(Fournisseur.objects.filter(pk=fournisseur.pk))
