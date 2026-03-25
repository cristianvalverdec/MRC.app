// ── People Picker — búsqueda de personas en Azure AD ─────────────────────
// Renderizado por QuestionSelect cuando options === '__DYNAMIC_AZURE_AD__'.
// En dev mode usa una lista mock con búsqueda local.
// En producción llama a Microsoft Graph (User.ReadBasic.All).

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, User, X } from 'lucide-react'
import { searchUsers } from '../../services/graphService'

// ── Dev mode ──────────────────────────────────────────────────────────────
const IS_DEV_MODE =
  !import.meta.env.VITE_AZURE_CLIENT_ID ||
  import.meta.env.VITE_AZURE_CLIENT_ID === 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'

const MOCK_USERS = [
  { id: '1',  displayName: 'Carolina Rojas',     email: 'carolina.rojas@agrosuper.cl' },
  { id: '2',  displayName: 'Rodrigo Sánchez',    email: 'rodrigo.sanchez@agrosuper.cl' },
  { id: '3',  displayName: 'Valentina Martínez', email: 'valentina.martinez@agrosuper.cl' },
  { id: '4',  displayName: 'Diego Fuentes',      email: 'diego.fuentes@agrosuper.cl' },
  { id: '5',  displayName: 'Camila López',       email: 'camila.lopez@agrosuper.cl' },
  { id: '6',  displayName: 'Sebastián Torres',   email: 'sebastian.torres@agrosuper.cl' },
  { id: '7',  displayName: 'Andrea González',    email: 'andrea.gonzalez@agrosuper.cl' },
  { id: '8',  displayName: 'Felipe Morales',     email: 'felipe.morales@agrosuper.cl' },
  { id: '9',  displayName: 'Javiera Herrera',    email: 'javiera.herrera@agrosuper.cl' },
  { id: '10', displayName: 'Cristóbal Vargas',   email: 'cristobal.vargas@agrosuper.cl' },
  { id: '11', displayName: 'Daniela Castro',     email: 'daniela.castro@agrosuper.cl' },
  { id: '12', displayName: 'Nicolás Pérez',      email: 'nicolas.perez@agrosuper.cl' },
  { id: '13', displayName: 'Fernanda Muñoz',     email: 'fernanda.munoz@agrosuper.cl' },
  { id: '14', displayName: 'Alejandro Silva',    email: 'alejandro.silva@agrosuper.cl' },
  { id: '15', displayName: 'Isidora Molina',     email: 'isidora.molina@agrosuper.cl' },
  { id: '16', displayName: 'Tomás Riquelme',     email: 'tomas.riquelme@agrosuper.cl' },
  { id: '17', displayName: 'María José Vera',    email: 'mariajose.vera@agrosuper.cl' },
  { id: '18', displayName: 'Pablo Espinoza',     email: 'pablo.espinoza@agrosuper.cl' },
  { id: '19', displayName: 'Catalina Bravo',     email: 'catalina.bravo@agrosuper.cl' },
  { id: '20', displayName: 'Matías Contreras',   email: 'matias.contreras@agrosuper.cl' },
]

// ── Spinner inline ────────────────────────────────────────────────────────
function Spinner() {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
      style={{
        width: 14, height: 14, borderRadius: '50%',
        border: '2px solid rgba(255,255,255,0.2)',
        borderTopColor: 'var(--color-text-muted)',
        flexShrink: 0,
      }}
    />
  )
}

// ── Chip de persona seleccionada ──────────────────────────────────────────
function SelectedChip({ displayName, email, onClear }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 14px',
        background: 'rgba(26,82,184,0.12)',
        border: '1.5px solid var(--color-blue-btn)',
        borderRadius: 8,
      }}
    >
      {/* Avatar placeholder */}
      <div
        style={{
          width: 30, height: 30, borderRadius: '50%',
          background: 'rgba(26,82,184,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <User size={15} color="#60A5FA" />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600,
            color: 'var(--color-text-primary)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}
        >
          {displayName}
        </div>
        {email && (
          <div
            style={{
              fontFamily: 'var(--font-body)', fontSize: 11,
              color: 'var(--color-text-muted)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}
          >
            {email}
          </div>
        )}
      </div>

      <button
        onClick={onClear}
        aria-label="Quitar selección"
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--color-text-muted)', display: 'flex',
          padding: 4, borderRadius: 4,
          flexShrink: 0,
        }}
      >
        <X size={15} />
      </button>
    </motion.div>
  )
}

// ── Fila de resultado ─────────────────────────────────────────────────────
function ResultRow({ user, onSelect }) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      // onMouseDown para que no dispare el onBlur del input antes del click
      onMouseDown={(e) => { e.preventDefault(); onSelect(user) }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        width: '100%', padding: '10px 14px',
        background: hovered ? 'rgba(26,82,184,0.12)' : 'transparent',
        border: 'none',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        cursor: 'pointer', textAlign: 'left',
        transition: 'background 0.12s ease',
      }}
    >
      <div
        style={{
          width: 28, height: 28, borderRadius: '50%',
          background: 'rgba(26,82,184,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <User size={13} color="#60A5FA" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600,
            color: 'var(--color-text-primary)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}
        >
          {user.displayName}
        </div>
        <div
          style={{
            fontFamily: 'var(--font-body)', fontSize: 11,
            color: 'var(--color-text-muted)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}
        >
          {user.email}
        </div>
      </div>
    </button>
  )
}

// ── Componente principal ──────────────────────────────────────────────────
export default function QuestionPeoplePicker({ question, value, onChange }) {
  const [query, setQuery]     = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen]       = useState(false)

  const debounceRef  = useRef(null)
  const containerRef = useRef(null)
  const inputRef     = useRef(null)

  // value puede ser { displayName, email } o null
  const selected = value && typeof value === 'object' && value.displayName ? value : null

  // ── Búsqueda con debounce ─────────────────────────────────────────────
  const doSearch = useCallback(async (q) => {
    if (q.trim().length < 2) {
      setResults([])
      setOpen(false)
      return
    }

    setLoading(true)
    setOpen(true)

    try {
      let found = []
      if (IS_DEV_MODE) {
        const lower = q.toLowerCase()
        found = MOCK_USERS.filter((u) =>
          u.displayName.toLowerCase().includes(lower) ||
          u.email.toLowerCase().includes(lower)
        )
      } else {
        found = await searchUsers(q)
      }
      setResults(found)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleInputChange = (e) => {
    const q = e.target.value
    setQuery(q)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(q), 300)
  }

  const handleSelect = (user) => {
    onChange(question.id, { displayName: user.displayName, email: user.email })
    setQuery('')
    setResults([])
    setOpen(false)
  }

  const handleClear = () => {
    onChange(question.id, null)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Limpiar debounce al desmontar
  useEffect(() => () => clearTimeout(debounceRef.current), [])

  // ── Si ya hay selección — mostrar chip ───────────────────────────────
  if (selected) {
    return (
      <SelectedChip
        displayName={selected.displayName}
        email={selected.email}
        onClear={handleClear}
      />
    )
  }

  // ── Input de búsqueda ─────────────────────────────────────────────────
  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {IS_DEV_MODE && (
        <div
          style={{
            fontFamily: 'var(--font-body)', fontSize: 11,
            color: 'rgba(245,124,32,0.7)',
            marginBottom: 6, letterSpacing: '0.03em',
          }}
        >
          Modo demo — en producción busca en Microsoft Entra ID
        </div>
      )}

      {/* Input con icono */}
      <div style={{ position: 'relative' }}>
        <Search
          size={15}
          style={{
            position: 'absolute', left: 12, top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--color-text-muted)', pointerEvents: 'none',
          }}
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => query.trim().length >= 2 && setOpen(true)}
          placeholder={question.placeholder || 'Buscar persona...'}
          autoComplete="off"
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: '12px 40px 12px 36px',
            background: 'rgba(255,255,255,0.05)',
            border: `1.5px solid ${open ? 'var(--color-orange)' : 'var(--color-border)'}`,
            borderRadius: open && (results.length > 0 || loading) ? '8px 8px 0 0' : 8,
            color: 'var(--color-text-primary)',
            fontFamily: 'var(--font-body)', fontSize: 14,
            outline: 'none',
            transition: 'border-color 0.15s ease, border-radius 0.1s ease',
          }}
        />
        {loading && (
          <div
            style={{
              position: 'absolute', right: 12, top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
            }}
          >
            <Spinner />
          </div>
        )}
      </div>

      {/* Dropdown de resultados */}
      <AnimatePresence>
        {open && !loading && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            style={{
              position: 'absolute', top: '100%', left: 0, right: 0,
              zIndex: 50,
              background: 'var(--color-navy-mid)',
              border: '1.5px solid var(--color-border)',
              borderTop: 'none',
              borderRadius: '0 0 8px 8px',
              overflow: 'hidden',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              maxHeight: 260,
              overflowY: 'auto',
            }}
          >
            {results.map((user) => (
              <ResultRow key={user.id} user={user} onSelect={handleSelect} />
            ))}
          </motion.div>
        )}

        {/* Sin resultados */}
        {open && !loading && results.length === 0 && query.trim().length >= 2 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'absolute', top: '100%', left: 0, right: 0,
              zIndex: 50,
              background: 'var(--color-navy-mid)',
              border: '1.5px solid var(--color-border)',
              borderTop: 'none',
              borderRadius: '0 0 8px 8px',
              padding: '12px 14px',
              fontFamily: 'var(--font-body)', fontSize: 13,
              color: 'var(--color-text-muted)',
            }}
          >
            Sin resultados para <em>"{query}"</em>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
