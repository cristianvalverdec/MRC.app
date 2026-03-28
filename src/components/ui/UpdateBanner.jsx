import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, Download } from 'lucide-react'

/**
 * UpdateBanner — detecta via Service Worker nativo cuando hay
 * una nueva versión disponible y le pregunta al usuario si desea actualizar.
 *
 * Requiere registerType: 'prompt' en vite.config.js para que el SW
 * quede en estado 'waiting' en lugar de activarse automáticamente.
 *
 * Flujo:
 *  1. Al cargar: si ya hay un SW en estado 'waiting' → muestra banner
 *  2. updatefound → nuevo SW se instala → statechange 'installed' → muestra banner
 *  3. Poll cada 60 s para detectar nuevas versiones mientras la app está abierta
 *  4. Al hacer clic en Actualizar: envía SKIP_WAITING al SW en espera
 *  5. Escucha 'controllerchange' → recarga la página con la versión nueva
 */
export default function UpdateBanner() {
  const [needRefresh, setNeedRefresh] = useState(false)
  const waitingWorkerRef = useRef(null)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    // Al activarse el nuevo SW → recarga la página
    const handleControllerChange = () => {
      window.location.reload()
    }
    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange)

    const watchRegistration = (registration) => {
      // ¿Ya hay un SW esperando activación?
      if (registration.waiting) {
        waitingWorkerRef.current = registration.waiting
        setNeedRefresh(true)
      }

      // Escucha nuevas instalaciones en background
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (!newWorker) return
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // Nueva versión instalada, esperando activación — avisar al usuario
            waitingWorkerRef.current = newWorker
            setNeedRefresh(true)
          }
        })
      })

      // Poll cada 60 s mientras la app permanece abierta
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
    if (!waitingWorkerRef.current) {
      window.location.reload()
      return
    }
    // SKIP_WAITING → el SW en espera se activa → 'controllerchange' → reload
    waitingWorkerRef.current.postMessage({ type: 'SKIP_WAITING' })
    setNeedRefresh(false)
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
