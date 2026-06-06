import { create } from 'zustand';

interface UIState {
  isDrawerOpen: boolean;
  isModalOpen: boolean;
  setDrawerOpen: (isOpen: boolean) => void;
  setModalOpen: (isOpen: boolean) => void;
  toggleDrawer: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isDrawerOpen: false,
  isModalOpen: false,
  setDrawerOpen: (isOpen) => set({ isDrawerOpen: isOpen }),
  setModalOpen: (isOpen) => set({ isModalOpen: isOpen }),
  toggleDrawer: () => set((state) => ({ isDrawerOpen: !state.isDrawerOpen })),
}));
