from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('commandes', '0002_commande_created_by'),
    ]

    operations = [
        migrations.AddField(
            model_name='commande',
            name='personne',
            field=models.CharField(blank=True, default='', max_length=150),
        ),
        migrations.AlterField(
            model_name='commande',
            name='echeance',
            field=models.CharField(blank=True, default='', max_length=150),
        ),
        migrations.AlterField(
            model_name='commande',
            name='mode_livraison',
            field=models.CharField(blank=True, default='', max_length=150),
        ),
        migrations.AlterField(
            model_name='commande',
            name='type_paiement',
            field=models.CharField(blank=True, default='', max_length=100),
        ),
    ]
