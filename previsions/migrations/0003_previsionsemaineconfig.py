from django.db import migrations, models


DEFAULT_WEEK_RANGES = [
    (1, 7),
    (8, 14),
    (15, 22),
    (23, 31),
]


def seed_week_configs(apps, schema_editor):
    Prevision = apps.get_model('previsions', 'Prevision')
    PrevisionSemaineConfig = apps.get_model('previsions', 'PrevisionSemaineConfig')

    month_year_pairs = set(Prevision.objects.values_list('mois', 'annee'))
    for mois, annee in month_year_pairs:
        for semaine, (debut, fin) in enumerate(DEFAULT_WEEK_RANGES, start=1):
            PrevisionSemaineConfig.objects.get_or_create(
                mois=mois,
                annee=annee,
                semaine=semaine,
                defaults={
                    'debut_jour': debut,
                    'fin_jour': fin,
                },
            )


class Migration(migrations.Migration):

    dependencies = [
        ('previsions', '0002_semainecloture'),
    ]

    operations = [
        migrations.CreateModel(
            name='PrevisionSemaineConfig',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('semaine', models.IntegerField(choices=[(1, 'Semaine 1'), (2, 'Semaine 2'), (3, 'Semaine 3'), (4, 'Semaine 4')])),
                ('mois', models.IntegerField()),
                ('annee', models.IntegerField()),
                ('debut_jour', models.IntegerField(default=1)),
                ('fin_jour', models.IntegerField(default=7)),
                ('solde_debut_manuel', models.DecimalField(blank=True, decimal_places=2, max_digits=12, null=True)),
            ],
            options={
                'ordering': ['annee', 'mois', 'semaine'],
                'unique_together': {('semaine', 'mois', 'annee')},
            },
        ),
        migrations.RunPython(seed_week_configs, migrations.RunPython.noop),
    ]
