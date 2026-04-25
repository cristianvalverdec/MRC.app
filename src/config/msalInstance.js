// ── Singleton de MSAL v5 ──────────────────────────────────────────────────
// MSAL v3+ requiere llamar a initialize() antes de usar la instancia.
// La inicialización ocurre en main.jsx (async) antes de montar la app.

import { PublicClientApplication } from '@azure/msal-browser'
import { msalConfig, loginRequest } from './msalConfig'
import useAuthHealthStore from '../store/authHealthStore'

// Instancia creada sincrónicamente; se inicializa con .initialize() en main.jsx
export const msalInstance = new PublicClientApplication(msalConfig)

// Objeto mutable para acceso desde sharepointData.js / graphService.js
// después de que initialize() haya completado
export const msal = { instance: msalInstance }

// ── Token centralizado para Graph API ─────────────────────────────────────
// Todos los servicios DEBEN usar esta función en vez de crear la suya.
// Usa loginRequest (mismos scopes que el login original) para que MSAL
// reutilice el token cacheado o lo renueve vía refresh token HTTP POST.
// NUNCA lanza auth interactiva (popup/redirect) — en PWA mobile eso
// abre el navegador, rompe la sesión y puede causar loops de re-login.
//
// `forceRefresh: true` invalida el token cacheado y obtiene uno nuevo del
// backend de Azure AD. Crítico cuando un usuario fue agregado al grupo
// MRC Members en SharePoint pero su token aún tiene los claims antiguos
// y recibe 403 al consultar el sitio.
export async function getGraphToken({ forceRefresh = false } = {}) {
  const accounts = msalInstance.getAllAccounts()
  if (!accounts.length) {
    throw new Error('[MRC] Sin cuenta activa. Cierra y abre la app.')
  }
  try {
    const result = await msalInstance.acquireTokenSilent({
      ...loginRequest,
      account: accounts[0],
      forceRefresh,
    })
    useAuthHealthStore.getState().setTokenOk()
    return result.accessToken
  } catch (err) {
    const code = err?.errorCode || ''
    let message
    // timed_out: iframe bloqueado (PWA mobile) o múltiples pestañas
    if (code === 'timed_out' || err?.message?.includes('timed_out')) {
      console.warn('[MRC Auth] acquireTokenSilent timed_out — iframe bloqueado')
      message = 'No se pudo renovar la sesión. Cierra otras ventanas de MRC y recarga.'
    } else if (code === 'interaction_required' || err?.name === 'InteractionRequiredAuthError') {
      // interaction_required: refresh token expirado, necesita re-login
      console.warn('[MRC Auth] Token expirado, requiere re-login')
      message = 'Sesión expirada. Cierra la app y ábrela nuevamente para iniciar sesión.'
    } else {
      console.warn('[MRC Auth] acquireTokenSilent error:', code || err?.message)
      message = `Error de autenticación: ${code || err?.message || err}`
    }
    useAuthHealthStore.getState().setTokenError(message)
    throw new Error(message)
  }
}

// Atajo para forzar refresh del token. Útil cuando el usuario fue agregado
// al grupo MRC Members y necesita un token con los claims actualizados.
export async function forceRefreshGraphToken() {
  return getGraphToken({ forceRefresh: true })
}
