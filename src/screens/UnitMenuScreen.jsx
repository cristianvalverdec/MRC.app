import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShieldCheck, BarChart2, TrendingUp, Target, Users, HeartPulse } from 'lucide-react'
import AppHeader from '../components/layout/AppHeader'
import MenuCard from '../components/ui/MenuCard'
import { containerVariants, itemVariants } from '../components/ui/menuCardVariants'
import { unitLabels } from '../config/routes'
import useScreenVisibilityStore from '../store/screenVisibilityStore'
import useUserStore from '../store/userStore'

const IS_DEV_MODE =
  !import.meta.env.VITE_AZURE_CLIENT_ID ||
  import.meta.env.VITE_AZURE_CLIENT_ID === 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'

const menuItems = {
  sucursales: [
    {
      icon: <ShieldCheck size={22} color="#fff" />,
      label: 'Herramientas Gestión Preventiva',
      sublabel: '5 herramientas disponibles',
      accentColor: '#27AE60',
      route: (unitType) => `/unit/${unitType}/tools`,
      screenKey: 'tools',
    },
    {
      icon: <BarChart2 size={22} color="#fff" />,
      label: 'Estatus Diario del Programa',
      sublabel: 'KPIs en tiempo real',
      accentColor: 'var(--color-blue-btn)',
      route: (unitType) => `/unit/${unitType}/status`,
      screenKey: 'status',
    },
    {
      icon: <TrendingUp size={22} color="#fff" />,
      label: 'Analítica del Programa',
      sublabel: 'Reportes y tendencias',
      accentColor: 'var(--color-blue-dark)',
      route: (unitType) => `/unit/${unitType}/analytics`,
      screenKey: 'analytics',
    },
    {
      icon: <Target size={22} color="#fff" />,
      label: 'Metas del Programa',
      sublabel: 'Metas mensuales por Factor Accidentabilidad',
      accentColor: '#7B3FE4',
      route: (unitType) => `/unit/${unitType}/goals`,
      screenKey: 'goals',
    },
    {
      icon: <Users size={22} color="#fff" />,
      label: 'Gestión de CPHS',
      sublabel: 'Comité Paritario de Higiene y Seguridad',
      accentColor: '#F57C20',
      route: (unitType) => `/unit/${unitType}/cphs`,
      screenKey: 'cphs',
    },
    {
      icon: <HeartPulse size={22} color="#fff" />,
      label: 'Gestión Salud',
      sublabel: 'Vigilancia y salud ocupacional',
      accentColor: '#0EA5E9',
      route: (unitType) => `/unit/${unitType}/salud`,
      screenKey: 'salud',
    },
  ],
  'fuerza-de-ventas': [
    {
      icon: <ShieldCheck size={22} color="#fff" />,
      label: 'Herramientas Gestión Preventiva',
      sublabel: '3 herramientas disponibles',
      accentColor: 'var(--color-orange)',
      route: (unitType) => `/unit/${unitType}/tools`,
      screenKey: 'tools',
    },
    {
      icon: <BarChart2 size={22} color="#fff" />,
      label: 'Estatus Diario del Programa',
      sublabel: 'KPIs en tiempo real',
      accentColor: 'var(--color-blue-btn)',
      route: (unitType) => `/unit/${unitType}/status`,
      screenKey: 'status',
    },
    {
      icon: <TrendingUp size={22} color="#fff" />,
      label: 'Analítica del Programa',
      sublabel: 'Reportes y tendencias',
      accentColor: 'var(--color-blue-dark)',
      route: (unitType) => `/unit/${unitType}/analytics`,
      screenKey: 'analytics',
    },
  ],
}

export default function UnitMenuScreen() {
  const navigate = useNavigate()
  const { unitType } = useParams()
  const items = menuItems[unitType] || menuItems.sucursales
  const label = unitLabels[unitType] || unitType
  const isScreenDisabled = useScreenVisibilityStore((s) => s.isScreenDisabled)
  const role = useUserStore((s) => s.role)
  const isAdmin = role === 'admin' || IS_DEV_MODE

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--color-navy)',
      }}
    >
      <AppHeader title={label} />

      <div style={{ flex: 1, padding: '24px 16px' }}>
        <div className="content-col" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              color: 'var(--color-text-muted)',
              marginBottom: 4,
            }}
          >
            Selecciona una opción
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="initial"
            animate="animate"
            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
          >
            {items.map((item, i) => {
              const disabled = !isAdmin && isScreenDisabled(item.screenKey)
              return (
                <motion.div key={i} variants={itemVariants}>
                  <MenuCard
                    icon={item.icon}
                    label={item.label}
                    sublabel={item.sublabel}
                    accentColor={item.accentColor}
                    onClick={() => navigate(item.route(unitType))}
                    disabled={disabled}
                    badge={disabled ? 'NO DISPONIBLE' : undefined}
                  />
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
