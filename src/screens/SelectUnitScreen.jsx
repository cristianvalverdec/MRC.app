import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronLeft, Building2, TrendingUp, UserCircle } from 'lucide-react'
import useUserStore from '../store/userStore'

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
    bgColor: 'var(--color-blue-btn)',
    route: '/unit/sucursales',
  },
  {
    id: 'fuerza-de-ventas',
    label: 'Fuerza de Ventas',
    sublabel: 'Equipos comerciales en campo',
    icon: <TrendingUp size={22} color="#fff" />,
    bgColor: 'var(--color-blue-dark)',
    route: '/unit/fuerza-de-ventas',
  },
]

export default function SelectUnitScreen() {
  const navigate = useNavigate()
  const setUnit = useUserStore((s) => s.setUnit)

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
        background: 'radial-gradient(ellipse 120% 100% at 50% 80%, #1e3260 0%, #1B2A4A 60%, #111d33 100%)',
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

        {/* Centro: logo Agrosuper */}
        <motion.img
          src={`${import.meta.env.BASE_URL}agrosuper-logo.png`}
          alt="Agrosuper"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{ height: 32, width: 'auto' }}
        />

        {/* Derecha: perfil */}
        <div style={{ width: 44, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => navigate('/profile')}
            style={{
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 8, padding: 6, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'rgba(255,255,255,0.6)',
              minWidth: 36, minHeight: 36,
            }}
            aria-label="Mi perfil"
          >
            <UserCircle size={20} />
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
            style={{ willChange: 'transform' }}
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
                boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
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
