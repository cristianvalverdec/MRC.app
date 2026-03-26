// ── Singleton de MSAL v5 ──────────────────────────────────────────────────
// MSAL v5 requiere inicialización asíncrona.
// La promesa se resuelve en main.jsx antes de montar la app.

import { PublicClientApplication } from '@azure/msal-browser'
import { msalConfig } from './msalConfig'

// Promesa que resuelve con la instancia inicializada
export const msalInstancePromise = PublicClientApplication.createPublicClientApplication(msalConfig)

// Objeto mutable para acceso sincrónico desde sharepointData.js
// Se rellena cuando msalInstancePromise resuelve (ver main.jsx)
export const msal = { instance: null }
