from django.contrib.auth.models import AbstractUser
from django.db import models


class AppPage(models.Model):
    code = models.CharField(max_length=50, unique=True)
    label = models.CharField(max_length=100)
    path = models.CharField(max_length=100, unique=True)
    sort_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['sort_order', 'label']

    def __str__(self):
        return self.label


class CustomUser(AbstractUser):

    class Role(models.TextChoices):
        ADMIN = 'admin', 'Admin'
        SUPER_ADMIN = 'super_admin', 'Super Admin'
        ACHAT = 'achat', 'Achat'
        OTHERS = 'others', 'Others'
        RESPONSABLE_TECHNIQUE = 'responsable_technique', 'Responsable Technique'

    role = models.CharField(
        max_length=30,
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


class UserPagePermission(models.Model):
    user = models.ForeignKey(
        'CustomUser',
        on_delete=models.CASCADE,
        related_name='page_permissions'
    )
    page = models.ForeignKey(
        AppPage,
        on_delete=models.CASCADE,
        related_name='user_permissions'
    )
    can_view = models.BooleanField(default=False)
    can_create = models.BooleanField(default=False)
    can_edit = models.BooleanField(default=False)
    can_delete = models.BooleanField(default=False)

    class Meta:
        unique_together = ('user', 'page')
        ordering = ['page__sort_order', 'page__label']

    def __str__(self):
        return f"{self.user.username} - {self.page.code}"
