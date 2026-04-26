// Formatea un RUT raw (solo dígitos + K) al formato chileno: XX.XXX.XXX-K
function formatRUT(raw) {
  const clean = raw.replace(/[^0-9kK]/g, '').toUpperCase()
  if (clean.length === 0) return ''
  if (clean.length === 1) return clean
  const dv   = clean.slice(-1)
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
  const dv   = clean.slice(-1)
  let sum = 0, mult = 2
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i], 10) * mult
    mult = mult === 7 ? 2 : mult + 1
  }
  const rem      = 11 - (sum % 11)
  const expected = rem === 11 ? '0' : rem === 10 ? 'K' : String(rem)
  return dv === expected
}

export default function QuestionRut({ question, value, onChange }) {
  const raw      = (value || '').replace(/[^0-9kK]/g, '').toUpperCase()
  const displayed = formatRUT(raw)
  const valid     = validateRUT(raw)

  function handleChange(e) {
    // Extrae solo dígitos y K del valor que ingresó el usuario (con o sin formato)
    const newRaw = e.target.value.replace(/[^0-9kK]/g, '').toUpperCase()
    if (newRaw.length > 9) return   // máximo 8 dígitos + 1 DV
    onChange(question.id, newRaw)
  }

  const borderColor  = valid === true ? '#27AE60' : valid === false ? '#EB5757' : 'var(--color-border)'
  const statusColor  = valid === true ? '#27AE60' : '#EB5757'
  const statusLabel  = valid === true ? '✓ RUT válido' : valid === false ? '✗ RUT inválido' : ''

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

      <div style={{ position: 'relative' }}>
        <input
          type="text"
          inputMode="text"
          value={displayed}
          onChange={handleChange}
          placeholder="12.345.678-9"
          autoCapitalize="characters"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: statusLabel ? '12px 110px 12px 16px' : '12px 16px',
            borderRadius: 10,
            border: `1.5px solid ${borderColor}`,
            background: 'var(--color-surface)',
            color: 'var(--color-text-primary)',
            fontFamily: 'var(--font-display)',
            fontSize: 20,
            fontWeight: 600,
            letterSpacing: '0.06em',
            outline: 'none',
            transition: 'border-color 0.15s',
          }}
        />
        {statusLabel && (
          <span style={{
            position: 'absolute',
            right: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            fontFamily: 'var(--font-body)',
            fontSize: 12,
            fontWeight: 600,
            color: statusColor,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}>
            {statusLabel}
          </span>
        )}
      </div>

      <p style={{
        fontFamily: 'var(--font-body)',
        fontSize: 11,
        color: 'var(--color-text-muted)',
        margin: '6px 0 0',
      }}>
        Escribe sin puntos ni guión — se formatean automáticamente
      </p>
    </div>
  )
}
