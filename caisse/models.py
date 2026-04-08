from django.db import models
from services.models import Service


class SoldeCaisse(models.Model):
    montant = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Solde Caisse"

    def __str__(self):
        return f"Solde Caisse: {self.montant} DH"


class CaissePersonnelle(models.Model):
    nom = models.CharField(max_length=100)
    solde_initial = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Caisse Personnelle"

    def __str__(self):
        return self.nom

    @property
    def solde_calcule(self):
        actions = self.actions.filter(statut='traitee')
        total = self.solde_initial
        for a in actions:
            if a.type == 'entree':
                total += a.montant
            else:
                total -= a.montant
        return total


class ActionCaisse(models.Model):
    TYPE_CHOICES = [('entree', 'Entrée'), ('sortie', 'Sortie')]
    STATUT_CHOICES = [('en_cours', 'En cours'), ('traitee', 'Traitée')]
    CATEGORIE_CHOICES = [
        ('charge_variable', 'Charge Variable'),
        ('vehicule', 'Véhicule'),
        ('transport', 'Transport'),
        ('administratif', 'Charges administratives'),
        ('equipe', 'Dépenses équipe'),
        ('entretien', 'Entretien & nettoyage'),
        ('autre', 'Autre'),
    ]

    caisse = models.ForeignKey(
        CaissePersonnelle, on_delete=models.CASCADE,
        related_name='actions', null=True, blank=True
    )
    type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    titre = models.CharField(max_length=200)
    service = models.ForeignKey(
        Service, on_delete=models.SET_NULL, null=True, blank=True
    )
    categorie = models.CharField(max_length=50, choices=CATEGORIE_CHOICES)
    montant = models.DecimalField(max_digits=12, decimal_places=2)
    date = models.DateField()
    personne = models.CharField(max_length=100, blank=True)
    photo = models.ImageField(upload_to='caisse/photos/', null=True, blank=True)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='en_cours')
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    # Pour la caisse principale (sans caisse FK)
    is_caisse_principale = models.BooleanField(default=False)

    class Meta:
        verbose_name = "Action Caisse"
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f"{self.titre} - {self.montant} DH"