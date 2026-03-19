from django.db import models

class ChargeVariable(models.Model):

    class Statut(models.TextChoices):
        EN_COURS = 'en_cours', 'En cours'
        TRAITEE = 'traitee', 'Traitée'

    titre = models.CharField(max_length=200)
    
    service = models.ForeignKey(
        'services.Service',
        on_delete=models.CASCADE
    )
    
    categorie = models.CharField(max_length=100)
    sous_categorie = models.CharField(max_length=100, blank=True)
    montant = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateField()
    description = models.TextField(blank=True)
    
    photo = models.ImageField(
        upload_to='charges/photos/',
        null=True,
        blank=True
    )
    
    statut = models.CharField(
        max_length=20,
        choices=Statut.choices,
        default=Statut.EN_COURS
    )
    
    created_by = models.ForeignKey(
        'users.CustomUser',
        on_delete=models.SET_NULL,
        null=True
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.titre} - {self.montant} DH"