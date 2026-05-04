from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('fournisseurs', '0002_fournisseur_etat_regularite_override'),
    ]

    operations = [
        migrations.AddField(
            model_name='fournisseur',
            name='regularite_depassee_notified_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
