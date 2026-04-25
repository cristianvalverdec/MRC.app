// ── Servicio de solicitud de acceso al sitio SharePoint ──────────────────
//
// Envía una solicitud al flow de Power Automate (HTTP trigger) cuando un
// usuario recibe 403 al intentar acceder al sitio SSOASCOMERCIAL.
//
// El admin recibe un email y la solicitud queda registrada en la lista
// SharePoint "SolicitudesAccesoMRC" para su seguimiento.
//
// URL del webhook: configurable desde la UI admin vía urlLinksService
// (id: 'power-automate-access-request') — no requiere redeploy.
//
// Cooldown: 5 minutos por dispositivo (localStorage). Evita spam pero no
// bloquea retests reales — el caso de uso típico es: usuario solicita,
// admin lo agrega al grupo en SP, usuario reintenta. 5 min es suficiente
// para evitar dobles clicks sin frustrar pruebas reales.
//
// Antes era 24h pero resultaba excesivo en período de despliegue: si una
// solicitud salía mal (ej. sin email por bug v1.9.6) el dispositivo
// quedaba bloqueado todo un día.

import { getLink } from './urlLinksService'

const COOLDOWN_KEY = 'mrc-access-request-cooldown'
const COOLDOWN_MS  = 5 * 60 * 1000 // 5 minutos

// Devuelve true si el usuario ya envió una solicitud dentro del cooldown
export function isRequestOnCooldown() {
  try {
    const raw = localStorage.getItem(COOLDOWN_KEY)
    if (!raw) return false
    const { sentAt } = JSON.parse(raw)
    return Date.now() - new Date(sentAt).getTime() < COOLDOWN_MS
  } catch {
    return false
  }
}

// Devuelve el timestamp del último envío, o null
export function getLastRequestTime() {
  try {
    const raw = localStorage.getItem(COOLDOWN_KEY)
    if (!raw) return null
    return JSON.parse(raw).sentAt || null
  } catch {
    return null
  }
}

function setCooldown() {
  try {
    localStorage.setItem(COOLDOWN_KEY, JSON.stringify({ sentAt: new Date().toISOString() }))
  } catch { /* ignore */ }
}

// Limpia manualmente el cooldown — útil cuando una solicitud previa salió
// mal (ej. anonimizada por bug pre-1.9.7) y el usuario necesita reenviar
// sin esperar la ventana completa.
export function clearAccessRequestCooldown() {
  try { localStorage.removeItem(COOLDOWN_KEY) } catch { /* ignore */ }
}

// Envía la solicitud de acceso al webhook de Power Automate.
// userProfile: { name, email, role } — tomado del userStore.
// reason: string opcional ingresado por el usuario.
// Lanza error si el webhook no está configurado o falla.
export async function requestSiteAccess({ name, email, role, reason = '' }) {
  const webhookUrl = getLink('power-automate-access-request')

  if (!webhookUrl) {
    throw new Error('El webhook de solicitudes no está configurado aún. Contacta directamente a un admin MRC.')
  }

  const payload = {
    requesterEmail: email || 'sin-email@agrosuper.com',
    requesterName:  name  || 'Usuario sin nombre',
    requesterRole:  role  || 'Usuario',
    reason:         reason.trim() || 'Sin razón especificada',
    deviceInfo:     `${navigator.userAgent.substring(0, 120)}`,
    timestamp:      new Date().toISOString(),
  }

  const res = await fetch(webhookUrl, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  })

  if (!res.ok) {
    throw new Error(`El webhook respondió con error ${res.status}. Intenta más tarde.`)
  }

  // Guardar cooldown solo tras éxito
  setCooldown()

  return true
}
