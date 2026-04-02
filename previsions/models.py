from django.db import models


class Prevision(models.Model):
    TYPE_CHOICES = [
        ('entree', 'Entrée'),
        ('sortie', 'Sortie'),
    ]
    STATUT_CHOICES = [
        ('en_cours', 'En cours'),
        ('traitee', 'Traitée'),
        ('cloturee', 'Clôturée'),
    ]
    SEMAINE_CHOICES = [
        (1, 'Semaine 1'),
        (2, 'Semaine 2'),
        (3, 'Semaine 3'),
        (4, 'Semaine 4'),
    ]

    type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    titre = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    montant = models.DecimalField(max_digits=12, decimal_places=2)
    date_prevision = models.DateField()
    categorie = models.CharField(max_length=255, blank=True, default='')
    statut = models.CharField(max_length=10, choices=STATUT_CHOICES, default='en_cours')
    semaine = models.IntegerField(choices=SEMAINE_CHOICES, default=1)
    mois = models.IntegerField()
    annee = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['semaine', 'date_prevision']

    def __str__(self):
        return f"S{self.semaine} - {self.type} - {self.titre} - {self.montant} DH"