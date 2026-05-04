from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('cheques', '0003_demandecheque_personne_po'),
    ]

    operations = [
        migrations.AddField(
            model_name='demandecheque',
            name='is_ticket_initial',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='demandecheque',
            name='statut_ticket',
            field=models.CharField(
                choices=[
                    ('en_validation', 'En validation'),
                    ('reporte', 'Reportee'),
                    ('en_attente_signature', 'En attente de signature'),
                    ('cheque_signe', 'Cheque signe'),
                    ('livre_a_equipe', 'Livre a l equipe'),
                    ('traitee', 'Traitee'),
                ],
                default='en_validation',
                max_length=30,
            ),
        ),
        migrations.AlterField(
            model_name='demandecheque',
            name='date_souhaitee_signature',
            field=models.DateField(blank=True, null=True),
        ),
    ]
