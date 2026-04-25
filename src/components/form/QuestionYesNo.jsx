import { motion } from 'framer-motion'

const OPTIONS = [
  { value: 'si',  label: 'SÍ',  activeColor: '#27AE60', activeBg: 'rgba(39,174,96,0.15)'  },
  { value: 'no',  label: 'NO',  activeColor: '#EB5757', activeBg: 'rgba(235,87,87,0.15)'   },
  { value: 'na',  label: 'N/A', activeColor: '#8C96A8', activeBg: 'rgba(140,150,168,0.12)' },
]

export default function QuestionYesNo({ question, value, onChange }) {
  const visibleOptions = question.disableNA ? OPTIONS.filter(o => o.value !== 'na') : OPTIONS

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

      <div style={{ display: 'flex', gap: 8 }}>
        {visibleOptions.map((opt) => {
          const selected = value === opt.value
          return (
            <motion.button
              key={opt.value}
              whileTap={{ scale: 0.94 }}
              onClick={() => onChange(question.id, selected ? null : opt.value)}
              style={{
                flex: 1,
                height: 44,
                border: `1.5px solid ${selected ? opt.activeColor : 'var(--color-border)'}`,
                borderRadius: 8,
                background: selected ? opt.activeBg : 'transparent',
                color: selected ? opt.activeColor : 'var(--color-text-muted)',
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 14,
                letterSpacing: '0.06em',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {opt.label}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
