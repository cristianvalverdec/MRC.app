import { useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BarChart2, TrendingUp, ClipboardCheck, Users } from 'lucide-react'
import AppHeader from '../components/layout/AppHeader'
import useFormStore from '../store/formStore'
import { IS_DEV_MODE } from '../services/sharepointData'

const PERIOD_FILTERS = [
  { key: 'week',  label: 'Semana' },
  { key: 'month', label: 'Mes'    },
  { key: 'year',  label: 'Año'    },
]

// Etiquetas de formularios para el resumen dev
const FORM_LABELS = {
  'pauta-verificacion-reglas-oro': 'Pautas',
  'caminata-seguridad':             'Caminatas',
  'inspeccion-simple':              'Inspecciones',
  'difusiones-sso':                 'Difusiones',
  'observacion-conductual':         'Obs. Conductual',
  'inspeccion-planificada':         'Insp. Planificada',
}

// Datos sintéticos por período para el placeholder dev
function mockSummary(period) {
  const multipliers = { week: 1, month: 4.3, year: 52 }
  const m = multipliers[period] || 1
  return [
    { label: 'Registros totales',   value: Math.round(47 * m), icon: <ClipboardCheck size={18} color="#60A5FA" />, color: '#60A5FA' },
    { label: 'Usuarios activos',    value: Math.round(12 * m * 0.3), icon: <Users size={18} color="#6FCF97" />,      color: '#6FCF97' },
    { label: 'Cumplimiento',        value: `${Math.min(98, Math.round(72 + m * 0.5))}%`, icon: <TrendingUp size={18} color="var(--color-orange)" />, color: 'var(--color-orange)' },
    { label: 'Observaciones graves',value: Math.round(3 * m * 0.4), icon: <BarChart2 size={18} color="#EB5757" />,   color: '#EB5757' },
  ]
}

// Mini barra de progreso para el chart de tipos de formulario
function MiniBar({ label, value, max, color }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-text-muted)' }}>{label}</span>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, color: 'var(--color-text-primary)' }}>{value}</span>
      </div>
      <div style={{ height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 99, overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          style={{ height: '100%', background: color, borderRadius: 99 }}
        />
      </div>
    </div>
  )
}

// ── Placeholder completo para modo dev / sin Power BI ─────────────────────
function DevPlaceholder({ period, unitType }) {
  const pendingQueue = useFormStore((s) => s.pendingQueue)

  // Contar envíos locales por tipo de formulario
  const localCounts = useMemo(() => {
    const counts = {}
    pendingQueue.forEach((item) => {
      if (item.formType) counts[item.formType] = (counts[item.formType] || 0) + 1
    })
    return counts
  }, [pendingQueue])

  const hasLocalData = Object.keys(localCounts).length > 0
  const summary = mockSummary(period)
  const maxCount = Math.max(...Object.values(localCounts), 1)

  const barColors = ['#1A52B8', '#27AE60', '#F57C20', '#EB5757', '#7B3FE4', '#2F80ED']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Tarjetas de resumen */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {summary.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            style={{
              background: 'var(--color-navy-mid)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-card)',
              padding: '14px 16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              {item.icon}
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--color-text-muted)', letterSpacing: '0.04em' }}>
                {item.label}
              </span>
            </div>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800,
              color: item.color, lineHeight: 1,
            }}>
              {item.value}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Distribución por tipo de formulario */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={{
          background: 'var(--color-navy-mid)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-card)',
          padding: '16px 18px',
        }}
      >
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700,
          letterSpacing: '0.06em', textTransform: 'uppercase',
          color: 'var(--color-text-secondary)', marginBottom: 14,
        }}>
          Registros por herramienta
        </div>
        {hasLocalData
          ? Object.entries(localCounts).map(([formType, count], i) => (
            <MiniBar
              key={formType}
              label={FORM_LABELS[formType] || formType}
              value={count}
              max={maxCount}
              color={barColors[i % barColors.length]}
            />
          ))
          : (
            <>
              {[
                { label: 'Pautas Verificación', value: 15, max: 15 },
                { label: 'Caminatas',           value: 8,  max: 10 },
                { label: 'Difusiones SSO',      value: 5,  max: 5  },
                { label: 'Inspecciones',        value: 3,  max: 8  },
              ].map(({ label, value, max }, i) => (
                <MiniBar
                  key={label}
                  label={label}
                  value={value}
                  max={max}
                  color={barColors[i]}
                />
              ))}
            </>
          )
        }
      </motion.div>

      {/* Aviso de configuración */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        style={{
          background: 'rgba(47,128,237,0.06)',
          border: '1px dashed rgba(47,128,237,0.25)',
          borderRadius: 10, padding: '12px 16px',
          display: 'flex', alignItems: 'flex-start', gap: 10,
        }}
      >
        <BarChart2 size={16} color="#60A5FA" style={{ marginTop: 1, flexShrink: 0 }} />
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
          Para activar el reporte Power BI embebido, configura
          {' '}<code style={{ color: '#93B4F8', fontSize: 11 }}>VITE_PBI_REPORT_ID</code>{' '}
          y{' '}<code style={{ color: '#93B4F8', fontSize: 11 }}>VITE_AZURE_TENANT_ID</code>{' '}
          en el archivo <code style={{ color: '#93B4F8', fontSize: 11 }}>.env</code>.
        </div>
      </motion.div>
    </div>
  )
}

// ── Pantalla principal ────────────────────────────────────────────────────
export default function AnalyticsScreen() {
  const { unitType }  = useParams()
  const [period, setPeriod] = useState('month')

  const reportId = import.meta.env.VITE_PBI_REPORT_ID
  const tenantId = import.meta.env.VITE_AZURE_TENANT_ID
  const hasPBI   = !!(reportId && tenantId) && !IS_DEV_MODE

  // Construir URL del reporte filtrando por período
  const pbiUrl = hasPBI
    ? `https://app.powerbi.com/reportEmbed?reportId=${reportId}&autoAuth=true&ctid=${tenantId}&filterPaneEnabled=false`
    : null

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--color-navy)' }}>
      <AppHeader title="Analítica del Programa" />

      <div style={{ flex: 1, padding: '16px 16px', paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))', display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }}>

        {/* Filtros de período */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', gap: 8 }}
        >
          {PERIOD_FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setPeriod(key)}
              style={{
                padding: '7px 18px',
                borderRadius: 'var(--radius-pill)',
                border: period === key ? 'none' : '1px solid var(--color-border)',
                background: period === key ? 'var(--color-blue-btn)' : 'transparent',
                color: period === key ? '#fff' : 'var(--color-text-secondary)',
                fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', minHeight: 40,
                transition: 'all 0.15s',
              }}
            >
              {label}
            </button>
          ))}
        </motion.div>

        {/* Contenido principal */}
        {hasPBI ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            style={{ flex: 1 }}
          >
            <iframe
              src={pbiUrl}
              style={{
                width: '100%',
                height: 'calc(100dvh - 160px)',
                border: 'none',
                borderRadius: 12,
              }}
              title="Analytics Dashboard"
            />
          </motion.div>
        ) : (
          <DevPlaceholder period={period} unitType={unitType} />
        )}
      </div>
    </div>
  )
}
