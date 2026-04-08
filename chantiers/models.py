from django.db import models
from equipe.models import Technicien


class Chantier(models.Model):
    ETAT_CHOICES = [
        ('confirme', 'Confirmé'),
        ('en_cours', 'En cours'),
        ('bloque', 'Bloqué'),
        ('termine', 'Terminé'),
        ('receptionne', 'Réceptionné'),
    ]

    nom = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    etat = models.CharField(max_length=20, choices=ETAT_CHOICES, default='confirme')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.nom


class PlanificationChantier(models.Model):
    chantier = models.ForeignKey(
        Chantier, on_delete=models.CASCADE, related_name='planifications'
    )
    technicien = models.ForeignKey(
        Technicien, on_delete=models.CASCADE, related_name='planifications'
    )
    date = models.DateField()

    class Meta:
        unique_together = ('chantier', 'technicien', 'date')
        ordering = ['date']

    def __str__(self):
        return f"{self.chantier} - {self.technicien} - {self.date}"


class MaterielChantier(models.Model):
    ETAT_CHOICES = [
        ('confirme', 'Confirmé'),
        ('bloque', 'Bloqué'),
        ('commande', 'Commandé'),
        ('livre', 'Livré'),
    ]

    nom = models.CharField(max_length=200)
    etat = models.CharField(max_length=20, choices=ETAT_CHOICES, default='confirme')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.nom