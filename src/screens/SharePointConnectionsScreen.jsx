import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Database, CheckCircle, XCircle, Loader, RefreshCw,
  Globe, HardDrive, Users, Settings, ChevronDown, ChevronUp,
  Link2, Pencil, Trash2, Save,
} from 'lucide-react'
import AppHeader from '../components/layout/AppHeader'
import { containerVariants, itemVariants } from '../components/ui/menuCardVariants'
import { msalInstance } from '../config/msalInstance'
import { graphScopes } from '../config/msalConfig'
import {
  saveConnectionOverride,
  clearConnectionOverride,
  getAllConnectionOverrides,
} from '../services/sharepointData'

// ── Registro estático de conexiones SharePoint ──────────────────────────────
const SITE_URL = import.meta.env.VITE_SHAREPOINT_SITE_URL || '(no configurado)'

const IS_DEV_MODE =
  !import.meta.env.VITE_AZURE_CLIENT_ID ||
  import.meta.env.VITE_AZURE_CLIENT_ID === 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'

const CONNECTIONS = [
  {
    category: 'Formularios',
    items: [
      {
        name: 'Reglas de Oro — Sucursales',
        listId: 'd123a245-0aeb-4f51-9b20-693639c963b6',
        type: 'guid',
        formId: 'pauta-verificacion-reglas-oro',
        formLabel: 'Pauta de Verificación',
        unit: 'Sucursales',
        service: 'sharepointData.js',
      },
      {
        name: 'Reglas de Oro — Ventas',
        listId: '5edaee5a-2ee5-4fb4-a5aa-18f8068a1b25',
        type: 'guid',
        formId: 'observacion-conductual',
        formLabel: 'Observación Conductual',
        unit: 'Fuerza de Ventas',
        service: 'sharepointData.js',
      },
      {
        name: 'Caminata de Seguridad',
        listId: '04730b19-b235-4eef-b487-0234326fd4ac',
        type: 'guid',
        formId: 'caminata-seguridad',
        formLabel: 'Caminata de Seguridad',
        unit: 'Sucursales',
        service: 'sharepointData.js',
      },
      {
        name: 'Inspección Simple',
        listId: 'de766ded-0d14-4e50-8254-710c533a2106',
        type: 'guid',
        formId: 'inspeccion-simple',
        formLabel: 'Inspección Simple',
        unit: 'Sucursales',
        service: 'sharepointData.js',
      },
      {
        name: 'Difusiones SSO MRC',
        listId: '2097a931-5615-472b-afc7-b2d2fc6fe805',
        type: 'guid',
        formId: 'difusiones-sso',
        formLabel: 'Difusiones SSO',
        unit: 'Ambas',
        service: 'sharepointData.js + difusionesService.js',
      },
      {
        name: 'Maestro de Cierre Condiciones',
        listId: '00b25970-34f1-4026-9cc8-0df3f59c3383',
        type: 'guid',
        formId: 'cierre-condiciones',
        formLabel: 'Cierre de Condiciones',
        unit: 'Sucursales',
        service: 'sharepointData.js',
      },
    ],
  },
  {
    category: 'Gestión de Líderes',
    items: [
      {
        name: 'Líderes MRC',
        listId: null,
        type: 'dynamic',
        formLabel: 'Asignación de líderes por instalación',
        unit: 'Ambas',
        service: 'lideresService.js',
      },
      {
        name: 'Historial Líderes MRC',
        listId: null,
        type: 'dynamic',
        formLabel: 'Log de cambios y trazabilidad',
        unit: 'Ambas',
        service: 'lideresService.js',
      },
    ],
  },
  {
    category: 'Sistema',
    items: [
      {
        name: 'Administradores MRC',
        listId: null,
        type: 'dynamic',
        formLabel: 'Control de acceso de administradores',
        unit: 'Global',
        service: 'adminService.js',
      },
    ],
  },
  {
    category: 'Archivos de Configuración',
    items: [
      {
        name: 'mrc-forms-config.json',
        listId: null,
        type: 'drive',
        formLabel: 'Configuración de formularios (overrides admin)',
        unit: 'Global',
        service: 'sharepointSync.js',
      },
    ],
  },
]

const ENV_VARS = [
  { key: 'VITE_SHAREPOINT_SITE_URL', label: 'URL del sitio SharePoint', value: import.meta.env.VITE_SHAREPOINT_SITE_URL },
  { key: 'VITE_AZURE_CLIENT_ID', label: 'App Registration ID', value: import.meta.env.VITE_AZURE_CLIENT_ID ? '••••' + (import.meta.env.VITE_AZURE_CLIENT_ID || '').slice(-4) : null },
  { key: 'VITE_AZURE_TENANT_ID', label: 'Tenant ID', value: import.meta.env.VITE_AZURE_TENANT_ID ? '••••' + (import.meta.env.VITE_AZURE_TENANT_ID || '').slice(-4) : null },
  { key: 'VITE_SP_DIFUSIONES_LIST_ID', label: 'ID lista Difusiones (env)', value: import.meta.env.VITE_SP_DIFUSIONES_LIST_ID },
  { key: 'VITE_SP_BIBLIOTECA_URL', label: 'Carpeta biblioteca anual', value: import.meta.env.VITE_SP_BIBLIOTECA_URL },
  { key: 'VITE_SP_SEMANA_OP', label: 'Carpeta semana — Operaciones', value: import.meta.env.VITE_SP_SEMANA_OP },
  { key: 'VITE_SP_SEMANA_ADM', label: 'Carpeta semana — Administración', value: import.meta.env.VITE_SP_SEMANA_ADM },
  { key: 'VITE_SP_SEMANA_DIST', label: 'Carpeta semana — Distribuidoras', value: import.meta.env.VITE_SP_SEMANA_DIST },
]

// ── Helpers Graph API ────────────────────────────────────────────────────────

async function getGraphToken() {
  const accounts = msalInstance.getAllAccounts()
  if (!accounts.length) throw new Error('Sin cuenta autenticada. Recarga la app.')
  try {
    const result = await msalInstance.acquireTokenSilent({ ...graphScopes, account: accounts[0] })
    return result.accessToken
  } catch (err) {
    // timed_out ocurre cuando hay múltiples ventanas compitiendo por el token
    // o cuando el iframe de MSAL no puede comunicarse (WebView restrictivo).
    // No relanzamos auth interactiva para no abrir más ventanas.
    const isTimeout = err?.errorCode === 'timed_out' || err?.message?.includes('timed_out')
    if (isTimeout) {
      throw new Error('No se pudo obtener el token (timed_out). Recarga la pantalla e intenta de nuevo.')
    }
    throw new Error(`Error al obtener token: ${err?.errorCode || err?.message || err}`)
  }
}

function getSiteBase() {
  const raw = import.meta.env.VITE_SHAREPOINT_SITE_URL
  if (!raw) return null
  const url = new URL(raw)
  const path = url.pathname.replace(/\/$/, '')
  return `https://graph.microsoft.com/v1.0/sites/${url.hostname}:${path}:`
}

// ── Test de conectividad ─────────────────────────────────────────────────────
// FIX: itemCount no es campo válido en $select de Graph API → se omite

async function testListByGuid(listId, token) {
  const siteBase = getSiteBase()
  if (!siteBase) return { ok: false, error: 'VITE_SHAREPOINT_SITE_URL no configurado' }
  const res = await fetch(`${siteBase}/lists/${listId}?$select=id,displayName`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    return { ok: false, error: `HTTP ${res.status}`, detail: txt }
  }
  const data = await res.json()
  return { ok: true, displayName: data.displayName }
}

async function testListByName(listName, token) {
  const siteBase = getSiteBase()
  if (!siteBase) return { ok: false, error: 'VITE_SHAREPOINT_SITE_URL no configurado' }
  const res = await fetch(
    `${siteBase}/lists?$filter=displayName eq '${encodeURIComponent(listName)}'&$select=id,displayName`,
    { headers: { Authorization: `Bearer ${token}` } },
  )
  if (!res.ok) return { ok: false, error: `HTTP ${res.status}` }
  const data = await res.json()
  if (!data.value || data.value.length === 0) {
    return { ok: false, error: 'Lista no encontrada (se creará al primer uso)' }
  }
  const list = data.value[0]
  return { ok: true, displayName: list.displayName, resolvedId: list.id }
}

async function testDriveFile(fileName, token) {
  const siteBase = getSiteBase()
  if (!siteBase) return { ok: false, error: 'VITE_SHAREPOINT_SITE_URL no configurado' }
  const res = await fetch(`${siteBase}/drive/root:/${fileName}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (res.status === 404) return { ok: false, error: 'Archivo no existe aún' }
  if (!res.ok) return { ok: false, error: `HTTP ${res.status}` }
  const data = await res.json()
  return { ok: true, size: data.size, lastModified: data.lastModifiedDateTime }
}

// ── Resolución de URL/nombre → GUID ─────────────────────────────────────────
// Acepta: GUID directo, URL de SharePoint (/Lists/NombreLista/...), nombre de lista
async function resolveToListId(input, token) {
  const trimmed = input.trim()
  const guidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

  // Caso 1: ya es un GUID
  if (guidRe.test(trimmed)) {
    const result = await testListByGuid(trimmed, token)
    if (!result.ok) throw new Error(result.error)
    return { listId: trimmed, displayName: result.displayName }
  }

  // Caso 2: es una URL de SharePoint
  let listName = trimmed
  try {
    const url = new URL(trimmed)
    // Intentar extraer nombre de /Lists/NombreLista/
    const matchLists = url.pathname.match(/\/[Ll]ists\/([^/]+)/i)
    if (matchLists) {
      listName = decodeURIComponent(matchLists[1])
    } else {
      // Intentar GUID en query param ?List={guid}
      const listParam = url.searchParams.get('List')
      if (listParam) {
        const cleanGuid = listParam.replace(/[{}]/g, '')
        if (guidRe.test(cleanGuid)) {
          const result = await testListByGuid(cleanGuid, token)
          if (!result.ok) throw new Error(result.error)
          return { listId: cleanGuid, displayName: result.displayName }
        }
      }
    }
  } catch (e) {
    if (e.message !== 'Failed to construct \'URL\': Invalid URL') throw e
    // No era URL válida, seguir con listName = trimmed
  }

  // Caso 3: nombre de lista
  const result = await testListByName(listName, token)
  if (!result.ok || !result.resolvedId) throw new Error(result.error || 'Lista no encontrada')
  return { listId: result.resolvedId, displayName: result.displayName }
}

// ── Estilos ──────────────────────────────────────────────────────────────────

const s = {
  page: { minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--color-navy)' },
  content: { flex: 1, padding: '20px 16px 32px' },
  siteUrl: {
    background: 'var(--color-navy-mid)', border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-card)', padding: '12px 16px', marginBottom: 16,
    display: 'flex', alignItems: 'center', gap: 10,
  },
  siteLabel: { fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 2 },
  siteUrlText: { fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-text-muted)', wordBreak: 'break-all' },
  testAllBtn: {
    background: 'rgba(47,128,237,0.15)', border: '1px solid rgba(47,128,237,0.3)',
    borderRadius: 8, padding: '10px 16px', display: 'flex', alignItems: 'center',
    justifyContent: 'center', gap: 8, cursor: 'pointer', width: '100%', marginBottom: 20,
    fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700,
    color: '#60A5FA', letterSpacing: '0.05em', textTransform: 'uppercase',
  },
  catHeader: { display: 'flex', alignItems: 'center', gap: 10, margin: '20px 0 10px', cursor: 'pointer' },
  catLine: { flex: 1, height: 1 },
  catLabel: { fontFamily: 'var(--font-body)', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' },
  card: { background: 'var(--color-navy-mid)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-card)', padding: '14px 16px', marginBottom: 8 },
  cardHeader: { display: 'flex', alignItems: 'flex-start', gap: 10 },
  iconBox: { width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cardTitle: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, letterSpacing: '0.04em', color: 'var(--color-text-primary)', lineHeight: 1.3 },
  cardSub: { fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 },
  tag: { display: 'inline-block', fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', padding: '2px 6px', borderRadius: 4, marginRight: 6, marginTop: 4 },
  detailRow: { display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontFamily: 'var(--font-body)', fontSize: 11 },
  detailLabel: { color: 'var(--color-text-muted)', minWidth: 60 },
  detailValue: { color: 'var(--color-text-primary)', wordBreak: 'break-all', fontSize: 10, fontFamily: 'monospace' },
  statusText: { fontFamily: 'var(--font-body)', fontSize: 11, marginTop: 8, padding: '6px 10px', borderRadius: 6 },
  summary: { display: 'flex', gap: 12, marginBottom: 16 },
  summaryCard: { flex: 1, background: 'var(--color-navy-mid)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-card)', padding: '12px', textAlign: 'center' },
  summaryNumber: { fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: 'var(--color-text-primary)' },
  summaryLabel: { fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--color-text-muted)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.06em' },
  envSection: { background: 'var(--color-navy-mid)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-card)', padding: '14px 16px', marginTop: 8 },
  envRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' },
  statusDot: (ok) => ({ width: 8, height: 8, borderRadius: '50%', background: ok ? '#27AE60' : '#E74C3C', flexShrink: 0 }),
  // Config panel
  cfgPanel: { marginTop: 10, padding: '12px 14px', background: 'rgba(47,128,237,0.06)', border: '1px solid rgba(47,128,237,0.18)', borderRadius: 8 },
  cfgLabel: { fontFamily: 'var(--font-body)', fontSize: 11, color: '#60A5FA', marginBottom: 6 },
  cfgInput: {
    width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(47,128,237,0.3)', borderRadius: 6, padding: '8px 10px',
    fontFamily: 'monospace', fontSize: 11, color: 'var(--color-text-primary)',
    outline: 'none',
  },
  cfgRow: { display: 'flex', gap: 8, marginTop: 8 },
  cfgBtn: (color) => ({
    flex: 1, padding: '7px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
    fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700,
    letterSpacing: '0.06em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
    background: color === 'primary' ? 'rgba(47,128,237,0.25)' : 'rgba(255,255,255,0.07)',
    color: color === 'primary' ? '#60A5FA' : 'var(--color-text-muted)',
  }),
}

// ── Componentes internos ─────────────────────────────────────────────────────

function StatusBadge({ status }) {
  if (!status) return null
  if (status.loading) return (
    <div style={{ ...s.statusText, background: 'rgba(47,128,237,0.1)', color: '#60A5FA', display: 'flex', alignItems: 'center', gap: 6 }}>
      <Loader size={12} style={{ animation: 'spin 1s linear infinite' }} /> Verificando...
    </div>
  )
  if (status.ok) return (
    <div style={{ ...s.statusText, background: 'rgba(39,174,96,0.1)', color: '#27AE60', display: 'flex', alignItems: 'center', gap: 6 }}>
      <CheckCircle size={12} />
      <span>
        Conectado{status.displayName ? ` — "${status.displayName}"` : ''}
        {status.size != null ? ` (${(status.size / 1024).toFixed(1)} KB)` : ''}
        {status.lastModified ? ` — ${new Date(status.lastModified).toLocaleDateString('es-CL')}` : ''}
      </span>
    </div>
  )
  return (
    <div style={{ ...s.statusText, background: 'rgba(231,76,60,0.1)', color: '#E74C3C', display: 'flex', alignItems: 'center', gap: 6 }}>
      <XCircle size={12} /> <span>{status.error || 'Error desconocido'}</span>
    </div>
  )
}

function ConfigPanel({ item, override, onSave, onClear }) {
  const [input, setInput] = useState('')
  const [resolving, setResolving] = useState(false)
  const [resolveError, setResolveError] = useState(null)

  const handleSave = async () => {
    if (!input.trim()) return
    setResolving(true)
    setResolveError(null)
    try {
      const token = await getGraphToken()
      const { listId, displayName } = await resolveToListId(input, token)
      onSave(item.formId, listId, displayName)
      setInput('')
    } catch (err) {
      setResolveError(err.message)
    } finally {
      setResolving(false)
    }
  }

  return (
    <div style={s.cfgPanel}>
      <div style={s.cfgLabel}>
        {override
          ? `Override activo: ${override.listId}`
          : 'Pega la URL de la lista SharePoint o su GUID'}
      </div>
      <input
        style={s.cfgInput}
        placeholder="https://agrosuper.sharepoint.com/.../Lists/NombreLista  ó  guid"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      {resolveError && (
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: '#E74C3C', marginTop: 4 }}>
          {resolveError}
        </div>
      )}
      <div style={s.cfgRow}>
        <button style={s.cfgBtn('primary')} onClick={handleSave} disabled={resolving || !input.trim()}>
          {resolving ? <Loader size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={12} />}
          {resolving ? 'Resolviendo...' : 'Guardar'}
        </button>
        {override && (
          <button style={s.cfgBtn('secondary')} onClick={() => onClear(item.formId)}>
            <Trash2 size={12} /> Quitar override
          </button>
        )}
      </div>
    </div>
  )
}

function ConnectionCard({ item, status, override, onSave, onClear }) {
  const [cfgOpen, setCfgOpen] = useState(false)
  const iconColor = item.type === 'guid' ? '#2F80ED' : item.type === 'dynamic' ? '#0891B2' : '#F57C20'
  const IconComponent = item.type === 'drive' ? HardDrive : item.type === 'dynamic' ? Users : Database

  const unitColors = {
    Sucursales: { bg: 'rgba(26,82,184,0.15)', color: '#5B9BF5', border: 'rgba(26,82,184,0.3)' },
    'Fuerza de Ventas': { bg: 'rgba(245,124,32,0.15)', color: '#F5A623', border: 'rgba(245,124,32,0.3)' },
    Ambas: { bg: 'rgba(39,174,96,0.12)', color: '#4ADE80', border: 'rgba(39,174,96,0.25)' },
    Global: { bg: 'rgba(123,63,228,0.12)', color: '#C084FC', border: 'rgba(123,63,228,0.25)' },
  }
  const unitStyle = unitColors[item.unit] || unitColors.Global
  const effectiveId = override ? override.listId : item.listId

  return (
    <motion.div variants={itemVariants} style={s.card}>
      <div style={s.cardHeader}>
        <div style={{ ...s.iconBox, background: `${iconColor}22` }}>
          <IconComponent size={18} color={iconColor} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={s.cardTitle}>{item.name}</span>
            {override && (
              <span style={{ ...s.tag, background: 'rgba(245,124,32,0.15)', color: '#F5A623', border: '1px solid rgba(245,124,32,0.3)', marginTop: 0 }}>
                OVERRIDE
              </span>
            )}
          </div>
          <div style={s.cardSub}>{item.formLabel}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
            <span style={{ ...s.tag, background: unitStyle.bg, color: unitStyle.color, border: `1px solid ${unitStyle.border}` }}>
              {item.unit}
            </span>
            <span style={{ ...s.tag, background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-muted)', border: '1px solid rgba(255,255,255,0.08)' }}>
              {item.service}
            </span>
            {item.type === 'dynamic' && (
              <span style={{ ...s.tag, background: 'rgba(8,145,178,0.12)', color: '#22D3EE', border: '1px solid rgba(8,145,178,0.25)' }}>
                Auto-creada
              </span>
            )}
          </div>
        </div>
        {/* Botón Configurar — solo para listas con formId */}
        {item.formId && (
          <button
            onClick={() => setCfgOpen((v) => !v)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: cfgOpen ? '#60A5FA' : 'var(--color-text-muted)', flexShrink: 0 }}
            title="Configurar conexión"
          >
            <Pencil size={14} />
          </button>
        )}
      </div>

      {effectiveId && (
        <div style={s.detailRow}>
          <span style={s.detailLabel}>GUID:</span>
          <span style={{ ...s.detailValue, color: override ? '#F5A623' : 'var(--color-text-primary)' }}>
            {effectiveId}
          </span>
        </div>
      )}
      {item.formId && (
        <div style={s.detailRow}>
          <span style={s.detailLabel}>Form ID:</span>
          <span style={s.detailValue}>{item.formId}</span>
        </div>
      )}

      <StatusBadge status={status} />

      <AnimatePresence>
        {cfgOpen && item.formId && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <ConfigPanel
              item={item}
              override={override}
              onSave={(formId, listId, displayName) => {
                onSave(formId, listId, displayName)
                setCfgOpen(false)
              }}
              onClear={(formId) => {
                onClear(formId)
                setCfgOpen(false)
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Pantalla principal ───────────────────────────────────────────────────────

export default function SharePointConnectionsScreen() {
  const [statuses, setStatuses] = useState({})
  const [testing, setTesting] = useState(false)
  const [overrides, setOverrides] = useState(() => {
    // Limpieza única: eliminar clave residual del hook defectuoso anterior
    localStorage.removeItem('mrc-sp-panel-open')
    return getAllConnectionOverrides()
  })
  const [expandedCategories, setExpandedCategories] = useState(() => {
    const init = {}
    CONNECTIONS.forEach((cat) => { init[cat.category] = true })
    init['Variables de Entorno'] = false
    return init
  })

  const toggleCategory = (cat) => setExpandedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }))

  const totalConnections = CONNECTIONS.reduce((sum, cat) => sum + cat.items.length, 0)
  const testedCount = Object.keys(statuses).length
  const okCount = Object.values(statuses).filter((s) => s.ok).length
  const failCount = Object.values(statuses).filter((s) => !s.loading && !s.ok).length

  const handleSaveOverride = useCallback((formId, listId) => {
    saveConnectionOverride(formId, listId)
    setOverrides(getAllConnectionOverrides())
  }, [])

  const handleClearOverride = useCallback((formId) => {
    clearConnectionOverride(formId)
    setOverrides(getAllConnectionOverrides())
  }, [])

  const testAll = useCallback(async () => {
    if (IS_DEV_MODE) {
      const simulated = {}
      CONNECTIONS.forEach((cat) => {
        cat.items.forEach((item) => {
          simulated[item.name] = { ok: false, error: 'Modo desarrollo — sin conexión real' }
        })
      })
      setStatuses(simulated)
      return
    }

    setTesting(true)
    const loading = {}
    CONNECTIONS.forEach((cat) => { cat.items.forEach((item) => { loading[item.name] = { loading: true } }) })
    setStatuses(loading)

    try {
      const token = await getGraphToken()
      const promises = CONNECTIONS.flatMap((cat) =>
        cat.items.map(async (item) => {
          try {
            let result
            // Si tiene override activo, verificar con ese GUID
            const activeId = overrides[item.formId]?.listId || item.listId
            if (item.type === 'guid' || (item.formId && activeId)) {
              result = await testListByGuid(activeId, token)
            } else if (item.type === 'dynamic') {
              result = await testListByName(item.name, token)
            } else if (item.type === 'drive') {
              result = await testDriveFile(item.name, token)
            } else {
              result = { ok: false, error: 'Tipo desconocido' }
            }
            return { name: item.name, result }
          } catch (err) {
            return { name: item.name, result: { ok: false, error: err.message } }
          }
        }),
      )
      const results = await Promise.all(promises)
      const final = {}
      results.forEach(({ name, result }) => { final[name] = result })
      setStatuses(final)
    } catch (err) {
      const errAll = {}
      CONNECTIONS.forEach((cat) => {
        cat.items.forEach((item) => { errAll[item.name] = { ok: false, error: err.message } })
      })
      setStatuses(errAll)
    } finally {
      setTesting(false)
    }
  }, [overrides])

  const categoryColors = {
    Formularios: { line: 'rgba(47,128,237,0.2)', text: 'rgba(96,165,250,0.7)' },
    'Gestión de Líderes': { line: 'rgba(8,145,178,0.2)', text: 'rgba(34,211,238,0.7)' },
    Sistema: { line: 'rgba(123,63,228,0.2)', text: 'rgba(192,132,252,0.7)' },
    'Archivos de Configuración': { line: 'rgba(245,124,32,0.2)', text: 'rgba(245,166,35,0.7)' },
  }

  return (
    <div style={s.page}>
      <AppHeader title="Conexiones SharePoint" />
      <div style={s.content}>

        {/* Resumen */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={s.summary}>
          <div style={s.summaryCard}>
            <div style={s.summaryNumber}>{totalConnections}</div>
            <div style={s.summaryLabel}>Conexiones</div>
          </div>
          <div style={s.summaryCard}>
            <div style={{ ...s.summaryNumber, color: okCount > 0 ? '#27AE60' : 'var(--color-text-primary)' }}>
              {testedCount > 0 ? okCount : '—'}
            </div>
            <div style={s.summaryLabel}>Activas</div>
          </div>
          <div style={s.summaryCard}>
            <div style={{ ...s.summaryNumber, color: failCount > 0 ? '#E74C3C' : 'var(--color-text-primary)' }}>
              {testedCount > 0 ? failCount : '—'}
            </div>
            <div style={s.summaryLabel}>Con error</div>
          </div>
        </motion.div>

        {/* URL del sitio */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} style={s.siteUrl}>
          <Globe size={18} color="#60A5FA" style={{ flexShrink: 0 }} />
          <div>
            <div style={s.siteLabel}>Sitio SharePoint</div>
            <div style={s.siteUrlText}>{SITE_URL}</div>
          </div>
        </motion.div>

        {/* Botón verificar */}
        <motion.button
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          whileTap={{ scale: 0.97 }}
          style={s.testAllBtn}
          onClick={testAll}
          disabled={testing}
        >
          {testing ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={16} />}
          {testing ? 'Verificando conexiones...' : 'Verificar todas las conexiones'}
        </motion.button>

        {/* Categorías */}
        <motion.div variants={containerVariants} initial="initial" animate="animate">
          {CONNECTIONS.map((cat) => {
            const colors = categoryColors[cat.category] || { line: 'rgba(255,255,255,0.08)', text: 'rgba(255,255,255,0.3)' }
            const expanded = expandedCategories[cat.category] !== false
            return (
              <div key={cat.category}>
                <motion.div variants={itemVariants}>
                  <div style={s.catHeader} onClick={() => toggleCategory(cat.category)}>
                    <div style={{ ...s.catLine, background: colors.line }} />
                    <span style={{ ...s.catLabel, color: colors.text, display: 'flex', alignItems: 'center', gap: 4 }}>
                      {cat.category} ({cat.items.length})
                      {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </span>
                    <div style={{ ...s.catLine, background: colors.line }} />
                  </div>
                </motion.div>
                {expanded && cat.items.map((item) => (
                  <ConnectionCard
                    key={item.name}
                    item={item}
                    status={statuses[item.name]}
                    override={item.formId ? overrides[item.formId] : null}
                    onSave={handleSaveOverride}
                    onClear={handleClearOverride}
                  />
                ))}
              </div>
            )
          })}

          {/* Variables de entorno */}
          <motion.div variants={itemVariants}>
            <div style={s.catHeader} onClick={() => toggleCategory('Variables de Entorno')}>
              <div style={{ ...s.catLine, background: 'rgba(255,255,255,0.08)' }} />
              <span style={{ ...s.catLabel, color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Settings size={11} /> Variables de Entorno ({ENV_VARS.length})
                {expandedCategories['Variables de Entorno'] ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </span>
              <div style={{ ...s.catLine, background: 'rgba(255,255,255,0.08)' }} />
            </div>
          </motion.div>
          {expandedCategories['Variables de Entorno'] && (
            <motion.div variants={itemVariants} style={s.envSection}>
              {ENV_VARS.map((env, i) => (
                <div key={env.key} style={{ ...s.envRow, borderBottom: i < ENV_VARS.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <div>
                    <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#60A5FA' }}>{env.key}</div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--color-text-muted)', marginTop: 1 }}>{env.label}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={s.statusDot(!!env.value)} />
                    <span style={{ fontFamily: 'monospace', fontSize: 10, color: env.value ? 'var(--color-text-primary)' : '#E74C3C', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {env.value || 'No configurada'}
                    </span>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </motion.div>

        {/* Nota SSO */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          style={{ marginTop: 24, padding: '12px 14px', background: 'rgba(47,128,237,0.06)', border: '1px solid rgba(47,128,237,0.15)', borderRadius: 8, fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.5 }}
        >
          <strong style={{ color: '#60A5FA' }}>Nota para el equipo SSO:</strong> Las listas marcadas como
          "Auto-creada" se generan automáticamente la primera vez que se usan. Para reasignar una lista,
          toca el ícono <Pencil size={10} style={{ verticalAlign: 'middle', color: '#60A5FA' }} /> en la tarjeta
          y pega la URL o GUID de la nueva lista. El override se guarda localmente y es aplicado al
          enviar formularios desde este dispositivo. Los scopes requeridos son{' '}
          <code style={{ fontSize: 10, color: '#C084FC' }}>Sites.ReadWrite.All</code> y{' '}
          <code style={{ fontSize: 10, color: '#C084FC' }}>Files.ReadWrite.All</code>.
        </motion.div>

        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )
}
