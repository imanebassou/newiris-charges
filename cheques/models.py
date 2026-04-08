from django.db import models
from fournisseurs.models import Fournisseur


class DemandeCheque(models.Model):
    ETAT_SIGNATURE_CHOICES = [
        ('en_cours', 'En cours'),
        ('signe', 'Signé'),
    ]
    ETAT_LIVRAISON_CHOICES = [
        ('en_cours', 'En cours'),
        ('livre', 'Livré'),
    ]

    titre = models.CharField(max_length=200)
    fournisseur = models.ForeignKey(
        Fournisseur, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='demandes_cheques'
    )
    montant = models.DecimalField(max_digits=12, decimal_places=2)
    date_souhaitee_signature = models.DateField()
    categorie = models.CharField(
        max_length=100, default='Paiement fournisseur'
    )
    etat_signature = models.CharField(
        max_length=20, choices=ETAT_SIGNATURE_CHOICES, default='en_cours'
    )
    etat_livraison = models.CharField(
        max_length=20, choices=ETAT_LIVRAISON_CHOICES, default='en_cours'
    )
    date_echeance = models.DateField(null=True, blank=True)
    type_paiement = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.titre} - {self.montant} DH"