import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MsalProvider } from '@azure/msal-react'
import { msalInstancePromise, msal } from './config/msalInstance'
import './index.css'
import App from './App.jsx'

// MSAL v5: inicializar de forma asíncrona antes de montar la app
msalInstancePromise.then((instance) => {
  msal.instance = instance   // disponible para sharepointData.js

  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <MsalProvider instance={instance}>
        <App />
      </MsalProvider>
    </StrictMode>,
  )
})
