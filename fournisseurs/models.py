from django.db import models
from django.utils import timezone


class Fournisseur(models.Model):
    ETAT_CHOICES = [
        ('en_cours', 'En cours'),
        ('depasee', 'Dépassée'),
        ('renouvelee', 'Renouvelée'),
    ]

    nom = models.CharField(max_length=255)
    type_contrat = models.CharField(max_length=255)
    date_fin_rf = models.DateField()
    etat_regularite_override = models.CharField(
        max_length=20, choices=ETAT_CHOICES, blank=True, default=''
    )
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def echeance(self):
        today = timezone.now().date()
        return (self.date_fin_rf - today).days

    @property
    def etat_regularite(self):
        if self.etat_regularite_override:
            return self.etat_regularite_override
        if self.echeance > 0:
            return 'en_cours'
        return 'depasee'

    def __str__(self):
        return f"{self.nom} — {self.type_contrat}"