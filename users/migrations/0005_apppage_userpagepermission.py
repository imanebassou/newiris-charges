from django.db import migrations, models
import django.db.models.deletion


PAGE_DEFINITIONS = [
    {'code': 'users', 'label': 'Utilisateurs', 'path': '/users', 'sort_order': 10},
    {'code': 'services', 'label': 'Services', 'path': '/services', 'sort_order': 20},
    {'code': 'dashboard', 'label': 'Dashboard', 'path': '/dashboard', 'sort_order': 30},
    {'code': 'banque', 'label': 'Banque', 'path': '/banque', 'sort_order': 40},
    {'code': 'caisse', 'label': 'Caisse', 'path': '/caisse', 'sort_order': 50},
    {'code': 'previsions', 'label': 'Previsions', 'path': '/previsions', 'sort_order': 60},
    {'code': 'charges_fixes', 'label': 'Charges fixes', 'path': '/charges-fixes', 'sort_order': 70},
    {'code': 'charges_variables', 'label': 'Charges variables', 'path': '/charges-variables', 'sort_order': 80},
    {'code': 'salaires', 'label': 'Salaires', 'path': '/salaires', 'sort_order': 90},
    {'code': 'fournisseurs', 'label': 'Fournisseurs', 'path': '/fournisseurs', 'sort_order': 100},
    {'code': 'demandes_cheques', 'label': 'Demandes cheques', 'path': '/demandes-cheques', 'sort_order': 110},
    {'code': 'vehicules', 'label': 'Vehicules', 'path': '/vehicules', 'sort_order': 120},
    {'code': 'equipe', 'label': 'Etat equipe', 'path': '/equipe', 'sort_order': 130},
    {'code': 'chantiers', 'label': 'Chantiers', 'path': '/chantiers', 'sort_order': 140},
    {'code': 'ajoute_charges', 'label': 'Ajouter charge variable', 'path': '/ajoute-charges', 'sort_order': 150},
    {'code': 'commandes', 'label': 'Gestion de commandes', 'path': '/commandes', 'sort_order': 160},
]

ROLE_PAGE_MAP = {
    'super_admin': [page['code'] for page in PAGE_DEFINITIONS],
    'admin': [
        'dashboard',
        'banque',
        'caisse',
        'previsions',
        'charges_fixes',
        'charges_variables',
        'salaires',
        'fournisseurs',
        'demandes_cheques',
        'commandes',
    ],
    'achat': [
        'caisse',
        'fournisseurs',
        'demandes_cheques',
        'ajoute_charges',
    ],
    'others': ['dashboard'],
    'responsable_technique': [
        'caisse',
        'vehicules',
        'equipe',
        'chantiers',
    ],
}


def seed_pages_and_permissions(apps, schema_editor):
    AppPage = apps.get_model('users', 'AppPage')
    CustomUser = apps.get_model('users', 'CustomUser')
    UserPagePermission = apps.get_model('users', 'UserPagePermission')

    page_map = {}
    for page_data in PAGE_DEFINITIONS:
        page, _ = AppPage.objects.update_or_create(
            code=page_data['code'],
            defaults=page_data,
        )
        page_map[page.code] = page

    for user in CustomUser.objects.all():
        allowed_codes = ROLE_PAGE_MAP.get(user.role, [])
        for code in allowed_codes:
            page = page_map.get(code)
            if not page:
                continue
            UserPagePermission.objects.update_or_create(
                user=user,
                page=page,
                defaults={
                    'can_view': True,
                    'can_create': True,
                    'can_edit': True,
                    'can_delete': True,
                },
            )


def unseed_pages_and_permissions(apps, schema_editor):
    AppPage = apps.get_model('users', 'AppPage')
    AppPage.objects.filter(code__in=[page['code'] for page in PAGE_DEFINITIONS]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0004_alter_customuser_role'),
    ]

    operations = [
        migrations.CreateModel(
            name='AppPage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('code', models.CharField(max_length=50, unique=True)),
                ('label', models.CharField(max_length=100)),
                ('path', models.CharField(max_length=100, unique=True)),
                ('sort_order', models.PositiveIntegerField(default=0)),
                ('is_active', models.BooleanField(default=True)),
            ],
            options={
                'ordering': ['sort_order', 'label'],
            },
        ),
        migrations.CreateModel(
            name='UserPagePermission',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('can_view', models.BooleanField(default=False)),
                ('can_create', models.BooleanField(default=False)),
                ('can_edit', models.BooleanField(default=False)),
                ('can_delete', models.BooleanField(default=False)),
                ('page', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='user_permissions', to='users.apppage')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='page_permissions', to='users.customuser')),
            ],
            options={
                'ordering': ['page__sort_order', 'page__label'],
                'unique_together': {('user', 'page')},
            },
        ),
        migrations.RunPython(seed_pages_and_permissions, unseed_pages_and_permissions),
    ]
