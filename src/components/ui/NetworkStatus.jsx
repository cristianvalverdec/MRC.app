import { motion, AnimatePresence } from 'framer-motion'
import { WifiOff, Wifi } from 'lucide-react'
import { useNetworkStatus } from '../../hooks/useNetworkStatus'

export default function NetworkStatus() {
  const { isOnline, justReconnected } = useNetworkStatus()

  return (
    <AnimatePresence>
      {/* Banner de sin red — aparece cuando no hay conexión */}
      {!isOnline && (
        <motion.div
          key="offline"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          style={{ overflow: 'hidden' }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '6px 16px',
            background: 'rgba(242, 153, 74, 0.15)',
            borderBottom: '1px solid rgba(242, 153, 74, 0.3)',
          }}>
            <WifiOff size={13} color="#F2994A" strokeWidth={2.5} />
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#F2994A',
            }}>
              Sin conexión · Los registros se guardan localmente
            </span>
          </div>
        </motion.div>
      )}

      {/* Flash de reconexión — desaparece solo a los 3s */}
      {justReconnected && (
        <motion.div
          key="reconnected"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          style={{ overflow: 'hidden' }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '6px 16px',
            background: 'rgba(39, 174, 96, 0.15)',
            borderBottom: '1px solid rgba(39, 174, 96, 0.3)',
          }}>
            <Wifi size={13} color="#27AE60" strokeWidth={2.5} />
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#27AE60',
            }}>
              Conexión restaurada · Sincronizando…
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
