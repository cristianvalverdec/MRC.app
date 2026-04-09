import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ClipboardList, PersonStanding, Search, Megaphone, Eye, CalendarCheck, Settings2, FileText, ShieldCheck, Brain, Users } from 'lucide-react'
import AppHeader from '../components/layout/AppHeader'
import MenuCard from '../components/ui/MenuCard'
import { containerVariants, itemVariants } from '../components/ui/MenuCard'
import useUserStore from '../store/userStore'
import useFormEditorStore from '../store/formEditorStore'

// En dev mode (sin Azure AD real), siempre se considera admin
const IS_DEV_MODE =
  !import.meta.env.VITE_AZURE_CLIENT_ID ||
  import.meta.env.VITE_AZURE_CLIENT_ID === 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'

const toolsBySucursales = [
  {
    icon: <ClipboardList size={22} color="#fff" />,
    label: 'Pauta de Verificación',
    sublabel: 'Reglas de Oro — verificación conductual',
    accentColor: '#1A52B8',
    formType: 'pauta-verificacion-reglas-oro',
  },
  {
    icon: <PersonStanding size={22} color="#fff" />,
    label: 'Caminata de Seguridad',
    sublabel: 'Recorrido de inspección en terreno',
    accentColor: '#27AE60',
    formType: 'caminata-seguridad',
  },
  {
    icon: <Search size={22} color="#fff" />,
    label: 'Inspección Simple',
    sublabel: 'Revisión de equipos y espacios',
    accentColor: '#F57C20',
    formType: 'inspeccion-simple',
  },
  {
    icon: <Megaphone size={22} color="#fff" />,
    label: 'Difusiones SSO',
    sublabel: 'Registro de charlas y capacitaciones',
    accentColor: '#2F80ED',
    route: 'difusiones-sso',
  },
  {
    icon: <ShieldCheck size={22} color="#fff" />,
    label: 'Cierre de Condiciones',
    sublabel: 'Registro de cierre de hallazgos inseguros',
    accentColor: '#27AE60',
    route: 'cierre-condiciones',   // ruta directa (no form genérico)
  },
  {
    icon: <Brain size={22} color="#fff" />,
    label: 'Monitor de Fatiga Operacional',
    sublabel: 'Test de fatiga para operadores de EQR',
    accentColor: '#0891B2',
    route: 'monitor-fatiga',
  },
]

const toolsByFuerzaVentas = [
  {
    icon: <Eye size={22} color="#fff" />,
    label: 'Observación Conductual',
    sublabel: 'Registro de comportamientos seguros',
    accentColor: '#1A52B8',
    formType: 'observacion-conductual',
  },
  {
    icon: <CalendarCheck size={22} color="#fff" />,
    label: 'Inspección Planificada',
    sublabel: 'Inspección programada de riesgos',
    accentColor: '#27AE60',
    formType: 'inspeccion-planificada',
  },
  {
    icon: <Megaphone size={22} color="#fff" />,
    label: 'Difusiones SSO',
    sublabel: 'Registro de charlas y capacitaciones',
    accentColor: '#2F80ED',
    route: 'difusiones-sso',
  },
  {
    icon: <Brain size={22} color="#fff" />,
    label: 'Monitor de Fatiga Operacional',
    sublabel: 'Test de fatiga para operadores de EQR',
    accentColor: '#0891B2',
    route: 'monitor-fatiga',
  },
]

export default function ToolsMenuScreen() {
  const navigate  = useNavigate()
  const { unitType } = useParams()
  const role      = useUserStore((s) => s.role)
  const mrcNivel  = useUserStore((s) => s.mrcNivel)
  const isAdmin   = role === 'admin' || IS_DEV_MODE
  // En dev mode se simula nivel 6 (Jefe de Zona) para mostrar el directorio
  const nivelEfectivo = IS_DEV_MODE ? 6 : mrcNivel
  const puedeVerDirectorio = nivelEfectivo >= 2
  const customForms = useFormEditorStore((s) => s.customForms)

  const tools = unitType === 'fuerza-de-ventas' ? toolsByFuerzaVentas : toolsBySucursales

  // Formularios custom creados por admin, filtrados por unidad
  const customTools = Object.values(customForms).filter((f) => {
    if (!f.unit || f.unit === 'Ambas') return true
    if (unitType === 'sucursales' && f.unit === 'Sucursales') return true
    if (unitType === 'fuerza-de-ventas' && f.unit === 'Fuerza de Ventas') return true
    return false
  })

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--color-navy)',
      }}
    >
      <AppHeader title="Herramientas Preventivas" />

      <div style={{ flex: 1, padding: '24px 16px' }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            color: 'var(--color-text-muted)',
            marginBottom: 16,
          }}
        >
          Selecciona el registro a completar
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="initial"
          animate="animate"
          style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
        >
          {tools.map((tool, i) => (
            <motion.div key={i} variants={itemVariants}>
              <MenuCard
                icon={tool.icon}
                label={tool.label}
                sublabel={tool.sublabel}
                accentColor={tool.accentColor}
                onClick={() =>
                  tool.route
                    ? navigate(`/unit/${unitType}/${tool.route}`)
                    : navigate(`/form/${tool.formType}`)
                }
              />
            </motion.div>
          ))}

          {/* ── Formularios custom creados por admin ──────────────────── */}
          {customTools.length > 0 && (
            <>
              <motion.div variants={itemVariants}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0 4px',
                }}>
                  <div style={{ flex: 1, height: 1, background: 'rgba(47,128,237,0.2)' }} />
                  <span style={{
                    fontFamily: 'var(--font-body)', fontSize: 11,
                    color: 'rgba(96,165,250,0.7)', letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}>
                    Herramientas adicionales
                  </span>
                  <div style={{ flex: 1, height: 1, background: 'rgba(47,128,237,0.2)' }} />
                </div>
              </motion.div>
              {customTools.map((form) => (
                <motion.div key={form.id} variants={itemVariants}>
                  <MenuCard
                    icon={<FileText size={22} color="#fff" />}
                    label={form.title}
                    sublabel={form.description || 'Formulario personalizado'}
                    accentColor={form.accentColor || '#2F80ED'}
                    onClick={() => navigate(`/form/${form.id}`)}
                  />
                </motion.div>
              ))}
            </>
          )}

          {/* ── Directorio de líderes (nivel ≥ 2) ───────────────────────── */}
          {puedeVerDirectorio && (
            <>
              <motion.div variants={itemVariants}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0 4px',
                }}>
                  <div style={{ flex: 1, height: 1, background: 'rgba(39,174,96,0.2)' }} />
                  <span style={{
                    fontFamily: 'var(--font-body)', fontSize: 11,
                    color: 'rgba(39,174,96,0.7)', letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}>
                    Directorio
                  </span>
                  <div style={{ flex: 1, height: 1, background: 'rgba(39,174,96,0.2)' }} />
                </div>
              </motion.div>
              <motion.div variants={itemVariants}>
                <MenuCard
                  icon={<Users size={22} color="#fff" />}
                  label="Líderes de Instalación"
                  sublabel="Directorio de contactos de jefatura"
                  accentColor="#27AE60"
                  onClick={() => navigate(`/unit/${unitType}/lideres`)}
                />
              </motion.div>
            </>
          )}

          {/* ── Card exclusiva para Administrador ─────────────────────── */}
          {isAdmin && (
            <>
              <motion.div variants={itemVariants}>
                {/* Separador visual */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  margin: '4px 0 4px',
                }}>
                  <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
                  <span style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 11,
                    color: 'rgba(255,255,255,0.3)',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}>
                    Administrador
                  </span>
                  <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
                </div>
              </motion.div>

              <motion.div variants={itemVariants}>
                <MenuCard
                  icon={<Settings2 size={22} color="#fff" />}
                  label="Editor de Formularios"
                  sublabel="Gestionar preguntas y ramificaciones"
                  accentColor="#7B3FE4"
                  badge="ADMIN"
                  onClick={() => navigate('/admin/form-editor')}
                />
              </motion.div>
              <motion.div variants={itemVariants}>
                <MenuCard
                  icon={<Users size={22} color="#fff" />}
                  label="Gestión de Líderes"
                  sublabel="Asignar y editar líderes por instalación"
                  accentColor="#0891B2"
                  badge="ADMIN"
                  onClick={() => navigate('/admin/lideres')}
                />
              </motion.div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  )
}
