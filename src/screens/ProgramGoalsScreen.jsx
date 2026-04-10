import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Filter, ChevronDown, ChevronUp, Info, ClipboardList, PersonStanding, Megaphone, Pencil } from 'lucide-react'
import AppHeader from '../components/layout/AppHeader'
import { containerVariants, itemVariants } from '../components/ui/menuCardVariants'
import useGoalsStore, { getTramo, TRAMO_META } from '../store/goalsStore'
import useUserStore from '../store/userStore'
import { SUCURSALES_LIST } from '../hooks/useKPIs'
import { IS_DEV_MODE } from '../services/sharepointData'

// ── Fórmula explicada ─────────────────────────────────────────────────────
function FormulaCard() {
  const [open, setOpen] = useState(false)
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: 'rgba(47,128,237,0.07)',
        border: '1px solid rgba(47,128,237,0.2)',
        borderRadius: 10, overflow: 'hidden',
      }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: '100%', background: 'none', border: 'none', cursor: 'pointer',
          padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8,
        }}
      >
        <Info size={14} color="#60A5FA" />
        <span style={{ flex: 1, fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, color: '#93B4F8', letterSpacing: '0.05em', textAlign: 'left' }}>
          ¿CÓMO SE CALCULA EL FACTOR DE ACCIDENTABILIDAD?
        </span>
        {open ? <ChevronUp size={14} color="#60A5FA" /> : <ChevronDown size={14} color="#60A5FA" />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0 14px 14px' }}>
              <div style={{
                fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700,
                color: 'var(--color-text-primary)', textAlign: 'center',
                background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: '10px 14px',
                marginBottom: 10, letterSpacing: '0.01em',
              }}>
                FA = ((CTP × 0,70) + (STP × 0,30)) / Dotación × 100
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {[
                  ['CTP',      'Sumatoria de accidentes con tiempo perdido en los últimos 12 meses'],
                  ['STP',      'Sumatoria de accidentes sin tiempo perdido en los últimos 12 meses'],
                  ['Dotación', 'Total de trabajadores activos en la sucursal'],
                ].map(([abbr, def]) => (
                  <div key={abbr} style={{ display: 'flex', gap: 8 }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, color: '#93B4F8', minWidth: 64 }}>{abbr}</span>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-text-muted)' }}>{def}</span>
                  </div>
                ))}
              </div>
              <div style={{
                marginTop: 10, padding: '8px 10px',
                background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.15)', borderRadius: 7,
                fontFamily: 'var(--font-body)', fontSize: 11, color: '#60A5FA', lineHeight: 1.5,
              }}>
                📅 <strong>Período móvil:</strong> se acumula desde el mismo mes del año anterior hasta el mes inmediatamente anterior al período en curso. Ej: reporte Marzo 2026 → acumula Marzo 2025 – Febrero 2026.
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Semáforo de tramos ────────────────────────────────────────────────────
function TramoLegend() {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {Object.entries(TRAMO_META).map(([key, t]) => (
        <div key={key} style={{
          flex: 1, background: t.bg, border: `1px solid ${t.border}`,
          borderRadius: 8, padding: '8px 6px', textAlign: 'center',
        }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, color: t.color, letterSpacing: '0.04em' }}>
            {t.label.toUpperCase()}
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: t.color, opacity: 0.8, marginTop: 2 }}>
            FA {t.range}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Card de actividades requeridas ────────────────────────────────────────
function ActivityTargetsCard({ tramo, targets }) {
  const t = TRAMO_META[tramo]
  const items = [
    {
      icon: <ClipboardList size={16} color={t.color} />,
      label: 'Pautas Verificación',
      sublabel: 'Turno Mañana / Tarde / Noche',
      value: targets.pautasTurnos,
      unit: 'por turno',
    },
    {
      icon: <ClipboardList size={16} color={t.color} />,
      label: 'Pautas Verificación',
      sublabel: 'Administración',
      value: targets.pautasAdmin,
      unit: 'por mes',
    },
    {
      icon: <PersonStanding size={16} color={t.color} />,
      label: 'Caminatas de Seguridad',
      sublabel: 'Líderes',
      value: targets.caminatas,
      unit: 'por mes',
    },
    {
      icon: <Megaphone size={16} color={t.color} />,
      label: 'Difusiones SSO',
      sublabel: targets.periodicidadDifusiones,
      value: targets.difusiones,
      unit: 'por mes',
    },
  ]
  return (
    <div style={{
      background: t.bg, border: `1.5px solid ${t.border}`,
      borderRadius: 12, overflow: 'hidden',
    }}>
      {/* Header del card */}
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${t.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: t.color }} />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, letterSpacing: '0.06em', color: t.color }}>
            {t.label.toUpperCase()}
          </span>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: t.color, opacity: 0.7 }}>
            · FA {t.range}
          </span>
        </div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: t.color, opacity: 0.75, marginTop: 4 }}>
          Actividades mínimas requeridas este mes
        </div>
      </div>
      {/* Filas de actividades */}
      {items.map((item, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', padding: '11px 16px', gap: 12,
          borderBottom: i < items.length - 1 ? `1px solid ${t.border}` : 'none',
        }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {item.icon}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>
              {item.label}
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: t.color, opacity: 0.75, marginTop: 1 }}>
              {item.sublabel}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: t.color, lineHeight: 1 }}>
              {item.value}
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: t.color, opacity: 0.7 }}>
              {item.unit}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Badge de FA para la vista general ────────────────────────────────────
function BranchFARow({ branch, faEntry, onSelect }) {
  const tramo = getTramo(faEntry.fa)
  const t = TRAMO_META[tramo]
  return (
    <motion.button
      variants={itemVariants}
      onClick={onSelect}
      style={{
        width: '100%', background: 'var(--color-navy-mid)',
        border: `1px solid ${t.border}`,
        borderLeft: `4px solid ${t.color}`,
        borderRadius: 10, padding: '12px 14px',
        display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '0.04em' }}>
          {branch}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: t.color, flexShrink: 0 }} />
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: t.color }}>
            {t.label}
          </span>
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: t.color, lineHeight: 1 }}>
          {faEntry.fa.toFixed(2)}
        </div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 9, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          FA {faEntry.mock ? 'ABR 2026' : faEntry.month}
        </div>
      </div>
    </motion.button>
  )
}

// ── Resumen de tramos (vista global) ─────────────────────────────────────
function TramoSummary({ counts }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 4 }}>
      {Object.entries(TRAMO_META).map(([key, t]) => (
        <div key={key} style={{
          background: t.bg, border: `1px solid ${t.border}`, borderRadius: 8,
          padding: '10px 8px', textAlign: 'center',
        }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: t.color, lineHeight: 1 }}>
            {counts[key] || 0}
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: t.color, marginTop: 3 }}>
            {key === 'bajo' ? 'Bajo' : key === 'medio' ? 'Medio' : 'Alto'}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Pantalla principal ────────────────────────────────────────────────────
export default function ProgramGoalsScreen() {
  const navigate           = useNavigate()
  const getFAForBranch     = useGoalsStore((s) => s.getFAForBranch)
  const getTargetsForTramo = useGoalsStore((s) => s.getTargetsForTramo)
  const role               = useUserStore((s) => s.role)
  const isAdmin            = role === 'admin' || IS_DEV_MODE

  const [selectedBranch, setSelectedBranch] = useState('all')

  // Construir mapa FA de todas las sucursales
  const allBranchesFA = SUCURSALES_LIST.map((branch) => ({
    branch,
    faEntry: getFAForBranch(branch),
  }))

  // Contar por tramo para resumen
  const tramoCounts = allBranchesFA.reduce((acc, { faEntry }) => {
    const t = getTramo(faEntry.fa)
    acc[t] = (acc[t] || 0) + 1
    return acc
  }, {})

  // Datos de la sucursal seleccionada
  const selectedFA    = selectedBranch !== 'all' ? getFAForBranch(selectedBranch) : null
  const selectedTramo = selectedFA ? getTramo(selectedFA.fa) : null
  const targets       = selectedTramo ? getTargetsForTramo(selectedTramo) : null

  const adminAction = isAdmin ? (
    <motion.button
      whileTap={{ scale: 0.88 }}
      onClick={() => navigate('/admin/fa-data')}
      style={{
        background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.25)',
        borderRadius: 8, padding: '5px 10px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 5,
        fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700,
        letterSpacing: '0.05em', color: '#60A5FA',
      }}
    >
      <Pencil size={12} /> FA
    </motion.button>
  ) : null

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--color-navy)' }}>
      <AppHeader title="Metas del Programa" rightAction={adminAction} />

      <div style={{ flex: 1, padding: '20px 16px', overflowY: 'auto', paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Fórmula colapsable */}
        <FormulaCard />

        {/* Semáforo de tramos */}
        <TramoLegend />

        {/* Resumen conteos si estamos en vista global */}
        {selectedBranch === 'all' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
              Distribución de sucursales
            </div>
            <TramoSummary counts={tramoCounts} />
          </motion.div>
        )}

        {/* Filtro por sucursal */}
        <div style={{
          background: 'var(--color-navy-mid)', border: '1px solid var(--color-border)',
          borderRadius: 10, padding: '12px 14px',
        }}>
          <div style={{
            fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600,
            color: 'var(--color-text-muted)', letterSpacing: '0.08em',
            textTransform: 'uppercase', marginBottom: 8,
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <Filter size={10} />
            Filtrar por sucursal / CD
          </div>
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
            <button
              onClick={() => setSelectedBranch('all')}
              style={{
                flexShrink: 0, padding: '5px 14px', borderRadius: 'var(--radius-pill)',
                border: selectedBranch === 'all' ? 'none' : '1px solid var(--color-border)',
                background: selectedBranch === 'all' ? 'var(--color-blue-btn)' : 'rgba(255,255,255,0.04)',
                color: selectedBranch === 'all' ? '#fff' : 'var(--color-text-muted)',
                fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600,
                cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              Todas
            </button>
            {SUCURSALES_LIST.map((branch) => {
              const fa = getFAForBranch(branch)
              const tramo = getTramo(fa.fa)
              const tc = TRAMO_META[tramo]
              const active = selectedBranch === branch
              return (
                <button
                  key={branch}
                  onClick={() => setSelectedBranch(active ? 'all' : branch)}
                  style={{
                    flexShrink: 0, padding: '5px 12px', borderRadius: 'var(--radius-pill)',
                    border: active ? 'none' : `1px solid ${tc.border}`,
                    background: active ? tc.color : tc.bg,
                    color: active ? '#fff' : tc.color,
                    fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', whiteSpace: 'nowrap',
                    transition: 'all 0.15s',
                  }}
                >
                  {branch}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Vista detalle de sucursal seleccionada ── */}
        <AnimatePresence mode="wait">
          {selectedBranch !== 'all' && selectedFA && targets ? (
            <motion.div
              key="detail"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
            >
              {/* Header de sucursal + FA */}
              <div style={{
                background: 'var(--color-navy-mid)', border: '1px solid var(--color-border)',
                borderRadius: 12, padding: '16px',
              }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
                  {selectedBranch}
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 2 }}>
                      Factor de Accidentabilidad
                    </div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 42, fontWeight: 900, color: TRAMO_META[selectedTramo].color, lineHeight: 1 }}>
                      {selectedFA.fa.toFixed(2)}
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '6px 14px', borderRadius: 8,
                      background: TRAMO_META[selectedTramo].bg,
                      border: `1.5px solid ${TRAMO_META[selectedTramo].border}`,
                      marginBottom: 4,
                    }}>
                      <div style={{ width: 9, height: 9, borderRadius: '50%', background: TRAMO_META[selectedTramo].color }} />
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: TRAMO_META[selectedTramo].color, letterSpacing: '0.05em' }}>
                        {TRAMO_META[selectedTramo].label.toUpperCase()}
                      </span>
                    </div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--color-text-muted)' }}>
                      FA {TRAMO_META[selectedTramo].range}
                    </div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
                      {selectedFA.mock ? 'Dato Abril 2026' : selectedFA.month}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card de metas */}
              <ActivityTargetsCard tramo={selectedTramo} targets={targets} />
            </motion.div>

          ) : selectedBranch === 'all' ? (
            // ── Vista lista de todas las sucursales ──
            <motion.div
              key="list"
              variants={containerVariants}
              initial="initial"
              animate="animate"
              style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
            >
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
                {SUCURSALES_LIST.length} sucursales · ordenadas por riesgo ↓
              </div>
              {[...allBranchesFA]
                .sort((a, b) => b.faEntry.fa - a.faEntry.fa)
                .map(({ branch, faEntry }) => (
                  <BranchFARow
                    key={branch}
                    branch={branch}
                    faEntry={faEntry}
                    onSelect={() => setSelectedBranch(branch)}
                  />
                ))
              }
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  )
}
