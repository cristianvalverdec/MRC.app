// ── Singleton de MSAL ─────────────────────────────────────────────────────
// Exportar una instancia única para evitar conflictos entre MsalProvider
// y el servicio de sync de SharePoint (ambos necesitan el mismo objeto).

import { PublicClientApplication } from '@azure/msal-browser'
import { msalConfig } from './msalConfig'

export const msalInstance = new PublicClientApplication(msalConfig)
