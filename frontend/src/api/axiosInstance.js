import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to every outgoing request
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('dqp_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle session expiry / unauthorized responses globally
let sessionExpiredHandler = null;
export const registerSessionExpiredHandler = (handler) => {
  sessionExpiredHandler = handler;
};

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('dqp_token');
      localStorage.removeItem('dqp_user');
      if (sessionExpiredHandler) sessionExpiredHandler();
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
