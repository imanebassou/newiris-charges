from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('previsions', '0003_previsionsemaineconfig'),
    ]

    operations = [
        migrations.AddField(
            model_name='prevision',
            name='exclure_du_calcul',
            field=models.BooleanField(default=False),
        ),
    ]
