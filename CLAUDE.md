# CLAUDE.md

## Perfil del Proyecto 
Sistema de gestión escolar de alta concurrencia.
- **Backend**: Django 5.2+ | DRF | Python 3.12+ (Tipado estricto).
- **Frontend**: React 19 (Stable) | Vite 6 | MUI 7 + Pigment CSS (Zero-runtime).
- **Paradigma**: Arquitectura de Hooks limpios y separación radical de lógica (Hooks) y vista (JSX).

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