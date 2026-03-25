import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, AlertCircle, Clock, Upload, Filter } from 'lucide-react'
import AppHeader from '../components/layout/AppHeader'
import KPICard from '../components/ui/KPICard'
import { unitLabels } from '../config/routes'
import { useKPIs, SUCURSALES_LIST, CANALES_FDV } from '../hooks/useKPIs'

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

// ── Pantalla principal ────────────────────────────────────────────────────
export default function DailyStatusScreen() {
  const { unitType } = useParams()
  const label = unitLabels[unitType] || unitType

  const isSucursales = unitType !== 'fuerza-de-ventas'
  const [selectedBranch, setSelectedBranch] = useState('all')
  const [selectedCanal,  setSelectedCanal]  = useState('all')

  const filters = isSucursales
    ? { branch: selectedBranch }
    : { canal:  selectedCanal }

  const { kpis, activity, loading, error, lastUpdated, refresh, localPendingCount } = useKPIs(unitType, filters)

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--color-navy)' }}>
      <AppHeader title="Estatus Diario" />

      <div style={{ flex: 1, padding: '20px 16px', overflowY: 'auto', paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))' }}>

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
            : kpis.map((kpi, i) => <KPICard key={kpi.formType} {...kpi} delay={i * 0.08} />)
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
    </div>
  )
}
