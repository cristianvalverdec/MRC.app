import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, X, Share } from 'lucide-react'

const STORAGE_KEY  = 'mrc-install-dismissed'
const SUPPRESS_DAYS = 14   // vuelve a aparecer si pasaron más de 14 días
const SHOW_DELAY_MS = 3500 // espera antes de mostrar (ms)

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream
}

function wasDismissedRecently() {
  try {
    const ts = localStorage.getItem(STORAGE_KEY)
    if (!ts) return false
    return Date.now() - parseInt(ts, 10) < SUPPRESS_DAYS * 24 * 3600 * 1000
  } catch {
    return false
  }
}

function saveDismissed() {
  try { localStorage.setItem(STORAGE_KEY, String(Date.now())) } catch { /* no-op */ }
}

// ── Banner iOS: instrucciones manuales ────────────────────────────────────
function IOSInstructions({ onClose }) {
  return (
    <motion.div
      key="ios-prompt"
      initial={{ y: 120, opacity: 0 }}
      animate={{ y: 0,   opacity: 1 }}
      exit={{   y: 120, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 340, damping: 30 }}
      style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9998,
        background: 'linear-gradient(180deg, #1B2A4A 0%, #0f1c35 100%)',
        borderTop: '1px solid rgba(96,165,250,0.25)',
        borderRadius: '20px 20px 0 0',
        padding: '20px 20px calc(20px + env(safe-area-inset-bottom, 0px))',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.5)',
      }}
    >
      {/* Handle */}
      <div style={{
        width: 36, height: 4, borderRadius: 2,
        background: 'rgba(255,255,255,0.2)',
        margin: '0 auto 18px',
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        {/* Icono app */}
        <img
          src={`${import.meta.env.BASE_URL}icons/icon-192.png`}
          alt="MRC"
          onError={(e) => { e.target.style.display = 'none' }}
          style={{ width: 56, height: 56, borderRadius: 14, flexShrink: 0 }}
        />

        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16,
            color: '#FFFFFF', letterSpacing: '0.03em',
          }}>
            Instalar Misión Riesgo Cero
          </div>
          <div style={{
            fontFamily: 'var(--font-body)', fontSize: 12,
            color: 'rgba(255,255,255,0.55)', marginTop: 3, lineHeight: 1.5,
          }}>
            Añade la app a tu pantalla de inicio para acceso rápido sin necesidad de abrir el navegador.
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8,
            padding: '6px', cursor: 'pointer', display: 'flex', flexShrink: 0,
          }}
        >
          <X size={16} color="rgba(255,255,255,0.5)" />
        </motion.button>
      </div>

      {/* Pasos iOS */}
      <div style={{
        marginTop: 18, display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        {[
          { num: 1, icon: <Share size={14} color="#60A5FA" />, text: 'Toca el ícono de Compartir en Safari' },
          { num: 2, icon: <Download size={14} color="#60A5FA" />, text: 'Selecciona "Añadir a pantalla de inicio"' },
          { num: 3, icon: null, text: 'Toca "Agregar" para confirmar' },
        ].map(({ num, icon, text }) => (
          <div key={num} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
              background: 'rgba(96,165,250,0.12)',
              border: '1px solid rgba(96,165,250,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {icon || (
                <span style={{
                  fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, color: '#60A5FA',
                }}>
                  {num}
                </span>
              )}
            </div>
            <span style={{
              fontFamily: 'var(--font-body)', fontSize: 13,
              color: 'rgba(255,255,255,0.75)', lineHeight: 1.4,
            }}>
              {text}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

// ── Banner Android / Desktop ─────────────────────────────────────────────
function AndroidPrompt({ onInstall, onClose }) {
  return (
    <motion.div
      key="android-prompt"
      initial={{ y: 120, opacity: 0 }}
      animate={{ y: 0,   opacity: 1 }}
      exit={{   y: 120, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 340, damping: 30 }}
      style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9998,
        background: 'linear-gradient(180deg, #1B2A4A 0%, #0f1c35 100%)',
        borderTop: '1px solid rgba(96,165,250,0.25)',
        borderRadius: '20px 20px 0 0',
        padding: '20px 20px calc(20px + env(safe-area-inset-bottom, 0px))',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.5)',
      }}
    >
      {/* Handle */}
      <div style={{
        width: 36, height: 4, borderRadius: 2,
        background: 'rgba(255,255,255,0.2)',
        margin: '0 auto 18px',
      }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* Icono app */}
        <img
          src={`${import.meta.env.BASE_URL}icons/icon-192.png`}
          alt="MRC"
          onError={(e) => { e.target.style.display = 'none' }}
          style={{ width: 56, height: 56, borderRadius: 14, flexShrink: 0 }}
        />

        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16,
            color: '#FFFFFF', letterSpacing: '0.03em',
          }}>
            Instalar Misión Riesgo Cero
          </div>
          <div style={{
            fontFamily: 'var(--font-body)', fontSize: 12,
            color: 'rgba(255,255,255,0.55)', marginTop: 3,
          }}>
            Instala la app para acceso rápido desde tu pantalla de inicio.
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8,
            padding: '6px', cursor: 'pointer', display: 'flex', flexShrink: 0,
          }}
        >
          <X size={16} color="rgba(255,255,255,0.5)" />
        </motion.button>
      </div>

      {/* Beneficios rápidos */}
      <div style={{
        marginTop: 16, display: 'flex', gap: 8,
      }}>
        {['Acceso directo', 'Sin navegador', 'Modo offline'].map((label) => (
          <div key={label} style={{
            flex: 1, background: 'rgba(96,165,250,0.08)',
            border: '1px solid rgba(96,165,250,0.18)',
            borderRadius: 8, padding: '6px 4px', textAlign: 'center',
            fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600,
            color: 'rgba(255,255,255,0.6)', letterSpacing: '0.04em',
          }}>
            {label}
          </div>
        ))}
      </div>

      {/* Acciones */}
      <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onClose}
          style={{
            flex: 1, height: 48,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 12, cursor: 'pointer',
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14,
            color: 'rgba(255,255,255,0.5)',
            letterSpacing: '0.04em',
          }}
        >
          Ahora no
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onInstall}
          style={{
            flex: 2, height: 48,
            background: 'linear-gradient(135deg, #1A52B8 0%, #2F80ED 100%)',
            border: '1px solid rgba(96,165,250,0.4)',
            borderRadius: 12, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14,
            color: '#FFFFFF', letterSpacing: '0.04em',
            boxShadow: '0 4px 20px rgba(26,82,184,0.4)',
          }}
        >
          <Download size={16} />
          Instalar app
        </motion.button>
      </div>
    </motion.div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────
export default function InstallPrompt() {
  const [visible,  setVisible]  = useState(false)
  const [platform, setPlatform] = useState(null) // 'ios' | 'android'
  const deferredRef = useRef(null)
  const timerRef    = useRef(null)

  useEffect(() => {
    // No mostrar si ya está instalada como PWA
    if (isStandalone()) return
    // No mostrar si fue rechazada recientemente
    if (wasDismissedRecently()) return

    if (isIOS()) {
      timerRef.current = setTimeout(() => {
        setPlatform('ios')
        setVisible(true)
      }, SHOW_DELAY_MS)
    } else {
      const handler = (e) => {
        e.preventDefault()
        deferredRef.current = e
        timerRef.current = setTimeout(() => {
          setPlatform('android')
          setVisible(true)
        }, SHOW_DELAY_MS)
      }
      window.addEventListener('beforeinstallprompt', handler)
      return () => {
        window.removeEventListener('beforeinstallprompt', handler)
        if (timerRef.current) clearTimeout(timerRef.current)
      }
    }

    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [])

  const handleClose = () => {
    saveDismissed()
    setVisible(false)
  }

  const handleInstall = async () => {
    if (!deferredRef.current) return
    deferredRef.current.prompt()
    const { outcome } = await deferredRef.current.userChoice
    deferredRef.current = null
    saveDismissed()
    setVisible(false)
    if (outcome === 'accepted') {
      console.info('[MRC] PWA instalada ✓')
    }
  }

  return (
    <>
      {/* Overlay semitransparente */}
      <AnimatePresence>
        {visible && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            style={{
              position: 'fixed', inset: 0, zIndex: 9997,
              background: 'rgba(0,0,0,0.55)',
              backdropFilter: 'blur(2px)',
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {visible && platform === 'ios' && (
          <IOSInstructions key="ios" onClose={handleClose} />
        )}
        {visible && platform === 'android' && (
          <AndroidPrompt key="android" onInstall={handleInstall} onClose={handleClose} />
        )}
      </AnimatePresence>
    </>
  )
}
