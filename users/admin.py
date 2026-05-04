from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import AppPage, CustomUser, UserPagePermission


class UserPagePermissionInline(admin.TabularInline):
    model = UserPagePermission
    extra = 0


class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ['username', 'email', 'role', 'service', 'fonction', 'is_staff']
    inlines = [UserPagePermissionInline]
    fieldsets = UserAdmin.fieldsets + (
        ('Informations Newiris', {
            'fields': ('role', 'service', 'fonction', 'phone', 'photo')
        }),
    )


@admin.register(AppPage)
class AppPageAdmin(admin.ModelAdmin):
    list_display = ['label', 'code', 'path', 'sort_order', 'is_active']
    list_editable = ['sort_order', 'is_active']
    search_fields = ['label', 'code', 'path']


admin.site.register(CustomUser, CustomUserAdmin)
