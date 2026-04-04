import { motion } from 'framer-motion'
import { CheckCircle2, AlertTriangle, Eye } from 'lucide-react'

const STYLES = {
  positive: {
    activeColor: '#27AE60',
    activeBg: 'rgba(39,174,96,0.12)',
    activeBorder: '#27AE60',
    Icon: CheckCircle2,
  },
  negative: {
    activeColor: '#EB5757',
    activeBg: 'rgba(235,87,87,0.10)',
    activeBorder: '#EB5757',
    Icon: AlertTriangle,
  },
}

export default function QuestionRadio({ question, value, onChange }) {
  return (
    <div>
      {/* Conduct list — things to observe before answering */}
      {question.conductasList?.length > 0 && (
        <div
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--color-border)',
            borderRadius: 10,
            padding: '14px 16px',
            marginBottom: 20,
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 11,
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
              color: 'var(--color-orange)',
              marginBottom: 12,
            }}
          >
            Conductas a observar
          </div>
          {question.conductasList.map((conducta, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: 10,
                marginBottom: i < question.conductasList.length - 1 ? 10 : 0,
              }}
            >
              <Eye
                size={13}
                color="var(--color-text-muted)"
                style={{ flexShrink: 0, marginTop: 2 }}
              />
              <span
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 13,
                  color: 'var(--color-text-secondary)',
                  lineHeight: 1.45,
                }}
              >
                {conducta}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Subtitle (instruction) */}
      {question.subtitle && (
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            color: 'var(--color-text-muted)',
            margin: '0 0 14px',
            lineHeight: 1.4,
          }}
        >
          {question.subtitle}
        </p>
      )}

      {/* Two choice cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {question.options.map((opt) => {
          const s = STYLES[opt.style] || STYLES.positive
          const Icon = s.Icon
          const selected = value === opt.value

          return (
            <motion.button
              key={opt.value}
              whileTap={{ scale: 0.97 }}
              onClick={() => onChange(question.id, selected ? null : opt.value)}
              style={{
                width: '100%',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                border: `2px solid ${selected ? s.activeBorder : 'var(--color-border)'}`,
                borderRadius: 12,
                background: selected ? s.activeBg : 'rgba(255,255,255,0.02)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                textAlign: 'left',
                boxSizing: 'border-box',
              }}
            >
              <Icon
                size={20}
                color={selected ? s.activeColor : 'var(--color-text-muted)'}
                strokeWidth={selected ? 2.5 : 1.5}
                style={{ flexShrink: 0, marginTop: 2 }}
              />
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize: 15,
                  letterSpacing: '0.04em',
                  color: selected ? s.activeColor : 'var(--color-text-secondary)',
                  transition: 'color 0.15s ease',
                  wordBreak: 'break-word',
                  overflowWrap: 'anywhere',
                  minWidth: 0,
                  lineHeight: 1.3,
                }}
              >
                {opt.label}
              </span>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
