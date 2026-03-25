import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'

// ── Agrosuper Logo PNG ────────────────────────────────────────────────
function AgrosuperShield({ height = 36 }) {
  return (
    <img
      src="/agrosuper-logo.png"
      alt="Agrosuper"
      style={{ height, width: 'auto', display: 'block' }}
    />
  )
}

// ── Team Illustration — PNG real MRC 2026 ────────────────────────────
function TeamIllustration() {
  return (
    <img
      src="/mrc-logo.png"
      alt="#MisiónRiesgoCero — Trabajemos juntos por una cultura preventiva"
      style={{
        width: '100%',
        maxWidth: 500,
        height: 'auto',
        display: 'block',
        // PNG tiene fondo negro — se mezcla con el fondo navy
        mixBlendMode: 'screen',
      }}
    />
  )
}

// ── Floating particles background ────────────────────────────────────
function FloatingParticles() {
  const particles = [
    { x: '8%',  y: '15%', size: 3, delay: 0,    duration: 5 },
    { x: '92%', y: '20%', size: 2, delay: 0.8,  duration: 4.5 },
    { x: '20%', y: '80%', size: 2, delay: 1.2,  duration: 6 },
    { x: '80%', y: '75%', size: 3, delay: 0.4,  duration: 5.5 },
    { x: '50%', y: '8%',  size: 2, delay: 2,    duration: 4 },
    { x: '15%', y: '45%', size: 1.5, delay: 1.6, duration: 7 },
    { x: '88%', y: '55%', size: 2, delay: 0.2,  duration: 5 },
  ]

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {particles.map((p, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            left: p.x,
            top: p.y,
            width: p.size * 2,
            height: p.size * 2,
            borderRadius: '50%',
            background: 'rgba(245, 124, 32, 0.4)',
          }}
          animate={{ y: [0, -16, 0], opacity: [0.3, 0.8, 0.3] }}
          transition={{
            repeat: Infinity,
            duration: p.duration,
            delay: p.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

// ── Main Splash Screen ─────────────────────────────────────────────────
export default function SplashScreen() {
  const navigate = useNavigate()
  const { login, isDevMode } = useAuth()
  const [loading, setLoading] = useState(false)

  const handleIngresar = async () => {
    setLoading(true)
    const result = await login()
    setLoading(false)
    if (result.success) {
      navigate('/select-unit')
    }
  }

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        background: 'radial-gradient(ellipse 120% 100% at 50% 80%, #1e3260 0%, #1B2A4A 60%, #111d33 100%)',
      }}
    >
      {/* Noise texture */}
      <div className="noise-overlay" />

      {/* Floating particles */}
      <FloatingParticles />

      {/* Top accent glow */}
      <div
        style={{
          position: 'absolute',
          top: -80,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 300,
          height: 200,
          background: 'radial-gradient(ellipse, rgba(26,82,184,0.35) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* ── Header with logo (top-right) ──────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          padding: '16px 16px 0 0',
          paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))',
          zIndex: 10,
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0 }}
        >
          <AgrosuperShield height={36} />
        </motion.div>
      </div>

      {/* Spacer superior — empuja el logo hacia el centro */}
      <div style={{ flex: 2, minHeight: 64 }} />

      {/* ── Logo MRC centrado ──────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '0 24px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Capa 1: entrada (una vez) */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
        >
          {/* Capa 2: float loop suave (sin jump al reiniciar) */}
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

      </div>

      {/* Spacer inferior — más pequeño para acercar botón */}
      <div style={{ flex: 1, minHeight: 24 }} />

      {/* ── Botón al fondo ─────────────────────────────────────────────── */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          padding: '16px 24px',
          paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut', delay: 0.5 }}
        >
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleIngresar}
            className="btn-shimmer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: 56,
              background: 'var(--color-blue-btn)',
              color: '#fff',
              fontFamily: 'var(--font-display)',
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              border: 'none',
              borderRadius: 'var(--radius-btn)',
              cursor: 'pointer',
              boxShadow: '0 4px 24px rgba(26,82,184,0.45)',
              position: 'relative',
              overflow: 'hidden',
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
            textAlign: 'center',
            fontFamily: 'var(--font-body)',
            fontSize: 11,
            color: 'var(--color-text-muted)',
            marginTop: 10,
            marginBottom: 0,
            letterSpacing: '0.04em',
          }}
        >
          v1.0 · 26 Centros de Distribución
        </motion.p>
      </div>
    </div>
  )
}
