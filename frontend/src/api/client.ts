import axios from 'axios';
import { useAuthStore } from '../store/authStore';

// const BASE_URL ='https://65.2.38.246.nip.io';  
const BASE_URL = 'http://localhost:3001';

export const apiClient = axios.create({
    baseURL: `${BASE_URL}/api`,
    headers: { 'Content-Type': 'application/json' },
    timeout: 15000,
});

// ── Request interceptor: attach JWT ──────────────────────────────────────────
apiClient.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ── Response interceptor: handle 401 ─────────────────────────────────────────
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Avoid hard reload loops; let route guards handle redirects.
            // Also avoid logging out when there is no session yet (e.g. public pages).
            const token = useAuthStore.getState().token;
            if (token) {
                useAuthStore.getState().logout();
            }
        }
        return Promise.reject(error);
    }
);

export default apiClient;
