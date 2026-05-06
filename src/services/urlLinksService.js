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
  VITE_PA_ACCESS_REQUEST_URL: import.meta.env.VITE_PA_ACCESS_REQUEST_URL,
}

function readStore() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

// Devuelve la clave de semana ISO para una fecha dada: "YYYY-WNN"
// Usa lunes como inicio de semana (ISO 8601 compatible).
export function getWeekKey(date = new Date()) {
  const d = new Date(date)
  const day = d.getDay() || 7           // 1=lunes … 7=domingo
  const monday = new Date(d)
  monday.setDate(d.getDate() - day + 1)
  const year = monday.getFullYear()
  const start = new Date(year, 0, 1)
  const week = Math.ceil(((monday - start) / 86400000 + start.getDay() + 1) / 7)
  return `${year}-W${String(week).padStart(2, '0')}`
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

// Devuelve la URL de un linkId para un desplazamiento semanal dado.
// weekOffset=0 → semana actual, weekOffset=-1 → semana pasada, etc.
export function getLinkForWeekOffset(linkId, weekOffset) {
  if (weekOffset === 0) return getLink(linkId)
  const store = readStore()
  const target = new Date()
  target.setDate(target.getDate() + weekOffset * 7)
  const archiveKey = `${linkId}-${getWeekKey(target)}`
  return store[archiveKey]?.url || null
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

// Guarda una URL para un linkId.
// Antes de sobreescribir archiva el valor anterior bajo su clave de semana
// para que la navegación histórica en Difusiones SSO encuentre el material previo.
export function saveLink(linkId, url) {
  try {
    const store = readStore()
    const existing = store[linkId]
    if (existing?.url) {
      // Archivar el valor anterior bajo la semana en que fue guardado
      const savedAt = existing.savedAt ? new Date(existing.savedAt) : new Date()
      const archiveKey = `${linkId}-${getWeekKey(savedAt)}`
      // Solo archivar si no existe ya una entrada para esa semana (primera escritura gana)
      if (!store[archiveKey]) {
        store[archiveKey] = existing
      }
    }
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

// Restaura el mapa completo de URLs desde un payload cloud (mrc-forms-config.json).
// Hace merge con los valores locales: cloud gana para la misma clave.
// Llamado por formEditorStore.pullFromCloud cuando cloudIsNewer.
export function restoreLinks(linksMap) {
  try {
    if (!linksMap || typeof linksMap !== 'object') return
    const store = readStore()
    Object.entries(linksMap).forEach(([k, v]) => {
      store[k] = v
    })
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
    console.info('[MRC] URL links restaurados desde cloud ✓')
  } catch (e) {
    console.warn('[MRC] Error restaurando URL links desde cloud:', e)
  }
}
