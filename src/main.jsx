import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MsalProvider } from '@azure/msal-react'
import { msalInstance } from './config/msalInstance'
import './index.css'
import App from './App.jsx'

// ── Limpieza de artefactos Azure en modo demo ──────────────────────────────
// Cuando la app pasa de producción (Azure AD) a modo demo, los dispositivos
// desactualizados conservan tokens MSAL y caches de Graph API en localStorage.
// Esta limpieza se ejecuta UNA vez (flag en localStorage) al detectar modo demo.
const IS_DEV_MODE =
  !import.meta.env.VITE_AZURE_CLIENT_ID ||
  import.meta.env.VITE_AZURE_CLIENT_ID === 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'

if (IS_DEV_MODE && !localStorage.getItem('mrc-azure-cleanup-done')) {
  const keysToRemove = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (
      key?.startsWith('msal.') ||
      key?.includes('.idtoken') ||
      key?.includes('.accesstoken') ||
      key?.includes('.refreshtoken') ||
      key?.includes('.account.keys') ||
      key?.includes('login.windows.net') ||
      key?.includes('microsoftonline')
    ) {
      keysToRemove.push(key)
    }
  }
  keysToRemove.forEach(k => localStorage.removeItem(k))
  if (keysToRemove.length > 0) {
    console.info(`[MRC] Limpieza Azure: eliminados ${keysToRemove.length} artefactos MSAL de localStorage`)
  }
  // Limpiar caches de Graph API del service worker
  if ('caches' in window) {
    caches.delete('graph-api-cache').catch(() => {})
  }
  // Resetear el store de usuario para que no quede una sesión Azure zombi
  const userStore = JSON.parse(localStorage.getItem('mrc-user-store') || '{}')
  if (userStore?.state?.email && userStore.state.email !== 'demo@agrosuper.cl') {
    userStore.state.isAuthenticated = false
    userStore.state.email = null
    userStore.state.name = null
    userStore.state.role = null
    localStorage.setItem('mrc-user-store', JSON.stringify(userStore))
  }
  localStorage.setItem('mrc-azure-cleanup-done', '1')
}

// Aplicar tema guardado antes de montar — evita flash de color incorrecto
const savedStore = JSON.parse(localStorage.getItem('mrc-user-store') || '{}')
const savedTheme = savedStore?.state?.theme || 'dark'
document.documentElement.setAttribute('data-theme', savedTheme)

// Sincronizar barra de URL y barra inferior Android con el tema guardado.
// Se actualiza el inline style del <html> — Chrome lo lee antes que el CSS.
const navColor = savedTheme === 'light' ? '#F0F3F9' : '#1B2A4A'
document.documentElement.style.backgroundColor = navColor
document.querySelector('meta[name="theme-color"]')?.setAttribute('content', navColor)

// MSAL v3+: initialize() debe completarse antes de montar la app
msalInstance.initialize().then(() => {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <MsalProvider instance={msalInstance}>
        <App />
      </MsalProvider>
    </StrictMode>,
  )
})
