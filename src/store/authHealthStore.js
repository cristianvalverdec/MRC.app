// ── authHealthStore — Estado de salud de la sesión Azure AD ───────────────
// Solo almacena si el último intento de adquisición de token falló o no.
// getGraphToken() (msalInstance.js) actualiza este store en cada intento.
// Los componentes lo leen para mostrar semáforo de sesión.

import { create } from 'zustand'

const useAuthHealthStore = create((set) => ({
  tokenStatus: 'unknown',  // 'unknown' | 'ok' | 'error'
  tokenError: null,        // string con el mensaje de error, o null

  setTokenOk:   ()    => set({ tokenStatus: 'ok',    tokenError: null }),
  setTokenError: (msg) => set({ tokenStatus: 'error', tokenError: msg }),
  resetStatus:  ()    => set({ tokenStatus: 'unknown', tokenError: null }),
}))

export default useAuthHealthStore
