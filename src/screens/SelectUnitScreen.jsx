import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronLeft, Building2, TrendingUp } from 'lucide-react'
import useUserStore from '../store/userStore'
import { useNetworkStatus } from '../hooks/useNetworkStatus'

// ── Network dot — pequeño indicador de conectividad ───────────────────
function NetworkDot() {
  const { isOnline } = useNetworkStatus()
  return (
    <div style={{
      width: 8, height: 8, borderRadius: '50%',
      background: isOnline ? '#27AE60' : '#F2994A',
      border: '1.5px solid rgba(255,255,255,0.5)',
      boxShadow: isOnline
        ? '0 0 5px rgba(39,174,96,0.8)'
        : '0 0 5px rgba(242,153,74,0.8)',
      transition: 'background 0.4s ease, box-shadow 0.4s ease',
    }} />
  )
}

function MiniAvatar({ name, photoUrl }) {
  const initials = name ? name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase() : '?'
  return (
    <div style={{
      width: 32, height: 32, borderRadius: '50%',
      overflow: 'hidden', border: '2px solid var(--color-border)',
      background: 'var(--color-surface)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      {photoUrl
        ? <img src={photoUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 800, color: 'var(--color-text-secondary)' }}>{initials}</span>
      }
    </div>
  )
}

// Logo Agrosuper — blanco en dark, color en light con mismo ancho visual
function AgrosuperLogo({ height = 32 }) {
  const theme = useUserStore((s) => s.theme)
  const isLight = theme === 'light'
  // Logo blanco: ratio 3.1 → h=32 → w≈99px. Logo color: ratio 1.5 → mismo w=99
  return (
    <motion.img
      src={`${import.meta.env.BASE_URL}${isLight ? 'agrosuper-logo-color.png' : 'agrosuper-logo.png'}`}
      alt="Agrosuper"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={isLight
        ? { width: 99, height: 'auto' }
        : { height, width: 'auto' }
      }
    />
  )
}

// MRC 2026 PNG — mismo asset que splash
function TeamIllustration() {
  return (
    <img
      src={`${import.meta.env.BASE_URL}mrc-logo.png`}
      alt="#MisiónRiesgoCero — Trabajemos juntos por una cultura preventiva"
      style={{
        width: '100%',
        maxWidth: 500,
        height: 'auto',
        display: 'block',
        mixBlendMode: 'screen',
        margin: '0 auto',
      }}
    />
  )
}

const unitCards = [
  {
    id: 'sucursales',
    label: 'Sucursales',
    sublabel: '26 Centros de Distribución',
    icon: <Building2 size={22} color="#fff" />,
    bgColor: 'var(--unit-card-primary)',
    route: '/unit/sucursales',
  },
  {
    id: 'fuerza-de-ventas',
    label: 'Fuerza de Ventas',
    sublabel: 'Equipos comerciales en campo',
    icon: <TrendingUp size={22} color="#fff" />,
    bgColor: 'var(--unit-card-secondary)',
    route: '/unit/fuerza-de-ventas',
  },
]

export default function SelectUnitScreen() {
  const navigate = useNavigate()
  const setUnit   = useUserStore((s) => s.setUnit)
  const name      = useUserStore((s) => s.name)
  const photoUrl  = useUserStore((s) => s.photoUrl)

  const handleSelectUnit = (unit) => {
    setUnit(unit.id)
    navigate(unit.route)
  }

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-splash-gradient)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div className="noise-overlay" />

      {/* ── Header: 3 columnas — back | logo centrado | perfil ─── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px',
          paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))',
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* Izquierda: volver */}
        <div style={{ width: 44, display: 'flex', alignItems: 'center' }}>
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => navigate('/')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--color-orange)', borderRadius: 8,
              minWidth: 44, minHeight: 44,
            }}
            aria-label="Volver"
          >
            <ChevronLeft size={26} strokeWidth={2.5} />
          </motion.button>
        </div>

        {/* Centro: logo Agrosuper — color en light, blanco en dark */}
        <AgrosuperLogo height={32} />

        {/* Derecha: network dot + perfil */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <NetworkDot />
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => navigate('/profile')}
            style={{
              background: 'var(--color-surface)', border: '1px solid var(--color-border)',
              borderRadius: 8, padding: 6, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              minWidth: 36, minHeight: 36,
            }}
            aria-label="Mi perfil"
          >
            <MiniAvatar name={name} photoUrl={photoUrl} />
          </motion.button>
        </div>
      </div>

      {/* ── Illustration + Badge ─────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '8px 24px 0',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Capa 1: entrada */}
        <motion.div
          style={{ width: '100%' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          {/* Capa 2: float loop suave */}
          <motion.div
            animate={{ y: [0, -14, 0] }}
            transition={{
              duration: 4,
              repeat: Infinity,
              repeatType: 'mirror',
              ease: 'easeInOut',
            }}
            style={{ willChange: 'transform', width: '100%' }}
          >
            <TeamIllustration />
          </motion.div>
        </motion.div>

        {/* Badge y subtítulo ya incluidos en el PNG */}
      </div>

      {/* ── Unit selection ───────────────────────────────────────────── */}
      <div
        style={{
          padding: '24px 24px',
          paddingBottom: 'calc(32px + env(safe-area-inset-bottom, 0px))',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Section label */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
            color: 'var(--color-text-muted)',
            marginBottom: 16,
            textAlign: 'center',
          }}
        >
          Selecciona tu unidad
        </motion.div>

        {/* Unit cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {unitCards.map((unit, i) => (
            <motion.button
              key={unit.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 + i * 0.1, duration: 0.35, ease: 'easeOut' }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleSelectUnit(unit)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                width: '100%',
                height: 64,
                background: unit.bgColor,
                border: 'none',
                borderRadius: 'var(--radius-btn)',
                cursor: 'pointer',
                padding: '0 20px',
                boxShadow: '0 4px 20px var(--unit-card-shadow)',
              }}
              aria-label={`Seleccionar ${unit.label}`}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {unit.icon}
              </div>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 700,
                    fontSize: 17,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    color: '#fff',
                    lineHeight: 1.2,
                  }}
                >
                  {unit.label}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 11,
                    color: 'rgba(255,255,255,0.65)',
                    marginTop: 1,
                  }}
                >
                  {unit.sublabel}
                </div>
              </div>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M7 4l6 6-6 6" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  )
}
