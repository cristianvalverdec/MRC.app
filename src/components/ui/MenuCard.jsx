import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'

export const cardVariants = {
  rest:  { scale: 1 },
  press: { scale: 0.97 },
}

export const containerVariants = {
  animate: { transition: { staggerChildren: 0.07 } },
}

export const itemVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
}

export default function MenuCard({ icon, label, sublabel, onClick, accentColor, badge }) {
  return (
    <motion.button
      variants={itemVariants}
      whileTap="press"
      initial="rest"
      onClick={onClick}
      style={{
        background: 'var(--color-navy-mid)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-card)',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        cursor: 'pointer',
        width: '100%',
        textAlign: 'left',
        minHeight: 72,
      }}
    >
      {/* Icon container */}
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 10,
          background: accentColor || 'var(--color-blue-btn)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          fontSize: 22,
        }}
      >
        {icon}
      </div>

      {/* Labels */}
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: 15,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: 'var(--color-text-primary)',
            lineHeight: 1.25,
          }}
        >
          {label}
        </div>
        {sublabel && (
          <div
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 12,
              color: 'var(--color-text-muted)',
              marginTop: 2,
            }}
          >
            {sublabel}
          </div>
        )}
      </div>

      {/* Badge opcional + Chevron */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {badge && (
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.1em',
            padding: '2px 7px',
            borderRadius: 4,
            background: 'rgba(123,63,228,0.18)',
            color: '#C084FC',
            border: '1px solid rgba(123,63,228,0.35)',
          }}>
            {badge}
          </span>
        )}
        <ChevronRight size={20} color="var(--color-orange)" strokeWidth={2.5} />
      </div>
    </motion.button>
  )
}
