import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, Download } from 'lucide-react'

/**
 * UpdateBanner — detecta via Service Worker cuando hay una nueva versión.
 *
 * Con registerType: 'autoUpdate' + skipWaiting + clientsClaim, el SW nuevo
 * se activa de inmediato. Este banner:
 *  1. Detecta si hay un SW en estado 'waiting' (caso borde)
 *  2. Escucha 'updatefound' para nuevas versiones mientras la app está abierta
 *  3. Ofrece botón para forzar la recarga
 *  4. Escucha 'controllerchange' → recarga la página automáticamente
 *  5. Poll cada 60 s para detectar nuevas versiones
 */
export default function UpdateBanner() {
  const [needRefresh, setNeedRefresh] = useState(false)
  const waitingWorkerRef = useRef(null)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    const handleControllerChange = () => {
      window.location.reload()
    }
    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange)

    const watchRegistration = (registration) => {
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

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange)
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const handleUpdate = () => {
    if (waitingWorkerRef.current) {
      waitingWorkerRef.current.postMessage({ type: 'SKIP_WAITING' })
    }
    // Fuerza recarga para obtener la versión nueva
    window.location.reload()
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
              Toca Actualizar para obtener los últimos cambios
            </div>
          </div>

          {/* Botón */}
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={handleUpdate}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 12px',
              background: 'rgba(26,82,184,0.9)',
              border: '1px solid rgba(96,165,250,0.5)',
              borderRadius: 8, cursor: 'pointer',
              fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700,
              letterSpacing: '0.05em', color: '#FFFFFF',
              flexShrink: 0,
              boxShadow: '0 0 12px rgba(96,165,250,0.3)',
            }}
          >
            <RefreshCw size={13} />
            ACTUALIZAR
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
