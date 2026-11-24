import { create } from 'zustand';

interface UiState {
  sidebarCollapsed: boolean;
  selectedPullRequestId: number | null;
  toggleSidebar: () => void;
  selectPullRequest: (id: number | null) => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarCollapsed: false,
  selectedPullRequestId: null,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  selectPullRequest: (selectedPullRequestId) => set({ selectedPullRequestId }),
}));
