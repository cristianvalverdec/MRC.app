// Gestión de URLs configurables desde la app (sin redeploy).
// Patrón idéntico a los overrides de listas en sharepointData.js.
// Clave localStorage: 'mrc-url-links'

const STORAGE_KEY = 'mrc-url-links'

// Catálogo de enlaces configurables — fuente de verdad del módulo.
// Para agregar un nuevo enlace: añadir entrada aquí. Aparecerá automáticamente
// en Conexiones SharePoint y podrá consumirse con getLink('nuevo-id').
export const URL_LINK_CATALOG = [
  {
    id: 'semana-op',
    label: 'Charla Semana — Operaciones',
    description: 'Enlace semanal de material para área Operaciones',
    category: 'Difusiones SSO',
    envFallback: 'VITE_SP_SEMANA_OP',
  },
  {
    id: 'semana-adm',
    label: 'Charla Semana — Administración',
    description: 'Enlace semanal de material para área Administración',
    category: 'Difusiones SSO',
    envFallback: 'VITE_SP_SEMANA_ADM',
  },
  {
    id: 'semana-dist',
    label: 'Charla Semana — Distribuidoras',
    description: 'Enlace semanal de material para Distribuidoras',
    category: 'Difusiones SSO',
    envFallback: 'VITE_SP_SEMANA_DIST',
  },
  {
    id: 'biblioteca-anual',
    label: 'Biblioteca Anual',
    description: 'Carpeta SharePoint con archivo histórico del año en curso',
    category: 'Difusiones SSO',
    envFallback: 'VITE_SP_BIBLIOTECA_URL',
  },
  {
    id: 'power-automate-access-request',
    label: 'Webhook Solicitud de Acceso',
    description: 'URL HTTP del flow en Power Automate que recibe solicitudes de acceso al sitio SharePoint. Solo visible para admins.',
    category: 'Sistema',
    envFallback: 'VITE_PA_ACCESS_REQUEST_URL',
    adminOnly: true,
  },
]

// Mapa de variables de entorno disponibles en tiempo de ejecución.
// Necesario porque import.meta.env no es iterable con nombres dinámicos.
const ENV_VALUES = {
  VITE_SP_SEMANA_OP:    import.meta.env.VITE_SP_SEMANA_OP,
  VITE_SP_SEMANA_ADM:   import.meta.env.VITE_SP_SEMANA_ADM,
  VITE_SP_SEMANA_DIST:  import.meta.env.VITE_SP_SEMANA_DIST,
  VITE_SP_BIBLIOTECA_URL: import.meta.env.VITE_SP_BIBLIOTECA_URL,
}

function readStore() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

// Leer URL: override local → env var de fallback → null
export function getLink(linkId) {
  try {
    const store = readStore()
    if (store[linkId]?.url) return store[linkId].url
    const entry = URL_LINK_CATALOG.find((e) => e.id === linkId)
    return entry ? (ENV_VALUES[entry.envFallback] || null) : null
  } catch {
    return null
  }
}

// Retorna el origen de una URL para un link: 'override' | 'env' | 'none'
export function getLinkSource(linkId) {
  try {
    const store = readStore()
    if (store[linkId]?.url) return 'override'
    const entry = URL_LINK_CATALOG.find((e) => e.id === linkId)
    if (entry && ENV_VALUES[entry.envFallback]) return 'env'
    return 'none'
  } catch {
    return 'none'
  }
}

export function saveLink(linkId, url) {
  try {
    const store = readStore()
    store[linkId] = { url: url.trim(), savedAt: new Date().toISOString() }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch (e) {
    console.warn('[MRC] Error guardando URL override:', e)
  }
}

export function clearLink(linkId) {
  try {
    const store = readStore()
    delete store[linkId]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    /* ignore */
  }
}

export function getAllLinks() {
  return readStore()
}
