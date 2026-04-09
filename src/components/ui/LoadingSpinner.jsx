import { motion } from 'framer-motion'

export default function LoadingSpinner({ size = 40, label = 'Cargando...' }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        padding: 32,
      }}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          border: `3px solid var(--color-border)`,
          borderTopColor: 'var(--color-orange)',
        }}
      />
      {label && (
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            color: 'var(--color-text-muted)',
          }}
        >
          {label}
        </span>
      )}
    </div>
  )
}
