from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='BlogCategory',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, unique=True, verbose_name='Nombre')),
                ('slug', models.SlugField(blank=True, max_length=120, unique=True)),
            ],
            options={
                'verbose_name': 'Categoría',
                'verbose_name_plural': 'Categorías',
                'ordering': ['name'],
            },
        ),
        migrations.CreateModel(
            name='BlogPost',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=255, verbose_name='Título')),
                ('slug', models.SlugField(blank=True, max_length=280, unique=True)),
                ('excerpt', models.TextField(blank=True, max_length=500, verbose_name='Extracto')),
                ('content', models.TextField(verbose_name='Contenido')),
                ('cover_image', models.ImageField(blank=True, null=True, upload_to='blog/', verbose_name='Imagen de portada')),
                ('author_name', models.CharField(default='Equipo Sigeldyw', max_length=200, verbose_name='Autor')),
                ('tags', models.CharField(blank=True, help_text='Etiquetas separadas por comas', max_length=500, verbose_name='Etiquetas')),
                ('status', models.CharField(choices=[('draft', 'Borrador'), ('published', 'Publicado')], default='draft', max_length=20)),
                ('published_at', models.DateTimeField(blank=True, null=True)),
                ('views_count', models.PositiveIntegerField(default=0, verbose_name='Vistas')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('category', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='posts', to='blog.blogcategory', verbose_name='Categoría')),
            ],
            options={
                'verbose_name': 'Entrada de Blog',
                'verbose_name_plural': 'Entradas de Blog',
                'ordering': ['-published_at', '-created_at'],
            },
        ),
    ]
