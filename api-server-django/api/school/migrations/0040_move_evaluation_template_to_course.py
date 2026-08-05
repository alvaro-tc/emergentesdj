from django.db import migrations, models
import django.db.models.deletion


def copy_template_to_courses(apps, schema_editor):
    """Cada curso hereda el tipo de evaluación que tenía su materia."""
    Course = apps.get_model('school', 'Course')
    for course in Course.objects.select_related('subject').iterator():
        template_id = course.subject.evaluation_template_id if course.subject_id else None
        if template_id:
            Course.objects.filter(pk=course.pk).update(evaluation_template_id=template_id)


def copy_template_back_to_subjects(apps, schema_editor):
    """Reversa: la materia recupera el tipo de evaluación de alguno de sus cursos."""
    Course = apps.get_model('school', 'Course')
    Subject = apps.get_model('school', 'Subject')
    for course in Course.objects.exclude(evaluation_template__isnull=True).iterator():
        Subject.objects.filter(pk=course.subject_id).update(evaluation_template_id=course.evaluation_template_id)


class Migration(migrations.Migration):

    dependencies = [
        ('school', '0039_remove_subject_period'),
    ]

    operations = [
        migrations.AddField(
            model_name='course',
            name='evaluation_template',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='courses',
                to='school.evaluationtemplate',
            ),
        ),
        migrations.RunPython(copy_template_to_courses, copy_template_back_to_subjects),
        migrations.RemoveField(
            model_name='subject',
            name='evaluation_template',
        ),
    ]
