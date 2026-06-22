import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:5000/api',
  withCredentials: true // This allows the browser to send cookies (including HttpOnly cookies) along with requests to the backend, enabling session management and authentication.
});

export default apiClient;