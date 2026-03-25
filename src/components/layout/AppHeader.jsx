import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { motion } from 'framer-motion'

function AgrosuperLogo({ height = 28 }) {
  return (
    <img
      src={`${import.meta.env.BASE_URL}agrosuper-logo.png`}
      alt="Agrosuper"
      style={{ height, width: 'auto', display: 'block' }}
    />
  )
}

export default function AppHeader({ title, showBack = true, onBack, rightAction }) {
  const navigate = useNavigate()

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      navigate(-1)
    }
  }

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        paddingTop: 'calc(12px + env(safe-area-inset-top, 0px))',
        background: 'rgba(27, 42, 74, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--color-border)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Left: back button */}
      <div style={{ width: 44, display: 'flex', alignItems: 'center' }}>
        {showBack && (
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={handleBack}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              margin: '-8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-orange)',
              borderRadius: 8,
              minWidth: 44,
              minHeight: 44,
            }}
            aria-label="Volver"
          >
            <ChevronLeft size={26} strokeWidth={2.5} />
          </motion.button>
        )}
      </div>

      {/* Center: title or logo */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        {title ? (
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 17,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: 'var(--color-text-primary)',
              textAlign: 'center',
            }}
          >
            {title}
          </span>
        ) : (
          <AgrosuperLogo height={24} />
        )}
      </div>

      {/* Right: action slot o spacer */}
      <div style={{ width: 44, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
        {rightAction || null}
      </div>
    </header>
  )
}
