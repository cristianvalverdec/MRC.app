import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import { useNetworkStatus } from '../hooks/useNetworkStatus'
import useUserStore from '../store/userStore'
import { MAINTENANCE_MODE } from '../config/msalConfig'

// ── Agrosuper Logo — blanco en dark (relación 3.1:1), color en light (relación 1.5:1)
// Para que ambos logos aparezcan del mismo tamaño visual usamos ancho fijo
function AgrosuperShield({ height = 36 }) {
  const theme = useUserStore((s) => s.theme)
  const isLight = theme === 'light'
  // Logo blanco: 5784×1864 → ratio 3.1. A h=36 → w≈111px
  // Logo color:  17718×11812 → ratio 1.5. Para w=111px → h≈74px
  return (
    <img
      src={`${import.meta.env.BASE_URL}agrosuper-logo.png`}
      alt="Agrosuper"
      style={isLight
        ? { width: 111, height: 'auto', display: 'block' }
        : { height, width: 'auto', display: 'block' }
      }
    />
  )
}

// ── Logo MRC — sin contenedor oscuro, mixBlendMode screen sobre cualquier fondo
function TeamIllustration() {
  return (
    <img
      src={`${import.meta.env.BASE_URL}mrc-logo.png`}
      alt="#MisiónRiesgoCero — Trabajemos juntos por una cultura preventiva"
      style={{
        width: '100%',
        maxWidth: 'var(--content-max-w)',
        height: 'auto',
        display: 'block',
        mixBlendMode: 'screen',
        margin: '0 auto',
      }}
    />
  )
}

// ── Partículas flotantes — color naranja Agrosuper (var definida en index.css)
function FloatingParticles() {
  const particles = [
    { x: '8%',  y: '15%', size: 3,   delay: 0,    duration: 5 },
    { x: '92%', y: '20%', size: 2,   delay: 0.8,  duration: 4.5 },
    { x: '20%', y: '80%', size: 2,   delay: 1.2,  duration: 6 },
    { x: '80%', y: '75%', size: 3,   delay: 0.4,  duration: 5.5 },
    { x: '50%', y: '8%',  size: 2,   delay: 2,    duration: 4 },
    { x: '15%', y: '45%', size: 1.5, delay: 1.6,  duration: 7 },
    { x: '88%', y: '55%', size: 2,   delay: 0.2,  duration: 5 },
  ]
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {particles.map((p, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute', left: p.x, top: p.y,
            width: p.size * 2, height: p.size * 2, borderRadius: '50%',
            background: 'var(--splash-particle)',
          }}
          animate={{ y: [0, -16, 0], opacity: [0.35, 0.9, 0.35] }}
          transition={{ repeat: Infinity, duration: p.duration, delay: p.delay, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}

// ── Network dot — LED de conectividad
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

// ── Pantalla de mantenimiento ──────────────────────────────────────────
function MaintenanceScreen() {
  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      background: 'var(--bg-splash-gradient)',
      padding: '32px 24px',
    }}>
      <div className="noise-overlay" />
      <FloatingParticles />

      {/* Glow superior */}
      <div style={{
        position: 'absolute', top: -80, left: '50%',
        transform: 'translateX(-50%)',
        width: 300, height: 200,
        background: 'var(--bg-splash-glow)',
        pointerEvents: 'none',
      }} />

      {/* Logo Agrosuper */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ position: 'absolute', top: 0, right: 0, padding: '16px 16px 0 0',
          paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))', zIndex: 10 }}
      >
        <AgrosuperShield height={32} />
      </motion.div>

      {/* Icono + mensaje */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        style={{
          position: 'relative', zIndex: 1,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          textAlign: 'center', maxWidth: 380,
        }}
      >
        {/* Candado SVG */}
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'rgba(245,124,32,0.12)',
          border: '2px solid rgba(245,124,32,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 28,
          boxShadow: '0 0 32px rgba(245,124,32,0.15)',
        }}>
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#F57C20" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>

        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700,
          color: '#fff', letterSpacing: '0.04em', textTransform: 'uppercase',
          marginBottom: 12, lineHeight: 1.2,
        }}>
          Sistema en mantenimiento
        </h1>

        <p style={{
          fontFamily: 'var(--font-body)', fontSize: 15, color: 'rgba(255,255,255,0.65)',
          lineHeight: 1.6, marginBottom: 32,
        }}>
          La aplicación MRC se encuentra temporalmente fuera de servicio mientras se completan
          las validaciones necesarias para su uso en producción.
        </p>

        <div style={{
          background: 'rgba(245,124,32,0.08)',
          border: '1px solid rgba(245,124,32,0.25)',
          borderRadius: 12, padding: '14px 18px',
          width: '100%',
        }}>
          <p style={{
            fontFamily: 'var(--font-body)', fontSize: 13,
            color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.5,
          }}>
            Para consultas, contactar al equipo SST de Agrosuper Comercial.
          </p>
        </div>
      </motion.div>

      {/* Versión */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        style={{
          position: 'absolute', bottom: 0,
          paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
          fontFamily: 'var(--font-body)', fontSize: 11,
          color: 'var(--color-text-muted)', letterSpacing: '0.04em',
        }}
      >
        v{__APP_VERSION__} · {__BUILD_DATE__}
      </motion.p>
    </div>
  )
}

// ── Pantalla principal ─────────────────────────────────────────────────
export default function SplashScreen() {
  const navigate = useNavigate()
  const { login, isDevMode } = useAuth()
  const [loading, setLoading] = useState(false)

  if (MAINTENANCE_MODE && !isDevMode) return <MaintenanceScreen />

  const handleIngresar = async () => {
    setLoading(true)
    const result = await login()
    setLoading(false)
    if (result.success) navigate('/select-unit')
  }

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
      background: 'var(--bg-splash-gradient)',
    }}>
      <div className="noise-overlay" />
      <FloatingParticles />

      {/* Glow superior */}
      <div style={{
        position: 'absolute', top: -80, left: '50%',
        transform: 'translateX(-50%)',
        width: 300, height: 200,
        background: 'var(--bg-splash-glow)',
        pointerEvents: 'none',
      }} />

      {/* ── Header: network dot + logo Agrosuper ──────────────────── */}
      <div style={{
        position: 'absolute', top: 0, right: 0,
        padding: '16px 16px 0 0',
        paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))',
        zIndex: 10,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <NetworkDot />
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <AgrosuperShield height={32} />
        </motion.div>
      </div>

      <div style={{ flex: 1, minHeight: 40 }} />

      {/* ── Logo MRC — centrado horizontal y verticalmente ──────────── */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center',
        padding: '0 24px', position: 'relative', zIndex: 1,
        width: '100%',
      }}>
        <motion.div
          style={{ width: '100%', maxWidth: 500, margin: '0 auto' }}
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
        >
          <motion.div
            animate={{ y: [0, -14, 0] }}
            transition={{ duration: 4, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
            style={{ willChange: 'transform' }}
          >
            <TeamIllustration />
          </motion.div>
        </motion.div>
      </div>

      <div style={{ flex: 1, minHeight: 40 }} />

      {/* ── Botón naranja Agrosuper ─────────────────────────────────── */}
      <div style={{
        position: 'relative', zIndex: 1,
        padding: '16px 24px',
        paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut', delay: 0.5 }}
          style={{ maxWidth: 'var(--content-max-w)', margin: '0 auto', width: '100%' }}
        >
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleIngresar}
            className="btn-shimmer"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '100%', height: 56,
              background: 'var(--btn-primary)',
              color: '#fff',
              fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              border: 'none', borderRadius: 'var(--radius-btn)',
              cursor: 'pointer',
              boxShadow: '0 4px 24px var(--btn-primary-shadow)',
              position: 'relative', overflow: 'hidden',
            }}
            aria-label="Ingresar a la aplicación"
            disabled={loading}
          >
            {loading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                style={{
                  width: 22, height: 22, borderRadius: '50%',
                  border: '3px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#fff',
                }}
              />
            ) : (
              isDevMode ? 'INGRESAR (DEMO)' : 'INGRESAR'
            )}
          </motion.button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          style={{
            textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 11,
            color: 'var(--color-text-muted)', marginTop: 10, marginBottom: 0,
            letterSpacing: '0.04em',
          }}
        >
          v{__APP_VERSION__} · {__BUILD_DATE__}
        </motion.p>
      </div>
    </div>
  )
}
