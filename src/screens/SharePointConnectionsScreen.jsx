import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Database, CheckCircle, XCircle, Loader, RefreshCw,
  Link2, FileText, Users, Shield, BookOpen, Settings,
  ChevronDown, ChevronUp, Globe, HardDrive,
} from 'lucide-react'
import AppHeader from '../components/layout/AppHeader'
import { containerVariants, itemVariants } from '../components/ui/menuCardVariants'
import { msalInstance } from '../config/msalInstance'
import { graphScopes } from '../config/msalConfig'

// ── Registro estático de conexiones SharePoint ──────────────────────────────
// Fuente de verdad centralizada para el panel de administración.
// Al agregar una lista nueva en sharepointData.js, agregar aquí también.

const SITE_URL = import.meta.env.VITE_SHAREPOINT_SITE_URL || '(no configurado)'

const IS_DEV_MODE =
  !import.meta.env.VITE_AZURE_CLIENT_ID ||
  import.meta.env.VITE_AZURE_CLIENT_ID === 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'

const CONNECTIONS = [
  // ── Listas con GUID fijo (formularios) ────────────────────────────────────
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
  // ── Listas dinámicas (se crean automáticamente) ───────────────────────────
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
  // ── Listas de sistema ─────────────────────────────────────────────────────
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
  // ── Archivos en Drive ─────────────────────────────────────────────────────
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

// Variables de entorno relevantes
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

// ── Helpers ─────────────────────────────────────────────────────────────────

async function getGraphToken() {
  const accounts = msalInstance.getAllAccounts()
  if (!accounts.length) throw new Error('Sin cuenta autenticada')
  const result = await msalInstance.acquireTokenSilent({ ...graphScopes, account: accounts[0] })
  return result.accessToken
}

function getSiteBase() {
  const raw = import.meta.env.VITE_SHAREPOINT_SITE_URL
  if (!raw) return null
  const url = new URL(raw)
  const path = url.pathname.replace(/\/$/, '')
  return `https://graph.microsoft.com/v1.0/sites/${url.hostname}:${path}:`
}

// Test de conectividad para una lista por GUID
async function testListByGuid(listId, token) {
  const siteBase = getSiteBase()
  if (!siteBase) return { ok: false, error: 'VITE_SHAREPOINT_SITE_URL no configurado' }
  const res = await fetch(`${siteBase}/lists/${listId}?$select=id,displayName,itemCount`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    return { ok: false, error: `HTTP ${res.status}`, detail: txt }
  }
  const data = await res.json()
  return { ok: true, displayName: data.displayName, itemCount: data.itemCount }
}

// Test de conectividad para una lista por nombre (dinámicas)
async function testListByName(listName, token) {
  const siteBase = getSiteBase()
  if (!siteBase) return { ok: false, error: 'VITE_SHAREPOINT_SITE_URL no configurado' }
  const res = await fetch(
    `${siteBase}/lists?$filter=displayName eq '${listName}'&$select=id,displayName,itemCount`,
    { headers: { Authorization: `Bearer ${token}` } },
  )
  if (!res.ok) {
    return { ok: false, error: `HTTP ${res.status}` }
  }
  const data = await res.json()
  if (!data.value || data.value.length === 0) {
    return { ok: false, error: 'Lista no encontrada (se creará al primer uso)' }
  }
  const list = data.value[0]
  return { ok: true, displayName: list.displayName, itemCount: list.itemCount, resolvedId: list.id }
}

// Test de conectividad para archivo en Drive
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

// ── Estilos ─────────────────────────────────────────────────────────────────

const styles = {
  page: {
    minHeight: '100dvh',
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--color-navy)',
  },
  content: {
    flex: 1,
    padding: '20px 16px 32px',
  },
  siteUrl: {
    background: 'var(--color-navy-mid)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-card)',
    padding: '12px 16px',
    marginBottom: 16,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  siteUrlText: {
    fontFamily: 'var(--font-body)',
    fontSize: 12,
    color: 'var(--color-text-muted)',
    wordBreak: 'break-all',
  },
  siteLabel: {
    fontFamily: 'var(--font-display)',
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--color-text-primary)',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  testAllBtn: {
    background: 'rgba(47,128,237,0.15)',
    border: '1px solid rgba(47,128,237,0.3)',
    borderRadius: 8,
    padding: '10px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    cursor: 'pointer',
    width: '100%',
    marginBottom: 20,
    fontFamily: 'var(--font-display)',
    fontSize: 13,
    fontWeight: 700,
    color: '#60A5FA',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },
  categoryHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    margin: '20px 0 10px',
    cursor: 'pointer',
  },
  categoryLine: {
    flex: 1,
    height: 1,
  },
  categoryLabel: {
    fontFamily: 'var(--font-body)',
    fontSize: 11,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  card: {
    background: 'var(--color-navy-mid)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-card)',
    padding: '14px 16px',
    marginBottom: 8,
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardTitle: {
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    fontSize: 13,
    letterSpacing: '0.04em',
    color: 'var(--color-text-primary)',
    lineHeight: 1.3,
  },
  cardSub: {
    fontFamily: 'var(--font-body)',
    fontSize: 11,
    color: 'var(--color-text-muted)',
    marginTop: 2,
  },
  tag: {
    display: 'inline-block',
    fontFamily: 'var(--font-display)',
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: '0.1em',
    padding: '2px 6px',
    borderRadius: 4,
    marginRight: 6,
    marginTop: 4,
  },
  detailRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    fontFamily: 'var(--font-body)',
    fontSize: 11,
  },
  detailLabel: {
    color: 'var(--color-text-muted)',
    minWidth: 60,
  },
  detailValue: {
    color: 'var(--color-text-primary)',
    wordBreak: 'break-all',
    fontSize: 10,
    fontFamily: 'monospace',
  },
  statusDot: (ok) => ({
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: ok ? '#27AE60' : '#E74C3C',
    flexShrink: 0,
  }),
  statusText: {
    fontFamily: 'var(--font-body)',
    fontSize: 11,
    marginTop: 8,
    padding: '6px 10px',
    borderRadius: 6,
  },
  envSection: {
    background: 'var(--color-navy-mid)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-card)',
    padding: '14px 16px',
    marginTop: 8,
  },
  envRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '6px 0',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
  },
  summary: {
    display: 'flex',
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    background: 'var(--color-navy-mid)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-card)',
    padding: '12px',
    textAlign: 'center',
  },
  summaryNumber: {
    fontFamily: 'var(--font-display)',
    fontSize: 24,
    fontWeight: 700,
    color: 'var(--color-text-primary)',
  },
  summaryLabel: {
    fontFamily: 'var(--font-body)',
    fontSize: 10,
    color: 'var(--color-text-muted)',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
}

// ── Componentes internos ────────────────────────────────────────────────────

function StatusBadge({ status }) {
  if (!status) return null
  if (status.loading) {
    return (
      <div style={{ ...styles.statusText, background: 'rgba(47,128,237,0.1)', color: '#60A5FA', display: 'flex', alignItems: 'center', gap: 6 }}>
        <Loader size={12} style={{ animation: 'spin 1s linear infinite' }} />
        Verificando...
      </div>
    )
  }
  if (status.ok) {
    return (
      <div style={{ ...styles.statusText, background: 'rgba(39,174,96,0.1)', color: '#27AE60', display: 'flex', alignItems: 'center', gap: 6 }}>
        <CheckCircle size={12} />
        <span>
          Conectado
          {status.displayName ? ` — "${status.displayName}"` : ''}
          {status.itemCount != null ? ` (${status.itemCount} registros)` : ''}
          {status.size != null ? ` (${(status.size / 1024).toFixed(1)} KB)` : ''}
          {status.lastModified ? ` — ${new Date(status.lastModified).toLocaleDateString('es-CL')}` : ''}
        </span>
      </div>
    )
  }
  return (
    <div style={{ ...styles.statusText, background: 'rgba(231,76,60,0.1)', color: '#E74C3C', display: 'flex', alignItems: 'center', gap: 6 }}>
      <XCircle size={12} />
      <span>{status.error || 'Error desconocido'}</span>
    </div>
  )
}

function ConnectionCard({ item, status }) {
  const iconColor = item.type === 'guid' ? '#2F80ED' : item.type === 'dynamic' ? '#0891B2' : '#F57C20'
  const IconComponent = item.type === 'drive' ? HardDrive : item.type === 'dynamic' ? Users : Database

  const unitColors = {
    Sucursales: { bg: 'rgba(26,82,184,0.15)', color: '#5B9BF5', border: 'rgba(26,82,184,0.3)' },
    'Fuerza de Ventas': { bg: 'rgba(245,124,32,0.15)', color: '#F5A623', border: 'rgba(245,124,32,0.3)' },
    Ambas: { bg: 'rgba(39,174,96,0.12)', color: '#4ADE80', border: 'rgba(39,174,96,0.25)' },
    Global: { bg: 'rgba(123,63,228,0.12)', color: '#C084FC', border: 'rgba(123,63,228,0.25)' },
  }
  const unitStyle = unitColors[item.unit] || unitColors.Global

  return (
    <motion.div variants={itemVariants} style={styles.card}>
      <div style={styles.cardHeader}>
        <div style={{ ...styles.iconBox, background: `${iconColor}22` }}>
          <IconComponent size={18} color={iconColor} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={styles.cardTitle}>{item.name}</div>
          <div style={styles.cardSub}>{item.formLabel}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
            <span style={{ ...styles.tag, background: unitStyle.bg, color: unitStyle.color, border: `1px solid ${unitStyle.border}` }}>
              {item.unit}
            </span>
            <span style={{ ...styles.tag, background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-muted)', border: '1px solid rgba(255,255,255,0.08)' }}>
              {item.service}
            </span>
            {item.type === 'dynamic' && (
              <span style={{ ...styles.tag, background: 'rgba(8,145,178,0.12)', color: '#22D3EE', border: '1px solid rgba(8,145,178,0.25)' }}>
                Auto-creada
              </span>
            )}
          </div>
        </div>
      </div>

      {item.listId && (
        <div style={styles.detailRow}>
          <span style={styles.detailLabel}>GUID:</span>
          <span style={styles.detailValue}>{item.listId}</span>
        </div>
      )}
      {item.formId && (
        <div style={styles.detailRow}>
          <span style={styles.detailLabel}>Form ID:</span>
          <span style={styles.detailValue}>{item.formId}</span>
        </div>
      )}

      <StatusBadge status={status} />
    </motion.div>
  )
}

// ── Pantalla principal ──────────────────────────────────────────────────────

export default function SharePointConnectionsScreen() {
  const [statuses, setStatuses] = useState({})
  const [testing, setTesting] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState(() => {
    const initial = {}
    CONNECTIONS.forEach((cat) => { initial[cat.category] = true })
    initial['Variables de Entorno'] = false
    return initial
  })

  const toggleCategory = (cat) => {
    setExpandedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }))
  }

  // Total de conexiones
  const totalConnections = CONNECTIONS.reduce((sum, cat) => sum + cat.items.length, 0)
  const testedCount = Object.keys(statuses).length
  const okCount = Object.values(statuses).filter((s) => s.ok).length
  const failCount = Object.values(statuses).filter((s) => !s.loading && !s.ok).length

  const testAll = useCallback(async () => {
    if (IS_DEV_MODE) {
      // En dev mode simulamos resultados
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
    // Marcar todas como "loading"
    const loading = {}
    CONNECTIONS.forEach((cat) => {
      cat.items.forEach((item) => { loading[item.name] = { loading: true } })
    })
    setStatuses(loading)

    try {
      const token = await getGraphToken()

      // Testear todas las conexiones en paralelo
      const promises = CONNECTIONS.flatMap((cat) =>
        cat.items.map(async (item) => {
          try {
            let result
            if (item.type === 'guid' && item.listId) {
              result = await testListByGuid(item.listId, token)
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
      // Error global (ej: no hay token)
      const errAll = {}
      CONNECTIONS.forEach((cat) => {
        cat.items.forEach((item) => {
          errAll[item.name] = { ok: false, error: err.message }
        })
      })
      setStatuses(errAll)
    } finally {
      setTesting(false)
    }
  }, [])

  const categoryColors = {
    Formularios: { line: 'rgba(47,128,237,0.2)', text: 'rgba(96,165,250,0.7)' },
    'Gestión de Líderes': { line: 'rgba(8,145,178,0.2)', text: 'rgba(34,211,238,0.7)' },
    Sistema: { line: 'rgba(123,63,228,0.2)', text: 'rgba(192,132,252,0.7)' },
    'Archivos de Configuración': { line: 'rgba(245,124,32,0.2)', text: 'rgba(245,166,35,0.7)' },
    'Variables de Entorno': { line: 'rgba(255,255,255,0.08)', text: 'rgba(255,255,255,0.3)' },
  }

  return (
    <div style={styles.page}>
      <AppHeader title="Conexiones SharePoint" />

      <div style={styles.content}>
        {/* ── Resumen ─────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={styles.summary}
        >
          <div style={styles.summaryCard}>
            <div style={styles.summaryNumber}>{totalConnections}</div>
            <div style={styles.summaryLabel}>Conexiones</div>
          </div>
          <div style={styles.summaryCard}>
            <div style={{ ...styles.summaryNumber, color: okCount > 0 ? '#27AE60' : 'var(--color-text-primary)' }}>
              {testedCount > 0 ? okCount : '—'}
            </div>
            <div style={styles.summaryLabel}>Activas</div>
          </div>
          <div style={styles.summaryCard}>
            <div style={{ ...styles.summaryNumber, color: failCount > 0 ? '#E74C3C' : 'var(--color-text-primary)' }}>
              {testedCount > 0 ? failCount : '—'}
            </div>
            <div style={styles.summaryLabel}>Con error</div>
          </div>
        </motion.div>

        {/* ── Sitio SharePoint ────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          style={styles.siteUrl}
        >
          <Globe size={18} color="#60A5FA" style={{ flexShrink: 0 }} />
          <div>
            <div style={styles.siteLabel}>Sitio SharePoint</div>
            <div style={styles.siteUrlText}>{SITE_URL}</div>
          </div>
        </motion.div>

        {/* ── Botón Test All ─────────────────────────────────────────── */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileTap={{ scale: 0.97 }}
          style={styles.testAllBtn}
          onClick={testAll}
          disabled={testing}
        >
          {testing ? (
            <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
          ) : (
            <RefreshCw size={16} />
          )}
          {testing ? 'Verificando conexiones...' : 'Verificar todas las conexiones'}
        </motion.button>

        {/* ── Categorías de conexiones ────────────────────────────────── */}
        <motion.div
          variants={containerVariants}
          initial="initial"
          animate="animate"
        >
          {CONNECTIONS.map((cat) => {
            const colors = categoryColors[cat.category] || categoryColors.Sistema
            const expanded = expandedCategories[cat.category] !== false

            return (
              <div key={cat.category}>
                <motion.div variants={itemVariants}>
                  <div
                    style={styles.categoryHeader}
                    onClick={() => toggleCategory(cat.category)}
                  >
                    <div style={{ ...styles.categoryLine, background: colors.line }} />
                    <span style={{ ...styles.categoryLabel, color: colors.text, display: 'flex', alignItems: 'center', gap: 4 }}>
                      {cat.category} ({cat.items.length})
                      {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </span>
                    <div style={{ ...styles.categoryLine, background: colors.line }} />
                  </div>
                </motion.div>

                {expanded && cat.items.map((item) => (
                  <ConnectionCard
                    key={item.name}
                    item={item}
                    status={statuses[item.name]}
                  />
                ))}
              </div>
            )
          })}

          {/* ── Variables de Entorno ──────────────────────────────────── */}
          <motion.div variants={itemVariants}>
            <div
              style={styles.categoryHeader}
              onClick={() => toggleCategory('Variables de Entorno')}
            >
              <div style={{ ...styles.categoryLine, background: 'rgba(255,255,255,0.08)' }} />
              <span style={{ ...styles.categoryLabel, color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Settings size={11} /> Variables de Entorno ({ENV_VARS.length})
                {expandedCategories['Variables de Entorno'] ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </span>
              <div style={{ ...styles.categoryLine, background: 'rgba(255,255,255,0.08)' }} />
            </div>
          </motion.div>

          {expandedCategories['Variables de Entorno'] && (
            <motion.div variants={itemVariants} style={styles.envSection}>
              {ENV_VARS.map((env, i) => (
                <div
                  key={env.key}
                  style={{ ...styles.envRow, borderBottom: i < ENV_VARS.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
                >
                  <div>
                    <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#60A5FA' }}>{env.key}</div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--color-text-muted)', marginTop: 1 }}>
                      {env.label}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={styles.statusDot(!!env.value)} />
                    <span style={{
                      fontFamily: 'monospace',
                      fontSize: 10,
                      color: env.value ? 'var(--color-text-primary)' : '#E74C3C',
                      maxWidth: 120,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {env.value || 'No configurada'}
                    </span>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </motion.div>

        {/* ── Nota informativa ────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          style={{
            marginTop: 24,
            padding: '12px 14px',
            background: 'rgba(47,128,237,0.06)',
            border: '1px solid rgba(47,128,237,0.15)',
            borderRadius: 8,
            fontFamily: 'var(--font-body)',
            fontSize: 11,
            color: 'var(--color-text-muted)',
            lineHeight: 1.5,
          }}
        >
          <strong style={{ color: '#60A5FA' }}>Nota para el equipo SSO:</strong> Las listas marcadas como
          "Auto-creada" se generan automáticamente la primera vez que se usan. Si una conexión falla,
          verificar que el sitio SharePoint tenga los permisos correctos y que la App Registration
          tenga los scopes <code style={{ fontSize: 10, color: '#C084FC' }}>Sites.ReadWrite.All</code> y{' '}
          <code style={{ fontSize: 10, color: '#C084FC' }}>Files.ReadWrite.All</code>.
        </motion.div>

        {/* Spinner CSS animation */}
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  )
}
