import { createSlice } from '@reduxjs/toolkit';

// Contexto de periodo del panel de administración.
// `activePeriod` es el periodo activo del sistema (fuente de verdad del landing page).
// `viewingPeriod` es un cambio TEMPORAL de periodo para verificaciones: no se persiste,
// se descarta al recargar la aplicación y se limpia con `resetToActivePeriod`.
const initialState = {
    activePeriod: null,
    viewingPeriod: null,
    loading: false
};

const periodSlice = createSlice({
    name: 'period',
    initialState,
    reducers: {
        setActivePeriod(state, action) {
            state.activePeriod = action.payload;
            state.loading = false;
            // Si el periodo visualizado pasó a ser el activo, deja de ser temporal.
            if (state.viewingPeriod && action.payload && state.viewingPeriod.id === action.payload.id) {
                state.viewingPeriod = null;
            }
        },
        setViewingPeriod(state, action) {
            const period = action.payload;
            state.viewingPeriod = period && state.activePeriod && period.id === state.activePeriod.id ? null : period;
        },
        resetToActivePeriod(state) {
            state.viewingPeriod = null;
        },
        setPeriodLoading(state, action) {
            state.loading = action.payload;
        }
    }
});

export const { setActivePeriod, setViewingPeriod, resetToActivePeriod, setPeriodLoading } = periodSlice.actions;

export default periodSlice.reducer;

// Periodo con el que trabaja el panel: el temporal si existe, si no el activo.
export const selectContextPeriod = (state) => state.period.viewingPeriod || state.period.activePeriod;
export const selectIsTemporaryPeriod = (state) => Boolean(state.period.viewingPeriod);
