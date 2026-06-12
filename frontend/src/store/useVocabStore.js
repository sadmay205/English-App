import { create } from 'zustand';
import api from '../services/api';

const useVocabStore = create((set, get) => ({
  // State
  vocabSets: [],
  currentSet: null,
  vocabularies: [],
  isLoading: false,
  error: null,

  // Fetch all vocabulary sets
  fetchSets: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get('/vocabulary/sets');
      set({ vocabSets: data, isLoading: false });
    } catch (error) {
      set({ error: error.response?.data?.message || 'Lỗi khi tải bộ từ vựng', isLoading: false });
    }
  },

  // Create a new vocabulary set
  createSet: async (title, description) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post('/vocabulary/sets', { title, description });
      set((state) => ({
        vocabSets: [{ ...data, wordCount: 0 }, ...state.vocabSets],
        isLoading: false,
      }));
      return data;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Lỗi khi tạo bộ từ vựng', isLoading: false });
      return null;
    }
  },

  // Fetch a single set with vocabularies
  fetchSetById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get(`/vocabulary/sets/${id}`);
      set({ currentSet: data, vocabularies: data.vocabularies || [], isLoading: false });
      return data;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Lỗi khi tải bộ từ vựng', isLoading: false });
      return null;
    }
  },

  // Add a single vocabulary word
  addWord: async (vocabSetId, wordData) => {
    set({ error: null });
    try {
      const { data } = await api.post('/vocabulary/item', { vocabSetId, ...wordData });
      set((state) => ({
        vocabularies: [...state.vocabularies, data],
      }));
      // Update wordCount in vocabSets list
      set((state) => ({
        vocabSets: state.vocabSets.map((s) =>
          s._id === vocabSetId ? { ...s, wordCount: (s.wordCount || 0) + 1 } : s
        ),
      }));
      return data;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Lỗi khi thêm từ vựng' });
      return null;
    }
  },

  // Upload PDF to import vocabularies
  uploadPdf: async (vocabSetId, file) => {
    set({ isLoading: true, error: null });
    try {
      const formData = new FormData();
      formData.append('pdf', file);
      formData.append('vocabSetId', vocabSetId);

      const { data } = await api.post('/vocabulary/upload-pdf', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Refresh the set to get updated vocabularies
      await get().fetchSetById(vocabSetId);

      // Update wordCount in vocabSets list
      set((state) => ({
        vocabSets: state.vocabSets.map((s) =>
          s._id === vocabSetId ? { ...s, wordCount: (s.wordCount || 0) + data.count } : s
        ),
        isLoading: false,
      }));

      return data;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Lỗi khi import PDF', isLoading: false });
      return null;
    }
  },

  // Generate English definitions using AI
  generateDefinitions: async (setId) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post(`/vocabulary/sets/${setId}/generate-definitions`);
      set((state) => ({
        vocabularies: data.vocabularies,
        currentSet: state.currentSet ? { ...state.currentSet, vocabularies: data.vocabularies } : null,
        isLoading: false,
      }));
      return data;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Lỗi khi tạo định nghĩa tiếng Anh',
        isLoading: false,
      });
      return null;
    }
  },

  // Delete a vocabulary set
  deleteSet: async (id) => {
    try {
      await api.delete(`/vocabulary/sets/${id}`);
      set((state) => ({
        vocabSets: state.vocabSets.filter((s) => s._id !== id),
        currentSet: state.currentSet?._id === id ? null : state.currentSet,
        vocabularies: state.currentSet?._id === id ? [] : state.vocabularies,
      }));
      return true;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Lỗi khi xóa bộ từ vựng' });
      return false;
    }
  },

  // Delete a single vocabulary word
  deleteWord: async (vocabSetId, wordId) => {
    try {
      await api.delete(`/vocabulary/item/${wordId}`);
      set((state) => ({
        vocabularies: state.vocabularies.filter((v) => v._id !== wordId),
      }));
      // Update wordCount in vocabSets list
      set((state) => ({
        vocabSets: state.vocabSets.map((s) =>
          s._id === vocabSetId ? { ...s, wordCount: Math.max(0, (s.wordCount || 1) - 1) } : s
        ),
      }));
      return true;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Lỗi khi xóa từ vựng' });
      return false;
    }
  },

  // Update a single vocabulary word
  updateWord: async (vocabSetId, wordId, wordData) => {
    set({ error: null });
    try {
      const { data } = await api.put(`/vocabulary/item/${wordId}`, wordData);
      set((state) => ({
        vocabularies: state.vocabularies.map((v) => (v._id === wordId ? data : v)),
      }));
      return data;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Lỗi khi cập nhật từ vựng' });
      return null;
    }
  },

  // Merge two sets
  mergeSets: async (sourceSetId, targetSetId) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post('/vocabulary/merge', { sourceSetId, targetSetId });
      
      set((state) => {
        const sourceSet = state.vocabSets.find((s) => s._id === sourceSetId);
        const sourceCount = sourceSet ? (sourceSet.wordCount || 0) : 0;
        
        return {
          vocabSets: state.vocabSets
            .filter((s) => s._id !== sourceSetId)
            .map((s) =>
              s._id === targetSetId
                ? { ...s, wordCount: (s.wordCount || 0) + sourceCount, lastStudiedAt: new Date().toISOString() }
                : s
            ),
          isLoading: false,
        };
      });
      return data;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Lỗi khi gộp bộ từ vựng',
        isLoading: false,
      });
      return null;
    }
  },

  // Split selected words into a new set
  splitSet: async (sourceSetId, wordIds, newSetTitle, newSetDescription) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post('/vocabulary/split', {
        sourceSetId,
        wordIds,
        newSetTitle,
        newSetDescription,
      });
      
      set((state) => {
        const updatedVocabularies = state.vocabularies.filter((v) => !wordIds.includes(v._id));
        const updatedVocabSets = state.vocabSets.map((s) =>
          s._id === sourceSetId
            ? { ...s, wordCount: Math.max(0, (s.wordCount || 0) - data.splitCount), lastStudiedAt: new Date().toISOString() }
            : s
        );
        
        const newSetWithDate = {
          ...data.newSet,
          lastStudiedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        };

        return {
          vocabSets: [newSetWithDate, ...updatedVocabSets],
          vocabularies: updatedVocabularies,
          currentSet: state.currentSet?._id === sourceSetId
            ? { ...state.currentSet, wordCount: updatedVocabularies.length }
            : state.currentSet,
          isLoading: false,
        };
      });
      return data;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Lỗi khi tách bộ từ vựng',
        isLoading: false,
      });
      return null;
    }
  },

  // Update a vocabulary set
  updateSet: async (id, title, description) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.put(`/vocabulary/sets/${id}`, { title, description });
      set((state) => ({
        vocabSets: state.vocabSets.map((s) => (s._id === id ? { ...s, title: data.title, description: data.description } : s)),
        currentSet: state.currentSet?._id === id ? { ...state.currentSet, title: data.title, description: data.description } : state.currentSet,
        isLoading: false,
      }));
      return data;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Lỗi khi cập nhật bộ từ vựng',
        isLoading: false,
      });
      return null;
    }
  },

  // Clear current set
  clearCurrentSet: () => set({ currentSet: null, vocabularies: [] }),
}));


export default useVocabStore;
