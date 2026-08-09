import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Allow components or auth flow to handle 401 gracefully
      console.warn('Unauthorized or session expired.');
    }
    return Promise.reject(error);
  }
);

export { API_BASE_URL };
export default api;
