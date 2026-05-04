from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('commandes', '0001_initial'),
        ('cheques', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='demandecheque',
            name='commande',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='demandes_cheques', to='commandes.commande'),
        ),
        migrations.AddField(
            model_name='demandecheque',
            name='livre_a_equipe',
            field=models.CharField(choices=[('en_cours', 'En cours'), ('traitee', 'Traitee')], default='en_cours', max_length=20),
        ),
        migrations.AddField(
            model_name='demandecheque',
            name='livre_au_transport',
            field=models.CharField(choices=[('en_cours', 'En cours'), ('traitee', 'Traitee')], default='en_cours', max_length=20),
        ),
        migrations.AlterField(
            model_name='demandecheque',
            name='etat_livraison',
            field=models.CharField(choices=[('en_cours', 'En cours'), ('traitee', 'Traitee')], default='en_cours', max_length=20),
        ),
        migrations.AlterField(
            model_name='demandecheque',
            name='etat_signature',
            field=models.CharField(choices=[('en_cours', 'En cours'), ('traitee', 'Traitee')], default='en_cours', max_length=20),
        ),
    ]
