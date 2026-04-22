import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronLeft, Save, Calculator, CheckCircle, Info } from 'lucide-react'
import AppHeader from '../components/layout/AppHeader'
import useGoalsStore, { calcFA, getTramo, TRAMO_META } from '../store/goalsStore'
import useUserStore from '../store/userStore'
import { SUCURSALES_LIST } from '../hooks/useKPIs'

// Período móvil de 12 meses: desde mes_actual-12 hasta mes_actual-1
// Ejemplo: reporte Marzo 2026 → acumula Marzo 2025 – Febrero 2026
function getRollingPeriod() {
  const now = new Date()
  const endDate   = new Date(now.getFullYear(), now.getMonth() - 1, 1)   // mes anterior al actual
  const startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1)   // mismo mes, año anterior
  const fmt = (d) => d.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1)
  return {
    start: cap(fmt(startDate)),
    end:   cap(fmt(endDate)),
    label: `${cap(fmt(startDate))} – ${cap(fmt(endDate))}`,
  }
}

const ROLLING = getRollingPeriod()

// ── Resumen FA de sucursal en la lista ─────────────────────────────────────
function BranchListRow({ branch, faEntry, onEdit }) {
  const tramo = getTramo(faEntry.fa)
  const t = TRAMO_META[tramo]
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 14px',
      borderBottom: '1px solid var(--color-border)',
    }}>
      <div style={{ width: 4, alignSelf: 'stretch', borderRadius: 2, background: t.color, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '0.03em' }}>
          {branch}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 800, color: t.color }}>
            {faEntry.fa.toFixed(2)}
          </span>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: t.color, opacity: 0.8 }}>
            {t.label}
          </span>
          {faEntry.mock && (
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
              · demo
            </span>
          )}
          {!faEntry.mock && (
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: '#27AE60' }}>
              · real
            </span>
          )}
        </div>
      </div>
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={() => onEdit(branch)}
        style={{
          background: 'rgba(47,128,237,0.1)',
          border: '1px solid rgba(47,128,237,0.25)',
          borderRadius: 8, padding: '6px 12px',
          fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700,
          letterSpacing: '0.05em', color: '#60A5FA', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 5,
        }}
      >
        EDITAR <ChevronRight size={12} />
      </motion.button>
    </div>
  )
}

// ── Campo numérico ──────────────────────────────────────────────────────────
function NumericField({ label, sublabel, value, onChange, min = 0 }) {
  return (
    <div style={{
      background: 'var(--color-navy)',
      border: '1px solid var(--color-border)',
      borderRadius: 10, padding: '12px 14px',
    }}>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 2 }}>
        {label}
      </div>
      {sublabel && (
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 8 }}>
          {sublabel}
        </div>
      )}
      <input
        type="number"
        min={min}
        value={value}
        onChange={(e) => onChange(Math.max(min, Number(e.target.value) || 0))}
        style={{
          width: '100%', background: 'transparent', border: 'none', outline: 'none',
          fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800,
          color: 'var(--color-text-primary)', letterSpacing: '0.02em',
          padding: 0,
        }}
      />
    </div>
  )
}

// ── Pantalla principal ─────────────────────────────────────────────────────
export default function FADataEntryScreen() {
  const { name } = useUserStore()
  const getFAForBranch = useGoalsStore((s) => s.getFAForBranch)
  const setFAData      = useGoalsStore((s) => s.setFAData)

  const [editBranch, setEditBranch] = useState(null)
  const [atp,        setAtp]        = useState(0)
  const [astp,       setAstp]       = useState(0)
  const [dotacion,   setDotacion]   = useState(1)
  const [saved,      setSaved]      = useState(false)

  // FA calculado en vivo
  const previewFA    = useMemo(() => calcFA({ atp, astp, dotacion }), [atp, astp, dotacion])
  const previewTramo = getTramo(previewFA)
  const previewMeta  = TRAMO_META[previewTramo]

  const handleEdit = (branch) => {
    const current = getFAForBranch(branch)
    setAtp(current.atp ?? 0)
    setAstp(current.astp ?? 0)
    setDotacion(current.dotacion ?? 1)
    setSaved(false)
    setEditBranch(branch)
  }

  const handleSave = () => {
    setFAData(editBranch, { atp, astp, dotacion, updatedBy: name || 'Admin' })
    setSaved(true)
    setTimeout(() => {
      setEditBranch(null)
      setSaved(false)
    }, 1200)
  }

  const handleBack = () => {
    setEditBranch(null)
    setSaved(false)
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--color-navy)' }}>
      <AppHeader
        title={editBranch ? editBranch : 'Ingreso FA'}
        onBack={editBranch ? handleBack : undefined}
      />

      <AnimatePresence mode="wait">

        {/* ── Vista lista de sucursales ── */}
        {!editBranch && (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ flex: 1, overflowY: 'auto', paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))' }}
          >
            {/* Info cabecera */}
            <div style={{ padding: '16px 16px 8px' }}>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-text-muted)' }}>
                Período móvil 12 meses: <strong style={{ color: 'var(--color-text-secondary)' }}>{ROLLING.label}</strong>
              </div>
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 6,
                marginTop: 6, padding: '8px 10px',
                background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.15)', borderRadius: 8,
              }}>
                <Info size={13} color="#60A5FA" style={{ flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#60A5FA', lineHeight: 1.5 }}>
                  ATP y ASTP corresponden a la <strong>sumatoria de eventos en los últimos 12 meses</strong>, no al mes en curso.
                </span>
              </div>
            </div>

            {/* Lista */}
            <div style={{
              background: 'var(--color-navy-mid)',
              border: '1px solid var(--color-border)',
              borderRadius: 12, margin: '8px 16px', overflow: 'hidden',
            }}>
              {SUCURSALES_LIST.map((branch) => (
                <BranchListRow
                  key={branch}
                  branch={branch}
                  faEntry={getFAForBranch(branch)}
                  onEdit={handleEdit}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Vista edición de sucursal ── */}
        {editBranch && (
          <motion.div
            key="edit"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="content-col" style={{ flex: 1, padding: '20px 16px', overflowY: 'auto', paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))', display: 'flex', flexDirection: 'column', gap: 14 }}
          >

            {/* Período móvil */}
            <div style={{
              background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.15)',
              borderRadius: 10, padding: '10px 14px',
            }}>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#60A5FA', marginBottom: 2 }}>
                Período móvil 12 meses
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                {ROLLING.label}
              </div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--color-text-muted)', marginTop: 3 }}>
                Ingresa la <strong>sumatoria total</strong> de accidentes registrados en este período.
              </div>
            </div>

            {/* Campos de entrada */}
            <NumericField
              label="CTP — Accidente con Tiempo Perdido"
              sublabel={`Sumatoria ${ROLLING.start} – ${ROLLING.end}`}
              value={atp}
              onChange={setAtp}
            />
            <NumericField
              label="STP — Accidente sin Tiempo Perdido"
              sublabel={`Sumatoria ${ROLLING.start} – ${ROLLING.end}`}
              value={astp}
              onChange={setAstp}
            />
            <NumericField
              label="Dotación"
              sublabel="Total de trabajadores activos en la sucursal"
              value={dotacion}
              onChange={setDotacion}
              min={1}
            />

            {/* Preview FA en vivo */}
            <motion.div
              key={previewTramo}
              initial={{ scale: 0.97 }}
              animate={{ scale: 1 }}
              style={{
                background: previewMeta.bg,
                border: `1.5px solid ${previewMeta.border}`,
                borderRadius: 12, padding: '16px',
                display: 'flex', alignItems: 'center', gap: 16,
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Calculator size={13} color={previewMeta.color} />
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, color: previewMeta.color, letterSpacing: '0.06em' }}>
                    RESULTADO FA
                  </span>
                </div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: previewMeta.color, opacity: 0.8 }}>
                  ((CTP × 0,70) + (STP × 0,30)) / Dotación × 100
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 900, color: previewMeta.color, lineHeight: 1 }}>
                  {previewFA.toFixed(2)}
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, color: previewMeta.color, opacity: 0.8, marginTop: 3 }}>
                  {previewMeta.label.toUpperCase()}
                </div>
              </div>
            </motion.div>

            {/* Botón guardar */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSave}
              disabled={saved}
              style={{
                width: '100%', padding: '15px',
                background: saved ? 'rgba(39,174,96,0.15)' : 'var(--color-blue-btn)',
                border: saved ? '1px solid rgba(39,174,96,0.3)' : 'none',
                borderRadius: 12, cursor: saved ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700,
                letterSpacing: '0.06em',
                color: saved ? '#27AE60' : '#fff',
                transition: 'all 0.2s',
              }}
            >
              {saved ? (
                <>
                  <CheckCircle size={17} />
                  GUARDADO
                </>
              ) : (
                <>
                  <Save size={17} />
                  GUARDAR FA
                </>
              )}
            </motion.button>

            <button
              onClick={handleBack}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
                fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-text-muted)',
                padding: '4px 0',
              }}
            >
              <ChevronLeft size={15} /> Volver a la lista
            </button>

          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}
