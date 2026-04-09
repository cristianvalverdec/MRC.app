import { motion } from 'framer-motion'

const LABELS = ['', 'Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente']

export default function QuestionRating({ question, value, onChange }) {
  return (
    <div>
      {!question._noLabel && (
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            color: 'var(--color-text-secondary)',
            lineHeight: 1.45,
            margin: '0 0 12px',
          }}
        >
          {question.label}
          {question.required && (
            <span style={{ color: 'var(--color-orange)', marginLeft: 4 }}>*</span>
          )}
        </p>
      )}

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {[1, 2, 3, 4, 5].map((star) => {
          const selected = value >= star
          return (
            <motion.button
              key={star}
              whileTap={{ scale: 0.88 }}
              onClick={() => onChange(question.id, value === star ? null : star)}
              style={{
                flex: 1,
                height: 44,
                borderRadius: 8,
                border: `1.5px solid ${selected ? 'var(--color-orange)' : 'var(--color-border)'}`,
                background: selected ? 'rgba(245,124,32,0.15)' : 'transparent',
                color: selected ? 'var(--color-orange)' : 'var(--color-text-muted)',
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: 18,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label={`${star} — ${LABELS[star]}`}
            >
              {star}
            </motion.button>
          )
        })}
      </div>

      {value && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 11,
            color: 'var(--color-orange)',
            marginTop: 6,
            textAlign: 'center',
            letterSpacing: '0.04em',
          }}
        >
          {LABELS[value]}
        </motion.p>
      )}
    </div>
  )
}
