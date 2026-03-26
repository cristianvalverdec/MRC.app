import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Users, ChevronRight, CalendarDays, FileText, ClipboardCheck, AlertCircle } from 'lucide-react'
import AppHeader from '../components/layout/AppHeader'

const modules = [
  {
    icon: <CalendarDays size={20} color="#fff" />,
    label: 'Actas de Reunión CPHS',
    sublabel: 'Registro y seguimiento de reuniones mensuales',
    accentColor: '#7B3FE4',
    soon: true,
  },
  {
    icon: <ClipboardCheck size={20} color="#fff" />,
    label: 'Investigación de Accidentes',
    sublabel: 'Gestión de reportes e investigaciones',
    accentColor: '#E05C2A',
    soon: true,
  },
  {
    icon: <AlertCircle size={20} color="#fff" />,
    label: 'Denuncias y Observaciones',
    sublabel: 'Canal formal de reporte interno',
    accentColor: '#F59E0B',
    soon: true,
  },
  {
    icon: <FileText size={20} color="#fff" />,
    label: 'Documentos Legales CPHS',
    sublabel: 'Actas, informes y reglamentos',
    accentColor: '#2F80ED',
    soon: true,
  },
]

export default function GestionCPHSScreen() {
  const navigate = useNavigate()
  const { unitType } = useParams()

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--color-navy)',
      }}
    >
      <AppHeader title="Gestión de CPHS" />

      <div style={{ flex: 1, padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Hero banner */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{
            background: 'linear-gradient(135deg, #B85C00 0%, #F57C20 100%)',
            borderRadius: 16,
            padding: '20px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Users size={28} color="#fff" />
          </div>
          <div>
            <div style={{
              fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700,
              color: '#fff', marginBottom: 4,
            }}>
              Comité Paritario de Higiene y Seguridad
            </div>
            <div style={{
              fontFamily: 'var(--font-body)', fontSize: 13,
              color: 'rgba(255,255,255,0.75)',
            }}>
              Gestión integral del CPHS de la instalación
            </div>
          </div>
        </motion.div>

        {/* Módulos */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          style={{
            fontFamily: 'var(--font-body)', fontSize: 12,
            color: 'var(--color-text-muted)', letterSpacing: '0.06em',
            textTransform: 'uppercase', marginBottom: -4,
          }}
        >
          Módulos disponibles
        </motion.div>

        {modules.map((mod, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.18 + i * 0.07 }}
          >
            <div
              style={{
                background: 'var(--color-card)',
                border: '1px solid var(--color-border)',
                borderRadius: 14,
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                cursor: 'default',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Accent bar */}
              <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0,
                width: 4, background: mod.accentColor, borderRadius: '14px 0 0 14px',
              }} />

              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: mod.accentColor,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, marginLeft: 8,
              }}>
                {mod.icon}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 600,
                  color: 'var(--color-text)', marginBottom: 2,
                }}>
                  {mod.label}
                </div>
                <div style={{
                  fontFamily: 'var(--font-body)', fontSize: 12,
                  color: 'var(--color-text-muted)',
                }}>
                  {mod.sublabel}
                </div>
              </div>

              {mod.soon && (
                <span style={{
                  fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700,
                  color: mod.accentColor, border: `1px solid ${mod.accentColor}`,
                  borderRadius: 6, padding: '2px 7px', letterSpacing: '0.05em',
                  whiteSpace: 'nowrap', opacity: 0.85,
                }}>
                  PRÓXIMO
                </span>
              )}

              {!mod.soon && (
                <ChevronRight size={16} color="var(--color-text-muted)" />
              )}
            </div>
          </motion.div>
        ))}

        {/* Info note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
          style={{
            background: 'rgba(245,124,32,0.08)',
            border: '1px solid rgba(245,124,32,0.25)',
            borderRadius: 12,
            padding: '12px 16px',
            fontFamily: 'var(--font-body)',
            fontSize: 12,
            color: 'rgba(253,186,116,0.9)',
            lineHeight: 1.6,
            marginTop: 4,
          }}
        >
          Esta sección está en desarrollo activo. Los módulos se habilitarán progresivamente durante los siguientes sprints del proyecto MRC.
        </motion.div>

      </div>
    </div>
  )
}
