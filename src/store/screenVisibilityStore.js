import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Modos de restricción:
//   null / ausente → habilitada para todos
//   'users'        → bloqueada solo para usuarios regulares (admins acceden con banner)
//   'all'          → bloqueada para todos los perfiles incluyendo admins

const useScreenVisibilityStore = create(
  persist(
    (set, get) => ({
      disabledScreens: {},

      // Establece el modo de restricción. mode === null elimina la restricción.
      setScreenMode: (screenKey, mode) => {
        set((state) => {
          const next = { ...state.disabledScreens }
          if (!mode) {
            delete next[screenKey]
          } else {
            next[screenKey] = mode
          }
          return { disabledScreens: next }
        })
      },

      // Devuelve el modo activo: 'users', 'all', o null si está habilitada.
      // Compatibilidad con datos anteriores donde el valor era true → 'all'.
      getScreenMode: (screenKey) => {
        const val = get().disabledScreens[screenKey]
        if (!val) return null
        if (val === true) return 'all'
        return val
      },

      isScreenDisabled: (screenKey) => !!get().disabledScreens[screenKey],

      // Usado por formEditorStore.pullFromCloud para actualizar en bulk
      setDisabledScreens: (map) => set({ disabledScreens: map || {} }),
    }),
    { name: 'mrc-screen-visibility' }
  )
)

export default useScreenVisibilityStore
