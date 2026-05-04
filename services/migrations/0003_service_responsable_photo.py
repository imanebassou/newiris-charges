from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('services', '0002_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='service',
            name='photo',
            field=models.ImageField(blank=True, null=True, upload_to='services/logos/'),
        ),
    ]
