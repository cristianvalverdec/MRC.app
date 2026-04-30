import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useScreenVisibilityStore = create(
  persist(
    (set, get) => ({
      disabledScreens: {},

      // Alterna el estado de una pantalla. El caller es responsable de
      // disparar _syncToCloud() en formEditorStore para persistir en la nube.
      toggleScreen: (screenKey) => {
        set((state) => {
          const next = { ...state.disabledScreens }
          if (next[screenKey]) {
            delete next[screenKey]
          } else {
            next[screenKey] = true
          }
          return { disabledScreens: next }
        })
      },

      isScreenDisabled: (screenKey) => !!get().disabledScreens[screenKey],

      // Usado por formEditorStore.pullFromCloud para actualizar en bulk
      setDisabledScreens: (map) => set({ disabledScreens: map || {} }),
    }),
    { name: 'mrc-screen-visibility' }
  )
)

export default useScreenVisibilityStore
