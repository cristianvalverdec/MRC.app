import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Search, ChevronRight, Briefcase,
  FlaskConical, BookOpen, Scale, CalendarDays, MapPin,
} from 'lucide-react'
import AppHeader from '../components/layout/AppHeader'
import { SUCURSALES_LIST } from '../hooks/useKPIs'

const MODULES = [
  {
    id: 'programa-trabajo',
    icon: <Briefcase size={20} color="#fff" />,
    label: 'Programa de Trabajo',
    sublabel: 'Actividades, pautas e inspecciones del mes',
    accentColor: '#F57C20',
    active: true,
  },
  {
    id: 'investigaciones',
    icon: <FlaskConical size={20} color="#fff" />,
    label: 'Investigaciones del CPHS',
    sublabel: 'Gestión de accidentes e investigaciones',
    accentColor: '#E05C2A',
    active: false,
  },
  {
    id: 'cumplimiento-legal',
    icon: <Scale size={20} color="#fff" />,
    label: 'Cumplimiento Legal',
    sublabel: 'Normativa y obligaciones legales SSO',
    accentColor: '#2F80ED',
    active: false,
  },
  {
    id: 'biblioteca',
    icon: <BookOpen size={20} color="#fff" />,
    label: 'Biblioteca para CPHS',
    sublabel: 'Documentos, guías y recursos de apoyo',
    accentColor: '#7B3FE4',
    active: false,
  },
  {
    id: 'eventos',
    icon: <CalendarDays size={20} color="#fff" />,
    label: 'Eventos CPHS',
    sublabel: 'Reuniones, capacitaciones y actividades',
    accentColor: '#0EA5E9',
    active: false,
  },
]

export default function GestionCPHSScreen() {
  const navigate = useNavigate()
  const { unitType } = useParams()
  const [query, setQuery]               = useState('')
  const [selectedInstalacion, setSelected] = useState(null)
  const [showList, setShowList]         = useState(false)

  const filtered = SUCURSALES_LIST.filter((s) =>
    s.toLowerCase().includes(query.toLowerCase())
  )

  const handleSelect = (inst) => {
    setSelected(inst)
    setQuery(inst)
    setShowList(false)
  }

  const handleModuleClick = (mod) => {
    if (!mod.active) return
    navigate(`/unit/${unitType}/cphs/${mod.id}?instalacion=${encodeURIComponent(selectedInstalacion)}`)
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--color-navy)' }}>
      <AppHeader title="Gestión de CPHS" />

      <div className="content-col" style={{ flex: 1, padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'linear-gradient(135deg, #B85C00 0%, #F57C20 100%)',
            borderRadius: 16, padding: '18px 20px',
            display: 'flex', alignItems: 'center', gap: 14,
          }}
        >
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Users size={26} color="#fff" />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 3 }}>
              Comité Paritario de Higiene y Seguridad
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.78)' }}>
              Selecciona una instalación para continuar
            </div>
          </div>
        </motion.div>

        {/* Selector de instalación */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          style={{ position: 'relative' }}
        >
          <div style={{
            fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--color-text-muted)',
            letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8,
          }}>
            Instalación / Sucursal
          </div>

          {/* Input */}
          <div style={{
            position: 'relative', display: 'flex', alignItems: 'center',
            background: 'var(--color-card)',
            border: `1.5px solid ${showList ? '#F57C20' : 'var(--color-border)'}`,
            borderRadius: 12, overflow: 'hidden',
            transition: 'border-color 0.2s',
          }}>
            <Search size={16} color="var(--color-text-muted)" style={{ marginLeft: 14, flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Buscar sucursal o CD..."
              value={query}
              onChange={(e) => { setQuery(e.target.value); setShowList(true) }}
              onFocus={() => setShowList(true)}
              style={{
                flex: 1, padding: '13px 12px',
                background: 'transparent', border: 'none', outline: 'none',
                fontFamily: 'var(--font-body)', fontSize: 14,
                color: 'var(--color-text)', caretColor: '#F57C20',
              }}
            />
            {selectedInstalacion && (
              <MapPin size={16} color="#F57C20" style={{ marginRight: 14, flexShrink: 0 }} />
            )}
          </div>

          {/* Dropdown */}
          <AnimatePresence>
            {showList && filtered.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                style={{
                  position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 50,
                  background: 'var(--color-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 12,
                  maxHeight: 220, overflowY: 'auto',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
                }}
              >
                {filtered.map((inst, i) => (
                  <div
                    key={i}
                    onClick={() => handleSelect(inst)}
                    style={{
                      padding: '11px 16px',
                      fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--color-text)',
                      cursor: 'pointer',
                      borderBottom: i < filtered.length - 1 ? '1px solid var(--color-border)' : 'none',
                      background: inst === selectedInstalacion ? 'rgba(245,124,32,0.1)' : 'transparent',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(245,124,32,0.08)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = inst === selectedInstalacion ? 'rgba(245,124,32,0.1)' : 'transparent'}
                  >
                    {inst}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Overlay para cerrar el dropdown */}
        {showList && (
          <div
            onClick={() => setShowList(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 40 }}
          />
        )}

        {/* Módulos — sólo visibles al seleccionar instalación */}
        <AnimatePresence>
          {selectedInstalacion && (
            <motion.div
              key="modules"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
            >
              <div style={{
                fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--color-text-muted)',
                letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 2,
              }}>
                {selectedInstalacion}
              </div>

              {MODULES.map((mod, i) => (
                <motion.div
                  key={mod.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <div
                    onClick={() => handleModuleClick(mod)}
                    style={{
                      background: 'var(--color-card)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 14, padding: '13px 16px',
                      display: 'flex', alignItems: 'center', gap: 12,
                      cursor: mod.active ? 'pointer' : 'default',
                      position: 'relative', overflow: 'hidden',
                      opacity: mod.active ? 1 : 0.55,
                      transition: 'opacity 0.2s',
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
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-text-muted)' }}>
                        {mod.sublabel}
                      </div>
                    </div>

                    {mod.active ? (
                      <ChevronRight size={16} color="#F57C20" />
                    ) : (
                      <span style={{
                        fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700,
                        color: mod.accentColor, border: `1px solid ${mod.accentColor}`,
                        borderRadius: 6, padding: '2px 7px', letterSpacing: '0.05em',
                        whiteSpace: 'nowrap',
                      }}>
                        PRÓXIMO
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hint si no hay instalación seleccionada */}
        {!selectedInstalacion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 10, paddingBottom: 40,
            }}
          >
            <Users size={40} color="rgba(255,255,255,0.1)" />
            <p style={{
              fontFamily: 'var(--font-body)', fontSize: 13,
              color: 'var(--color-text-muted)', textAlign: 'center',
              maxWidth: 220, lineHeight: 1.6,
            }}>
              Selecciona una instalación para ver los módulos del CPHS disponibles
            </p>
          </motion.div>
        )}

      </div>
    </div>
  )
}
