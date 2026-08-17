"""
Lleva las presentaciones existentes al formato Quarto.

Tres cambios sobre el contenido heredado:
  1. Todos los temas antiguos pasan al tema único `quarto`.
  2. Los `---` que separaban diapositivas desaparecen: ahora cada `##` abre una.
  3. El par `# Título` + `## Subtítulo` se convierte en diapositiva de sección,
     degradando el `##` a `[texto]{.subtitle}` para no partirla en dos.
"""

from django.db import migrations

from api.school.qmd import demote_legacy_subtitles, strip_legacy_separators


def to_quarto(apps, schema_editor):
    Presentation = apps.get_model('school', 'Presentation')
    for presentation in Presentation.objects.all():
        presentation.theme = 'quarto'
        presentation.content = strip_legacy_separators(
            demote_legacy_subtitles(presentation.content)
        )
        presentation.save(update_fields=['theme', 'content'])


def noop(apps, schema_editor):
    """
    Sin vuelta atrás: los separadores `---` no se pueden reconstruir sin
    adivinar dónde estaban. El contenido migrado sigue siendo Markdown válido.
    """


class Migration(migrations.Migration):

    dependencies = [
        ('school', '0041_presentation_heading_color_dark_and_more'),
    ]

    operations = [
        migrations.RunPython(to_quarto, noop),
    ]
