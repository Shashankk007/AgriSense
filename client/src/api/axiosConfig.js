import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:5555/api',
  withCredentials: true // send the HttpOnly auth cookies with every request
});

// Auth endpoints where a 401 is a real answer (bad credentials etc.), not an expired session.
const NO_REFRESH_URLS = ['/auth/login', '/auth/register', '/auth/google-login', '/auth/refresh-token', '/auth/forgot-password', '/auth/reset-password'];

// Share one in-flight refresh between concurrent requests.
let refreshPromise = null;

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const skipRefresh = NO_REFRESH_URLS.some((u) => original?.url?.startsWith(u));

    if (status === 401 && original && !original._retried && !skipRefresh) {
      original._retried = true;
      try {
        refreshPromise = refreshPromise || apiClient.post('/auth/refresh-token').finally(() => { refreshPromise = null; });
        await refreshPromise;
        return apiClient(original); // retry with the fresh access-token cookie
      } catch {
        // refresh failed: session is really over, fall through to the original error
      }
    }

    console.error(`[API ERROR] ${original?.method?.toUpperCase()} ${original?.url}`, {
      status,
      data: error.response?.data,
    });
    return Promise.reject(error);
  }
);

export default apiClient;
