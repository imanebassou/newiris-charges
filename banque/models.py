from django.db import models

class SoldeInitial(models.Model):
    montant = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Solde Initial'

    def __str__(self):
        return f"Solde: {self.montant} DH"


class ActionBanque(models.Model):
    TYPE_CHOICES = [
        ('entree', 'Entrée'),
        ('sortie', 'Sortie'),
    ]
    STATUT_CHOICES = [
        ('en_cours', 'En cours'),
        ('traitee', 'Traitée'),
    ]

    type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    date = models.DateField()
    titre = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    montant = models.DecimalField(max_digits=12, decimal_places=2)
    categorie = models.CharField(max_length=255, blank=True, default='')
    statut = models.CharField(max_length=10, choices=STATUT_CHOICES, default='en_cours')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f"{self.type} - {self.titre} - {self.montant} DH"