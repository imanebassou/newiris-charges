from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    
    class Role(models.TextChoices):
        ADMIN = 'admin', 'Admin'
        TECHNICIEN = 'technicien', 'Technicien'
        OTHERS = 'others', 'Others'

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.OTHERS
    )
    
    service = models.ForeignKey(
        'services.Service',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    
    photo = models.ImageField(
        upload_to='users/photos/',
        null=True,
        blank=True
    )
    
    fonction = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=20, blank=True)

    def __str__(self):
        return f"{self.username} ({self.role})"