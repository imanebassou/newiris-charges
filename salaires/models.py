from django.db import models


class Salarie(models.Model):
    nom = models.CharField(max_length=255)
    prenom = models.CharField(max_length=255)
    salaire_base = models.DecimalField(max_digits=12, decimal_places=2)
    date_debut = models.DateField()
    date_fin = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.nom} {self.prenom} — {self.salaire_base} DH"


class ActionSalaire(models.Model):
    TYPE_CHOICES = [
        ('entree', 'Entrée'),
        ('sortie', 'Sortie'),
    ]
    STATUT_CHOICES = [
        ('en_cours', 'En cours'),
        ('traitee', 'Traitée'),
    ]

    salarie = models.ForeignKey(Salarie, on_delete=models.CASCADE, related_name='actions')
    type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    categorie = models.CharField(max_length=255, blank=True, default='')
    montant = models.DecimalField(max_digits=12, decimal_places=2)
    date = models.DateField()
    statut = models.CharField(max_length=10, choices=STATUT_CHOICES, default='en_cours')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return f"{self.salarie} — {self.type} — {self.montant} DH"