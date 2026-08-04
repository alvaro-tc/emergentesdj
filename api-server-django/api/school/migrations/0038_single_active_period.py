from django.db import migrations, models


def keep_single_active_period(apps, schema_editor):
    """Deja activo solo un periodo (el de fecha de inicio más reciente)."""
    AcademicPeriod = apps.get_model('school', 'AcademicPeriod')
    active_ids = list(
        AcademicPeriod.objects.filter(active=True)
        .order_by('-start_date', '-id')
        .values_list('id', flat=True)
    )
    if active_ids:
        AcademicPeriod.objects.exclude(id=active_ids[0]).update(active=False)
        return

    # Ningún periodo activo: se activa el más reciente si existe.
    latest = AcademicPeriod.objects.order_by('-start_date', '-id').first()
    if latest:
        AcademicPeriod.objects.filter(id=latest.id).update(active=True)


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('school', '0037_add_title_to_project'),
    ]

    operations = [
        migrations.AlterField(
            model_name='academicperiod',
            name='active',
            field=models.BooleanField(default=False),
        ),
        migrations.RunPython(keep_single_active_period, noop),
        migrations.AddConstraint(
            model_name='academicperiod',
            constraint=models.UniqueConstraint(
                condition=models.Q(('active', True)),
                fields=('active',),
                name='unique_active_academic_period',
            ),
        ),
    ]
