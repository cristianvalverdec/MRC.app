// ── Servicio de sincronización SharePoint ────────────────────────────────
//
// Flujo:
//   Admin edita/crea formulario → saveFormEdits/updateCustomForm en store
//   → store llama syncFormsToSharePoint(data)
//   → se escribe mrc-forms-config.json en SharePoint
//
//   Al iniciar la app → pullFromCloud() en store
//   → loadFormsFromSharePoint() lee ese JSON
//   → todos los teléfonos reciben la versión más reciente
//
// Variables de entorno requeridas (producción):
//   VITE_AZURE_CLIENT_ID    — App Registration Client ID
//   VITE_AZURE_TENANT_ID    — Azure Tenant ID
//   VITE_SHAREPOINT_SITE_ID — ID del sitio SharePoint
//                            (GET https://graph.microsoft.com/v1.0/sites/{host}:/sites/{name})

import { msalInstance } from '../config/msalInstance'
import { graphScopes } from '../config/msalConfig'

// En modo dev (sin credenciales reales) se simula el sync localmente
const IS_DEV_MODE =
  !import.meta.env.VITE_AZURE_CLIENT_ID ||
  import.meta.env.VITE_AZURE_CLIENT_ID === 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'

// Ruta del archivo de configuración en SharePoint
const CONFIG_FILE_PATH = '/mrc-app/forms-config.json'

// ── Obtener token Graph silenciosamente ──────────────────────────────────
async function getGraphToken() {
  const accounts = msalInstance.getAllAccounts()
  if (!accounts.length) throw new Error('Sin cuenta autenticada')
  const result = await msalInstance.acquireTokenSilent({
    ...graphScopes,
    account: accounts[0],
  })
  return result.accessToken
}

// ── Construir URL del archivo en OneDrive/SharePoint ─────────────────────
function getFileUrl() {
  const siteId = import.meta.env.VITE_SHAREPOINT_SITE_ID
  if (!siteId) throw new Error('VITE_SHAREPOINT_SITE_ID no configurado')
  return `https://graph.microsoft.com/v1.0/sites/${siteId}/drive/root:${CONFIG_FILE_PATH}:/content`
}

// ── Subir configuración de formularios a SharePoint ──────────────────────
export async function syncFormsToSharePoint(data) {
  if (IS_DEV_MODE) {
    console.info('[MRC Sync] Modo dev — configuración guardada localmente')
    return { success: true, dev: true }
  }

  try {
    const token = await getGraphToken()
    const response = await fetch(getFileUrl(), {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      throw new Error(`SharePoint respondió ${response.status}`)
    }
    console.info('[MRC Sync] Formularios sincronizados con SharePoint ✓')
    return { success: true }
  } catch (err) {
    console.warn('[MRC Sync] Error al sincronizar:', err.message)
    throw err
  }
}

// ── Descargar configuración de formularios desde SharePoint ──────────────
export async function loadFormsFromSharePoint() {
  if (IS_DEV_MODE) {
    console.info('[MRC Sync] Modo dev — usando configuración local')
    return null
  }

  try {
    const token = await getGraphToken()
    const response = await fetch(getFileUrl(), {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (response.status === 404) {
      console.info('[MRC Sync] forms-config.json no existe aún en SharePoint')
      return null
    }
    if (!response.ok) {
      throw new Error(`SharePoint respondió ${response.status}`)
    }
    const data = await response.json()
    console.info('[MRC Sync] Configuración de formularios cargada desde SharePoint ✓')
    return data
  } catch (err) {
    console.warn('[MRC Sync] Error al cargar desde SharePoint:', err.message)
    return null // Falla silenciosamente — se usa lo que hay en localStorage
  }
}
