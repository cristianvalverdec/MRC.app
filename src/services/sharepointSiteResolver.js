// ── Resolver centralizado del siteId del sitio SharePoint ────────────────
//
// Antes había dos implementaciones idénticas de `resolveSiteId` en
// `sharepointSync.js` y `spMembersAddedSync.js`. Centralizamos aquí para
// que cualquier servicio que necesite el siteId reuse la misma caché y
// el mismo manejo de errores.
//
// Uso:
//   import { resolveSiteId, getSiteEndpoint } from './sharepointSiteResolver'
//   const siteId = await resolveSiteId(token)
//   const url    = `https://graph.microsoft.com/v1.0/sites/${siteId}/drive/...`

let _cachedSiteId = null

export function getSiteEnvUrl() {
  const raw = import.meta.env.VITE_SHAREPOINT_SITE_URL
  if (!raw) throw new Error('VITE_SHAREPOINT_SITE_URL no configurado')
  return raw
}

// Resuelve el siteId vía Graph API. La caché es de proceso (módulo),
// no se persiste — un reload limpio fuerza re-resolución.
export async function resolveSiteId(token) {
  if (_cachedSiteId) return _cachedSiteId
  const raw = getSiteEnvUrl()
  const url = new URL(raw)
  const endpoint = `https://graph.microsoft.com/v1.0/sites/${url.hostname}:${url.pathname}`

  const response = await fetch(endpoint, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`No se pudo resolver el sitio SharePoint (${response.status}): ${body.slice(0, 120)}`)
  }
  const data = await response.json()
  _cachedSiteId = data.id
  return _cachedSiteId
}

// Endpoint base estilo Graph para listas — `${base}/lists/{name}/items`.
// Es el formato que usan sharepointData.js y accessRequestsListService.js.
export function buildSiteEndpoint() {
  const raw  = getSiteEnvUrl()
  const url  = new URL(raw)
  const path = url.pathname.replace(/\/$/, '')
  return `https://graph.microsoft.com/v1.0/sites/${url.hostname}:${path}:`
}

// URL para subir/leer archivos al drive raíz del sitio.
export function buildDriveFileUrl(siteId, filename) {
  return `https://graph.microsoft.com/v1.0/sites/${siteId}/drive/root:/${filename}:/content`
}
