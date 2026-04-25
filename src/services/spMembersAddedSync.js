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
// Formato:
//   {
//     added:  ["email1@...", "email2@..."],   // marcados como ya agregados al grupo
//     manual: [{ email, name?, addedBy, addedAt }],  // emails extra que no
//             vienen de la lista de Líderes pero el admin quiere incluirlos
//             en el set "MRC Members" (ej. invitados externos, áreas extra)
//     updatedAt: "2026-04-25T..."
//   }

import { getGraphToken } from '../config/msalInstance'

const IS_DEV_MODE =
  !import.meta.env.VITE_AZURE_CLIENT_ID ||
  import.meta.env.VITE_AZURE_CLIENT_ID === 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'

const FILENAME = 'mrc-sp-members-added.json'

let _cachedSiteId = null

async function resolveSiteId(token) {
  if (_cachedSiteId) return _cachedSiteId
  const siteUrl = import.meta.env.VITE_SHAREPOINT_SITE_URL
  if (!siteUrl) throw new Error('VITE_SHAREPOINT_SITE_URL no configurado')
  const url = new URL(siteUrl)
  const endpoint = `https://graph.microsoft.com/v1.0/sites/${url.hostname}:${url.pathname}`
  const res = await fetch(endpoint, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`No se pudo resolver el sitio SharePoint (${res.status}): ${body.slice(0, 120)}`)
  }
  const data = await res.json()
  _cachedSiteId = data.id
  return _cachedSiteId
}

function buildFileUrl(siteId) {
  return `https://graph.microsoft.com/v1.0/sites/${siteId}/drive/root:/${FILENAME}:/content`
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
  if (!data || !Array.isArray(data.added)) return null
  // Compatibilidad hacia atrás: archivos pre-1.9.8 no tienen `manual`.
  if (!Array.isArray(data.manual)) data.manual = []
  return data
}

// Guarda el set completo en SharePoint. Reintentos para 5xx/red, 4xx falla rápido.
// `addedArray`  — emails marcados como ya agregados al grupo.
// `manualArray` — emails extra que el admin agregó manualmente (objetos
//                 { email, name?, addedBy, addedAt }). Default: [].
export async function saveAddedEmails(addedArray, manualArray = []) {
  if (IS_DEV_MODE) return { success: true, dev: true }

  const token  = await getGraphToken()
  const siteId = await resolveSiteId(token)
  const url    = buildFileUrl(siteId)
  const body   = JSON.stringify({
    added:  [...new Set((addedArray || []).filter(Boolean).map(e => e.toLowerCase()))],
    manual: (manualArray || []).filter(m => m?.email).map(m => ({
      email:   m.email.toLowerCase(),
      name:    m.name    || '',
      addedBy: m.addedBy || '',
      addedAt: m.addedAt || new Date().toISOString(),
    })),
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
