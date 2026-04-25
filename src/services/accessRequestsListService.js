// ── Lectura/escritura de la lista SolicitudesAccesoMRC ───────────────────
//
// Esta lista en SharePoint guarda las solicitudes de acceso que envía el
// flow de Power Automate cuando un usuario ve un 403 en la app.
//
// Columnas (según vista del sitio):
//   Title (estándar SP, no usado)
//   RequesterEmail   — single line text
//   RequesterName    — single line text
//   RequesterRole    — single line text  (admin | user)
//   Reason           — single line text
//   DeviceInfo       — multi-line text
//   Status           — choice: Pendiente | Procesada | Rechazada
//   ProcessedBy      — single line text
//   ProcessedAt      — date/time
//
// Endpoint: /sites/{siteId}/lists/SolicitudesAccesoMRC/items?$expand=fields
//
// Requiere Sites.ReadWrite.All (ya en loginRequest).

import { getGraphToken } from '../config/msalInstance'

const IS_DEV_MODE =
  !import.meta.env.VITE_AZURE_CLIENT_ID ||
  import.meta.env.VITE_AZURE_CLIENT_ID === 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'

const LIST_NAME = 'SolicitudesAccesoMRC'

function getSiteEndpoint() {
  const raw = import.meta.env.VITE_SHAREPOINT_SITE_URL
  if (!raw) throw new Error('VITE_SHAREPOINT_SITE_URL no configurado')
  const url  = new URL(raw)
  const path = url.pathname.replace(/\/$/, '')
  return `https://graph.microsoft.com/v1.0/sites/${url.hostname}:${path}:`
}

// Devuelve [] sin error si la lista no existe aún (404).
// Lanza error clasificado en 401/403/5xx.
export async function getPendingAccessRequests({ includeProcessed = false } = {}) {
  if (IS_DEV_MODE) {
    return [
      {
        id: 'mock-1',
        requesterEmail: 'demo.user@agrosuper.com',
        requesterName:  'Usuario Demo',
        requesterRole:  'user',
        reason:         'Necesito enviar pautas para mi sucursal',
        deviceInfo:     'Mozilla/5.0 (mock)',
        status:         'Pendiente',
        createdAt:      new Date().toISOString(),
      },
    ]
  }

  const token    = await getGraphToken()
  const siteUrl  = getSiteEndpoint()
  const url      = `${siteUrl}/lists/${LIST_NAME}/items?$expand=fields&$top=200&$orderby=lastModifiedDateTime desc`

  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (res.status === 404) return []
  if (res.status === 401 || res.status === 403) {
    throw new Error(`Sin permiso para leer SolicitudesAccesoMRC (${res.status}).`)
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Error ${res.status} al leer solicitudes: ${body.slice(0, 120)}`)
  }
  const data = await res.json()
  const items = Array.isArray(data?.value) ? data.value : []

  const mapped = items.map(item => ({
    id:             item.id,
    requesterEmail: item.fields?.RequesterEmail || '',
    requesterName:  item.fields?.RequesterName  || '',
    requesterRole:  item.fields?.RequesterRole  || 'user',
    reason:         item.fields?.Reason         || '',
    deviceInfo:     item.fields?.DeviceInfo     || '',
    status:         item.fields?.Status         || 'Pendiente',
    processedBy:    item.fields?.ProcessedBy    || '',
    processedAt:    item.fields?.ProcessedAt    || null,
    createdAt:      item.createdDateTime        || item.fields?.Created || null,
  }))

  return includeProcessed
    ? mapped
    : mapped.filter(r => (r.status || 'Pendiente') === 'Pendiente')
}

// Marca una solicitud como procesada/rechazada con la identidad del admin.
export async function markAccessRequestProcessed(itemId, { status = 'Procesada', processedBy = '' } = {}) {
  if (IS_DEV_MODE) return { success: true, dev: true }

  const token   = await getGraphToken()
  const siteUrl = getSiteEndpoint()
  const url     = `${siteUrl}/lists/${LIST_NAME}/items/${itemId}/fields`

  const res = await fetch(url, {
    method:  'PATCH',
    headers: {
      Authorization:  `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      Status:      status,
      ProcessedBy: processedBy,
      ProcessedAt: new Date().toISOString(),
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Error ${res.status} al actualizar solicitud: ${body.slice(0, 120)}`)
  }
  return { success: true }
}
