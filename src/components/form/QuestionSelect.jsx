import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import QuestionPeoplePicker from './QuestionPeoplePicker'

export default function QuestionSelect({ question, value, onChange }) {
  const [focused, setFocused] = useState(false)

  const isDynamicAD = question.options === '__DYNAMIC_AZURE_AD__'

  // ── People Picker (Azure AD typeahead) ──────────────────────────────────
  // Delegamos completamente a QuestionPeoplePicker cuando la pregunta
  // apunta a Azure AD. Maneja tanto dev mode (mock) como producción (Graph).
  if (isDynamicAD) {
    return <QuestionPeoplePicker question={question} value={value} onChange={onChange} />
  }

  const rawOptions = question.options
  const useDropdown = question.displayType === 'dropdown' || rawOptions.length > 8

  // Normalize: always work with { label, value } internally
  const options = rawOptions.map((opt) =>
    typeof opt === 'string' ? { label: opt, value: opt } : opt
  )

  // ── Dropdown (native select) ────────────────────────────────────────────
  if (useDropdown) {
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
            {question.labelParts ? (
              <>
                {question.labelParts.prefix}
                <span style={{ color: 'var(--color-orange)', fontWeight: 700 }}>
                  {question.labelParts.highlight}
                </span>
                {question.labelParts.suffix || ''}
              </>
            ) : (
              question.label
            )}
            {question.required && (
              <span style={{ color: 'var(--color-orange)', marginLeft: 4 }}>*</span>
            )}
          </p>
        )}

        <div style={{ position: 'relative' }}>
          <select
            value={value || ''}
            onChange={(e) => onChange(question.id, e.target.value || null)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={{
              width: '100%',
              padding: '13px 40px 13px 14px',
              background: 'rgba(255,255,255,0.05)',
              border: `1.5px solid ${focused ? 'var(--color-orange)' : value ? 'var(--color-blue-btn)' : 'var(--color-border)'}`,
              borderRadius: 8,
              color: value ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
              fontFamily: 'var(--font-body)',
              fontSize: 14,
              outline: 'none',
              cursor: 'pointer',
              appearance: 'none',
              WebkitAppearance: 'none',
              transition: 'border-color 0.15s ease',
            }}
          >
            <option value="" disabled style={{ background: '#1B2A4A', color: '#8C96A8' }}>
              {question.placeholder || 'Selecciona la respuesta'}
            </option>
            {options.map((opt) => (
              <option
                key={opt.value}
                value={opt.value}
                style={{ background: '#1B2A4A', color: '#E8ECF4' }}
              >
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={16}
            color={focused ? 'var(--color-orange)' : 'var(--color-text-muted)'}
            style={{
              position: 'absolute',
              right: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              transition: 'color 0.15s ease',
            }}
          />
        </div>
      </div>
    )
  }

  // ── Chips (pill buttons) ────────────────────────────────────────────────
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
          {question.labelParts ? (
            <>
              {question.labelParts.prefix}
              <span style={{ color: 'var(--color-orange)', fontWeight: 700 }}>
                {question.labelParts.highlight}
              </span>
              {question.labelParts.suffix || ''}
            </>
          ) : (
            question.label
          )}
          {question.required && (
            <span style={{ color: 'var(--color-orange)', marginLeft: 4 }}>*</span>
          )}
        </p>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {options.map((opt) => {
          const selected = value === opt.value
          return (
            <motion.button
              key={opt.value}
              whileTap={{ scale: 0.95 }}
              onClick={() => onChange(question.id, selected ? null : opt.value)}
              style={{
                padding: '9px 16px',
                borderRadius: 999,
                border: `1.5px solid ${selected ? 'var(--color-blue-btn)' : 'var(--color-border)'}`,
                background: selected ? 'rgba(26,82,184,0.22)' : 'transparent',
                color: selected ? '#fff' : 'var(--color-text-muted)',
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                fontWeight: selected ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'normal',
                wordBreak: 'break-word',
                textAlign: 'left',
                lineHeight: 1.35,
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
