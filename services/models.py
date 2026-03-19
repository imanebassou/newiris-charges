from django.db import models

class Service(models.Model):
    nom = models.CharField(max_length=100)
    responsable = models.ForeignKey(
        'users.CustomUser',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='services_responsable'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.nom