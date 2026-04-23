// ── Servicio de sincronización SharePoint ────────────────────────────────
//
// Flujo:
//   Admin edita/crea formulario → saveFormEdits/updateCustomForm en store
//   → store llama syncFormsToSharePoint(data)
//   → se escribe mrc-forms-config.json en la biblioteca Documents del sitio
//
//   Al iniciar la app → pullFromCloud() en store
//   → loadFormsFromSharePoint() lee ese JSON
//   → todos los teléfonos reciben la versión más reciente
//
// Variables de entorno requeridas:
//   VITE_AZURE_CLIENT_ID       — App Registration Client ID
//   VITE_AZURE_TENANT_ID       — Azure Tenant ID
//   VITE_SHAREPOINT_SITE_URL   — URL del sitio (ej: https://agrosuper.sharepoint.com/sites/SSOASCOMERCIAL)

import { getGraphToken } from '../config/msalInstance'

const IS_DEV_MODE =
  !import.meta.env.VITE_AZURE_CLIENT_ID ||
  import.meta.env.VITE_AZURE_CLIENT_ID === 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'

// Nombre del archivo en la raíz de la biblioteca Documents del sitio
const CONFIG_FILENAME = 'mrc-forms-config.json'

// Cache del siteId para no resolverlo en cada llamada
let _cachedSiteId = null

// ── Resolver el siteId a partir de la URL del sitio ──────────────────────
// Llama a GET /sites/{hostname}:{/path} → devuelve el ID real del sitio.
// Este enfoque es el más robusto: evita problemas con formatos de URL compuestos.
async function resolveSiteId(token) {
  if (_cachedSiteId) return _cachedSiteId

  const siteUrl = import.meta.env.VITE_SHAREPOINT_SITE_URL
  if (!siteUrl) throw new Error('VITE_SHAREPOINT_SITE_URL no configurado')

  const url = new URL(siteUrl)
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
  console.info('[MRC Sync] Site ID resuelto:', _cachedSiteId)
  return _cachedSiteId
}

// ── URL del archivo usando el siteId resuelto ────────────────────────────
function buildFileUrl(siteId) {
  return `https://graph.microsoft.com/v1.0/sites/${siteId}/drive/root:/${CONFIG_FILENAME}:/content`
}

// ── Subir configuración de formularios a SharePoint ──────────────────────
// Con retry ligero: 1 intento + 2 reintentos con backoff 1s/3s.
// Solo reintenta errores transitorios (5xx, network). 4xx fallan al primer intento.
export async function syncFormsToSharePoint(data) {
  if (IS_DEV_MODE) {
    console.info('[MRC Sync] Modo dev — configuración guardada localmente')
    return { success: true, dev: true }
  }

  const token  = await getGraphToken()
  const siteId = await resolveSiteId(token)
  const url    = buildFileUrl(siteId)
  const body   = JSON.stringify(data)
  const backoffs = [0, 1000, 3000]
  let lastError = null

  for (let attempt = 0; attempt < backoffs.length; attempt++) {
    if (backoffs[attempt] > 0) await new Promise((r) => setTimeout(r, backoffs[attempt]))
    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body,
      })
      if (response.ok) {
        console.info(`[MRC Sync] Formularios sincronizados con SharePoint ✓ (intento ${attempt + 1})`)
        return { success: true }
      }
      const text = await response.text().catch(() => '')
      const detail = text.slice(0, 150)
      lastError = new Error(`Error ${response.status} al guardar en SharePoint — ${detail}`)
      // 4xx (excepto 429) no se reintentan: son errores de cliente/auth
      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        console.warn('[MRC Sync] Error no reintentable:', response.status, detail)
        throw lastError
      }
      console.warn(`[MRC Sync] Intento ${attempt + 1} falló (${response.status}), reintentando...`)
    } catch (err) {
      lastError = err
      // Si es network error (fetch rejected), reintenta; si es nuestro throw ya formateado, no
      if (err.message?.startsWith('Error ') && err.message.match(/Error 4\d\d/)) throw err
      console.warn(`[MRC Sync] Intento ${attempt + 1} network error:`, err.message)
    }
  }
  throw lastError || new Error('Sync a SharePoint falló tras 3 intentos')
}

// ── Descargar configuración de formularios desde SharePoint ──────────────
export async function loadFormsFromSharePoint() {
  if (IS_DEV_MODE) {
    console.info('[MRC Sync] Modo dev — usando configuración local')
    return null
  }

  try {
    const token  = await getGraphToken()
    const siteId = await resolveSiteId(token)
    const url    = buildFileUrl(siteId)

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (response.status === 404) {
      console.info('[MRC Sync] mrc-forms-config.json no existe aún en SharePoint — primera vez')
      return null
    }

    if (!response.ok) {
      const body = await response.text().catch(() => '')
      throw new Error(`Error ${response.status} al leer desde SharePoint: ${body.slice(0, 120)}`)
    }

    const data = await response.json()
    console.info('[MRC Sync] Configuración cargada desde SharePoint ✓')
    return data
  } catch (err) {
    // Falla silenciosamente en la descarga — se usa localStorage como fallback
    console.warn('[MRC Sync] Error al cargar:', err.message)
    return null
  }
}
