import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

export const augmentRowsWithGrades = (rows, structure) =>
    rows.map(row => {
        const criterionGrades = {};
        let finalGradeNumeric = 0;
        structure.forEach(group => {
            let totalScore = 0;
            group.sub_criteria.forEach(sub => {
                const s = row.grades[sub.id];
                if (s !== undefined && s !== null && s !== '') totalScore += parseFloat(s);
            });
            let extraPoints = 0;
            (group.special_criteria || []).forEach(spec => {
                const s = row.grades[spec.id];
                if (s !== undefined && s !== null && s !== '') extraPoints += parseFloat(s);
            });
            let criterionGradeNumeric = 0;
            let criterionGrade = '-';
            if (totalScore > 0 || extraPoints > 0) {
                // La base se topa al peso del criterio; los puntos extra se suman por encima.
                const cappedBase = Math.min(totalScore, parseFloat(group.weight));
                criterionGradeNumeric = cappedBase + extraPoints;
                criterionGrade = criterionGradeNumeric.toFixed(2);
            }
            criterionGrades[group.id] = { grade: criterionGradeNumeric, weight: parseFloat(group.weight), formatted: criterionGrade };
            if (criterionGradeNumeric > 0) finalGradeNumeric += criterionGradeNumeric;
        });
        // La nota final nunca supera 100, aunque los extras acumulados lo permitieran.
        const cappedFinal = Math.min(finalGradeNumeric, 100);
        return { ...row, _criterionGrades: criterionGrades, _finalGrade: finalGradeNumeric > 0 ? cappedFinal.toFixed(2) : '-' };
    });

// numeric = true genera valores numéricos reales (para Excel); false genera texto formateado (para PDF).
export const buildExportRows = (rows, structure, isCriterionVisible, showFinalGrade, numeric = false) => {
    const empty = numeric ? null : '-';
    const num = (v) => {
        if (v === undefined || v === null || v === '') return empty;
        const n = parseFloat(v);
        if (Number.isNaN(n)) return empty;
        return numeric ? n : n.toFixed(2);
    };

    const headers = ['No.', 'CI', 'Paterno', 'Materno', 'Nombres'];
    structure.forEach(group => {
        const visibleSubs = group.sub_criteria.filter(s => s.visible);
        const visibleSpecials = (group.special_criteria || []).filter(s => s.visible);
        if ((visibleSubs.length + visibleSpecials.length) === 0 && !isCriterionVisible(group.id)) return;
        visibleSubs.forEach(sub => headers.push(`${sub.name} (${sub.percentage}%)`));
        visibleSpecials.forEach(spec => headers.push(`(Extra) ${spec.name}`));
        if (isCriterionVisible(group.id)) headers.push(`Nota ${group.name} (${group.weight}%)`);
    });
    if (showFinalGrade) headers.push('Nota Final');

    const dataRows = rows.map((row, idx) => {
        const r = [idx + 1, row.ci, row.paterno, row.materno, row.nombre];
        structure.forEach(group => {
            const visibleSubs = group.sub_criteria.filter(s => s.visible);
            const visibleSpecials = (group.special_criteria || []).filter(s => s.visible);
            if ((visibleSubs.length + visibleSpecials.length) === 0 && !isCriterionVisible(group.id)) return;
            visibleSubs.forEach(sub => r.push(num(row.grades[sub.id])));
            visibleSpecials.forEach(spec => {
                const raw = row.grades[spec.id];
                if (raw === undefined || raw === null || raw === '') { r.push(empty); return; }
                const n = parseFloat(raw);
                if (Number.isNaN(n)) { r.push(empty); return; }
                r.push(numeric ? n : `+${n.toFixed(2)}`);
            });
            if (isCriterionVisible(group.id)) {
                const cg = row._criterionGrades?.[group.id];
                r.push(cg ? (numeric ? cg.grade : cg.grade.toFixed(2)) : empty);
            }
        });
        if (showFinalGrade) r.push(num(row._finalGrade));
        return r;
    });
    return { headers, dataRows };
};

export const exportGradesToPDF = (rows, structure, isCriterionVisible, showFinalGrade, activeCourse) => {
    const { headers, dataRows } = buildExportRows(rows, structure, isCriterionVisible, showFinalGrade);
    const fileName = `Calificaciones_${activeCourse.subject_details?.name || 'Curso'}_${activeCourse.parallel || ''}_${new Date().toLocaleDateString('es-BO').replace(/\//g, '-')}`;
    const doc = new jsPDF('landscape');
    doc.setFontSize(14);
    doc.text(`Calificaciones: ${activeCourse.subject_details?.name || ''} - Paralelo ${activeCourse.parallel || ''}`, 14, 15);
    doc.setFontSize(10);
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-BO')}`, 14, 22);
    doc.autoTable({ head: [headers], body: dataRows, startY: 25, theme: 'plain', styles: { fontSize: 8, cellPadding: 2, lineColor: [0, 0, 0], lineWidth: 0.1 }, headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' } });
    doc.save(`${fileName}.pdf`);
};

export const exportGradesToExcel = (rows, structure, isCriterionVisible, showFinalGrade, activeCourse) => {
    const { headers, dataRows } = buildExportRows(rows, structure, isCriterionVisible, showFinalGrade, true);
    const fileName = `Calificaciones_${activeCourse.subject_details?.name || 'Curso'}_${activeCourse.parallel || ''}_${new Date().toLocaleDateString('es-BO').replace(/\//g, '-')}`;
    const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);

    // Forzar formato numérico en las columnas de notas (todas menos No., CI, Paterno, Materno, Nombres)
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let R = range.s.r + 1; R <= range.e.r; R += 1) {
        for (let C = 5; C <= range.e.c; C += 1) {
            const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
            if (cell && typeof cell.v === 'number') {
                cell.t = 'n';
                cell.z = '0.00';
            }
        }
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Calificaciones');
    XLSX.writeFile(wb, `${fileName}.xlsx`);
};
