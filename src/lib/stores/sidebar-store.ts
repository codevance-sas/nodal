import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface SidebarState {
  isOpen: boolean;
  isMobileOpen: boolean;
  toggleSidebar: () => void;
  toggleMobileSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setMobileSidebarOpen: (open: boolean) => void;
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set, get) => ({
      isOpen: true, // Desktop sidebar abierto por defecto
      isMobileOpen: false, // Mobile sidebar cerrado por defecto
      
      toggleSidebar: () => set((state) => ({ isOpen: !state.isOpen })),
      
      toggleMobileSidebar: () => set((state) => ({ isMobileOpen: !state.isMobileOpen })),
      
      setSidebarOpen: (open: boolean) => set({ isOpen: open }),
      
      setMobileSidebarOpen: (open: boolean) => set({ isMobileOpen: open }),
    }),
    {
      name: 'sidebar-storage',
      storage: createJSONStorage(() => localStorage),
      // Solo persistir el estado del sidebar de escritorio
      partialize: (state) => ({ isOpen: state.isOpen }),
    }
  )
); 