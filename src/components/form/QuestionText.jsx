import { useState } from 'react'

const MAX_CHARS = 500

export default function QuestionText({ question, value, onChange }) {
  const [focused, setFocused] = useState(false)
  const text = value || ''

  return (
    <div>
      {!question._noLabel && (
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            color: 'var(--color-text-secondary)',
            lineHeight: 1.45,
            margin: '0 0 10px',
          }}
        >
          {question.label}
          {question.required && (
            <span style={{ color: 'var(--color-orange)', marginLeft: 4 }}>*</span>
          )}
        </p>
      )}

      {question.inputType === 'single-line' ? (
        <input
          type="text"
          value={text}
          onChange={(e) => onChange(question.id, e.target.value.slice(0, MAX_CHARS))}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={question.placeholder || 'Escriba su respuesta'}
          style={{
            width: '100%',
            background: 'rgba(255,255,255,0.05)',
            border: `1.5px solid ${focused ? 'var(--color-orange)' : 'var(--color-border)'}`,
            borderRadius: 8,
            padding: '13px 14px',
            color: 'var(--color-text-primary)',
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            outline: 'none',
            transition: 'border-color 0.15s ease',
            boxSizing: 'border-box',
          }}
        />
      ) : (
        <textarea
          value={text}
          onChange={(e) => onChange(question.id, e.target.value.slice(0, MAX_CHARS))}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={question.placeholder || 'Escribe aquí…'}
          rows={3}
          style={{
            width: '100%',
            background: 'rgba(255,255,255,0.05)',
            border: `1.5px solid ${focused ? 'var(--color-orange)' : 'var(--color-border)'}`,
            borderRadius: 8,
            padding: '12px 14px',
            color: 'var(--color-text-primary)',
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            lineHeight: 1.5,
            resize: 'none',
            outline: 'none',
            transition: 'border-color 0.15s ease',
            boxSizing: 'border-box',
          }}
        />
      )}

      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginTop: 4,
          fontFamily: 'var(--font-body)',
          fontSize: 11,
          color: text.length > MAX_CHARS * 0.9 ? 'var(--color-warning)' : 'var(--color-text-muted)',
        }}
      >
        {text.length}/{MAX_CHARS}
      </div>
    </div>
  )
}
