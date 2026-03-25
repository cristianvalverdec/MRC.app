import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShieldCheck, BarChart2, TrendingUp, Target, UserCircle } from 'lucide-react'
import AppHeader from '../components/layout/AppHeader'
import MenuCard from '../components/ui/MenuCard'
import { containerVariants, itemVariants } from '../components/ui/MenuCard'
import { unitLabels } from '../config/routes'

const menuItems = {
  sucursales: [
    {
      icon: <ShieldCheck size={22} color="#fff" />,
      label: 'Herramientas Gestión Preventiva',
      sublabel: '4 herramientas disponibles',
      accentColor: 'var(--color-orange)',
      route: (unitType) => `/unit/${unitType}/tools`,
    },
    {
      icon: <BarChart2 size={22} color="#fff" />,
      label: 'Estatus Diario del Programa',
      sublabel: 'KPIs en tiempo real',
      accentColor: 'var(--color-blue-btn)',
      route: (unitType) => `/unit/${unitType}/status`,
    },
    {
      icon: <TrendingUp size={22} color="#fff" />,
      label: 'Analítica del Programa',
      sublabel: 'Reportes y tendencias',
      accentColor: 'var(--color-blue-dark)',
      route: (unitType) => `/unit/${unitType}/analytics`,
    },
    {
      icon: <Target size={22} color="#fff" />,
      label: 'Metas del Programa',
      sublabel: 'Metas mensuales por Factor Accidentabilidad',
      accentColor: '#27AE60',
      route: (unitType) => `/unit/${unitType}/goals`,
    },
  ],
  'fuerza-de-ventas': [
    {
      icon: <ShieldCheck size={22} color="#fff" />,
      label: 'Herramientas Gestión Preventiva',
      sublabel: '3 herramientas disponibles',
      accentColor: 'var(--color-orange)',
      route: (unitType) => `/unit/${unitType}/tools`,
    },
    {
      icon: <BarChart2 size={22} color="#fff" />,
      label: 'Estatus Diario del Programa',
      sublabel: 'KPIs en tiempo real',
      accentColor: 'var(--color-blue-btn)',
      route: (unitType) => `/unit/${unitType}/status`,
    },
    {
      icon: <TrendingUp size={22} color="#fff" />,
      label: 'Analítica del Programa',
      sublabel: 'Reportes y tendencias',
      accentColor: 'var(--color-blue-dark)',
      route: (unitType) => `/unit/${unitType}/analytics`,
    },
  ],
}

export default function UnitMenuScreen() {
  const navigate = useNavigate()
  const { unitType } = useParams()
  const items = menuItems[unitType] || menuItems.sucursales
  const label = unitLabels[unitType] || unitType

  const profileAction = (
    <motion.button
      whileTap={{ scale: 0.88 }}
      onClick={() => navigate('/profile')}
      style={{
        background: 'rgba(255,255,255,0.06)', border: '1px solid var(--color-border)',
        borderRadius: 8, padding: 6, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--color-text-muted)',
        minWidth: 36, minHeight: 36,
      }}
      aria-label="Mi perfil"
    >
      <UserCircle size={20} />
    </motion.button>
  )

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--color-navy)',
      }}
    >
      <AppHeader title={label} rightAction={profileAction} />

      <div style={{ flex: 1, padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Unit label */}
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

        {/* Menu cards */}
        <motion.div
          variants={containerVariants}
          initial="initial"
          animate="animate"
          style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
        >
          {items.map((item, i) => (
            <motion.div key={i} variants={itemVariants}>
              <MenuCard
                icon={item.icon}
                label={item.label}
                sublabel={item.sublabel}
                accentColor={item.accentColor}
                onClick={() => navigate(item.route(unitType))}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
