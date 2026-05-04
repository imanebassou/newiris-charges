from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('previsions', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='SemaineCloture',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('mois', models.IntegerField()),
                ('annee', models.IntegerField()),
                ('semaine', models.IntegerField(choices=[(1, 'Semaine 1'), (2, 'Semaine 2'), (3, 'Semaine 3'), (4, 'Semaine 4')])),
                ('statut', models.CharField(choices=[('prevision', 'Prevision'), ('en_cours', 'En cours'), ('cloturee', 'Cloturee')], default='prevision', max_length=20)),
                ('solde_reference', models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ('cloturee_at', models.DateTimeField(blank=True, null=True)),
            ],
            options={
                'ordering': ['annee', 'mois', 'semaine'],
                'unique_together': {('mois', 'annee', 'semaine')},
            },
        ),
    ]
