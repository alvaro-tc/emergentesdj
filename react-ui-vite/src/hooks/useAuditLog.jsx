import { useReducer, useCallback, useRef, useEffect } from 'react';

const STORAGE_KEY = 'sigeldyw_audit_v1';
const MAX_STORED = 500;

// ─── Persistence helpers ──────────────────────────────────────────────────────

function loadFromStorage() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : { past: [], future: [] };
    } catch {
        return { past: [], future: [] };
    }
}

function saveToStorage(state) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            past: state.past.slice(-MAX_STORED),
            future: state.future.slice(-MAX_STORED),
        }));
    } catch (_) {}
}

// ─── Reducer ─────────────────────────────────────────────────────────────────

function auditReducer(state, action) {
    switch (action.type) {
        case 'RECORD': {
            const entry = action.payload;
            const newFuture = state.future.filter((e) => e.userId !== entry.userId);
            return { past: [...state.past, entry], future: newFuture };
        }

        case 'UNDO': {
            const idx = state.past.findIndex((e) => e.actionId === action.payload.actionId);
            if (idx === -1) return state;
            const entry = state.past[idx];
            return {
                past: state.past.filter((_, i) => i !== idx),
                future: [...state.future, entry],
            };
        }

        case 'REDO': {
            const idx = state.future.findIndex((e) => e.actionId === action.payload.actionId);
            if (idx === -1) return state;
            const entry = state.future[idx];
            const newFuture = state.future.filter((_, i) => i !== idx);
            const newPast = [...state.past];
            const insertAt = newPast.findIndex((e) => e.timestamp > entry.timestamp);
            if (insertAt === -1) newPast.push(entry);
            else newPast.splice(insertAt, 0, entry);
            return { past: newPast, future: newFuture };
        }

        case 'CLEAR':
            return { past: [], future: [] };

        default:
            return state;
    }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export default function useAuditLog() {
    const [state, dispatch] = useReducer(auditReducer, undefined, loadFromStorage);
    const callbacksRef = useRef(new Map());

    // Sync to localStorage on every state change
    useEffect(() => {
        saveToStorage(state);
    }, [state]);

    /**
     * Record a new action.
     * Accepts: { type, payload, userId, userName?, method?, url?, httpStatus?, onUndo?, onRedo? }
     * Returns the generated actionId.
     */
    const recordAction = useCallback(
        ({ type, payload, userId, userName, method, url, httpStatus, onUndo, onRedo }) => {
            const actionId = crypto.randomUUID();
            if (onUndo || onRedo) callbacksRef.current.set(actionId, { onUndo, onRedo });

            dispatch({
                type: 'RECORD',
                payload: {
                    actionId,
                    type,
                    payload,
                    timestamp: new Date().toISOString(),
                    userId,
                    userName: userName ?? String(userId),
                    method: method ?? null,
                    url: url ?? null,
                    httpStatus: httpStatus ?? null,
                },
            });
            return actionId;
        },
        []
    );

    /**
     * Undo a specific action. Does NOT alter other users' committed actions.
     */
    const undo = useCallback((actionId) => {
        callbacksRef.current.get(actionId)?.onUndo?.();
        dispatch({ type: 'UNDO', payload: { actionId } });
    }, []);

    /**
     * Redo a previously undone action.
     */
    const redo = useCallback((actionId) => {
        callbacksRef.current.get(actionId)?.onRedo?.();
        dispatch({ type: 'REDO', payload: { actionId } });
    }, []);

    const clearHistory = useCallback(() => {
        callbacksRef.current.clear();
        dispatch({ type: 'CLEAR' });
    }, []);

    return {
        past: state.past,
        present: state.past.at(-1) ?? null,
        future: state.future,
        recordAction,
        undo,
        redo,
        clearHistory,
    };
}
