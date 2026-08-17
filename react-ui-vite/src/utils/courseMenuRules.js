/**
 * Reglas que alinean el menú académico al curso seleccionado.
 *
 * Se deshabilita en vez de ocultar: un menú que cambia de tamaño confunde y hace
 * creer que se perdió una función. `Ponderaciones` nunca se bloquea por falta de
 * etapas, porque es justamente donde se crean.
 */
const RULES = {
    grades: {
        requires: (caps) => caps.has_criteria,
        reason: 'Este curso todavía no tiene etapas de calificación definidas (Ponderaciones)'
    },
    'task-grading': {
        requires: (caps) => caps.has_criteria,
        reason: 'Este curso todavía no tiene etapas de calificación definidas (Ponderaciones)'
    },
    projects: {
        requires: (caps) => caps.has_projects,
        reason: 'Este curso no tiene etapas de tipo proyecto'
    }
};

/**
 * Ítems que no dependen del curso activo.
 *
 * `Presentaciones` cuelga de la materia, no del curso ni del periodo: tiene su
 * propio selector de materia y debe poder abrirse sin curso seleccionado, o no
 * habría forma de crear la primera.
 */
const COURSE_INDEPENDENT = new Set(['presentations']);

const NO_COURSE_REASON = 'Selecciona un curso para trabajar';

/**
 * Aplica las reglas a un grupo del menú.
 * @param {object} group grupo de menu-items
 * @param {object|null} capabilities respuesta de /courses/{id}/capabilities/
 * @param {boolean} hasCourse si hay un curso seleccionado
 */
export const applyCourseRules = (group, capabilities, hasCourse) => {
    if (group.id !== 'school') return group;

    return {
        ...group,
        children: group.children.map((item) => {
            if (COURSE_INDEPENDENT.has(item.id)) return item;
            if (!hasCourse) {
                return { ...item, disabled: true, disabledReason: NO_COURSE_REASON };
            }
            const rule = RULES[item.id];
            // Sin capacidades resueltas aún, no se bloquea nada.
            if (!rule || !capabilities) return item;
            if (rule.requires(capabilities)) return item;
            return { ...item, disabled: true, disabledReason: rule.reason };
        })
    };
};

export default applyCourseRules;
