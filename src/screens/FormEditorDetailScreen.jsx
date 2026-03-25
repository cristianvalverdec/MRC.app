import { useState, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Plus, Trash2, ChevronUp, ChevronDown, Save,
  GitBranch, List, AlertTriangle, CheckCircle2,
  RotateCcw, GripVertical, ArrowRight, Info,
  PlusCircle, MinusCircle,
} from 'lucide-react'
import AppHeader from '../components/layout/AppHeader'
import { formDefinitions } from '../forms/formDefinitions'
import useFormEditorStore from '../store/formEditorStore'

// ── Helpers ───────────────────────────────────────────────────────────────

const TYPE_LABELS = {
  radio:    { label: 'Radio',    color: '#1A52B8', bg: 'rgba(26,82,184,0.18)' },
  checkbox: { label: 'Checks',   color: '#F57C20', bg: 'rgba(245,124,32,0.18)' },
  select:   { label: 'Select',   color: '#2F80ED', bg: 'rgba(47,128,237,0.18)' },
  yesno:    { label: 'Sí/No',    color: '#27AE60', bg: 'rgba(39,174,96,0.18)' },
  text:     { label: 'Texto',    color: '#9B9B9B', bg: 'rgba(155,155,155,0.15)' },
  rating:   { label: 'Rating',   color: '#F2994A', bg: 'rgba(242,153,74,0.18)' },
}

const PROFILE_COLORS = {
  OP:  { color: '#60A5FA', bg: 'rgba(96,165,250,0.15)', border: 'rgba(96,165,250,0.35)' },
  ADM: { color: '#34D399', bg: 'rgba(52,211,153,0.15)', border: 'rgba(52,211,153,0.35)' },
}

// Convierte el dict de questions {Q1:{...}, Q2:{...}} → array ordenado por .order
function dictToArray(questionsDict) {
  return Object.values(questionsDict).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
}

// Convierte el array → dict keyed by question.id
function arrayToDict(questionsArray) {
  return Object.fromEntries(questionsArray.map((q) => [q.id, q]))
}

// Genera ID único para nueva pregunta
function newQId(existing) {
  const nums = existing
    .map((q) => parseInt(q.id.replace(/\D/g, ''), 10))
    .filter((n) => !isNaN(n))
  const max = nums.length ? Math.max(...nums) : 0
  return `Q${max + 1}`
}

// Pregunta vacía de tipo radio (la más común en wizard)
function emptyQuestion(id, order) {
  return {
    id,
    order,
    label: 'Nueva pregunta',
    type: 'radio',
    required: true,
    branching: true,
    conductasList: ['Conducta a observar 1'],
    options: [
      { value: 'SIN_OBSERVACIONES', label: 'SIN OBSERVACIONES', style: 'positive', nextQuestion: 'END' },
      { value: 'CON_OBSERVACIONES', label: 'CON OBSERVACIONES', style: 'negative', nextQuestion: 'END' },
    ],
  }
}

// ── Tipo badge inline ──────────────────────────────────────────────────────
function TypeBadge({ type }) {
  const t = TYPE_LABELS[type] || { label: type, color: '#9B9B9B', bg: 'rgba(155,155,155,0.15)' }
  return (
    <span style={{
      fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600,
      letterSpacing: '0.06em', padding: '2px 6px', borderRadius: 4,
      background: t.bg, color: t.color,
      border: `1px solid ${t.color}40`,
      whiteSpace: 'nowrap',
    }}>
      {t.label.toUpperCase()}
    </span>
  )
}

function ProfileBadge({ profile }) {
  if (!profile) return null
  const p = PROFILE_COLORS[profile] || { color: '#9B9B9B', bg: 'rgba(155,155,155,0.15)', border: 'rgba(155,155,155,0.3)' }
  return (
    <span style={{
      fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700,
      padding: '2px 7px', borderRadius: 4,
      background: p.bg, color: p.color, border: `1px solid ${p.border}`,
    }}>
      {profile}
    </span>
  )
}

// ── Indicador de destino de ramificación ──────────────────────────────────
function BranchIndicator({ question }) {
  // options puede ser array, string ('__DYNAMIC_AZURE_AD__') o undefined
  const opts = Array.isArray(question.options) ? question.options : []
  const branchingOpts = opts.filter(o => o && typeof o === 'object' && o.nextQuestion)

  if (branchingOpts.length === 0) {
    if (!question.nextQuestion) return null
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <ArrowRight size={11} color="var(--color-text-muted)" />
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--color-text-muted)' }}>
          {question.nextQuestion}
        </span>
      </div>
    )
  }
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
      {branchingOpts.map((o) => (
        <div key={o.value || o.label} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <ArrowRight size={10} color={o.style === 'positive' ? '#27AE60' : '#EB5757'} />
          <span style={{
            fontFamily: 'var(--font-body)', fontSize: 10,
            color: o.style === 'positive' ? '#6FCF97' : '#FF8A80',
          }}>
            {o.nextQuestion}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Item en la lista de preguntas ─────────────────────────────────────────
function QuestionItem({ question, index, total, onEdit, onDelete, onMoveUp, onMoveDown }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.15 } }}
      style={{
        background: 'var(--color-navy-mid)',
        border: '1px solid var(--color-border)',
        borderRadius: 10,
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'stretch' }}>
        {/* Barra izquierda con acciones de orden */}
        <div style={{
          width: 36, background: 'rgba(255,255,255,0.03)',
          borderRight: '1px solid var(--color-border)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 2, padding: '4px 0',
        }}>
          <button
            onClick={onMoveUp} disabled={index === 0}
            style={{
              background: 'none', border: 'none', cursor: index === 0 ? 'default' : 'pointer',
              padding: '4px', borderRadius: 4,
              opacity: index === 0 ? 0.2 : 0.7,
            }}
          >
            <ChevronUp size={14} color="var(--color-text-muted)" />
          </button>
          <span style={{
            fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700,
            color: 'var(--color-text-muted)', letterSpacing: '0.02em',
          }}>
            {question.id}
          </span>
          <button
            onClick={onMoveDown} disabled={index === total - 1}
            style={{
              background: 'none', border: 'none', cursor: index === total - 1 ? 'default' : 'pointer',
              padding: '4px', borderRadius: 4,
              opacity: index === total - 1 ? 0.2 : 0.7,
            }}
          >
            <ChevronDown size={14} color="var(--color-text-muted)" />
          </button>
        </div>

        {/* Contenido principal */}
        <div style={{ flex: 1, padding: '12px 12px', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
            <TypeBadge type={question.type} />
            <ProfileBadge profile={question.profile} />
            {question.required && (
              <span style={{
                fontFamily: 'var(--font-body)', fontSize: 9, color: '#EB5757',
                border: '1px solid rgba(235,87,87,0.35)', padding: '1px 5px', borderRadius: 3,
              }}>REQ</span>
            )}
          </div>
          <div style={{
            fontFamily: 'var(--font-body)', fontSize: 13,
            color: 'var(--color-text-primary)', lineHeight: 1.4,
            overflow: 'hidden', display: '-webkit-box',
            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            marginBottom: 6,
          }}>
            {question.label}
          </div>
          <BranchIndicator question={question} />
        </div>

        {/* Botones de acción */}
        <div style={{
          display: 'flex', flexDirection: 'column',
          borderLeft: '1px solid var(--color-border)',
          flexShrink: 0,
        }}>
          <button
            onClick={onEdit}
            style={{
              flex: 1, background: 'none', border: 'none', cursor: 'pointer',
              padding: '0 14px',
              borderBottom: '1px solid var(--color-border)',
              color: '#60A5FA',
            }}
          >
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600 }}>
              EDITAR
            </span>
          </button>
          <button
            onClick={onDelete}
            style={{
              flex: 1, background: 'none', border: 'none', cursor: 'pointer',
              padding: '0 14px', color: '#EB5757',
            }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// ── Vista de Flujo (tab "Flujo") ──────────────────────────────────────────
function FlowView({ questions }) {
  return (
    <div style={{ padding: '16px 0' }}>
      {questions.map((q, i) => {
        const opts = Array.isArray(q.options) ? q.options : []
        const hasBranching = q.branching && opts.some(o => o && typeof o === 'object' && o.nextQuestion)
        return (
          <div key={q.id} style={{ marginBottom: 2 }}>
            {/* Nodo de pregunta */}
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
            }}>
              {/* Línea vertical + círculo */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 28, flexShrink: 0 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: hasBranching ? 'rgba(26,82,184,0.2)' : 'rgba(255,255,255,0.05)',
                  border: `2px solid ${hasBranching ? '#1A52B8' : 'rgba(255,255,255,0.15)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <span style={{
                    fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 700,
                    color: hasBranching ? '#93B4F8' : 'var(--color-text-muted)',
                  }}>
                    {q.id}
                  </span>
                </div>
                {i < questions.length - 1 && (
                  <div style={{ width: 2, flex: 1, minHeight: 16, background: 'rgba(255,255,255,0.08)', marginTop: 2 }} />
                )}
              </div>

              {/* Contenido */}
              <div style={{ flex: 1, paddingBottom: 12, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginBottom: 3 }}>
                  <TypeBadge type={q.type} />
                  <ProfileBadge profile={q.profile} />
                </div>
                <div style={{
                  fontFamily: 'var(--font-body)', fontSize: 12,
                  color: 'var(--color-text-primary)', lineHeight: 1.4,
                  overflow: 'hidden', display: '-webkit-box',
                  WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                  marginBottom: 4,
                }}>
                  {q.label}
                </div>

                {/* Destinos de ramificación */}
                {hasBranching ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {(Array.isArray(q.options) ? q.options : []).filter(o => o && typeof o === 'object' && o.nextQuestion).map((o) => (
                      <div key={o.value} style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '3px 8px', borderRadius: 5,
                        background: o.style === 'positive' ? 'rgba(39,174,96,0.08)' : 'rgba(235,87,87,0.08)',
                        border: `1px solid ${o.style === 'positive' ? 'rgba(39,174,96,0.2)' : 'rgba(235,87,87,0.2)'}`,
                      }}>
                        <span style={{
                          fontFamily: 'var(--font-body)', fontSize: 10,
                          color: o.style === 'positive' ? '#6FCF97' : '#FF8A80',
                          flex: 1,
                        }}>
                          {o.label}
                        </span>
                        <ArrowRight size={10} color="var(--color-text-muted)" />
                        <span style={{
                          fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700,
                          color: o.nextQuestion === 'END' ? '#F2994A' : 'var(--color-text-secondary)',
                        }}>
                          {o.nextQuestion}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : q.nextQuestion ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ArrowRight size={11} color="var(--color-text-muted)" />
                    <span style={{
                      fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700,
                      color: q.nextQuestion === 'END' ? '#F2994A' : 'var(--color-text-secondary)',
                    }}>
                      {q.nextQuestion}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )
      })}

      {/* END node */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(242,153,74,0.15)', border: '2px solid rgba(242,153,74,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CheckCircle2 size={12} color="#F2994A" />
        </div>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, color: '#F2994A' }}>
          END — Fin del formulario
        </span>
      </div>
    </div>
  )
}

// ── Panel editor de pregunta (bottom sheet) ───────────────────────────────
function QuestionEditorPanel({ question, allQuestions, onSave, onClose }) {
  // Normalizar options: si es string (ej '__DYNAMIC_AZURE_AD__') convertir a array vacío para edición
  const normalizedQuestion = {
    ...question,
    options: Array.isArray(question.options) ? question.options : [],
  }
  const [draft, setDraft] = useState(normalizedQuestion)
  const allIds = allQuestions.map(q => q.id)
  const destinationOptions = [...allIds.filter(id => id !== question.id), 'END', '__AREA_ROUTING__']

  const update = (field, value) => setDraft(d => ({ ...d, [field]: value }))

  // Opciones helpers
  const updateOption = (idx, field, value) => {
    const opts = [...(draft.options || [])]
    opts[idx] = { ...opts[idx], [field]: value }
    update('options', opts)
  }

  const addOption = () => {
    const opts = [...(draft.options || [])]
    opts.push({ value: `opcion_${Date.now()}`, label: 'Nueva opción', nextQuestion: 'END' })
    update('options', opts)
  }

  const removeOption = (idx) => {
    const opts = [...(draft.options || [])]
    opts.splice(idx, 1)
    update('options', opts)
  }

  // conductasList helpers
  const updateConducta = (idx, value) => {
    const list = [...(draft.conductasList || [])]
    list[idx] = value
    update('conductasList', list)
  }

  const addConducta = () => {
    update('conductasList', [...(draft.conductasList || []), 'Nueva conducta a observar'])
  }

  const removeConducta = (idx) => {
    const list = [...(draft.conductasList || [])]
    list.splice(idx, 1)
    update('conductasList', list)
  }

  const inputStyle = {
    width: '100%', boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid var(--color-border)',
    borderRadius: 8, padding: '9px 12px',
    fontFamily: 'var(--font-body)', fontSize: 13,
    color: 'var(--color-text-primary)', outline: 'none',
  }

  const labelStyle = {
    fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600,
    color: 'var(--color-text-muted)', letterSpacing: '0.06em',
    textTransform: 'uppercase', marginBottom: 6, display: 'block',
  }

  const sectionStyle = { marginBottom: 20 }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'flex-end',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        style={{
          width: '100%', maxHeight: '92dvh',
          background: 'var(--color-navy-mid)',
          borderRadius: '16px 16px 0 0',
          border: '1px solid var(--color-border)',
          borderBottom: 'none',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header del panel */}
        <div style={{
          padding: '14px 16px', borderBottom: '1px solid var(--color-border)',
          display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'rgba(26,82,184,0.2)', border: '1.5px solid rgba(26,82,184,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700, color: '#93B4F8' }}>
              {draft.id}
            </span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '0.04em' }}>
              EDITAR PREGUNTA
            </div>
            <TypeBadge type={draft.type} />
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => onSave(draft)}
            style={{
              height: 36, padding: '0 16px',
              background: 'var(--color-blue-btn)', border: 'none', borderRadius: 8,
              color: '#fff', fontFamily: 'var(--font-display)', fontSize: 13,
              fontWeight: 700, letterSpacing: '0.06em', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <Save size={13} />
            GUARDAR
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            style={{
              width: 36, height: 36, background: 'rgba(255,255,255,0.06)',
              border: '1px solid var(--color-border)', borderRadius: 8,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={16} color="var(--color-text-muted)" />
          </motion.button>
        </div>

        {/* Cuerpo scrollable */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px', paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))' }}>

          {/* Tipo de pregunta */}
          <div style={sectionStyle}>
            <label style={labelStyle}>Tipo de pregunta</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {Object.entries(TYPE_LABELS).map(([type, meta]) => (
                <button
                  key={type}
                  onClick={() => update('type', type)}
                  style={{
                    padding: '6px 12px', borderRadius: 7, cursor: 'pointer',
                    background: draft.type === type ? meta.bg : 'rgba(255,255,255,0.04)',
                    border: `1.5px solid ${draft.type === type ? meta.color + '80' : 'var(--color-border)'}`,
                    color: draft.type === type ? meta.color : 'var(--color-text-muted)',
                    fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600,
                    transition: 'all 0.15s',
                  }}
                >
                  {meta.label}
                </button>
              ))}
            </div>
          </div>

          {/* Perfil (OP/ADM) */}
          <div style={sectionStyle}>
            <label style={labelStyle}>Perfil</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[null, 'OP', 'ADM'].map((p) => (
                <button
                  key={String(p)}
                  onClick={() => update('profile', p)}
                  style={{
                    padding: '6px 14px', borderRadius: 7, cursor: 'pointer',
                    background: draft.profile === p
                      ? (p ? PROFILE_COLORS[p].bg : 'rgba(255,255,255,0.08)')
                      : 'rgba(255,255,255,0.04)',
                    border: `1.5px solid ${draft.profile === p
                      ? (p ? PROFILE_COLORS[p].border : 'rgba(255,255,255,0.2)')
                      : 'var(--color-border)'}`,
                    color: draft.profile === p
                      ? (p ? PROFILE_COLORS[p].color : 'var(--color-text-primary)')
                      : 'var(--color-text-muted)',
                    fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600,
                    transition: 'all 0.15s',
                  }}
                >
                  {p ?? 'Sin perfil'}
                </button>
              ))}
            </div>
          </div>

          {/* Obligatorio */}
          <div style={{ ...sectionStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-text-primary)' }}>
              Pregunta obligatoria
            </span>
            <button
              onClick={() => update('required', !draft.required)}
              style={{
                width: 44, height: 24, borderRadius: 12, cursor: 'pointer', border: 'none',
                background: draft.required ? 'var(--color-blue-btn)' : 'rgba(255,255,255,0.1)',
                position: 'relative', transition: 'background 0.2s',
              }}
            >
              <div style={{
                width: 18, height: 18, borderRadius: '50%', background: '#fff',
                position: 'absolute', top: 3, transition: 'left 0.2s',
                left: draft.required ? 23 : 3,
              }} />
            </button>
          </div>

          {/* Etiqueta principal */}
          <div style={sectionStyle}>
            <label style={labelStyle}>Texto de la pregunta</label>
            <textarea
              value={draft.label}
              onChange={(e) => update('label', e.target.value)}
              rows={3}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
            />
          </div>

          {/* Subtítulo */}
          <div style={sectionStyle}>
            <label style={labelStyle}>Subtítulo (opcional)</label>
            <input
              value={draft.subtitle || ''}
              onChange={(e) => update('subtitle', e.target.value)}
              placeholder="Instrucción o descripción adicional"
              style={inputStyle}
            />
          </div>

          {/* conductasList (solo para tipo radio) */}
          {draft.type === 'radio' && (
            <div style={sectionStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>Lista de conductas a observar</label>
                <button
                  onClick={addConducta}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px',
                    background: 'rgba(39,174,96,0.12)', border: '1px solid rgba(39,174,96,0.3)',
                    borderRadius: 6, cursor: 'pointer', color: '#6FCF97',
                    fontFamily: 'var(--font-body)', fontSize: 11,
                  }}
                >
                  <Plus size={11} /> Añadir
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(draft.conductasList || []).map((c, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <span style={{
                      fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--color-text-muted)',
                      paddingTop: 10, flexShrink: 0, minWidth: 20,
                    }}>
                      {idx + 1}.
                    </span>
                    <input
                      value={c}
                      onChange={(e) => updateConducta(idx, e.target.value)}
                      style={{ ...inputStyle, flex: 1, padding: '8px 10px' }}
                    />
                    <button
                      onClick={() => removeConducta(idx)}
                      style={{
                        background: 'rgba(235,87,87,0.1)', border: '1px solid rgba(235,87,87,0.25)',
                        borderRadius: 7, padding: '8px 8px', cursor: 'pointer', flexShrink: 0,
                      }}
                    >
                      <Trash2 size={12} color="#EB5757" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Opciones con ramificaciones (radio, checkbox, select) */}
          {(draft.type === 'radio' || draft.type === 'checkbox' || draft.type === 'select') && (
            <div style={sectionStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>Opciones de respuesta</label>
                <button
                  onClick={addOption}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px',
                    background: 'rgba(26,82,184,0.12)', border: '1px solid rgba(26,82,184,0.3)',
                    borderRadius: 6, cursor: 'pointer', color: '#93B4F8',
                    fontFamily: 'var(--font-body)', fontSize: 11,
                  }}
                >
                  <Plus size={11} /> Añadir
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(draft.options || []).map((opt, idx) => (
                  <div key={idx} style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 9, padding: '12px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--color-text-muted)', letterSpacing: '0.06em' }}>
                        OPCIÓN {idx + 1}
                      </span>
                      <button
                        onClick={() => removeOption(idx)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                      >
                        <Trash2 size={12} color="#EB5757" />
                      </button>
                    </div>

                    {/* Etiqueta de opción */}
                    <div style={{ marginBottom: 8 }}>
                      <label style={{ ...labelStyle, fontSize: 10 }}>Texto visible</label>
                      <input
                        value={opt.label}
                        onChange={(e) => updateOption(idx, 'label', e.target.value)}
                        style={{ ...inputStyle, padding: '7px 10px', fontSize: 12 }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                      {/* Valor interno */}
                      <div>
                        <label style={{ ...labelStyle, fontSize: 10 }}>Valor (ID interno)</label>
                        <input
                          value={opt.value}
                          onChange={(e) => updateOption(idx, 'value', e.target.value)}
                          style={{ ...inputStyle, padding: '7px 10px', fontSize: 11, fontFamily: 'monospace' }}
                        />
                      </div>

                      {/* Severity (checkbox) */}
                      {draft.type === 'checkbox' && (
                        <div>
                          <label style={{ ...labelStyle, fontSize: 10 }}>Severidad</label>
                          <select
                            value={opt.severity || 'NORMAL'}
                            onChange={(e) => updateOption(idx, 'severity', e.target.value)}
                            style={{ ...inputStyle, padding: '7px 10px', fontSize: 12 }}
                          >
                            <option value="NORMAL">NORMAL</option>
                            <option value="GRAVE">GRAVE</option>
                          </select>
                        </div>
                      )}

                      {/* Style (radio) */}
                      {draft.type === 'radio' && (
                        <div>
                          <label style={{ ...labelStyle, fontSize: 10 }}>Estilo visual</label>
                          <select
                            value={opt.style || 'positive'}
                            onChange={(e) => updateOption(idx, 'style', e.target.value)}
                            style={{ ...inputStyle, padding: '7px 10px', fontSize: 12 }}
                          >
                            <option value="positive">Positivo (verde)</option>
                            <option value="negative">Negativo (rojo)</option>
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Destino de ramificación por opción */}
                    {(draft.type === 'radio' || draft.type === 'select') && (
                      <div>
                        <label style={{ ...labelStyle, fontSize: 10 }}>
                          <GitBranch size={10} style={{ display: 'inline', marginRight: 4 }} />
                          Ir a pregunta
                        </label>
                        <select
                          value={opt.nextQuestion || 'END'}
                          onChange={(e) => updateOption(idx, 'nextQuestion', e.target.value)}
                          style={{ ...inputStyle, padding: '7px 10px', fontSize: 12 }}
                        >
                          {destinationOptions.map(id => (
                            <option key={id} value={id}>
                              {id === 'END' ? '— FIN del formulario' : id === '__AREA_ROUTING__' ? '⚙ Enrutamiento por área' : id}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* nextQuestion lineal (para yesno, text, rating, checkbox) */}
          {(draft.type === 'yesno' || draft.type === 'text' || draft.type === 'rating' || draft.type === 'checkbox') && (
            <div style={sectionStyle}>
              <label style={labelStyle}>
                <GitBranch size={11} style={{ display: 'inline', marginRight: 5 }} />
                Continuar a pregunta
              </label>
              <select
                value={draft.nextQuestion || 'END'}
                onChange={(e) => update('nextQuestion', e.target.value)}
                style={{ ...inputStyle, padding: '9px 12px' }}
              >
                {destinationOptions.map(id => (
                  <option key={id} value={id}>
                    {id === 'END' ? '— FIN del formulario' : id === '__AREA_ROUTING__' ? '⚙ Enrutamiento por área' : id}
                  </option>
                ))}
              </select>
            </div>
          )}

        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Pantalla principal ────────────────────────────────────────────────────
export default function FormEditorDetailScreen() {
  const { formId } = useParams()
  const navigate = useNavigate()
  const {
    editedForms, saveFormEdits, resetFormEdits,
    customForms, updateCustomForm, deleteCustomForm,
  } = useFormEditorStore()

  // ¿Es un formulario personalizado creado por admin (no existe en formDefinitions)?
  const isCustom   = !formDefinitions[formId] && !!customForms[formId]
  const staticForm = formDefinitions[formId] || customForms[formId] || null
  const isWizard   = staticForm?.mode === 'wizard'

  // Carga el estado inicial: edición guardada o definición estática / custom
  const initQuestions = useCallback(() => {
    // Para formularios custom: los cambios se guardan directo en customForms
    if (isCustom) {
      const cf = customForms[formId]
      if (cf?.questions) return dictToArray(cf.questions)
      if (cf?.sections) {
        return cf.sections.flatMap((s) =>
          s.questions.map((q) => ({ ...q, _section: s.id, _sectionTitle: s.title }))
        )
      }
      return []
    }
    // Para formularios estáticos: override de editedForms primero
    const override = editedForms[formId]
    if (override?.questions) return dictToArray(override.questions)
    if (isWizard && staticForm?.questions) return dictToArray(staticForm.questions)
    if (staticForm?.sections) {
      return staticForm.sections.flatMap((s) =>
        s.questions.map((q) => ({ ...q, _section: s.id, _sectionTitle: s.title }))
      )
    }
    return []
  }, [formId]) // eslint-disable-line

  const [questions, setQuestions] = useState(initQuestions)
  const [activeTab, setActiveTab] = useState('lista')
  const [editingQ, setEditingQ] = useState(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [showDeleteFormConfirm, setShowDeleteFormConfirm] = useState(false)
  const [showSaveToast, setShowSaveToast] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const allIds = questions.map(q => q.id)

  const markChanged = (newQs) => {
    setQuestions(newQs)
    setHasChanges(true)
  }

  // Reordenar
  const moveUp = (idx) => {
    if (idx === 0) return
    const q = [...questions]
    ;[q[idx - 1], q[idx]] = [q[idx], q[idx - 1]]
    q.forEach((item, i) => { item.order = i + 1 })
    markChanged(q)
  }

  const moveDown = (idx) => {
    if (idx === questions.length - 1) return
    const q = [...questions]
    ;[q[idx], q[idx + 1]] = [q[idx + 1], q[idx]]
    q.forEach((item, i) => { item.order = i + 1 })
    markChanged(q)
  }

  // Eliminar
  const deleteQuestion = (id) => {
    markChanged(questions.filter(q => q.id !== id))
    setDeleteConfirm(null)
  }

  // Guardar edición de pregunta
  const saveQuestion = (updatedQ) => {
    markChanged(questions.map(q => q.id === updatedQ.id ? updatedQ : q))
    setEditingQ(null)
  }

  // Agregar nueva pregunta
  const addQuestion = () => {
    const id = newQId(questions)
    const order = questions.length + 1
    const newQ = emptyQuestion(id, order)
    markChanged([...questions, newQ])
    setEditingQ(newQ)
  }

  // Guardar todo en el store
  const handleSave = () => {
    if (isCustom) {
      // Formulario personalizado: actualiza directamente en customForms
      const updatedForm = isWizard
        ? { ...staticForm, questions: arrayToDict(questions) }
        : {
            ...staticForm,
            sections: (staticForm.sections || []).map((s) => ({
              ...s,
              questions: questions.filter((q) => q._section === s.id),
            })),
          }
      updateCustomForm(formId, updatedForm)
    } else {
      // Formulario estático: guarda override en editedForms
      const override = isWizard
        ? { questions: arrayToDict(questions) }
        : {
            sections: staticForm.sections.map((s) => ({
              ...s,
              questions: questions.filter((q) => q._section === s.id),
            })),
          }
      saveFormEdits(formId, override)
    }
    setHasChanges(false)
    setShowSaveToast(true)
    setTimeout(() => setShowSaveToast(false), 2500)
  }

  // Resetear a definición estática (solo formularios no-custom)
  const handleReset = () => {
    resetFormEdits(formId)
    setQuestions(initQuestions())
    setHasChanges(false)
    setShowResetConfirm(false)
  }

  // Eliminar formulario personalizado
  const handleDeleteCustomForm = () => {
    deleteCustomForm(formId)
    navigate('/admin/form-editor')
  }

  if (!staticForm) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--color-navy)' }}>
        <AppHeader title="Editor" />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)' }}>
          Formulario no encontrado: {formId}
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--color-navy)' }}>

      {/* Header personalizado con botones Save / Reset */}
      <div style={{
        display: 'flex', alignItems: 'center',
        padding: '12px 16px',
        paddingTop: 'calc(12px + env(safe-area-inset-top, 0px))',
        borderBottom: '1px solid var(--color-border)',
        background: 'rgba(27,42,74,0.95)',
        backdropFilter: 'blur(12px)',
        gap: 10, flexShrink: 0,
      }}>
        {/* Volver */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => navigate('/admin/form-editor')}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: 6, display: 'flex', alignItems: 'center',
          }}
        >
          <ChevronDown size={20} color="var(--color-text-muted)" style={{ transform: 'rotate(90deg)' }} />
        </motion.button>

        {/* Título */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14,
            letterSpacing: '0.05em', textTransform: 'uppercase',
            color: 'var(--color-text-primary)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {staticForm.title}
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--color-text-muted)', marginTop: 1 }}>
            {questions.length} preguntas {hasChanges && <span style={{ color: '#F2994A' }}>• cambios sin guardar</span>}
          </div>
        </div>

        {/* Reset (estático) o Eliminar (custom) */}
        {isCustom ? (
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={() => setShowDeleteFormConfirm(true)}
            style={{
              height: 34, padding: '0 12px', background: 'rgba(235,87,87,0.1)',
              border: '1px solid rgba(235,87,87,0.25)', borderRadius: 8, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <Trash2 size={13} color="#EB5757" />
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#EB5757', fontWeight: 600 }}>
              ELIMINAR
            </span>
          </motion.button>
        ) : (
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={() => setShowResetConfirm(true)}
            style={{
              height: 34, padding: '0 12px', background: 'rgba(235,87,87,0.1)',
              border: '1px solid rgba(235,87,87,0.25)', borderRadius: 8, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <RotateCcw size={13} color="#EB5757" />
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#EB5757', fontWeight: 600 }}>
              RESET
            </span>
          </motion.button>
        )}

        {/* Guardar */}
        <motion.button
          whileTap={{ scale: 0.93 }}
          onClick={handleSave}
          disabled={!hasChanges}
          style={{
            height: 34, padding: '0 14px',
            background: hasChanges ? 'var(--color-blue-btn)' : 'rgba(255,255,255,0.06)',
            border: hasChanges ? 'none' : '1px solid var(--color-border)',
            borderRadius: 8, cursor: hasChanges ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', gap: 6,
            transition: 'all 0.2s',
          }}
        >
          <Save size={13} color={hasChanges ? '#fff' : 'var(--color-text-muted)'} />
          <span style={{
            fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700,
            letterSpacing: '0.06em',
            color: hasChanges ? '#fff' : 'var(--color-text-muted)',
          }}>
            GUARDAR
          </span>
        </motion.button>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', borderBottom: '1px solid var(--color-border)',
        background: 'rgba(27,42,74,0.8)', flexShrink: 0,
      }}>
        {[
          { id: 'lista', label: 'Lista de preguntas', icon: <List size={13} /> },
          { id: 'flujo', label: 'Vista de flujo', icon: <GitBranch size={13} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1, height: 44, background: 'none', border: 'none', cursor: 'pointer',
              borderBottom: activeTab === tab.id ? '2px solid var(--color-orange)' : '2px solid transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              color: activeTab === tab.id ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
              fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600,
              transition: 'all 0.2s',
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenido */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}>
        <AnimatePresence mode="wait">
          {activeTab === 'lista' ? (
            <motion.div key="lista" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {questions.map((q, idx) => (
                  <QuestionItem
                    key={q.id}
                    question={q}
                    index={idx}
                    total={questions.length}
                    onEdit={() => setEditingQ(q)}
                    onDelete={() => setDeleteConfirm(q.id)}
                    onMoveUp={() => moveUp(idx)}
                    onMoveDown={() => moveDown(idx)}
                  />
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div key="flujo" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <FlowView questions={questions} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* FAB — Agregar pregunta */}
      {activeTab === 'lista' && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileTap={{ scale: 0.93 }}
          onClick={addQuestion}
          style={{
            position: 'fixed',
            bottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
            right: 20,
            width: 52, height: 52, borderRadius: '50%',
            background: 'var(--color-orange)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(245,124,32,0.45)',
            zIndex: 10,
          }}
        >
          <Plus size={22} color="#fff" strokeWidth={2.5} />
        </motion.button>
      )}

      {/* Panel editor de pregunta */}
      <AnimatePresence>
        {editingQ && (
          <QuestionEditorPanel
            key={editingQ.id}
            question={editingQ}
            allQuestions={questions}
            onSave={saveQuestion}
            onClose={() => setEditingQ(null)}
          />
        )}
      </AnimatePresence>

      {/* Modal confirmar eliminar formulario custom */}
      <AnimatePresence>
        {showDeleteFormConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 60,
              background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{
                background: 'var(--color-navy-mid)', border: '1px solid rgba(235,87,87,0.3)',
                borderRadius: 14, padding: 24, maxWidth: 340, width: '100%',
              }}
            >
              <AlertTriangle size={24} color="#EB5757" style={{ marginBottom: 12 }} />
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 8 }}>
                ¿ELIMINAR FORMULARIO?
              </div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.5, marginBottom: 20 }}>
                Esta acción eliminará el formulario "<strong style={{ color: 'var(--color-text-primary)' }}>{staticForm?.title}</strong>" de forma permanente. No se podrá recuperar.
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setShowDeleteFormConfirm(false)}
                  style={{
                    flex: 1, height: 42, background: 'rgba(255,255,255,0.06)',
                    border: '1px solid var(--color-border)', borderRadius: 8, cursor: 'pointer',
                    color: 'var(--color-text-secondary)', fontFamily: 'var(--font-body)', fontSize: 13,
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteCustomForm}
                  style={{
                    flex: 1, height: 42, background: 'rgba(235,87,87,0.15)',
                    border: '1px solid rgba(235,87,87,0.3)', borderRadius: 8, cursor: 'pointer',
                    color: '#EB5757', fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700,
                  }}
                >
                  ELIMINAR
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal confirmar reset */}
      <AnimatePresence>
        {showResetConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 60,
              background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{
                background: 'var(--color-navy-mid)', border: '1px solid var(--color-border)',
                borderRadius: 14, padding: 24, maxWidth: 340, width: '100%',
              }}
            >
              <AlertTriangle size={24} color="#F2994A" style={{ marginBottom: 12 }} />
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 8 }}>
                ¿RESTABLECER FORMULARIO?
              </div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.5, marginBottom: 20 }}>
                Se eliminarán todos los cambios y se volverá a la definición original del formulario.
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  style={{
                    flex: 1, height: 42, background: 'rgba(255,255,255,0.06)',
                    border: '1px solid var(--color-border)', borderRadius: 8, cursor: 'pointer',
                    color: 'var(--color-text-secondary)', fontFamily: 'var(--font-body)', fontSize: 13,
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleReset}
                  style={{
                    flex: 1, height: 42, background: 'rgba(235,87,87,0.15)',
                    border: '1px solid rgba(235,87,87,0.3)', borderRadius: 8, cursor: 'pointer',
                    color: '#EB5757', fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700,
                  }}
                >
                  RESTABLECER
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal confirmar eliminar pregunta */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 60,
              background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{
                background: 'var(--color-navy-mid)', border: '1px solid rgba(235,87,87,0.3)',
                borderRadius: 14, padding: 24, maxWidth: 320, width: '100%',
              }}
            >
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 8 }}>
                ¿ELIMINAR {deleteConfirm}?
              </div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.5, marginBottom: 16 }}>
                Las referencias a esta pregunta en otras ramificaciones quedarán apuntando a un destino inexistente.
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setDeleteConfirm(null)}
                  style={{ flex: 1, height: 40, background: 'rgba(255,255,255,0.06)', border: '1px solid var(--color-border)', borderRadius: 8, cursor: 'pointer', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-body)', fontSize: 13 }}>
                  Cancelar
                </button>
                <button onClick={() => deleteQuestion(deleteConfirm)}
                  style={{ flex: 1, height: 40, background: 'rgba(235,87,87,0.15)', border: '1px solid rgba(235,87,87,0.3)', borderRadius: 8, cursor: 'pointer', color: '#EB5757', fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700 }}>
                  ELIMINAR
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast de guardado exitoso */}
      <AnimatePresence>
        {showSaveToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            style={{
              position: 'fixed',
              bottom: 'calc(84px + env(safe-area-inset-bottom, 0px))',
              left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(39,174,96,0.15)',
              border: '1px solid rgba(39,174,96,0.4)',
              borderRadius: 10, padding: '10px 20px',
              display: 'flex', alignItems: 'center', gap: 8,
              zIndex: 20, backdropFilter: 'blur(8px)',
              whiteSpace: 'nowrap',
            }}
          >
            <CheckCircle2 size={14} color="#6FCF97" />
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#6FCF97' }}>
              Cambios guardados
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
