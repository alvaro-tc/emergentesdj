# CLAUDE.md

Guía de contexto para Claude Code en el repositorio **Sigeldyw**.

## Perfil del Proyecto (Stack 2026)
Sistema de gestión escolar optimizado para alto rendimiento:
- **Backend**: Django 5.2+ + DRF + PyJWT (`api-server-django/`) -> Port 5000
- **Frontend**: React 19 (Stable) + Vite 6 + MUI 7 (Pigment CSS) (`react-ui-vite/`) -> Port 3000

## Comandos Críticos

### Backend (api-server-django/)
- **Setup**: `py -3.12 -m venv venv && source venv/Scripts/activate`
- **Deps**: `pip install -r requirements.txt`
- **DB**: `python manage.py migrate`
- **Run**: `python manage.py runserver 5000`
- **Test**: `python manage.py test api`

### Frontend (react-ui-vite/)
- **Setup**: `npm install` (Node 22.x o 24.x LTS)
- **Run**: `npm run dev`
- **Build**: `npm run build`

## Arquitectura y Lógica Core
- **Auth**: `api.authentication`. Flujo: JWT + verificación en `ActiveSession` (DB). El logout revoca la sesión eliminando el registro.
- **Roles**: `ADMIN`, `TEACHER`, `STUDENT`, `PARENT`.
- **Modelo de Evaluación**: 
  1. `EvaluationTemplate`: Definición global de criterios y porcentajes.
  2. `CourseSubCriterion`: Tareas y entregables específicos por curso.
  3. **Cálculo de Notas**: `TaskScore` -> `CriterionScore` -> `Enrollment.final_grade` (Lógica crítica).
- **Frontend State**: Redux Toolkit (`account` para auth y `customization` para UI).

## Reglas de Desarrollo y Eficiencia
- **Estilo Frontend**: React 19 Hooks, componentes funcionales y **MUI 7 con Pigment CSS** (Zero-runtime). Priorizar uso de `sx` y evitar Styled Components heredados de v4.
- **Estilo Backend**: Class-Based Views (CBVs), tipado estricto en serializers y cumplimiento de PEP 8.
- **Ahorro de Tokens**: 
  - No analices `node_modules` ni `venv` .
  - Antes de modificar `api.school`, verifica las señales (signals) que impactan en `final_grade`.
  - Sé conciso en las explicaciones; prioriza la ejecución de código.