from django.db import models
from django.utils import timezone


class Fournisseur(models.Model):
    nom = models.CharField(max_length=255)
    type_contrat = models.CharField(max_length=255)
    date_fin_rf = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def echeance(self):
        today = timezone.now().date()
        return (self.date_fin_rf - today).days

    @property
    def etat_regularite(self):
        if self.echeance > 0:
            return 'en_cours'
        return 'depasee'

    def __str__(self):
        return f"{self.nom} — {self.type_contrat}"