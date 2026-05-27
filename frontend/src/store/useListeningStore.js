import { create } from 'zustand';
import api from '../services/api';

const useListeningStore = create((set, get) => ({
  // State
  tasks: [],
  currentTask: null,
  isLoading: false,
  error: null,

  // Actions
  fetchTasks: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get('/listening/tasks');
      set({ tasks: data, isLoading: false });
    } catch (error) {
      set({ error: error.response?.data?.message || 'Lỗi khi tải danh sách bài tập nghe', isLoading: false });
    }
  },

  fetchTaskById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get(`/listening/tasks/${id}`);
      set({ currentTask: data, isLoading: false });
      return data;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Lỗi khi tải chi tiết bài tập nghe', isLoading: false });
      return null;
    }
  },

  processParagraph: async (title, paragraphText) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post('/listening/process-paragraph', { title, paragraphText });
      set((state) => ({
        tasks: [data, ...state.tasks],
        currentTask: data,
        isLoading: false,
      }));
      return data;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Lỗi khi phân tích đoạn văn', isLoading: false });
      return null;
    }
  },

  deleteTask: async (id) => {
    set({ error: null });
    try {
      await api.delete(`/listening/tasks/${id}`);
      set((state) => ({
        tasks: state.tasks.filter((t) => t._id !== id),
        currentTask: state.currentTask?._id === id ? null : state.currentTask,
      }));
      return true;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Lỗi khi xóa bài tập nghe' });
      return false;
    }
  },

  clearCurrentTask: () => set({ currentTask: null }),
}));

export default useListeningStore;
