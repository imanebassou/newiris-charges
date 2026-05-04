from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('previsions', '0003_previsionsemaineconfig'),
        ('banque', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='actionbanque',
            name='source_prevision',
            field=models.OneToOneField(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='banque_action',
                to='previsions.prevision',
            ),
        ),
    ]
