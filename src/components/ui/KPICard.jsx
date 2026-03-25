import { motion } from 'framer-motion'

function getStatusColor(percent) {
  if (percent >= 80) return 'var(--color-success)'
  if (percent >= 50) return 'var(--color-warning)'
  return 'var(--color-danger)'
}

function getStatusEmoji(percent) {
  if (percent >= 80) return '✅'
  if (percent >= 50) return '⚠️'
  return '🔴'
}

export default function KPICard({ label, current, total, percent, delay = 0 }) {
  const color = getStatusColor(percent)
  const emoji = getStatusEmoji(percent)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: 'easeOut' }}
      style={{
        background: 'linear-gradient(135deg, var(--color-navy-mid), var(--color-navy-light))',
        borderRadius: 'var(--radius-card)',
        padding: 16,
        borderLeft: `4px solid ${color}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--color-text-muted)',
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 28,
          fontWeight: 800,
          color: 'var(--color-text-primary)',
          lineHeight: 1,
        }}
      >
        {current}/{total}
      </div>

      {/* Progress bar */}
      <div
        style={{
          height: 6,
          background: 'rgba(255,255,255,0.10)',
          borderRadius: 99,
          overflow: 'hidden',
        }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ delay: delay + 0.2, duration: 0.6, ease: 'easeOut' }}
          style={{
            height: '100%',
            background: color,
            borderRadius: 99,
          }}
        />
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 700,
            fontSize: 14,
            color,
          }}
        >
          {percent}%
        </span>
        <span style={{ fontSize: 14 }}>{emoji}</span>
      </div>
    </motion.div>
  )
}
