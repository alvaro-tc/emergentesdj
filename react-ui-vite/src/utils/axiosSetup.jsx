import axios from 'axios';
import { store } from '../store';
import { LOGOUT } from '../store/actions';

let isHandling401 = false; // Prevent multiple simultaneous logouts

/**
 * Sets up a global axios interceptor that automatically logs out the user
 * when any API request returns a 401 (Unauthorized / token expired).
 *
 * This handles the case where the JWT token has expired (e.g. after 1 day)
 * and the user is still on the dashboard — instead of silently failing,
 * the app will clear the session and redirect to /login.
 */
export const setupAxiosInterceptors = () => {
    axios.interceptors.response.use(
        // Pass through successful responses unchanged
        (response) => response,

        // Handle errors
        (error) => {
            const status = error?.response?.status;
            const requestUrl = error?.config?.url || '';

            // Skip auth endpoints to avoid redirect loops
            const isAuthEndpoint =
                requestUrl.includes('/login') ||
                requestUrl.includes('/register') ||
                requestUrl.includes('/logout');

            // 401 = Unauthorized, 403 = DRF AuthenticationFailed (token expired/invalid)
            // Check that the response contains the auth error message to avoid false positives on 403
            const isAuthError =
                (status === 401 || status === 403) &&
                !isAuthEndpoint &&
                !isHandling401;

            // Only treat as auth failure if the response body indicates auth failure
            // (to avoid logging out on legitimate 403 permission errors)
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

                // Dispatch logout to clear Redux state (and redux-persist)
                store.dispatch({ type: LOGOUT });

                // Redirect to login page
                window.location.href = '/login';

                // Reset flag after redirect
                setTimeout(() => {
                    isHandling401 = false;
                }, 3000);
            }

            return Promise.reject(error);
        }
    );
};
