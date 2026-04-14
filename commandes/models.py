from django.db import models

class Commande(models.Model):
    CHOIX = [('en_attente', 'En attente'), ('ok', 'OK'), ('nok', 'NOK')]

    titre = models.CharField(max_length=200)
    fournisseur = models.ForeignKey('fournisseurs.Fournisseur', on_delete=models.SET_NULL, null=True, blank=True)
    montant = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    echeance = models.DateField(null=True, blank=True)
    mode_livraison = models.CharField(max_length=100, blank=True)
    type_paiement = models.CharField(max_length=100, blank=True)
    demande_achat = models.FileField(upload_to='commandes/docs/', null=True, blank=True)
    validation_direction = models.CharField(max_length=20, choices=CHOIX, default='en_attente')
    validation_finance = models.CharField(max_length=20, choices=CHOIX, default='en_attente')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.titre