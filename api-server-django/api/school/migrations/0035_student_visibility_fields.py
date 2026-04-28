from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('school', '0034_presentation_autor_logo_oscuro'),
    ]

    operations = [
        migrations.AddField(
            model_name='coursesubcriterion',
            name='visible_to_students',
            field=models.BooleanField(default=True, help_text='If false, students cannot see this sub-criterion or its score'),
        ),
        migrations.AddField(
            model_name='coursesubcriterion',
            name='tasks_visible_to_students',
            field=models.BooleanField(default=True, help_text='If false, students only see the criterion total score, not individual task scores'),
        ),
        migrations.AddField(
            model_name='coursespecialcriterion',
            name='visible_to_students',
            field=models.BooleanField(default=True, help_text='If false, students cannot see this special criterion or its score'),
        ),
        migrations.AddField(
            model_name='coursespecialcriterion',
            name='tasks_visible_to_students',
            field=models.BooleanField(default=True, help_text='If false, students only see the criterion total score, not individual task scores'),
        ),
    ]
