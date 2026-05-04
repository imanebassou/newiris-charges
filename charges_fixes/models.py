from django.db import models


class ChargeFixCategory(models.Model):
    TYPE_CHOICES = [
        ('traitee_par_banque', 'Traitee par banque'),
        ('traitee_par_caisse', 'Traitee par caisse'),
    ]

    nom = models.CharField(max_length=100, unique=True)
    type_traitement = models.CharField(max_length=30, choices=TYPE_CHOICES, default='traitee_par_banque')
    jour_du_mois = models.PositiveIntegerField(default=3)
    montant = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    date_debut = models.DateField(null=True, blank=True)
    date_fin = models.DateField(null=True, blank=True)

    class Meta:
        ordering = ['nom']

    def __str__(self):
        return f"{self.nom} ({self.jour_du_mois})"


class ChargeFix(models.Model):
    service = models.ForeignKey(
        'services.Service',
        on_delete=models.CASCADE
    )
    categorie = models.CharField(max_length=100)
    montant = models.DecimalField(max_digits=10, decimal_places=2)
    date_debut = models.DateField()
    date_fin = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.categorie} - {self.montant} DH"
