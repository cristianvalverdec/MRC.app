// ── Cache compartida del último resultado de verificación SharePoint ─────
//
// Cuando un admin presiona "Verificar permisos en SharePoint", consultamos
// el grupo MRC Members vía SP REST. El resultado se cachea en un archivo
// JSON paralelo a `mrc-sp-members-added.json` para que cualquier admin que
// abra la app desde otro dispositivo vea el último estado verificado sin
// tener que re-consultar (y sin necesitar el scope SP REST, que solo se
// requiere para la verificación REAL).
//
// Formato: mrc-sp-members-verified.json
//   {
//     verifiedEmails: ["aabarca@agrosuper.com", ...],
//     verifiedAt:     "2026-04-25T18:40:00.000Z",
//     verifiedBy:     "cvalverde@agrosuper.com",
//     totalInGroup:   119
//   }

import { getGraphToken } from '../config/msalInstance'
import { resolveSiteId, buildDriveFileUrl } from './sharepointSiteResolver'

const IS_DEV_MODE =
  !import.meta.env.VITE_AZURE_CLIENT_ID ||
  import.meta.env.VITE_AZURE_CLIENT_ID === 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'

const FILENAME = 'mrc-sp-members-verified.json'

function buildFileUrl(siteId) {
  return buildDriveFileUrl(siteId, FILENAME)
}

export async function loadVerified() {
  if (IS_DEV_MODE) return null

  const token  = await getGraphToken()
  const siteId = await resolveSiteId(token)
  const url    = buildFileUrl(siteId)

  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (res.status === 404) return null
  if (res.status === 401 || res.status === 403) {
    throw new Error(`Sin permiso para leer cache de verificación (${res.status}).`)
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Error ${res.status} al leer cache verificación: ${body.slice(0, 120)}`)
  }

  const data = await res.json()
  if (!data || typeof data !== 'object') return null
  if (!Array.isArray(data.verifiedEmails)) data.verifiedEmails = []
  data.verifiedEmails = data.verifiedEmails.filter(e => typeof e === 'string' && e.includes('@'))
  return data
}

export async function saveVerified({ verifiedEmails, verifiedBy, totalInGroup }) {
  if (IS_DEV_MODE) return { success: true, dev: true }

  const token  = await getGraphToken()
  const siteId = await resolveSiteId(token)
  const url    = buildFileUrl(siteId)

  const safeEmails = Array.isArray(verifiedEmails) ? verifiedEmails : []
  const body = JSON.stringify({
    verifiedEmails: safeEmails.filter(e => typeof e === 'string' && e.includes('@')).map(e => e.toLowerCase()),
    verifiedAt:     new Date().toISOString(),
    verifiedBy:     verifiedBy || '',
    totalInGroup:   typeof totalInGroup === 'number' ? totalInGroup : safeEmails.length,
  })

  const backoffs = [0, 1000, 3000]
  let lastError = null
  for (let attempt = 0; attempt < backoffs.length; attempt++) {
    if (backoffs[attempt] > 0) await new Promise(r => setTimeout(r, backoffs[attempt]))
    try {
      const res = await fetch(url, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body,
      })
      if (res.ok) return { success: true }
      const text = await res.text().catch(() => '')
      lastError = new Error(`Error ${res.status} al guardar verificación — ${text.slice(0, 150)}`)
      if (res.status >= 400 && res.status < 500 && res.status !== 429) throw lastError
    } catch (err) {
      lastError = err
      if (err.message?.match(/Error 4\d\d/)) throw err
    }
  }
  throw lastError || new Error('Sync verificación falló tras 3 intentos')
}
