# CLAUDE.md

## Perfil del Proyecto

Sistema de gestión escolar de alta concurrencia.

- **Backend**: Django 5.2+ | DRF | Python 3.12+ (Tipado estricto).
- **Frontend**: React 19 (Stable) | Vite 6 | MUI 7 + Pigment CSS (Zero-runtime).
- **Paradigma**: Arquitectura de Hooks limpios y separación radical de lógica (Hooks) y vista (JSX).

## Modelo de Dominio (invariantes)

Reglas estructurales de `api.school`. Violarlas reintroduce bugs ya corregidos.

- **`Subject` es genérica**: pertenece a un `Program`, se reutiliza entre semestres. **No** tiene periodo ni tipo de evaluación.
- **`Course` es la unidad de seguimiento**: es donde se inscriben los estudiantes y de donde cuelgan etapas, tareas, notas y proyectos. El curso define su `period` y su `evaluation_template`.
- **`EvaluationTemplate` = "Tipo de Evaluación"** (en la UI). Sus `EvaluationCriterion` son las **etapas** de calificación. Las etapas concretas de un curso son `CourseSubCriterion`.
- **Periodo activo único**: `AcademicPeriod.active` es exclusivo (`UniqueConstraint` + `save()`/`activate()`). `AcademicPeriod.get_active()` es la fuente de verdad de lo que publica el landing page.
- **Landing = periodo activo**: los endpoints públicos filtran por él. Solo un ADMIN puede enviar `?period_id=` para revisar temporalmente otro periodo (`get_context_period(request)`).
- **Archivar un curso es `active=False`**: lo oculta del listado, del selector y del landing. El filtro de archivados solo aplica a la acción `list`; sobre un curso concreto siempre debe poder operarse, o no habría cómo desarchivarlo.
- **Vía de calificación vigente**: `CourseSubCriterion` → `CourseTask` → `TaskScore` → `CriterionScore`. `MainEvaluation`/`SubEvaluation`/`Score` es la vía legacy y está vacía.
- **`Presentation` cuelga de `Subject`**, no de `Course` ni de periodo: el material se reutiliza semestre a semestre. La materia es obligatoria vía serializer (la columna admite NULL solo por las presentaciones heredadas). Su pantalla tiene selector de materia propio y **no depende del curso activo**, por eso está exenta en `courseMenuRules.js`.
- **Contenido en formato Quarto (`.qmd`)**: `#` abre diapositiva de sección y `##` diapositiva normal; los encabezados dentro de bloques de código no cuentan. La regla vive duplicada en `api/school/qmd.py` y `presentation/qmd.js` — **cambiar una obliga a cambiar la otra**.
- **`User.ru` y `User.observations` son del estudiante**, no de la inscripción: se reutilizan en todos sus cursos. `ru` no es único a nivel de columna (llega de planillas externas y un duplicado no debe tumbar una importación entera).
- **Los logos de presentación son URL**, no ficheros del modelo. `POST /presentations/upload-logo/` guarda el archivo y devuelve una URL absoluta que acaba en el mismo `logo_url`/`logo_oscuro`. Subir es solo otra forma de conseguir la URL: el deck, la portada y el export a PDF no se enteran.

## Presentaciones: reglas del render (Reveal)

Aprendidas rompiendo cosas. `presentation/quartoTheme.scss` y `presentation/qmd.js`.

- **Nunca declares `position` ni `display` sobre una `<section>` del deck.** Son de Reveal: `display` decide qué diapositiva se ve y `position: absolute` (sin `top`) hace que cada una se dibuje en su posición estática. Sacar una del posicionamiento absoluto la mete en el flujo y **empuja fuera de pantalla a las vecinas montadas** (las que caen dentro de `viewDistance`, unas 3). El síntoma engaña: la diapositiva que tocaste se ve bien y fallan las siguientes.
- **Para maquetar dentro de una diapositiva, envuelve el contenido y posiciona el envoltorio.** Es lo que hacen `.cover-text` (portada) y `.section-body` (diapositiva de sección): hijos absolutos sobre una sección que ya está posicionada por Reveal.
- **La portada se genera desde los campos del formulario** (título, subtítulo, autor, logo), no desde el `.qmd`. El bloque YAML de Quarto se descarta —como todo lo anterior al primer encabezado— y sus `format:`/`theme:` no tienen efecto: eso sale del selector de tema y paleta.
- **`---` no separa diapositivas**: el corte es por `#`/`##`. Un `---` suelto se renderiza como `<hr>`. `strip_legacy_separators()` de `api/school/qmd.py` solo corrió en la migración 0042, no en el render.
- **Los `background-*` del encabezado viajan a la `<section>`** como `data-background-*` (`renderSlide`). `# {background-image="…"}` sin texto es una imagen a sangre; el `h1` vacío se oculta por CSS.
- **El tema del deck es independiente del tema de la aplicación**: vive en `data-reveal-theme` / `data-reveal-palette`. Añadir un tema obliga a tocar tres sitios a la vez: `THEME_CHOICES` (con migración), `themes.js` (miniaturas y PDF) y `quartoTheme.scss` (lo que se ve).

## Contexto de trabajo en la UI

- El **selector de curso** vive en la cabecera del sidebar (`Sidebar/CourseContextSelector`), no en la barra superior. Periodo y carrera son filtros para _encontrar_ el curso, no pasos previos.
- El curso activo (`account.activeCourse`) gobierna las pantallas académicas y el menú. Está persistido: **refréscalo desde el servidor al cargar la lista de cursos** o quedará con datos obsoletos.
- El menú se alinea al curso vía `GET /courses/{id}/capabilities/` (una sola petición; nunca una por ítem) y `utils/courseMenuRules.js`. Se **deshabilita con tooltip, no se oculta**; `Ponderaciones` nunca se bloquea, porque es donde se crean las etapas.
- **Barras de herramientas que no deben perderse al desplazarse**: no basta con `position: sticky`. `Card` de MUI trae `overflow: hidden`, que lo anula en sus descendientes; y un anclaje solo se desplaza dentro de su contenedor, así que en vista apilada (una tarjeta por fila) no tiene recorrido. La solución que funciona es dar altura definida al panel y que el desplazamiento viva **dentro** del componente (columna flexible + `flex: 1; min-height: 0`), como en `PresentationForm` / `QmdEditor`.
- **Contenido montado en un portal (`Dialog`)**: el nodo no existe en el primer render. Si un efecto necesita ese nodo (CodeMirror, Reveal), guárdalo en **estado** (`ref={setEl}`) y no en `useRef`, o el efecto correrá con `null` y no volverá a intentarlo.
- **Calificación de tareas (`task-grading`) no tiene botón de guardar**: cada nota se persiste al momento con `task-scores/bulk_save/`, incluida la de «Calificar Todos». Cualquier acción nueva que solo toque estado local se pierde al recargar. Por debajo de `sm` manda `TaskGradingMobileList` (panel por estudiante); por encima, la tabla compacta con popover por celda.

## Importación y exportación de inscritos

`preview_bulk_upload` / `confirm_bulk_enrollment` en `api/school/views.py`, y `Enrollments.jsx`.

- **La cabecera se busca en las primeras 50 filas** y se compara en minúsculas y con espacios normalizados, pero **sin quitar tildes**: `correo electrónico` con tilde no se reconoce.
- **Única columna obligatoria: el CI** (`ci`, `carnet`, `cedula`, `documento`…). Es la clave: se le quitan los no dígitos y los repetidos se descartan. Nombres, en columnas separadas (`paterno`/`materno`/`nombre`) o en una sola (`nombre completo`, orden Paterno Materno Nombres). Opcionales: correo, celular, `ru`, `observaciones`.
- **Las filas más cortas que la última columna mapeada se rellenan, no se descartan**: en CSV y en openpyxl una celda vacía al final llega recortada, y descartarla perdía al estudiante en silencio.
- **De un estudiante que ya existe no se pisa nada**; solo se rellenan huecos de `ru`/`observations` (`students_to_update`). La vista previa marca con `+ valor` lo que va a completarse.
- **CSV de Moodle**: cabecera `username;firstname;lastname;email;password;course1;role1`, separador `;`, CRLF y BOM. `password` = carnet + `*Bo`, `role1` = `student` en minúsculas (shortname del rol), `course1` = `Course.course_identifier` (el nombre corto en Moodle; sin él no se genera nada). Sin correo válido se emite `carnet@mail.com`, que es único pero no recibe mensajes.

## Comandos de Operación

| Acción          | Backend (`api-server-django/`)    | Frontend (`react-ui-vite/`)     |
| :-------------- | :-------------------------------- | :------------------------------ |
| **Inicio**      | `source venv/Scripts/activate`    | `npm run dev`                   |
| **Instalación** | `pip install -r requirements.txt` | `npm install`                   |
| **Validación**  | `python manage.py test api`       | `npm run lint && npm run build` |
| **Migración**   | `python manage.py migrate`        | -                               |

## Protocolo de Auditoría y Refactor (Subagentes)

Cuando se te pida auditar o refactorizar, activa estos perfiles internamente:

1. **Analista de Performance**:
   - Sustituir `useEffect` innecesarios por `useMemo` o lógica basada en eventos de React 19.
   - Forzar el uso de **Pigment CSS** (MUI 7). Prohibido el uso de motores CSS-in-JS en tiempo de ejecución.
   - Identificar imports pesados y proponer `React.lazy()` en rutas y diálogos complejos.

2. **Arquitecto de Estado**:
   - Verificar que Redux Toolkit solo maneje estado global real (`auth`, `ui-theme`).
   - Mover estados de formularios a local state o `React Hook Form` para evitar re-renders innecesarios.

3. **Guardián de Lógica Crítica**:
   - Antes de modificar `api.school`, auditar señales de Django. El cálculo de `final_grade` es crítico; requiere validación lógica estricta.
   - `update_final_grade` itera las etapas de `course.evaluation_template`. Si tocas ese camino, valida con datos reales: captura los `final_grade` actuales, aplica el cambio, recalcula todas las inscripciones y compara. Diferencias esperables: notas nunca calculadas (`null` → `0.00`) y valores almacenados desactualizados.

## Reglas de Oro de Desarrollo

### Frontend (React 19 + MUI 7)

- **Zero-Runtime CSS**: Usa únicamente `sx` de MUI 7 o CSS Modules.
- **Data Fetching**: Priorizar el uso del hook `use()` para manejar promesas de forma nativa.
- **Transitions**: Envuelve actualizaciones de estado no urgentes en `startTransition` para mantener la fluidez de la UI.

### Backend (Django 5.2)

- **Seguridad**: El flujo de `ActiveSession` es la única fuente de verdad para el estado del JWT.
- **Rendimiento**: Forzar `select_related` y `prefetch_related` para evitar problemas de consultas N+1.
- **Tipado**: Todos los métodos y serializers deben incluir _Type Hints_.

## Pendientes acordados

- **Vista móvil de `task-grading`**: en la emulación de Chrome los toques no responden. Falta comprobarlo en un dispositivo real antes de tocar nada.
- **Modo oscuro de la aplicación**: `themes/palette.jsx` ya lee `customization.navType`, pero el campo no existe en `customizationSlice.js`. Faltan además las variables oscuras en `_themes-vars.module.scss` (hoy ninguna) y auditar ~107 colores escritos a mano en 29 vistas. Decisión tomada: dejar la landing pública siempre en claro.
- **Galería de entregas con valoración por pares** (enlaces de TikTok/Instagram para participación y proyectos): idea evaluada y viable colgando de `CourseTask`. Acordado que las estrellas de los compañeros **no** son la nota, solo una señal para el docente. Sin empezar.

## Estrategia de Ahorro de Tokens

- **Ignore**: No analices `node_modules`, `venv`, `build/`, ni archivos `.log`.
- **Análisis Incremental**: No resumas código existente; reporta solo cambios y lógica nueva.
- **Ejecución Directa**: Sé conciso; prioriza la generación de código funcional sobre las explicaciones extensas.
