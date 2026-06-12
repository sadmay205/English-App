import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling + auto-logout on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || 'Đã xảy ra lỗi';
    console.error('API Error:', message);

    // Auto-logout when token is expired or invalid
    if (error.response?.status === 401) {
      const token = localStorage.getItem('token');
      if (token) {
        // Dynamically import to avoid circular dependency issues
        import('../store/useAuthStore').then(({ default: useAuthStore }) => {
          useAuthStore.getState().logout();
        });
        console.warn('Phiên đăng nhập hết hạn, đã tự động đăng xuất.');
      }
    }

    return Promise.reject(error);
  }
);

export default api;
