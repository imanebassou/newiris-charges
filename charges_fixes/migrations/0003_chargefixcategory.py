from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('charges_fixes', '0002_chargefix_date'),
    ]

    operations = [
        migrations.CreateModel(
            name='ChargeFixCategory',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nom', models.CharField(max_length=100, unique=True)),
                ('jour_du_mois', models.PositiveIntegerField(default=3)),
            ],
            options={
                'ordering': ['nom'],
            },
        ),
    ]
