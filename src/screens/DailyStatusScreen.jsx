import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, AlertCircle, Clock, Upload, Filter, X, User, MapPin, Loader } from 'lucide-react'
import AppHeader from '../components/layout/AppHeader'
import KPICard from '../components/ui/KPICard'
import { unitLabels } from '../config/routes'
import { useKPIs, SUCURSALES_LIST, CANALES_FDV } from '../hooks/useKPIs'
import { fetchKPIDetail, IS_DEV_MODE } from '../services/sharepointData'
import { getShiftTargets } from '../config/branchTargets'

// ── Skeleton KPI card ─────────────────────────────────────────────────────
function KPISkeleton({ delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: [0.4, 0.7, 0.4] }}
      transition={{ duration: 1.4, repeat: Infinity, delay }}
      style={{
        background: 'var(--color-navy-mid)',
        borderRadius: 'var(--radius-card)',
        height: 110,
        borderLeft: '4px solid rgba(255,255,255,0.08)',
      }}
    />
  )
}

// ── Skeleton activity row ─────────────────────────────────────────────────
function ActivitySkeleton() {
  return (
    <div style={{ display: 'flex', gap: 12, paddingBottom: 16 }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', marginTop: 6, marginLeft: 16, flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <motion.div
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 1.4, repeat: Infinity }}
          style={{ height: 13, borderRadius: 4, background: 'rgba(255,255,255,0.08)', width: '75%' }}
        />
        <motion.div
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 1.4, repeat: Infinity, delay: 0.2 }}
          style={{ height: 11, borderRadius: 4, background: 'rgba(255,255,255,0.05)', width: '50%' }}
        />
      </div>
    </div>
  )
}

// ── Formato de fecha ──────────────────────────────────────────────────────
function formatDate() {
  return new Date().toLocaleDateString('es-CL', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
}

function formatTime(date) {
  if (!date) return ''
  return date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
}

// ── Pantalla principal ────────────────────────────────────────────────────
// ── Componente de filtro por pills ────────────────────────────────────────
function FilterPills({ options, value, onChange, label }) {
  return (
    <div>
      <div style={{
        fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600,
        color: 'var(--color-text-muted)', letterSpacing: '0.08em',
        textTransform: 'uppercase', marginBottom: 6,
        display: 'flex', alignItems: 'center', gap: 5,
      }}>
        <Filter size={10} />
        {label}
      </div>
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
        {/* "Todos" pill */}
        <button
          onClick={() => onChange('all')}
          style={{
            flexShrink: 0, padding: '5px 12px', borderRadius: 'var(--radius-pill)',
            border: value === 'all' ? 'none' : '1px solid var(--color-border)',
            background: value === 'all' ? 'var(--color-blue-btn)' : 'rgba(255,255,255,0.04)',
            color: value === 'all' ? '#fff' : 'var(--color-text-muted)',
            fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600,
            cursor: 'pointer', whiteSpace: 'nowrap',
          }}
        >
          Todos
        </button>
        {options.map((opt) => {
          const key   = typeof opt === 'string' ? opt : opt.key
          const lbl   = typeof opt === 'string' ? opt : opt.label
          const active = value === key
          return (
            <button
              key={key}
              onClick={() => onChange(active ? 'all' : key)}
              style={{
                flexShrink: 0, padding: '5px 12px', borderRadius: 'var(--radius-pill)',
                border: active ? 'none' : '1px solid var(--color-border)',
                background: active ? 'var(--color-orange)' : 'rgba(255,255,255,0.04)',
                color: active ? '#fff' : 'var(--color-text-muted)',
                fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600,
                cursor: 'pointer', whiteSpace: 'nowrap',
                transition: 'all 0.15s',
              }}
            >
              {lbl}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Drawer de detalle de registros ────────────────────────────────────────
function KPIDetailDrawer({ kpi, filters, onClose }) {
  const [records, setRecords]   = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error,   setError]     = useState(null)

  // Cargar registros al montar
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        if (IS_DEV_MODE) {
          await new Promise(r => setTimeout(r, 400))
          const names  = ['J. Pérez','M. González','A. Torres','C. Muñoz','R. Díaz']
          const turnos = ['Turno Mañana','Turno Tarde','Turno Noche','Administración']
          const mock = Array.from({ length: kpi.current }, (_, i) => ({
            user:   names[i % names.length],
            branch: filters?.branch && filters.branch !== 'all' ? filters.branch : 'Varias',
            time:   `${String(8 + Math.floor(i * 1.2)).padStart(2,'0')}:${String(i * 7 % 60).padStart(2,'0')}`,
            turno:  kpi.formType === 'pauta-verificacion-reglas-oro' ? turnos[i % turnos.length] : undefined,
          }))
          if (!cancelled) setRecords(mock)
        } else {
          const data = await fetchKPIDetail(kpi.formType, filters)
          if (!cancelled) setRecords(data)
        }
      } catch {
        if (!cancelled) setError('No se pudo cargar el detalle.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const statusColor = kpi.percent >= 80 ? 'var(--color-success)'
    : kpi.percent >= 50 ? 'var(--color-warning)'
    : 'var(--color-danger)'

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)',
        }}
      />

      {/* Drawer */}
      <motion.div
        key="drawer"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 101,
          background: 'var(--color-navy-mid)',
          borderRadius: '18px 18px 0 0',
          padding: '0 0 calc(24px + env(safe-area-inset-bottom, 0px))',
          maxHeight: '75dvh',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.4)',
        }}
      >
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.15)' }} />
        </div>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 18px 12px',
          borderBottom: '1px solid var(--color-border)',
        }}>
          <div>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700,
              letterSpacing: '0.06em', textTransform: 'uppercase',
              color: 'var(--color-text-muted)',
            }}>
              Detalle · hoy
            </div>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 800,
              color: 'var(--color-text-primary)', marginTop: 2,
            }}>
              {kpi.label}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <span style={{
                fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800,
                color: statusColor,
              }}>
                {kpi.current}
              </span>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-text-muted)' }}>
                de {kpi.total} objetivo · {kpi.percent}%
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.07)', border: 'none',
              borderRadius: '50%', width: 32, height: 32,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--color-text-muted)',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Contenido */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 18px' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '32px 0', color: 'var(--color-text-muted)' }}>
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                style={{ display: 'flex' }}
              >
                <Loader size={16} />
              </motion.span>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 13 }}>Cargando registros…</span>
            </div>
          ) : error ? (
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#EB5757', textAlign: 'center', padding: '24px 0' }}>
              {error}
            </div>
          ) : !records?.length ? (
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-text-muted)', textAlign: 'center', padding: '32px 0' }}>
              Sin registros hoy
            </div>
          ) : (() => {
            // Desglose por turno (solo para pautas)
            const hasTurno = records.some(r => r.turno !== undefined)
            const TURNO_CONFIG = [
              { label: 'Turno Mañana',  value: 'Mañana',         color: '#F57C20' },
              { label: 'Turno Tarde',   value: 'Tarde',           color: '#7B3FE4' },
              { label: 'Turno Noche',   value: 'Noche',           color: '#1A52B8' },
              { label: 'Administración',value: 'Administración',  color: '#27AE60' },
            ]
            // Metas semanales por turno según factor accidentabilidad de la sucursal
            const shiftTargets = getShiftTargets(filters?.branch)
            const turnoCounts = hasTurno
              ? TURNO_CONFIG.map(t => ({
                  label:  t.label,
                  value:  t.value,
                  count:  records.filter(r => r.turno === t.value).length,
                  target: shiftTargets?.shifts?.[t.value] ?? null,
                  color:  t.color,
                }))
              : []
            const knownValues = new Set(TURNO_CONFIG.map(t => t.value))
            const sinTurno = hasTurno ? records.filter(r => r.turno !== undefined && !knownValues.has(r.turno)).length : 0
            const turnoColorMap = Object.fromEntries(TURNO_CONFIG.map(t => [t.value, t.color]))

            return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {/* Desglose por turno */}
              {hasTurno && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    borderRadius: 12, padding: '12px 14px',
                    marginBottom: 14,
                  }}
                >
                  <div style={{
                    fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700,
                    letterSpacing: '0.07em', textTransform: 'uppercase',
                    color: 'var(--color-text-muted)', marginBottom: 12,
                  }}>
                    Registros por turno
                  </div>
                  {/* Subtítulo de referencia */}
                  {shiftTargets && (
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--color-text-muted)', marginBottom: 10 }}>
                      Meta semanal · {filters?.branch} · Total {shiftTargets.total}
                    </div>
                  )}
                  {turnoCounts.map(({ label, count, target, color }, i) => {
                    const pct = target > 0 ? Math.min(100, Math.round((count / target) * 100)) : null
                    const barWidth = target > 0
                      ? `${Math.min(100, Math.round((count / target) * 100))}%`
                      : records.length > 0 ? `${Math.round((count / records.length) * 100)}%` : '0%'
                    return (
                    <motion.div
                      key={label}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                      style={{ marginBottom: 12 }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-text-secondary)' }}>
                          {label}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                          <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color }}>
                            {count}
                          </span>
                          {target !== null && (
                            <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--color-text-muted)' }}>
                              / {target} sem.
                            </span>
                          )}
                          {pct !== null && (
                            <span style={{
                              fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600,
                              color: pct >= 100 ? '#27AE60' : pct >= 60 ? '#F57C20' : '#EB5757',
                            }}>
                              {pct}%
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ height: 5, background: 'rgba(255,255,255,0.07)', borderRadius: 99, overflow: 'hidden' }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: barWidth }}
                          transition={{ duration: 0.7, ease: 'easeOut', delay: i * 0.06 }}
                          style={{ height: '100%', background: color, borderRadius: 99 }}
                        />
                      </div>
                    </motion.div>
                  )})}
                  {sinTurno > 0 && (
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>
                      {sinTurno} sin turno registrado
                    </div>
                  )}
                </motion.div>
              )}

              {/* Lista de registros individuales */}
              <div style={{
                fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700,
                letterSpacing: '0.07em', textTransform: 'uppercase',
                color: 'var(--color-text-muted)', marginBottom: 8,
              }}>
                Registros individuales
              </div>
              {records.map((r, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', borderRadius: 10,
                    background: i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent',
                  }}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: 'rgba(26,82,184,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <User size={13} color="var(--color-blue-btn)" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600,
                      color: 'var(--color-text-primary)',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {r.user || '—'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 1, flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <MapPin size={10} color="var(--color-text-muted)" />
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--color-text-muted)' }}>
                          {r.branch || '—'}
                        </span>
                      </div>
                      {r.turno && (
                        <span style={{
                          fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600,
                          color: turnoColorMap[r.turno] || 'var(--color-text-muted)',
                          background: 'rgba(255,255,255,0.06)',
                          borderRadius: 4, padding: '1px 5px',
                        }}>
                          {r.turno}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-body)', fontSize: 11,
                    color: 'var(--color-text-muted)', flexShrink: 0,
                  }}>
                    {r.time}
                  </div>
                </motion.div>
              ))}
            </div>
          )
          })()}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// ── Pantalla principal ────────────────────────────────────────────────────
export default function DailyStatusScreen() {
  const { unitType } = useParams()
  const label = unitLabels[unitType] || unitType

  const isSucursales = unitType !== 'fuerza-de-ventas'
  const [selectedBranch, setSelectedBranch] = useState('all')
  const [selectedCanal,  setSelectedCanal]  = useState('all')
  const [detailKPI,      setDetailKPI]      = useState(null)   // kpi seleccionado para el drawer

  const openDetail  = useCallback((kpi) => setDetailKPI(kpi), [])
  const closeDetail = useCallback(() => setDetailKPI(null), [])

  const filters = isSucursales
    ? { branch: selectedBranch }
    : { canal:  selectedCanal }

  const { kpis, activity, loading, error, lastUpdated, refresh, localPendingCount } = useKPIs(unitType, filters)

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--color-navy)' }}>
      <AppHeader title="Estatus Diario" />

      <div className="content-col" style={{ flex: 1, padding: '20px 16px', overflowY: 'auto', paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))' }}>

        {/* Encabezado fecha + unidad */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ marginBottom: 20 }}
        >
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700,
            letterSpacing: '0.08em', textTransform: 'uppercase',
            color: 'var(--color-text-muted)',
          }}>
            {label}
          </div>
          <div style={{
            fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 600,
            color: 'var(--color-text-secondary)', marginTop: 2, textTransform: 'capitalize',
          }}>
            {formatDate()}
          </div>
        </motion.div>

        {/* ── Filtros ────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            background: 'var(--color-navy-mid)',
            border: '1px solid var(--color-border)',
            borderRadius: 10, padding: '12px 14px',
            marginBottom: 16,
            display: 'flex', flexDirection: 'column', gap: 12,
          }}
        >
          {isSucursales ? (
            <FilterPills
              label="Sucursal / CD"
              options={SUCURSALES_LIST}
              value={selectedBranch}
              onChange={setSelectedBranch}
            />
          ) : (
            <FilterPills
              label="Canal"
              options={CANALES_FDV.filter(c => c.key !== 'all')}
              value={selectedCanal}
              onChange={setSelectedCanal}
            />
          )}
        </motion.div>

        {/* Badge envíos pendientes */}
        <AnimatePresence>
          {localPendingCount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'rgba(245,124,32,0.1)',
                border: '1px solid rgba(245,124,32,0.3)',
                borderRadius: 8, padding: '8px 12px', marginBottom: 16,
              }}
            >
              <Upload size={14} color="var(--color-orange)" />
              <span style={{
                fontFamily: 'var(--font-body)', fontSize: 12,
                color: 'var(--color-orange)',
              }}>
                {localPendingCount} envío{localPendingCount !== 1 ? 's' : ''} pendiente{localPendingCount !== 1 ? 's' : ''} de sincronizar
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Estado de error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: 'rgba(235,87,87,0.08)',
                border: '1px solid rgba(235,87,87,0.25)',
                borderRadius: 10, padding: '12px 14px', marginBottom: 16,
              }}
            >
              <AlertCircle size={16} color="#EB5757" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, fontFamily: 'var(--font-body)', fontSize: 12, color: '#EB5757' }}>
                {error}
              </div>
              <button
                onClick={refresh}
                style={{
                  background: 'rgba(235,87,87,0.15)', border: '1px solid rgba(235,87,87,0.3)',
                  borderRadius: 6, padding: '4px 10px', cursor: 'pointer',
                  fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700,
                  letterSpacing: '0.06em', color: '#EB5757',
                }}
              >
                REINTENTAR
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* KPI grid */}
        {(selectedBranch !== 'all' || selectedCanal !== 'all') && (
          <div style={{
            fontFamily: 'var(--font-body)', fontSize: 11,
            color: 'var(--color-orange)', marginBottom: 8,
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <Filter size={11} />
            Mostrando:{' '}
            <strong>{isSucursales ? selectedBranch : selectedCanal}</strong>
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
          {loading
            ? [0, 1, 2, 3].map((i) => <KPISkeleton key={i} delay={i * 0.1} />)
            : kpis.map((kpi, i) => (
                <KPICard
                  key={kpi.formType}
                  {...kpi}
                  delay={i * 0.08}
                  onClick={() => openDetail(kpi)}
                />
              ))
          }
        </div>

        {/* Sección actividad */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 14,
          }}>
            <span style={{
              fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700,
              letterSpacing: '0.06em', textTransform: 'uppercase',
              color: 'var(--color-text-secondary)',
            }}>
              Actividad de hoy
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {lastUpdated && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={11} color="var(--color-text-muted)" />
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--color-text-muted)' }}>
                    {formatTime(lastUpdated)}
                  </span>
                </div>
              )}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={refresh}
                disabled={loading}
                style={{
                  background: 'none', border: 'none', cursor: loading ? 'default' : 'pointer',
                  color: 'var(--color-text-muted)',
                  display: 'flex', alignItems: 'center', gap: 4,
                  fontFamily: 'var(--font-body)', fontSize: 11,
                  padding: '4px 8px', borderRadius: 6,
                }}
              >
                <motion.span
                  animate={loading ? { rotate: 360 } : { rotate: 0 }}
                  transition={loading ? { duration: 1, repeat: Infinity, ease: 'linear' } : {}}
                  style={{ display: 'flex' }}
                >
                  <RefreshCw size={13} />
                </motion.span>
                Actualizar
              </motion.button>
            </div>
          </div>

          {/* Feed de actividad */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {loading
              ? [0, 1, 2, 3].map((i) => <ActivitySkeleton key={i} />)
              : activity.length === 0
                ? (
                  <div style={{
                    fontFamily: 'var(--font-body)', fontSize: 13,
                    color: 'var(--color-text-muted)', textAlign: 'center',
                    padding: '24px 0',
                  }}>
                    Sin actividad registrada hoy
                  </div>
                )
                : activity.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    style={{ display: 'flex', gap: 12, paddingBottom: 16, position: 'relative' }}
                  >
                    {i < activity.length - 1 && (
                      <div style={{ position: 'absolute', left: 19, top: 28, bottom: 0, width: 1, background: 'var(--color-border)' }} />
                    )}
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: 'var(--color-blue-btn)',
                      marginTop: 6, flexShrink: 0, marginLeft: 16, zIndex: 1,
                    }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        {item.action}
                      </div>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                        {item.user}{item.branch ? ` · ${item.branch}` : ''}
                      </div>
                    </div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--color-text-muted)', flexShrink: 0, paddingTop: 2 }}>
                      {item.time}
                    </div>
                  </motion.div>
                ))
            }
          </div>
        </motion.div>
      </div>

      {/* Drawer de detalle por tarjeta */}
      {detailKPI && (
        <KPIDetailDrawer
          kpi={detailKPI}
          filters={filters}
          onClose={closeDetail}
        />
      )}
    </div>
  )
}
