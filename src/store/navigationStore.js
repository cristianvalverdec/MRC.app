import { create } from 'zustand'

const useNavigationStore = create((set, get) => ({
  navigationStack: [],

  // Agregar una ruta al stack
  pushRoute: (route) => set((state) => {
    const currentStack = state.navigationStack
    // Evitar duplicados consecutivos
    if (currentStack[currentStack.length - 1] === route) return state
    return { navigationStack: [...currentStack, route] }
  }),

  // Obtener la ruta anterior
  getPreviousRoute: () => {
    const stack = get().navigationStack
    return stack.length > 1 ? stack[stack.length - 2] : null
  },

  // Retroceder en el stack
  popRoute: () => set((state) => {
    const newStack = state.navigationStack.slice(0, -1)
    return { navigationStack: newStack }
  }),

  // Limpiar el stack (útil después de logout)
  clearStack: () => set({ navigationStack: [] }),

  // Reemplazar la ruta actual (útil en ciertos casos de navegación)
  replaceRoute: (route) => set((state) => {
    const stack = state.navigationStack.slice(0, -1)
    return { navigationStack: [...stack, route] }
  }),
}))

export default useNavigationStore
