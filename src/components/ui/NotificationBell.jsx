import { Bell } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import useNotificationStore from '../../store/notificationStore'

export default function NotificationBell() {
  const navigate       = useNavigate()
  const notificaciones = useNotificationStore(s => s.notificaciones)
  const leidasIds      = useNotificationStore(s => s.leidasIds)
  const noLeidas       = notificaciones.filter(n => !leidasIds.includes(n.id)).length

  return (
    <motion.button
      whileTap={{ scale: 0.85 }}
      onClick={() => navigate('/notifications')}
      style={{
        position: 'relative',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '6px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'rgba(255,255,255,0.65)',
        borderRadius: 8,
        minWidth: 36,
        minHeight: 36,
        flexShrink: 0,
      }}
      aria-label={`Notificaciones${noLeidas > 0 ? ` (${noLeidas} sin leer)` : ''}`}
    >
      <Bell size={20} strokeWidth={1.8} />

      <AnimatePresence>
        {noLeidas > 0 && (
          <motion.div
            key="badge"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            style={{
              position: 'absolute',
              top: 2,
              right: 2,
              minWidth: 16,
              height: 16,
              borderRadius: 999,
              background: 'var(--color-orange)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-display)',
              fontSize: 9,
              fontWeight: 800,
              color: '#fff',
              padding: '0 3px',
              border: '1.5px solid rgba(27,42,74,0.9)',
              lineHeight: 1,
            }}
          >
            {noLeidas > 99 ? '99+' : noLeidas}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  )
}
