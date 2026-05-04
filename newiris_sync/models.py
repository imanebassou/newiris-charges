from django.db import models


class NewIrisDashboardRecord(models.Model):
    annee = models.IntegerField()
    mois = models.IntegerField()
    date_validation = models.DateTimeField(null=True, blank=True)
    devis = models.CharField(max_length=255, blank=True, default='')
    etat_po = models.CharField(max_length=255, blank=True, default='')
    etat_facture = models.CharField(max_length=255, blank=True, default='')
    service_newiris = models.CharField(max_length=255, blank=True, default='')
    client = models.CharField(max_length=255, blank=True, default='')
    contact = models.CharField(max_length=255, blank=True, default='')
    service_client = models.CharField(max_length=255, blank=True, default='')
    categorie = models.CharField(max_length=255, blank=True, default='')
    chantier = models.CharField(max_length=255, blank=True, default='')
    ca_ht = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    ca_ttc = models.DecimalField(max_digits=18, decimal_places=2, default=0)

    source_key = models.CharField(max_length=500, unique=True)
    last_synced_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'newiris_dashboard_records'
        ordering = ['-annee', '-mois', 'devis']

    def __str__(self):
        return f"{self.devis} - {self.chantier}"
