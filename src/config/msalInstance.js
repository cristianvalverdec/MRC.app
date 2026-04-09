// ── Singleton de MSAL v5 ──────────────────────────────────────────────────
// MSAL v3+ requiere llamar a initialize() antes de usar la instancia.
// La inicialización ocurre en main.jsx (async) antes de montar la app.

import { PublicClientApplication } from '@azure/msal-browser'
import { msalConfig } from './msalConfig'

// Instancia creada sincrónicamente; se inicializa con .initialize() en main.jsx
export const msalInstance = new PublicClientApplication(msalConfig)

// Objeto mutable para acceso desde sharepointData.js / graphService.js
// después de que initialize() haya completado
export const msal = { instance: msalInstance }
