// ── Hook de KPIs diarios ─────────────────────────────────────────────────
//
// Fuente de datos:
//   - Producción: consulta SharePoint list "MRC_FormSubmissions" (hoy)
//     Campos usados para filtrar: Branch (sucursal), Equipo (canal)
//   - Dev mode:   genera mock data determinista basada en la fecha actual
//
// Uso:
//   const { kpis, activity, ... } = useKPIs(unitType, { branch, canal })
//   branch: string | 'all'   — nombre del CD (Q1 del formulario)
//   canal:  string | 'all'   — equipo/canal (Q9 del formulario)

import { useState, useEffect, useCallback, useMemo } from 'react'
import useFormStore from '../store/formStore'
import { fetchTodayKPIs, fetchRecentActivity, fetchTodayKPIsAllBranches, IS_DEV_MODE } from '../services/sharepointData'

// ── Listas de opciones para los filtros ──────────────────────────────────

export const SUCURSALES_LIST = [
  'Arica','Iquique','Calama','Antofagasta','Copiapó','Coquimbo',
  'Hijuelas','San Antonio','Viña del Mar','Miraflores','Huechuraba',
  'Lo Espejo','Rancagua','Curicó','Talca','Chillán','Los Ángeles',
  'Concepción','Temuco','Valdivia','Osorno','Puerto Montt',
  'Castro','Coyhaique','Punta Arenas','San Felipe',
  'Oficina Central','Oficina Vespucio',
]

// Equipos de Fuerza de Ventas agrupados por canal
export const CANALES_FDV = [
  { key: 'all',              label: 'Todos'           },
  { key: 'Canal Tradicional', label: 'Canal Tradicional' },
  { key: 'Food Service',      label: 'Food Service'     },
]

// Equipos que pertenecen a cada canal (para filtro en dev)
const EQUIPO_POR_CANAL = {
  'Canal Tradicional': ['Norte','Centro','Santiago','Sur','Servicio al Cliente','Venta Digital'],
  'Food Service':      ['Foodservice'],
}

// ── Configuración de formularios por unidad ───────────────────────────────

const FORM_META = {
  'pauta-verificacion-reglas-oro': { label: 'Pautas Verificación', targets: { sucursales: 15, 'fuerza-de-ventas': 0 } },
  'caminata-seguridad':             { label: 'Caminatas',           targets: { sucursales: 10, 'fuerza-de-ventas': 0 } },
  'inspeccion-simple':              { label: 'Inspecciones',        targets: { sucursales: 8,  'fuerza-de-ventas': 0 } },
  'difusiones-sso':                 { label: 'Difusiones SSO',      targets: { sucursales: 5,  'fuerza-de-ventas': 5 } },
  'observacion-conductual':         { label: 'Obs. Conductual',     targets: { sucursales: 0,  'fuerza-de-ventas': 12 } },
  'inspeccion-planificada':         { label: 'Insp. Planificada',   targets: { sucursales: 0,  'fuerza-de-ventas': 8 } },
}

const ACTIVITY_ACTIONS = {
  'pauta-verificacion-reglas-oro': 'Envió Pauta de Verificación',
  'caminata-seguridad':             'Completó Caminata de Seguridad',
  'inspeccion-simple':              'Registró Inspección Simple',
  'difusiones-sso':                 'Registró Difusión SSO',
  'observacion-conductual':         'Completó Observación Conductual',
  'inspeccion-planificada':         'Completó Inspección Planificada',
}

const USERS = ['J. Pérez','M. González','A. Torres','C. Muñoz','R. Díaz','L. Vargas']

function seeded(seed, min, max) {
  const x = Math.sin(seed) * 10000
  return min + Math.floor((x - Math.floor(x)) * (max - min + 1))
}

// ── Mock data ─────────────────────────────────────────────────────────────

function buildMockKPIs(unitType, filters) {
  const dayOfYear = Math.floor(Date.now() / 86400000)
  // Al filtrar, reducir los valores para simular un subconjunto
  const filterFactor = (filters?.branch && filters.branch !== 'all') ? 0.25
    : (filters?.canal && filters.canal !== 'all') ? 0.4 : 1

  return Object.entries(FORM_META)
    .filter(([, meta]) => meta.targets[unitType] > 0)
    .map(([formType, meta], i) => {
      const total   = Math.max(1, Math.round(meta.targets[unitType] * filterFactor))
      const current = seeded(dayOfYear + i * 7, Math.floor(total * 0.4), total)
      const percent = Math.round((current / total) * 100)
      return { label: meta.label, formType, current, total, percent }
    })
}

function buildMockActivity(unitType, filters) {
  const forms = Object.keys(FORM_META).filter(f => FORM_META[f].targets[unitType] > 0)
  const now = new Date()

  // Pool de branches según filtro
  const branches = (filters?.branch && filters.branch !== 'all')
    ? [filters.branch]
    : SUCURSALES_LIST.slice(0, 6)

  const equiposFdv = (filters?.canal && filters.canal !== 'all')
    ? EQUIPO_POR_CANAL[filters.canal] || []
    : ['Norte','Centro','Foodservice','Sur','Venta Digital']

  return Array.from({ length: 5 }, (_, i) => {
    const minutesAgo = seeded(i * 13 + 1, 5, 180)
    const t = new Date(now - minutesAgo * 60000)
    const time = t.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
    const formType = forms[i % forms.length]
    const branch = unitType === 'sucursales'
      ? branches[seeded(i * 5 + 2, 0, branches.length - 1)]
      : equiposFdv[seeded(i * 5 + 2, 0, equiposFdv.length - 1)]
    return {
      time,
      user:   USERS[seeded(i * 3, 0, USERS.length - 1)],
      action: ACTIVITY_ACTIONS[formType] || 'Envió formulario',
      branch,
    }
  }).sort((a, b) => b.time.localeCompare(a.time))
}

// ── Construir KPIs desde datos reales de SharePoint ───────────────────────
// fetchTodayKPIs ahora devuelve { [formType]: count } (un conteo por lista).

function buildRealKPIs(countsMap, unitType) {
  return Object.entries(FORM_META)
    .filter(([, meta]) => meta.targets[unitType] > 0)
    .map(([formType, meta]) => {
      const total   = meta.targets[unitType]
      const current = countsMap[formType] || 0
      const percent = Math.round((current / total) * 100)
      return { label: meta.label, formType, current, total, percent }
    })
}

// ── Hook principal ────────────────────────────────────────────────────────

const AUTO_REFRESH_MS = 2 * 60 * 1000

export function useKPIs(unitType, filters = {}) {
  const pendingQueue = useFormStore((s) => s.pendingQueue)
  const syncQueue    = useFormStore((s) => s.syncQueue)

  const [kpis,        setKpis]        = useState([])
  const [activity,    setActivity]    = useState([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)
  const [accessDenied, setAccessDenied] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)

  // Serializar filtros para usar como dependency en useCallback
  const filtersKey = `${filters.branch || 'all'}|${filters.canal || 'all'}`

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    setAccessDenied(false)
    try {
      await syncQueue()
      if (IS_DEV_MODE) {
        await new Promise((r) => setTimeout(r, 600))
        setKpis(buildMockKPIs(unitType, filters))
        setActivity(buildMockActivity(unitType, filters))
      } else {
        // Consultar KPIs y actividad en paralelo
        const [countsMap, recentActivity] = await Promise.all([
          fetchTodayKPIs(unitType, filters),
          fetchRecentActivity(unitType, filters),
        ])

        // Detectar acceso denegado (403 en todas las listas)
        if (countsMap?.accessDenied || recentActivity?.accessDenied) {
          setAccessDenied(true)
          setKpis(buildRealKPIs({}, unitType))
          setActivity([])
        } else {
          setKpis(buildRealKPIs(countsMap, unitType))
          const items = Array.isArray(recentActivity) ? recentActivity : (recentActivity?.items || [])
          setActivity(items.length ? items : [])
        }
      }
      setLastUpdated(new Date())
    } catch {
      setError('No se pudo cargar la información. Verifica tu conexión.')
    } finally {
      setLoading(false)
    }
  }, [unitType, filtersKey, syncQueue]) // eslint-disable-line

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, AUTO_REFRESH_MS)
    return () => clearInterval(interval)
  }, [fetchData])

  const localPendingCount = useMemo(() => {
    const today = new Date().toDateString()
    return pendingQueue.filter(
      (item) => !item.synced && new Date(item.createdAt).toDateString() === today
    ).length
  }, [pendingQueue])

  return { kpis, activity, loading, error, accessDenied, lastUpdated, refresh: fetchData, localPendingCount }
}

// ── Hook de KPIs por sucursal/turno para DailyStatusScreenV2 ─────────────
// Retorna { data, loading, lastUpdated, refresh }
// data: { [branchName]: { pautas:{M,T,N,ADM}, cam:number, dif:{M,T,N,ADM} } }

export function useKPIsAllBranches() {
  const [weekOffset,   setWeekOffset]   = useState(0)
  const [data,         setData]         = useState({})
  const [loading,      setLoading]      = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)
  const [lastUpdated,  setLastUpdated]  = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setAccessDenied(false)
    try {
      const result = await fetchTodayKPIsAllBranches(weekOffset)
      if (result?.accessDenied) {
        setAccessDenied(true)
        setData({})
      } else {
        setData(result || {})
      }
      setLastUpdated(new Date())
    } catch (e) {
      console.warn('[MRC] useKPIsAllBranches:', e)
    } finally {
      setLoading(false)
    }
  }, [weekOffset])

  useEffect(() => {
    fetchData()
    if (weekOffset !== 0) return  // sin auto-refresh para semanas pasadas
    const iv = setInterval(fetchData, AUTO_REFRESH_MS)
    return () => clearInterval(iv)
  }, [fetchData, weekOffset])

  const goToPrevWeek = useCallback(() => setWeekOffset(o => o - 1), [])
  const goToNextWeek = useCallback(() => setWeekOffset(o => Math.min(0, o + 1)), [])
  const canGoNext = weekOffset < 0

  return { data, loading, accessDenied, lastUpdated, refresh: fetchData, weekOffset, goToPrevWeek, goToNextWeek, canGoNext }
}
