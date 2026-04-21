import { useNavigate } from 'react-router-dom'
import { ChevronLeft, RefreshCw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import useUserStore from '../../store/userStore'
import useAuthHealthStore from '../../store/authHealthStore'
import NetworkStatus from '../ui/NetworkStatus'
import NotificationBell from '../ui/NotificationBell'
import { useNetworkStatus } from '../../hooks/useNetworkStatus'

function AgrosuperLogo({ height = 28 }) {
  return (
    <img
      src={`${import.meta.env.BASE_URL}agrosuper-logo.png`}
      alt="Agrosuper"
      style={{ height, width: 'auto', display: 'block' }}
    />
  )
}

// Dot de conectividad — prioridad: error Azure (rojo) > offline (naranja) > ok (verde)
function NetworkDot() {
  const { isOnline } = useNetworkStatus()
  const tokenStatus = useAuthHealthStore((s) => s.tokenStatus)
  const isAuthError = tokenStatus === 'error'

  const color  = isAuthError ? '#E74C3C' : isOnline ? '#27AE60' : '#F2994A'
  const shadow = isAuthError ? '0 0 6px rgba(231,76,60,0.8)' : isOnline ? '0 0 5px rgba(39,174,96,0.7)' : '0 0 5px rgba(242,153,74,0.7)'

  return (
    <div style={{
      width: 8, height: 8, borderRadius: '50%',
      background: color,
      border: '1.5px solid rgba(27,42,74,0.8)',
      position: 'absolute',
      bottom: 0, right: 0,
      boxShadow: shadow,
      transition: 'background 0.4s ease, box-shadow 0.4s ease',
      // Pulso cuando hay error de sesión Azure para llamar la atención
      animation: isAuthError ? 'authErrorPulse 1.6s ease-in-out infinite' : 'none',
    }} />
  )
}

// Banner de sesión Azure perdida — aparece bajo el header igual que NetworkStatus
function AuthStatusBanner() {
  const { tokenStatus, tokenError } = useAuthHealthStore()
  const show = tokenStatus === 'error'

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25 }}
          style={{ overflow: 'hidden' }}
        >
          <div style={{
            background: 'rgba(231,76,60,0.12)',
            borderBottom: '1px solid rgba(231,76,60,0.3)',
            padding: '8px 16px',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <RefreshCw size={13} color="#E74C3C" style={{ flexShrink: 0 }} />
            <span style={{
              fontFamily: 'var(--font-body)', fontSize: 11,
              color: '#E74C3C', lineHeight: 1.4, flex: 1,
            }}>
              {tokenError || 'Sesión Azure perdida'} — <strong>cierra y abre la app</strong>
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function MiniAvatar({ name, photoUrl }) {
  const initials = name
    ? name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
    : '?'
  return (
    <motion.div
      whileTap={{ scale: 0.88 }}
      style={{
        width: 32, height: 32, borderRadius: '50%',
        overflow: 'visible', cursor: 'pointer',
        flexShrink: 0, position: 'relative',
      }}
    >
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        overflow: 'hidden',
        border: '2px solid rgba(245,124,32,0.5)',
        background: 'rgba(245,124,32,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {photoUrl ? (
          <img src={photoUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{
            fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 800,
            color: 'var(--color-orange)', letterSpacing: '0.02em',
          }}>
            {initials}
          </span>
        )}
      </div>
      <NetworkDot />
    </motion.div>
  )
}

export default function AppHeader({ title, showBack = true, onBack, rightAction }) {
  const navigate = useNavigate()
  const { name, photoUrl, isAuthenticated } = useUserStore()

  const handleBack = () => {
    if (onBack) onBack()
    else navigate(-1)
  }

  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 50 }}>
      {/* Header siempre navy — identidad de marca en ambos modos */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
        padding: '12px 16px',
        paddingTop: 'calc(12px + env(safe-area-inset-top, 0px))',
        background: 'rgba(27, 42, 74, 0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        {/* Izquierda: botón volver */}
        <div style={{ width: 44, display: 'flex', alignItems: 'center' }}>
          {showBack && (
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={handleBack}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '8px', margin: '-8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--color-orange)', borderRadius: 8,
                minWidth: 44, minHeight: 44,
              }}
              aria-label="Volver"
            >
              <ChevronLeft size={26} strokeWidth={2.5} />
            </motion.button>
          )}
        </div>

        {/* Centro: absolutamente centrado para no depender del ancho de los lados */}
        <div style={{
          position: 'absolute', left: 0, right: 0,
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          pointerEvents: 'none',
        }}>
          {title ? (
            <span style={{
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17,
              letterSpacing: '0.04em', textTransform: 'uppercase',
              color: '#FFFFFF', textAlign: 'center',
              pointerEvents: 'auto',
              maxWidth: 'calc(100% - 180px)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {title}
            </span>
          ) : (
            <div style={{ pointerEvents: 'auto' }}>
              <AgrosuperLogo height={24} />
            </div>
          )}
        </div>

        {/* Derecha: bell de notificaciones + avatar con dot de red */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginLeft: 'auto' }}>
          {isAuthenticated && !rightAction && <NotificationBell />}
          <div style={{ width: 44, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
            {rightAction || (
              isAuthenticated && (
                <div onClick={() => navigate('/profile')}>
                  <MiniAvatar name={name} photoUrl={photoUrl} />
                </div>
              )
            )}
          </div>
        </div>
      </header>

      {/* Banner de red — aparece bajo el header solo cuando es relevante */}
      <NetworkStatus />
      {/* Banner de sesión Azure — aparece cuando el token falla */}
      <AuthStatusBanner />
      <style>{`@keyframes authErrorPulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
    </div>
  )
}
