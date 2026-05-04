from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('vehicules', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='vehicule',
            name='photo',
            field=models.ImageField(blank=True, null=True, upload_to='vehicules/photos/'),
        ),
    ]
