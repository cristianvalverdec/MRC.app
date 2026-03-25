import { motion } from 'framer-motion'
import { Square, CheckSquare } from 'lucide-react'

export default function QuestionCheckbox({ question, value, onChange }) {
  const selected = Array.isArray(value) ? value : []

  const toggle = (optValue) => {
    const next = selected.includes(optValue)
      ? selected.filter((v) => v !== optValue)
      : [...selected, optValue]
    onChange(question.id, next.length > 0 ? next : null)
  }

  const graveCount = selected.filter((v) => {
    const opt = question.options.find((o) => o.value === v)
    return opt?.severity === 'GRAVE'
  }).length

  return (
    <div>
      {/* Subtitle */}
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

      {/* Checkbox items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {question.options.map((opt) => {
          const isSelected = selected.includes(opt.value)
          const isGrave = opt.severity === 'GRAVE'
          const activeColor = isGrave ? '#EB5757' : 'var(--color-blue-btn)'
          const activeBg = isGrave ? 'rgba(235,87,87,0.10)' : 'rgba(26,82,184,0.10)'
          const activeBorder = isGrave ? '#EB5757' : 'var(--color-blue-btn)'

          return (
            <motion.button
              key={opt.value}
              whileTap={{ scale: 0.98 }}
              onClick={() => toggle(opt.value)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: '12px 14px',
                border: `1.5px solid ${isSelected ? activeBorder : 'var(--color-border)'}`,
                borderRadius: 10,
                background: isSelected ? activeBg : 'rgba(255,255,255,0.02)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
                width: '100%',
              }}
            >
              {isSelected ? (
                <CheckSquare
                  size={18}
                  color={activeColor}
                  style={{ flexShrink: 0, marginTop: 1 }}
                />
              ) : (
                <Square
                  size={18}
                  color="var(--color-text-muted)"
                  style={{ flexShrink: 0, marginTop: 1 }}
                />
              )}

              <div style={{ flex: 1 }}>
                <span
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 13,
                    color: isSelected ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                    lineHeight: 1.45,
                  }}
                >
                  {opt.label}
                </span>
                {isGrave && (
                  <span
                    style={{
                      display: 'inline-block',
                      marginLeft: 8,
                      padding: '1px 7px',
                      borderRadius: 4,
                      background: 'rgba(235,87,87,0.18)',
                      border: '1px solid rgba(235,87,87,0.40)',
                      fontFamily: 'var(--font-display)',
                      fontWeight: 700,
                      fontSize: 10,
                      letterSpacing: '0.08em',
                      color: '#EB5757',
                      verticalAlign: 'middle',
                    }}
                  >
                    GRAVE
                  </span>
                )}
              </div>
            </motion.button>
          )
        })}
      </div>

      {/* Summary */}
      {selected.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            marginTop: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontFamily: 'var(--font-body)',
            fontSize: 12,
            color: 'var(--color-text-muted)',
          }}
        >
          <span>
            {selected.length} desviación{selected.length !== 1 ? 'es' : ''} seleccionada{selected.length !== 1 ? 's' : ''}
          </span>
          {graveCount > 0 && (
            <span
              style={{
                padding: '1px 8px',
                borderRadius: 4,
                background: 'rgba(235,87,87,0.18)',
                border: '1px solid rgba(235,87,87,0.40)',
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 10,
                letterSpacing: '0.06em',
                color: '#EB5757',
              }}
            >
              {graveCount} GRAVE{graveCount !== 1 ? 'S' : ''}
            </span>
          )}
        </motion.div>
      )}
    </div>
  )
}
