from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('charges_fixes', '0003_chargefixcategory_and_period'),
    ]

    operations = [
        migrations.AddField(
            model_name='chargefixcategory',
            name='montant',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=10),
        ),
        migrations.AddField(
            model_name='chargefixcategory',
            name='type_traitement',
            field=models.CharField(
                choices=[('traitee_par_banque', 'Traitee par banque'), ('traitee_par_caisse', 'Traitee par caisse')],
                default='traitee_par_banque',
                max_length=30
            ),
        ),
        migrations.CreateModel(
            name='ChargeFixSubCategory',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nom', models.CharField(max_length=100)),
                ('categorie', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='sous_categories', to='charges_fixes.chargefixcategory')),
            ],
            options={
                'ordering': ['nom'],
                'unique_together': {('nom', 'categorie')},
            },
        ),
    ]
