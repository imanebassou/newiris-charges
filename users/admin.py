from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser

class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ['username', 'email', 'role', 'service', 'fonction', 'is_staff']
    fieldsets = UserAdmin.fieldsets + (
        ('Informations Newiris', {
            'fields': ('role', 'service', 'fonction', 'phone', 'photo')
        }),
    )

admin.site.register(CustomUser, CustomUserAdmin)