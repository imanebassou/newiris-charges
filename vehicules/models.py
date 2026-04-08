from django.db import models
from services.models import Service
from users.models import CustomUser


class Vehicule(models.Model):
    ETAT_CHOICES = [
        ('normal', 'Normal'),
        ('proche', 'Proche'),
        ('depasee', 'Dépassée'),
    ]
    ETAT_VOITURE_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('en_panne', 'En panne'),
    ]

    nom = models.CharField(max_length=100)
    matricule = models.CharField(max_length=50)
    service = models.ForeignKey(
        Service, on_delete=models.SET_NULL, null=True, blank=True
    )
    personne = models.ForeignKey(
        CustomUser, on_delete=models.SET_NULL, null=True, blank=True
    )
    couleur = models.CharField(max_length=50, blank=True)

    # États
    etat_vidange = models.CharField(max_length=20, choices=ETAT_CHOICES, default='normal')
    etat_assurance = models.CharField(max_length=20, choices=ETAT_CHOICES, default='normal')
    etat_vignette = models.CharField(max_length=20, choices=ETAT_CHOICES, default='normal')
    etat_revision = models.CharField(max_length=20, choices=ETAT_CHOICES, default='normal')
    etat_voiture = models.CharField(max_length=20, choices=ETAT_VOITURE_CHOICES, default='active')

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.nom} - {self.matricule}"


class DossierVehicule(models.Model):
    vehicule = models.OneToOneField(
        Vehicule, on_delete=models.CASCADE, related_name='dossier'
    )
    date_echeance_assurance = models.DateField(null=True, blank=True)
    date_echeance_visite = models.DateField(null=True, blank=True)
    date_echeance_vignette = models.DateField(null=True, blank=True)
    km_actuel = models.IntegerField(null=True, blank=True)
    km_next_vidange = models.IntegerField(null=True, blank=True)
    nombre_vidange = models.IntegerField(default=0)

    def __str__(self):
        return f"Dossier {self.vehicule.nom}"


class ActionVehicule(models.Model):
    TYPE_CHOICES = [
        ('vidange', 'Vidange'),
        ('vignette', 'Vignette'),
        ('assurance', 'Assurance'),
        ('lavage', 'Lavage'),
        ('depannage', 'Dépannage'),
    ]

    vehicule = models.ForeignKey(
        Vehicule, on_delete=models.CASCADE, related_name='actions'
    )
    date = models.DateField()
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    montant = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return f"{self.type} - {self.vehicule.nom}"


class DemandeVehicule(models.Model):
    STATUT_CHOICES = [
        ('en_attente', 'En attente'),
        ('valide', 'Validé'),
        ('refuse', 'Refusé'),
    ]

    vehicule = models.ForeignKey(
        Vehicule, on_delete=models.CASCADE, related_name='demandes'
    )
    attribue_a = models.ForeignKey(
        CustomUser, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='demandes_vehicule_attribuees'
    )
    demande_par = models.ForeignKey(
        CustomUser, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='demandes_vehicule_faites'
    )
    date_souhaitee = models.DateField()
    statut_validation = models.CharField(
        max_length=20, choices=STATUT_CHOICES, default='en_attente'
    )
    date_retour = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Demande {self.vehicule.nom}"