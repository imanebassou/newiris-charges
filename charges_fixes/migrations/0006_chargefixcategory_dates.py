from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('charges_fixes', '0005_remove_chargefixsubcategory'),
    ]

    operations = [
        migrations.AddField(
            model_name='chargefixcategory',
            name='date_debut',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='chargefixcategory',
            name='date_fin',
            field=models.DateField(blank=True, null=True),
        ),
    ]
