import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BarChart2, TrendingUp, ClipboardCheck, Layers, RefreshCw, AlertCircle } from 'lucide-react'
import AppHeader from '../components/layout/AppHeader'
import { fetchAnalytics, IS_DEV_MODE } from '../services/sharepointData'

const PERIOD_FILTERS = [
  { key: 'week',  label: 'Semana' },
  { key: 'month', label: 'Mes'    },
  { key: 'year',  label: 'Año'    },
]

const PERIOD_LABEL = { week: 'esta semana', month: 'este mes', year: 'este año' }

// ── Mock para dev mode ────────────────────────────────────────────────────
function buildMockAnalytics(period) {
  const m = { week: 1, month: 4.3, year: 52 }[period] || 1
  return {
    summary: [
      { label: 'Registros totales',    value: Math.round(47 * m),    color: '#60A5FA' },
      { label: 'Cumplimiento',         value: '78%',                  color: '#F57C20' },
      { label: 'Herramientas activas', value: 4,                      color: '#7B3FE4' },
      { label: 'vs período anterior',  value: '+12%',                 color: '#27AE60' },
    ],
    byFormType: [
      { label: 'Pautas Verificación', count: Math.round(15 * m), target: Math.round(15 * m * 1.2) },
      { label: 'Caminatas',           count: Math.round(8  * m), target: Math.round(10 * m) },
      { label: 'Difusiones SSO',      count: Math.round(5  * m), target: Math.round(5  * m) },
      { label: 'Inspecciones',        count: Math.round(3  * m), target: Math.round(8  * m) },
    ],
    totalCurrent: Math.round(47 * m),
    compliance: 78,
  }
}

// ── Tarjeta de resumen ────────────────────────────────────────────────────
function SummaryCard({ label, value, color, icon, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      style={{
        background: 'var(--color-navy-mid)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-card)',
        padding: '14px 16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        {icon}
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--color-text-muted)', letterSpacing: '0.03em' }}>
          {label}
        </span>
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color, lineHeight: 1 }}>
        {value}
      </div>
    </motion.div>
  )
}

// ── Barra de formulario ───────────────────────────────────────────────────
function FormBar({ label, count, target, color, delay }) {
  const pct = target > 0 ? Math.min(100, Math.round((count / target) * 100)) : 0
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      style={{ marginBottom: 14 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-text-secondary)' }}>
          {label}
        </span>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, color: 'var(--color-text-primary)' }}>
          {count} <span style={{ fontWeight: 400, color: 'var(--color-text-muted)', fontSize: 11 }}>/ {target}</span>
        </span>
      </div>
      <div style={{ height: 6, background: 'rgba(255,255,255,0.07)', borderRadius: 99, overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay }}
          style={{ height: '100%', background: color, borderRadius: 99 }}
        />
      </div>
      <div style={{ marginTop: 3, fontFamily: 'var(--font-body)', fontSize: 10, color: pct >= 100 ? '#27AE60' : 'var(--color-text-muted)' }}>
        {pct}% del objetivo
      </div>
    </motion.div>
  )
}

const BAR_COLORS = ['#1A52B8', '#27AE60', '#F57C20', '#7B3FE4', '#EB5757', '#2F80ED']

// ── Skeleton ──────────────────────────────────────────────────────────────
function Skeleton({ height = 80, delay = 0 }) {
  return (
    <motion.div
      animate={{ opacity: [0.3, 0.6, 0.3] }}
      transition={{ duration: 1.4, repeat: Infinity, delay }}
      style={{ height, borderRadius: 12, background: 'var(--color-navy-mid)' }}
    />
  )
}

// ── Pantalla principal ────────────────────────────────────────────────────
export default function AnalyticsScreen() {
  const { unitType } = useParams()
  const [period, setPeriod]   = useState('month')
  const [data,   setData]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      if (IS_DEV_MODE) {
        await new Promise(r => setTimeout(r, 500))
        setData(buildMockAnalytics(period))
      } else {
        const result = await fetchAnalytics(unitType, period)
        setData(result)
      }
    } catch {
      setError('No se pudieron cargar los datos de analítica.')
    } finally {
      setLoading(false)
    }
  }, [unitType, period])

  useEffect(() => { load() }, [load])

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--color-navy)' }}>
      <AppHeader title="Analítica del Programa" />

      <div className="content-col" style={{ flex: 1, padding: '16px', paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))', display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }}>

        {/* Selector de período */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {PERIOD_FILTERS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setPeriod(key)}
                style={{
                  padding: '7px 18px', borderRadius: 'var(--radius-pill)',
                  border: period === key ? 'none' : '1px solid var(--color-border)',
                  background: period === key ? 'var(--color-blue-btn)' : 'transparent',
                  color: period === key ? '#fff' : 'var(--color-text-secondary)',
                  fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', minHeight: 40, transition: 'all 0.15s',
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={load}
            disabled={loading}
            style={{
              background: 'none', border: 'none', cursor: loading ? 'default' : 'pointer',
              color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4,
              fontFamily: 'var(--font-body)', fontSize: 11, padding: '4px 8px', borderRadius: 6,
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

        {/* Error */}
        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'rgba(235,87,87,0.08)', border: '1px solid rgba(235,87,87,0.25)',
            borderRadius: 10, padding: '12px 14px',
          }}>
            <AlertCircle size={16} color="#EB5757" />
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#EB5757' }}>{error}</span>
          </div>
        )}

        {/* Tarjetas resumen */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[0,1,2,3].map(i => <Skeleton key={i} height={90} delay={i*0.1} />)}
          </div>
        ) : data ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {data.summary.map((item, i) => (
                <SummaryCard
                  key={item.label}
                  label={item.label}
                  value={item.value}
                  color={item.color}
                  delay={i * 0.07}
                  icon={
                    i === 0 ? <ClipboardCheck size={16} color={item.color} /> :
                    i === 1 ? <TrendingUp     size={16} color={item.color} /> :
                    i === 2 ? <Layers         size={16} color={item.color} /> :
                              <BarChart2      size={16} color={item.color} />
                  }
                />
              ))}
            </div>

            {/* Barras por herramienta */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28 }}
              style={{
                background: 'var(--color-navy-mid)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-card)', padding: '16px 18px',
              }}
            >
              <div style={{
                fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700,
                letterSpacing: '0.07em', textTransform: 'uppercase',
                color: 'var(--color-text-muted)', marginBottom: 16,
              }}>
                Registros por herramienta · {PERIOD_LABEL[period]}
              </div>
              {data.byFormType.map((row, i) => (
                <FormBar
                  key={row.label}
                  label={row.label}
                  count={row.count}
                  target={row.target}
                  color={BAR_COLORS[i % BAR_COLORS.length]}
                  delay={0.32 + i * 0.06}
                />
              ))}
            </motion.div>

            {/* Badge modo dev */}
            {IS_DEV_MODE && (
              <div style={{
                background: 'rgba(245,124,32,0.06)',
                border: '1px dashed rgba(245,124,32,0.2)',
                borderRadius: 8, padding: '8px 14px',
                fontFamily: 'var(--font-body)', fontSize: 11,
                color: 'var(--color-orange)', textAlign: 'center',
              }}>
                Datos de demostración — conecta Azure AD para ver datos reales
              </div>
            )}
          </>
        ) : null}

      </div>
    </div>
  )
}
