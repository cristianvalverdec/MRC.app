// ── Sync del set de "emails agregados" en SharePoint ─────────────────────
//
// La pantalla "Permisos SharePoint" permite a los admins marcar qué líderes
// ya fueron agregados al grupo "MRC Members". Antes este estado vivía solo
// en localStorage por dispositivo: el admin marcaba 118 emails desde su PC
// y al abrir la app en el celular los veía a TODOS pendientes.
//
// Aquí guardamos el set en un archivo JSON compartido en la biblioteca
// Documents del sitio SSOASCOMERCIAL (mismo patrón que mrc-forms-config.json).
//
// Formato (v1.9.9):
//   {
//     added:  ["email1@...", "email2@..."],   // marcados como ya agregados al grupo
//     manual: [{ email, name?, addedBy, addedAt }],  // emails extra
//     audit:  [{ ts, by, action, email, meta? }],    // últimas 200 acciones (FIFO)
//     version: 4,                                    // optimistic concurrency
//     updatedAt: "2026-04-25T..."
//   }
//
// `audit.action` puede ser: 'toggle_added', 'toggle_pending', 'manual_add',
// 'manual_remove', 'verify_run', 'request_processed', 'orphan_accept'.

import { getGraphToken } from '../config/msalInstance'
import { resolveSiteId, buildDriveFileUrl } from './sharepointSiteResolver'

const IS_DEV_MODE =
  !import.meta.env.VITE_AZURE_CLIENT_ID ||
  import.meta.env.VITE_AZURE_CLIENT_ID === 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'

const FILENAME = 'mrc-sp-members-added.json'

function buildFileUrl(siteId) {
  return buildDriveFileUrl(siteId, FILENAME)
}

// Lee el set actual desde SharePoint. 404 → primera vez, devuelve null sin error.
export async function loadAddedEmails() {
  if (IS_DEV_MODE) return null
  const token  = await getGraphToken()
  const siteId = await resolveSiteId(token)
  const url    = buildFileUrl(siteId)

  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })

  if (res.status === 404) return null
  if (res.status === 401 || res.status === 403) {
    throw new Error(`Sin permiso para leer el listado de agregados (${res.status}). Pide acceso al admin del sitio.`)
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Error ${res.status} al leer agregados: ${body.slice(0, 120)}`)
  }

  const data = await res.json()
  if (!data || typeof data !== 'object') return null
  // Defensa estricta: si `added` o `manual` vienen como null/undefined/objeto
  // los normalizamos a array vacío. Esto evita el bug "e is not iterable"
  // (spread sobre null) en consumidores aguas abajo.
  if (!Array.isArray(data.added))  data.added  = []
  if (!Array.isArray(data.manual)) data.manual = []
  if (!Array.isArray(data.audit))  data.audit  = []
  if (typeof data.version !== 'number') data.version = 0
  // Filtrar entradas inválidas
  data.added  = data.added.filter(e => typeof e === 'string' && e.includes('@'))
  data.manual = data.manual.filter(m => m && typeof m.email === 'string')
  data.audit  = data.audit.filter(a => a && a.ts && a.action)
  return data
}

// Constante exportada — el max de entradas en el audit log (FIFO).
export const AUDIT_MAX_ENTRIES = 200

// Guarda el set completo en SharePoint. Reintentos para 5xx/red, 4xx falla rápido.
// Acepta firma legacy `saveAddedEmails(addedArray, manualArray)` Y firma nueva
// `saveAddedEmails({ added, manual, audit, version })`. Detecta cuál se usa.
export async function saveAddedEmails(addedArrayOrPayload, manualArray = []) {
  if (IS_DEV_MODE) return { success: true, dev: true }

  // ── Detección de firma legacy vs nueva ──
  let payload
  if (addedArrayOrPayload && typeof addedArrayOrPayload === 'object' && !Array.isArray(addedArrayOrPayload) && !(addedArrayOrPayload instanceof Set)) {
    // Firma nueva: objeto completo
    payload = addedArrayOrPayload
  } else {
    // Firma legacy
    payload = { added: addedArrayOrPayload, manual: manualArray, audit: [], version: 0 }
  }

  // Validación defensiva — la API debe ser idempotente ante callers que
  // pasen accidentalmente un Set, undefined, o un valor no-iterable.
  const rawAdded  = payload.added
  const rawManual = payload.manual
  const rawAudit  = payload.audit
  const safeAdded  = Array.isArray(rawAdded)  ? rawAdded  : (rawAdded  ? [...rawAdded]  : [])
  const safeManual = Array.isArray(rawManual) ? rawManual : (rawManual ? [...rawManual] : [])
  const safeAudit  = Array.isArray(rawAudit)  ? rawAudit  : []

  const token  = await getGraphToken()
  const siteId = await resolveSiteId(token)
  const url    = buildFileUrl(siteId)
  const body   = JSON.stringify({
    added:  [...new Set(safeAdded.filter(e => typeof e === 'string' && e.includes('@')).map(e => e.toLowerCase()))],
    manual: safeManual.filter(m => m?.email && typeof m.email === 'string').map(m => ({
      email:   m.email.toLowerCase(),
      name:    m.name    || '',
      addedBy: m.addedBy || '',
      addedAt: m.addedAt || new Date().toISOString(),
    })),
    audit:   safeAudit.filter(a => a && a.ts && a.action).slice(-AUDIT_MAX_ENTRIES),
    version: typeof payload.version === 'number' ? payload.version + 1 : 1,
    updatedAt: new Date().toISOString(),
  })

  const backoffs = [0, 1000, 3000]
  let lastError = null
  for (let attempt = 0; attempt < backoffs.length; attempt++) {
    if (backoffs[attempt] > 0) await new Promise(r => setTimeout(r, backoffs[attempt]))
    try {
      const res = await fetch(url, {
        method:  'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body,
      })
      if (res.ok) return { success: true }
      const text = await res.text().catch(() => '')
      lastError = new Error(`Error ${res.status} al guardar agregados — ${text.slice(0, 150)}`)
      if (res.status >= 400 && res.status < 500 && res.status !== 429) throw lastError
    } catch (err) {
      lastError = err
      if (err.message?.match(/Error 4\d\d/)) throw err
    }
  }
  throw lastError || new Error('Sync agregados falló tras 3 intentos')
}
