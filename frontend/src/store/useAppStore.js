import { create } from 'zustand';

const useAppStore = create((set) => ({
  // Current active view in the center canvas
  activeView: 'vocabulary', // 'vocabulary' | 'study' | 'quiz' | 'listening' | 'progress' | 'flashcard'

  // Set the active view
  setActiveView: (view) => set({ activeView: view }),

  // Sidebar collapsed state
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}));

export default useAppStore;
