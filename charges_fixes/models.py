from django.db import models

class ChargeFix(models.Model):
    service = models.ForeignKey(
        'services.Service',
        on_delete=models.CASCADE
    )
    categorie = models.CharField(max_length=100)
    montant = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.categorie} - {self.montant} DH"