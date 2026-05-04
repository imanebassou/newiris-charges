from django.conf import settings
from django.db import models
from fournisseurs.models import Fournisseur


class DemandeCheque(models.Model):
    STATUT_TICKET_CHOICES = [
        ('en_validation', 'En validation'),
        ('reporte', 'Reportee'),
        ('en_attente_signature', 'En attente de signature'),
        ('cheque_signe', 'Cheque signe'),
        ('livre_a_equipe', 'Livre a l equipe'),
        ('traitee', 'Traitee'),
    ]

    ETAT_SUIVI_CHOICES = [
        ('en_cours', 'En cours'),
        ('traitee', 'Traitee'),
    ]

    titre = models.CharField(max_length=200)
    commande = models.ForeignKey(
        'commandes.Commande',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='demandes_cheques'
    )
    fournisseur = models.ForeignKey(
        Fournisseur,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='demandes_cheques'
    )
    personne = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='demandes_cheques_creees'
    )

    montant = models.DecimalField(max_digits=12, decimal_places=2)
    date_souhaitee_signature = models.DateField(null=True, blank=True)
    date_echeance = models.DateField(null=True, blank=True)

    categorie = models.CharField(max_length=100, default='Paiement fournisseur')
    type_paiement = models.CharField(max_length=100, blank=True)

    po = models.FileField(upload_to='cheques/po/', null=True, blank=True)

    is_ticket_initial = models.BooleanField(default=False)

    statut_ticket = models.CharField(
        max_length=30,
        choices=STATUT_TICKET_CHOICES,
        default='en_validation'
    )

    etat_signature = models.CharField(
        max_length=20,
        choices=ETAT_SUIVI_CHOICES,
        default='en_cours'
    )
    livre_a_equipe = models.CharField(
        max_length=20,
        choices=ETAT_SUIVI_CHOICES,
        default='en_cours'
    )
    livre_au_transport = models.CharField(
        max_length=20,
        choices=ETAT_SUIVI_CHOICES,
        default='en_cours'
    )
    etat_livraison = models.CharField(
        max_length=20,
        choices=ETAT_SUIVI_CHOICES,
        default='en_cours'
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.titre} - {self.montant} DH"
