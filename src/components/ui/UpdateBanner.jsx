import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, Download, Loader } from 'lucide-react'
import { setSharedRegistration, getSharedRegistration } from '../../services/appUpdateService'

/**
 * UpdateBanner — detecta via Service Worker cuando hay una nueva versión.
 *
 * Flujo correcto (registerType: 'prompt', skipWaiting: false):
 *  1. Detecta SW en estado 'waiting' (página recargada con SW pendiente) o 'updatefound'
 *  2. Muestra banner con botón "ACTUALIZAR"
 *  3. Usuario toca → postMessage SKIP_WAITING → nuevo SW toma control
 *  4. controllerchange dispara → UNA sola recarga limpia
 *
 * onTouchStart previene el primer-tap sordo en iOS (elementos fixed no reciben
 * el primer click en Safari; touchstart sí llega siempre).
 */

export default function UpdateBanner() {
  const [needRefresh, setNeedRefresh] = useState(false)
  const [updating, setUpdating] = useState(false)
  const waitingWorkerRef = useRef(null)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    const handleControllerChange = () => {
      window.location.reload()
    }
    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange)

    const watchRegistration = (registration) => {
      setSharedRegistration(registration)

      if (registration.waiting) {
        waitingWorkerRef.current = registration.waiting
        setNeedRefresh(true)
      }

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (!newWorker) return
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            waitingWorkerRef.current = newWorker
            setNeedRefresh(true)
          }
        })
      })

      intervalRef.current = setInterval(() => {
        registration.update().catch(() => {})
      }, 60_000)
    }

    navigator.serviceWorker.ready.then(watchRegistration)

    // Chequeo inmediato cuando la app vuelve al frente (usuarios que regresan tras días)
    const handleVisibilityChange = () => {
      const reg = getSharedRegistration()
      if (document.visibilityState === 'visible' && reg) {
        reg.update().catch(() => {})
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const handleUpdate = () => {
    if (updating) return
    setUpdating(true)
    if (waitingWorkerRef.current) {
      // Solo postMessage — controllerchange se encarga de recargar (una sola recarga limpia)
      waitingWorkerRef.current.postMessage({ type: 'SKIP_WAITING' })
    } else {
      // Fallback: sin SW esperando, recarga directa
      window.location.reload()
    }
  }

  return (
    <AnimatePresence>
      {needRefresh && (
        <motion.div
          key="update-banner"
          initial={{ y: -90, opacity: 0 }}
          animate={{ y: 0,   opacity: 1 }}
          exit={{   y: -90, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          style={{
            position: 'fixed',
            top: 'env(safe-area-inset-top, 0px)',
            left: 0, right: 0,
            zIndex: 9999,
            margin: '8px 12px 0',
            borderRadius: 12,
            background: 'linear-gradient(135deg, #1A52B8 0%, #1B2A4A 100%)',
            border: '1px solid rgba(96,165,250,0.35)',
            boxShadow: '0 4px 20px rgba(26,82,184,0.45)',
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          {/* Icono */}
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'rgba(96,165,250,0.18)',
            border: '1px solid rgba(96,165,250,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Download size={17} color="#60A5FA" />
          </div>

          {/* Texto */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700,
              color: '#FFFFFF', letterSpacing: '0.02em',
            }}>
              Nueva versión disponible
            </div>
            <div style={{
              fontFamily: 'var(--font-body)', fontSize: 11,
              color: 'rgba(255,255,255,0.65)', marginTop: 2,
            }}>
              {updating ? 'Aplicando actualización…' : 'Toca Actualizar para obtener los últimos cambios'}
            </div>
          </div>

          {/* Botón — onTouchStart captura el primer tap en iOS/Safari */}
          <motion.button
            whileTap={{ scale: updating ? 1 : 0.93 }}
            onTouchStart={handleUpdate}
            onClick={handleUpdate}
            disabled={updating}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 12px',
              background: updating ? 'rgba(26,82,184,0.5)' : 'rgba(26,82,184,0.9)',
              border: '1px solid rgba(96,165,250,0.5)',
              borderRadius: 8, cursor: updating ? 'default' : 'pointer',
              fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700,
              letterSpacing: '0.05em', color: updating ? 'rgba(255,255,255,0.6)' : '#FFFFFF',
              flexShrink: 0,
              boxShadow: updating ? 'none' : '0 0 12px rgba(96,165,250,0.3)',
              transition: 'all 0.2s',
            }}
          >
            {updating
              ? <Loader size={13} style={{ animation: 'spin 1s linear infinite' }} />
              : <RefreshCw size={13} />
            }
            {updating ? 'CARGANDO…' : 'ACTUALIZAR'}
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
