import { useState } from 'react'
import { motion } from 'framer-motion'

// Formatea un RUT raw (solo dígitos + K) al formato chileno: XX.XXX.XXX-K
function formatRUT(raw) {
  const clean = raw.replace(/[^0-9kK]/g, '').toUpperCase()
  if (clean.length === 0) return ''
  if (clean.length === 1) return clean

  const dv = clean.slice(-1)
  const body = clean.slice(0, -1)

  let formatted = ''
  for (let i = 0; i < body.length; i++) {
    if (i > 0 && (body.length - i) % 3 === 0) formatted += '.'
    formatted += body[i]
  }
  return formatted + '-' + dv
}

// Valida RUT chileno por Módulo 11. Retorna true/false/null (null = incompleto)
function validateRUT(raw) {
  const clean = raw.replace(/[^0-9kK]/g, '').toUpperCase()
  if (clean.length < 2) return null
  const body = clean.slice(0, -1)
  const dv = clean.slice(-1)
  let sum = 0, mult = 2
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i], 10) * mult
    mult = mult === 7 ? 2 : mult + 1
  }
  const rem = 11 - (sum % 11)
  const expected = rem === 11 ? '0' : rem === 10 ? 'K' : String(rem)
  return dv === expected
}

const KEY_ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['K', '0', '⌫'],
]

export default function QuestionRut({ question, value, onChange }) {
  const [focused, setFocused] = useState(false)

  const raw = (value || '').replace(/[^0-9kK]/g, '').toUpperCase()
  const displayed = formatRUT(raw)
  const valid = validateRUT(raw)

  function handleKey(key) {
    if (key === '⌫') {
      const newRaw = raw.slice(0, -1)
      onChange(question.id, newRaw)
      return
    }
    if (key === 'K') {
      if (raw.length === 0) return
      const newRaw = raw.replace(/K$/, '') + 'K'
      onChange(question.id, newRaw)
      return
    }
    // digit
    if (raw.endsWith('K')) return // K ya es el dígito verificador
    if (raw.length >= 9) return   // máximo 8 dígitos + 1 DV
    onChange(question.id, raw + key)
  }

  const statusColor = valid === true ? '#27AE60' : valid === false ? '#EB5757' : 'var(--color-text-muted)'
  const statusLabel = valid === true ? '✓ RUT válido' : valid === false ? '✗ RUT inválido' : ''

  return (
    <div>
      <p style={{
        fontFamily: 'var(--font-body)',
        fontSize: 14,
        color: 'var(--color-text-secondary)',
        lineHeight: 1.45,
        margin: '0 0 12px',
      }}>
        {question.label}
        {question.required && (
          <span style={{ color: 'var(--color-orange)', marginLeft: 4 }}>*</span>
        )}
      </p>

      {/* Campo de display */}
      <div
        onClick={() => setFocused(true)}
        style={{
          padding: '12px 16px',
          borderRadius: 10,
          border: `1.5px solid ${focused ? 'var(--color-blue-btn)' : 'var(--color-border)'}`,
          background: 'var(--color-surface)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'text',
          minHeight: 48,
          transition: 'border-color 0.15s',
        }}
      >
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: 20,
          fontWeight: 600,
          letterSpacing: '0.06em',
          color: displayed ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
        }}>
          {displayed || '–– RUT ––'}
        </span>
        {statusLabel && (
          <span style={{
            fontFamily: 'var(--font-body)',
            fontSize: 12,
            fontWeight: 600,
            color: statusColor,
          }}>
            {statusLabel}
          </span>
        )}
      </div>

      {/* Teclado virtual */}
      {focused && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginTop: 12 }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {KEY_ROWS.flat().map((key) => {
              const isBackspace = key === '⌫'
              const isK = key === 'K'
              return (
                <motion.button
                  key={key}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => handleKey(key)}
                  style={{
                    height: 52,
                    borderRadius: 10,
                    border: `1.5px solid ${isBackspace ? 'rgba(235,87,87,0.35)' : isK ? 'rgba(47,128,237,0.4)' : 'var(--color-border)'}`,
                    background: isBackspace ? 'rgba(235,87,87,0.08)' : isK ? 'rgba(47,128,237,0.1)' : 'var(--color-surface)',
                    color: isBackspace ? '#EB5757' : isK ? '#2F80ED' : 'var(--color-text-primary)',
                    fontFamily: 'var(--font-display)',
                    fontWeight: 700,
                    fontSize: isK ? 16 : 20,
                    cursor: 'pointer',
                    transition: 'all 0.12s',
                  }}
                >
                  {key}
                </motion.button>
              )
            })}
          </div>

          <button
            onClick={() => setFocused(false)}
            style={{
              marginTop: 10,
              width: '100%',
              padding: '10px',
              borderRadius: 10,
              border: '1.5px solid var(--color-border)',
              background: 'rgba(255,255,255,0.04)',
              color: 'var(--color-text-muted)',
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Listo
          </button>
        </motion.div>
      )}
    </div>
  )
}
