import { create } from 'zustand';
import api from '../services/api';

const useAuthStore = create((set, get) => ({
  // State
  user: JSON.parse(localStorage.getItem('user')) || null,
  token: localStorage.getItem('token') || null,
  isLoading: false,
  error: null,

  // Actions
  register: async (username, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post('/auth/register', { username, email, password });
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({ username: data.username, email: data.email, _id: data._id }));
      
      set({
        user: { username: data.username, email: data.email, _id: data._id },
        token: data.token,
        isLoading: false,
      });
      return true;
    } catch (error) {
      const msg = error.response?.data?.message || 'Đăng ký thất bại';
      set({ error: msg, isLoading: false });
      return false;
    }
  },

  login: async (emailOrUsername, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post('/auth/login', { emailOrUsername, password });
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({ username: data.username, email: data.email, _id: data._id }));
      
      set({
        user: { username: data.username, email: data.email, _id: data._id },
        token: data.token,
        isLoading: false,
      });
      return true;
    } catch (error) {
      const msg = error.response?.data?.message || 'Đăng nhập thất bại';
      set({ error: msg, isLoading: false });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null, error: null });
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;
