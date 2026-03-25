import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, AlertTriangle, Hash, Wrench, MapPin, Send } from 'lucide-react'
import AppHeader from '../components/layout/AppHeader'
import useFormStore from '../store/formStore'
import useUserStore from '../store/userStore'

// ── Campo de texto reutilizable ───────────────────────────────────────────
function Field({ icon, label, sublabel, value, onChange, placeholder, multiline = false }) {
  return (
    <div
      style={{
        background: 'var(--color-navy-mid)',
        border: '1px solid var(--color-border)',
        borderRadius: 12, padding: '14px 16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ color: 'var(--color-text-muted)' }}>{icon}</span>
        <div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
            {label}
          </div>
          {sublabel && (
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--color-text-muted)' }}>
              {sublabel}
            </div>
          )}
        </div>
      </div>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          style={{
            width: '100%', background: 'transparent', border: 'none', outline: 'none', resize: 'none',
            fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--color-text-primary)',
            lineHeight: 1.5,
          }}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width: '100%', background: 'transparent', border: 'none', outline: 'none',
            fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700,
            color: 'var(--color-text-primary)', letterSpacing: '0.04em',
          }}
        />
      )}
    </div>
  )
}

// ── Pantalla principal ────────────────────────────────────────────────────
export default function CierreCondicionesScreen() {
  const navigate   = useNavigate()
  const { unitType } = useParams()
  const { name, email, branch } = useUserStore()
  const addToPendingQueue = useFormStore((s) => s.addToPendingQueue)

  const [codigo,           setCodigo]           = useState('')
  const [medida,           setMedida]           = useState('')
  const [area,             setArea]             = useState('')
  const [submitted,        setSubmitted]        = useState(false)
  const [codigoError,      setCodigoError]      = useState(false)

  const isValid = codigo.trim().length > 0 && medida.trim().length > 0

  const handleSubmit = () => {
    if (!codigo.trim()) {
      setCodigoError(true)
      return
    }
    setCodigoError(false)

    addToPendingQueue({
      formType:  'cierre-condiciones',
      unitType:  unitType || 'sucursales',
      branch:    branch || '',
      userName:  name  || '',
      userEmail: email || '',
      data: {
        codigoReporte:      codigo.trim().toUpperCase(),
        medidaImplementada: medida.trim(),
        areaImplementacion: area.trim(),
      },
    })

    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--color-navy)' }}>
        <AppHeader title="Cierre de Condición" onBack={() => navigate(-1)} />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '32px 24px', gap: 20, textAlign: 'center',
          }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
            style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'rgba(39,174,96,0.12)',
              border: '2px solid rgba(39,174,96,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <CheckCircle size={38} color="#27AE60" />
          </motion.div>

          <div>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800,
              color: 'var(--color-text-primary)', marginBottom: 8,
            }}>
              Cierre Registrado
            </div>
            <div style={{
              fontFamily: 'var(--font-body)', fontSize: 13,
              color: 'var(--color-text-muted)', lineHeight: 1.5,
            }}>
              La condición <strong style={{ color: '#27AE60' }}>{codigo.trim().toUpperCase()}</strong>{' '}
              quedó registrada para cierre. Power BI actualizará el estado automáticamente.
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(`/unit/${unitType}/tools`)}
            style={{
              marginTop: 8, padding: '14px 32px',
              background: 'var(--color-blue-btn)', border: 'none',
              borderRadius: 12, cursor: 'pointer',
              fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700,
              letterSpacing: '0.06em', color: '#fff',
            }}
          >
            VOLVER AL MENÚ
          </motion.button>
        </motion.div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--color-navy)' }}>
      <AppHeader title="Cierre de Condición" onBack={() => navigate(-1)} />

      <div
        style={{
          flex: 1, padding: '20px 16px',
          paddingBottom: 'calc(32px + env(safe-area-inset-bottom, 0px))',
          overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14,
        }}
      >
        {/* Banner informativo */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'rgba(96,165,250,0.06)',
            border: '1px solid rgba(96,165,250,0.18)',
            borderRadius: 10, padding: '12px 14px',
            display: 'flex', gap: 10,
          }}
        >
          <AlertTriangle size={15} color="#60A5FA" style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#60A5FA', lineHeight: 1.55 }}>
            Ingresa el <strong>Código de Reporte</strong> generado en la Inspección Simple.
            Power BI cruzará el ID para cambiar el estado a <strong>Cerrada</strong>.
          </div>
        </motion.div>

        {/* Campo código */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Field
            icon={<Hash size={15} />}
            label="Código de Reporte Asociado"
            sublabel="Ej: IS-MIR-123456"
            value={codigo}
            onChange={(v) => { setCodigo(v); setCodigoError(false) }}
            placeholder="IS-XXX-000000"
          />
          <AnimatePresence>
            {codigoError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{
                  fontFamily: 'var(--font-body)', fontSize: 11,
                  color: '#EB5757', marginTop: 4, paddingLeft: 4,
                }}
              >
                El código de reporte es obligatorio
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Medida implementada */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Field
            icon={<Wrench size={15} />}
            label="Medida de Control Implementada"
            sublabel="Describe qué se hizo para resolver la condición"
            value={medida}
            onChange={setMedida}
            placeholder="Ej: Se reparó el piso dañado y se señalizó el área…"
            multiline
          />
        </motion.div>

        {/* Área donde se implementó */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Field
            icon={<MapPin size={15} />}
            label="Área donde se Implementó"
            sublabel="Opcional"
            value={area}
            onChange={setArea}
            placeholder="Ej: Bodega frigorífica — sector B"
          />
        </motion.div>

        {/* Info sucursal */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--color-border)',
            borderRadius: 10, padding: '10px 14px',
            display: 'flex', justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--color-text-muted)', marginBottom: 2 }}>Instalación</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>
              {branch || '—'}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--color-text-muted)', marginBottom: 2 }}>Responsable</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>
              {name || '—'}
            </div>
          </div>
        </motion.div>

        {/* Botón enviar */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleSubmit}
          disabled={!isValid}
          style={{
            width: '100%', padding: '15px',
            background: isValid ? 'var(--color-blue-btn)' : 'rgba(255,255,255,0.06)',
            border: isValid ? 'none' : '1px solid var(--color-border)',
            borderRadius: 12, cursor: isValid ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700,
            letterSpacing: '0.06em',
            color: isValid ? '#fff' : 'var(--color-text-muted)',
            transition: 'all 0.2s',
          }}
        >
          <Send size={16} />
          REGISTRAR CIERRE
        </motion.button>
      </div>
    </div>
  )
}
