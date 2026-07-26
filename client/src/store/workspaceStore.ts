import { create } from 'zustand';
import type { SectionType } from '../types/workspace';

interface WorkspaceUIState {
  activeSectionType: SectionType | null;
  setActiveSectionType: (type: SectionType | null) => void;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

export const useWorkspaceStore = create<WorkspaceUIState>((set) => ({
  activeSectionType: null,
  setActiveSectionType: (type) => set({ activeSectionType: type }),
  isSidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ isSidebarCollapsed: !s.isSidebarCollapsed })),
}));
