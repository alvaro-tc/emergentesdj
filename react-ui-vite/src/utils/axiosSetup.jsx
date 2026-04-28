import axios from 'axios';
import { store } from '../store';
import { LOGOUT } from '../store/actions';
import auditBridge from './auditBridge';

let isHandling401 = false;

const METHOD_VERBS = { POST: 'CREÓ', PUT: 'ACTUALIZÓ', PATCH: 'MODIFICÓ', DELETE: 'ELIMINÓ' };
const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function extractResource(url = '') {
    try {
        const path = new URL(url).pathname;
        return path.replace(/^\/+api\/+/, '').replace(/\/+$/, '') || path;
    } catch {
        return url.replace(/^.*\/api\//, '').replace(/\/$/, '') || url;
    }
}

function safeTruncate(data, maxChars = 800) {
    if (data === null || data === undefined) return null;
    try {
        const str = typeof data === 'string' ? data : JSON.stringify(data);
        if (str.length <= maxChars) return typeof data === 'string' ? data : JSON.parse(str);
        return { _truncated: true, preview: str.substring(0, maxChars) + '…' };
    } catch {
        return null;
    }
}

export const setupAxiosInterceptors = () => {
    // ── Capture successful mutations for the audit log ──────────────────────────
    axios.interceptors.response.use(
        (response) => {
            const method = response.config.method?.toUpperCase();
            if (MUTATION_METHODS.has(method)) {
                const { account } = store.getState();
                const user = account?.user;
                if (user) {
                    let requestBody = null;
                    try { requestBody = JSON.parse(response.config.data || 'null'); } catch (_) {}

                    const resource = extractResource(response.config.url);
                    const verb = METHOD_VERBS[method] || method;

                    auditBridge.record({
                        type: `${verb} ${resource.toUpperCase()}`,
                        payload: {
                            method,
                            url: response.config.url,
                            resource,
                            httpStatus: response.status,
                            requestBody: safeTruncate(requestBody),
                            responseData: safeTruncate(response.data),
                        },
                        userId: user.id,
                        userName: user.username || user.email || `Usuario ${user.id}`,
                        method,
                        url: response.config.url,
                        httpStatus: response.status,
                    });
                }
            }
            return response;
        },

        // ── Handle auth errors (existing logic) ────────────────────────────────
        (error) => {
            const status = error?.response?.status;
            const requestUrl = error?.config?.url || '';

            const isAuthEndpoint =
                requestUrl.includes('/login') ||
                requestUrl.includes('/register') ||
                requestUrl.includes('/logout');

            const isAuthError =
                (status === 401 || status === 403) &&
                !isAuthEndpoint &&
                !isHandling401;

            const responseData = error?.response?.data;
            const isTokenError =
                isAuthError &&
                (status === 401 ||
                    (status === 403 &&
                        responseData &&
                        (responseData.msg === 'User is not logged on.' ||
                            (typeof responseData.detail === 'string' &&
                                responseData.detail.toLowerCase().includes('authentication')))));

            if (isTokenError) {
                isHandling401 = true;
                store.dispatch({ type: LOGOUT });
                window.location.href = '/login';
                setTimeout(() => { isHandling401 = false; }, 3000);
            }

            return Promise.reject(error);
        }
    );
};
