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

## Contexto de trabajo en la UI
- El **selector de curso** vive en la cabecera del sidebar (`Sidebar/CourseContextSelector`), no en la barra superior. Periodo y carrera son filtros para *encontrar* el curso, no pasos previos.
- El curso activo (`account.activeCourse`) gobierna las pantallas académicas y el menú. Está persistido: **refréscalo desde el servidor al cargar la lista de cursos** o quedará con datos obsoletos.
- El menú se alinea al curso vía `GET /courses/{id}/capabilities/` (una sola petición; nunca una por ítem) y `utils/courseMenuRules.js`. Se **deshabilita con tooltip, no se oculta**; `Ponderaciones` nunca se bloquea, porque es donde se crean las etapas.

## Comandos de Operación
| Acción | Backend (`api-server-django/`) | Frontend (`react-ui-vite/`) |
| :--- | :--- | :--- |
| **Inicio** | `source venv/Scripts/activate` | `npm run dev` |
| **Instalación** | `pip install -r requirements.txt` | `npm install` |
| **Validación** | `python manage.py test api` | `npm run lint && npm run build` |
| **Migración** | `python manage.py migrate` | - |

##  Protocolo de Auditoría y Refactor (Subagentes)
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

##  Reglas de Oro de Desarrollo

### Frontend (React 19 + MUI 7)
- **Zero-Runtime CSS**: Usa únicamente `sx` de MUI 7 o CSS Modules.
- **Componentes Atómicos**: Ningún archivo JSX debe superar las **150 líneas**. Si es mayor, extrae sub-componentes.
- **Data Fetching**: Priorizar el uso del hook `use()` para manejar promesas de forma nativa.
- **Transitions**: Envuelve actualizaciones de estado no urgentes en `startTransition` para mantener la fluidez de la UI.
  
### Backend (Django 5.2)
- **Seguridad**: El flujo de `ActiveSession` es la única fuente de verdad para el estado del JWT.
- **Rendimiento**: Forzar `select_related` y `prefetch_related` para evitar problemas de consultas N+1.
- **Tipado**: Todos los métodos y serializers deben incluir *Type Hints*.

##  Estrategia de Ahorro de Tokens
- **Ignore**: No analices `node_modules`, `venv`, `build/`, ni archivos `.log`.
- **Análisis Incremental**: No resumas código existente; reporta solo cambios y lógica nueva.
- **Ejecución Directa**: Sé conciso; prioriza la generación de código funcional sobre las explicaciones extensas.