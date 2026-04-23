from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('school', '0033_presentation'),
    ]

    operations = [
        migrations.AddField(
            model_name='presentation',
            name='autor',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name='presentation',
            name='logo_oscuro',
            field=models.URLField(blank=True, null=True),
        ),
    ]
