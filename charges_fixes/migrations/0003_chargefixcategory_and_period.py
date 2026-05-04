from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('charges_fixes', '0003_chargefixcategory'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='chargefix',
            name='date',
        ),
        migrations.AddField(
            model_name='chargefix',
            name='date_debut',
            field=models.DateField(default='2026-01-01'),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='chargefix',
            name='date_fin',
            field=models.DateField(default='2026-01-31'),
            preserve_default=False,
        ),
    ]
