import { useCallback } from 'react'
import { useMsal } from '@azure/msal-react'
import { loginRequest } from '../config/msalConfig'
import useUserStore from '../store/userStore'

const IS_DEV_MODE =
  !import.meta.env.VITE_AZURE_CLIENT_ID ||
  import.meta.env.VITE_AZURE_CLIENT_ID === 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'

export function useAuth() {
  const { instance, accounts } = useMsal()
  const setUser = useUserStore((s) => s.setUser)
  const clearUser = useUserStore((s) => s.clearUser)
  const isAuthenticated = useUserStore((s) => s.isAuthenticated)

  const login = useCallback(async () => {
    if (IS_DEV_MODE) {
      // Modo desarrollo: simula usuario admin autenticado
      setUser({
        rut: '12345678-9',
        name: 'Usuario Demo',
        email: 'demo@agrosuper.cl',
        role: 'admin',
        isAuthenticated: true,
      })
      return { success: true, dev: true }
    }

    try {
      // loginRedirect: redirige a Microsoft login y regresa a la app
      // Evita el bloqueo de popups de Chrome y es el patrón correcto para PWAs
      await instance.loginRedirect(loginRequest)
      return { success: true }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error }
    }
  }, [instance, setUser])

  const logout = useCallback(async () => {
    clearUser()
    if (!IS_DEV_MODE && accounts.length > 0) {
      await instance.logoutPopup({ account: accounts[0] })
    }
  }, [instance, accounts, clearUser])

  const getToken = useCallback(async () => {
    if (IS_DEV_MODE) return 'dev-token'
    try {
      const result = await instance.acquireTokenSilent({
        ...loginRequest,
        account: accounts[0],
      })
      return result.accessToken
    } catch {
      const result = await instance.acquireTokenPopup(loginRequest)
      return result.accessToken
    }
  }, [instance, accounts])

  return {
    login,
    logout,
    getToken,
    isAuthenticated,
    isDevMode: IS_DEV_MODE,
    userName: useUserStore.getState().name,
  }
}
