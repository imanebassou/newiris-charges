from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('cheques', '0002_demandecheque_commande_and_statuses'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name='demandecheque',
            name='personne',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='demandes_cheques_creees',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name='demandecheque',
            name='po',
            field=models.FileField(blank=True, null=True, upload_to='cheques/po/'),
        ),
    ]
