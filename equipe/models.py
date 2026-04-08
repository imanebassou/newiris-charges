from django.db import models


class ChefEquipe(models.Model):
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    photo = models.ImageField(upload_to='equipe/photos/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['nom']

    def __str__(self):
        return f"{self.prenom} {self.nom}"


class Technicien(models.Model):
    NIVEAU_CHOICES = [
        ('confirme', 'Technicien Confirmé'),
        ('operationnel', 'Technicien Opérationnel'),
        ('junior', 'Technicien Junior'),
    ]

    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    photo = models.ImageField(upload_to='equipe/photos/', null=True, blank=True)
    niveau = models.CharField(max_length=20, choices=NIVEAU_CHOICES, default='junior')
    chef = models.ForeignKey(
        ChefEquipe, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='techniciens'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['nom']

    def __str__(self):
        return f"{self.prenom} {self.nom} ({self.niveau})"


class Materiel(models.Model):
    nom = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['nom']

    def __str__(self):
        return self.nom


class EtatMaterielTechnicien(models.Model):
    COULEUR_CHOICES = [
        ('vert', 'Vert'),
        ('orange', 'Orange'),
        ('rouge', 'Rouge'),
        ('gris', 'Gris'),
    ]

    technicien = models.ForeignKey(
        Technicien, on_delete=models.CASCADE, related_name='etats_materiels'
    )
    materiel = models.ForeignKey(
        Materiel, on_delete=models.CASCADE, related_name='etats_techniciens'
    )
    couleur = models.CharField(
        max_length=10, choices=COULEUR_CHOICES, default='vert'
    )

    class Meta:
        unique_together = ('technicien', 'materiel')

    def __str__(self):
        return f"{self.technicien} - {self.materiel} - {self.couleur}"