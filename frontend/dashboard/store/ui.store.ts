import { create } from 'zustand'

interface Modal {
  id: string
  open: boolean
  data?: any
}

interface UIState {
  // Sidebar
  sidebarOpen: boolean
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  toggleSidebarCollapse: () => void

  // Modals
  modals: Map<string, Modal>
  openModal: (id: string, data?: any) => void
  closeModal: (id: string) => void
  isModalOpen: (id: string) => boolean
  getModalData: (id: string) => any

  // Theme
  theme: 'light' | 'dark' | 'auto'
  setTheme: (theme: 'light' | 'dark' | 'auto') => void

  // Loading states
  loadingStates: Map<string, boolean>
  setLoading: (key: string, loading: boolean) => void
  isLoading: (key: string) => boolean
}

export const useUIStore = create<UIState>((set, get) => ({
  // Sidebar
  sidebarOpen: true,
  sidebarCollapsed: false,

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebarCollapse: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  // Modals
  modals: new Map(),

  openModal: (id, data) => {
    const modals = new Map(get().modals)

    modals.set(id, { id, open: true, data })
    set({ modals })
  },

  closeModal: (id) => {
    const modals = new Map(get().modals)

    modals.delete(id)
    set({ modals })
  },

  isModalOpen: (id) => {
    return get().modals.get(id)?.open || false
  },

  getModalData: (id) => {
    return get().modals.get(id)?.data
  },

  // Theme
  theme: 'light',
  setTheme: (theme) => {
    set({ theme })

    // Apply theme to document
    if (typeof window !== 'undefined') {
      const root = window.document.documentElement

      root.classList.remove('light', 'dark')

      if (theme === 'auto') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
          .matches
          ? 'dark'
          : 'light'

        root.classList.add(systemTheme)
      } else {
        root.classList.add(theme)
      }
    }
  },

  // Loading states
  loadingStates: new Map(),

  setLoading: (key, loading) => {
    const loadingStates = new Map(get().loadingStates)

    if (loading) {
      loadingStates.set(key, true)
    } else {
      loadingStates.delete(key)
    }
    set({ loadingStates })
  },

  isLoading: (key) => {
    return get().loadingStates.get(key) || false
  },
}))
