from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('caisse', '0002_actioncaisse_source_action'),
    ]

    operations = [
        migrations.AddField(
            model_name='actioncaisse',
            name='sous_categorie',
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.AddField(
            model_name='actioncaisse',
            name='type_charge',
            field=models.CharField(
                choices=[('charge_variable', 'Charge variable'), ('charge_fixe', 'Charge fixe')],
                default='charge_variable',
                max_length=20,
            ),
        ),
        migrations.AlterField(
            model_name='actioncaisse',
            name='categorie',
            field=models.CharField(max_length=100),
        ),
    ]
