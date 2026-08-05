/** Etiquetas legibles de un curso: la materia identifica, el paralelo distingue. */
export const courseLabel = (course) => {
    const subject = course.subject_details;
    const code = subject?.code ? `${subject.code} · ` : '';
    return `${code}${subject?.name || 'Sin materia'}${course.parallel ? ` "${course.parallel}"` : ''}`;
};

/** Contexto secundario del curso: periodo y carrera. */
export const courseCaption = (course) =>
    [course.period_details?.name, course.subject_details?.program_details?.name].filter(Boolean).join(' · ');
