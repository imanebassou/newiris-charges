from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('charges_fixes', '0004_chargefixcategory_fields_and_subcategory'),
    ]

    operations = [
        migrations.DeleteModel(
            name='ChargeFixSubCategory',
        ),
    ]
