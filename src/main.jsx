import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MsalProvider } from '@azure/msal-react'
import { msalInstance } from './config/msalInstance'
import './index.css'
import App from './App.jsx'

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
