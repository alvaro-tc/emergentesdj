
// Utility to format schedule for display
// Handles both legacy simple strings and new JSON structure

export const formatSchedule = (scheduleData) => {
    if (!scheduleData) return 'Por definir';

    try {
        // Try to parse as JSON
        const schedule = JSON.parse(scheduleData);

        // precise validation: must be array and have at least one valid entry
        if (Array.isArray(schedule) && schedule.length > 0) {
            // Sort by day if needed (Monday=1, etc) - for now simple map
            return schedule.map(s => {
                const day = s.day || '';
                const start = s.start || '';
                const end = s.end || '';
                // e.g. "Lunes: 08:00 - 10:00"
                if (day && (start || end)) {
                    return `${day}: ${start}${end ? ' - ' + end : ''}`;
                }
                return `${day} ${start} ${end}`;
            }).join(', ');
        }

        // If it parses but is empty or not array, return original if string, or empty
        if (typeof scheduleData === 'string') return scheduleData;

    } catch (e) {
        // Not JSON, return as legacy text
        return scheduleData;
    }

    return scheduleData;
};

// Returns array of formatted strings for display (e.g. for mapping to divs)
export const getScheduleItems = (scheduleData) => {
    if (!scheduleData) return [];

    try {
        const schedule = JSON.parse(scheduleData);
        if (Array.isArray(schedule) && schedule.length > 0) {
            return schedule.map(s => {
                const day = s.day || '';
                const start = s.start || '';
                const end = s.end || '';
                if (day && (start || end)) {
                    return `${day}: ${start}${end ? ' - ' + end : ''}`;
                }
                return `${day} ${start} ${end}`;
            });
        }
        if (typeof scheduleData === 'string') return [scheduleData];
    } catch (e) {
        return [scheduleData];
    }
    return [];
};

// Helper for initial values in form
export const parseScheduleForForm = (scheduleData) => {
    if (!scheduleData) return [{ day: 'Lunes', start: '', end: '' }];

    try {
        const schedule = JSON.parse(scheduleData);
        if (Array.isArray(schedule) && schedule.length > 0) {
            return schedule;
        }
    } catch (e) {
        // Legacy text: return one row with note or just empty and let user overwrite?
        // Better: Put legacy text in a "note" or just start clean but maybe keep reference?
        // Strategy: If legacy text exists, we can't easily parse it into Day/Time. 
        // We will return a default row, but maybe we should warn user?
        // For now, let's just return default. User will re-enter data.
        // OR: we could try to put the whole text in "day" as a fallback, but that messes up dropdowns.
    }
    return [{ day: 'Lunes', start: '', end: '' }];
};
