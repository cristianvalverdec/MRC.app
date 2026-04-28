import { useState, useCallback, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Plus, Trash2, ChevronUp, ChevronDown, Save,
  GitBranch, List, AlertTriangle, CheckCircle2,
  RotateCcw, ArrowRight, Cloud, CloudOff, RefreshCw, Eye, Link2, Archive,
} from 'lucide-react'
import AppHeader from '../components/layout/AppHeader'
import { formDefinitions } from '../forms/formDefinitions'
import {
  SP_COLUMN_CATALOG, fetchListColumns,
  saveConnectionOverride, clearConnectionOverride, getAllConnectionOverrides,
} from '../services/sharepointData'
import { SHAREPOINT_LISTS, findListByGuid } from '../services/sharepointLists'
import useFormEditorStore from '../store/formEditorStore'

// ── Helpers ───────────────────────────────────────────────────────────────

// F3: parser regex que intenta convertir una `visibleWhen` estática en una
// `visibleCondition` serializable equivalente. Cubre los dos patrones que
// existen actualmente en formDefinitions.js:
//   (a) => a.Q18 === 'X'
//   (a) => a.Q18 === 'X' && a.Q20 === 'Y'
// Si el patrón no encaja, retorna null (la condición se muestra como
// "compleja — solo editable en código").
function parseVisibleWhen(fn) {
  if (typeof fn !== 'function') return null
  const src = fn.toString()
  // Normaliza espacios y elimina la firma del arrow
  const body = src.replace(/\s+/g, ' ').trim()
  const single = /a\.([A-Za-z_]\w*)\s*===\s*'([^']+)'/g
  const matches = []
  let m
  while ((m = single.exec(body)) !== null) {
    matches.push({ questionId: m[1], equals: m[2] })
  }
  if (matches.length === 0) return null
  if (matches.length === 1) return matches[0]
  // Múltiples comparaciones: detectar && (all) vs || (any)
  if (body.includes('&&') && !body.includes('||')) return { all: matches }
  if (body.includes('||') && !body.includes('&&')) return { any: matches }
  return null  // mezcla de operadores → no soportado
}

// Convierte una visibleCondition serializada en texto legible para badges.
function renderConditionLabel(vc) {
  if (!vc) return ''
  if (vc._complex) return 'condición compleja'
  if (vc.questionId) {
    const val = vc.equals ?? (Array.isArray(vc.in) ? vc.in.join(' / ') : '')
    return `Visible si ${vc.questionId} = "${val}"`
  }
  if (vc.all) return `Visible si ${vc.all.map((c) => `${c.questionId}="${c.equals ?? ''}"`).join(' Y ')}`
  if (vc.any) return `Visible si ${vc.any.map((c) => `${c.questionId}="${c.equals ?? ''}"`).join(' O ')}`
  return ''
}

const TYPE_LABELS = {
  radio:    { label: 'Radio',    color: '#1A52B8', bg: 'rgba(26,82,184,0.18)' },
  checkbox: { label: 'Checks',   color: '#F57C20', bg: 'rgba(245,124,32,0.18)' },
  select:   { label: 'Select',   color: '#2F80ED', bg: 'rgba(47,128,237,0.18)' },
  yesno:    { label: 'Sí/No',    color: '#27AE60', bg: 'rgba(39,174,96,0.18)' },
  text:     { label: 'Texto',    color: '#9B9B9B', bg: 'rgba(155,155,155,0.15)' },
  rating:   { label: 'Rating',   color: '#F2994A', bg: 'rgba(242,153,74,0.18)' },
  photo:    { label: 'Foto',     color: '#EB5757', bg: 'rgba(235,87,87,0.15)'  },
  rut:      { label: 'RUT',      color: '#6B7FD7', bg: 'rgba(107,127,215,0.18)' },
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

// Genera ID único para nueva pregunta.
// Considera IDs del set actual EN el editor + los del formulario estático,
// para evitar colisiones con preguntas que existan solo en formDefinitions.
function newQId(existing, staticForm) {
  const staticIds = staticForm?.sections
    ? staticForm.sections.flatMap((s) => (s.questions || []).map((q) => q.id))
    : Object.keys(staticForm?.questions ?? {})
  const allIds = new Set([...existing.map((q) => q.id), ...staticIds])
  const allNums = [...allIds]
    .map((id) => parseInt(String(id).replace(/\D/g, ''), 10))
    .filter((n) => !isNaN(n))
  let n = allNums.length ? Math.max(...allNums) + 1 : 1
  while (allIds.has(`Q${n}`)) n++
  return `Q${n}`
}

// Pregunta vacía de tipo radio (la más común en wizard).
// Para formularios seccionados se DEBE pasar sectionId + sectionTitle, si no
// la pregunta queda huérfana y el handleSave tendrá que re-asignarla como red
// de seguridad (ver regla 5c en CLAUDE.md).
function emptyQuestion(id, order, sectionId = null, sectionTitle = null) {
  const base = {
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
  if (sectionId) {
    base._section = sectionId
    base._sectionTitle = sectionTitle
  }
  return base
}

// Trunca labels largos para mostrar en dropdowns de ramificación.
function truncateLabel(str, n = 60) {
  if (!str) return ''
  const s = String(str).replace(/\s+/g, ' ').trim()
  return s.length > n ? s.slice(0, n - 1) + '…' : s
}

// Formatea una opción de destino con su label para dropdowns "Ir a pregunta".
// "Q18 — ¿Área en la que verificará el cumplimiento?"
function formatDestinationLabel(id, questionsById) {
  if (id === 'END') return '— FIN del formulario'
  if (id === '__AREA_ROUTING__') return '⚙ Enrutamiento por área'
  const q = questionsById[id]
  if (!q || !q.label) return id
  return `${id} — ${truncateLabel(q.label, 60)}`
}

// ── Validación pre-guardado ────────────────────────────────────────────────
// Devuelve { errors: string[], warnings: string[] }.
// errors bloquean el guardado; warnings solo informan.
function validateForm(questions, staticForm, isWizard, originalStatic = null) {
  const errors = []
  const warnings = []
  const ids = questions.map((q) => q.id)
  const idSet = new Set(ids)

  // 1. IDs duplicados
  const seen = new Set()
  const dups = new Set()
  ids.forEach((id) => {
    if (seen.has(id)) dups.add(id)
    else seen.add(id)
  })
  if (dups.size) errors.push(`IDs duplicados: ${[...dups].join(', ')}`)

  // 2. Labels vacíos
  const emptyLabels = questions.filter((q) => !q.label || !String(q.label).trim())
  if (emptyLabels.length) {
    errors.push(`Preguntas sin texto: ${emptyLabels.map((q) => q.id).join(', ')}`)
  }

  // 3. Opciones requeridas en tipos que las usan
  const withOpts = questions.filter((q) => ['radio', 'checkbox', 'select'].includes(q.type))
  withOpts.forEach((q) => {
    const opts = Array.isArray(q.options) ? q.options : []
    if (opts.length === 0) {
      errors.push(`${q.id}: tipo ${q.type} sin opciones`)
    }
    opts.forEach((o, i) => {
      if (!o || !String(o.label || '').trim()) {
        errors.push(`${q.id}: opción ${i + 1} sin texto`)
      }
    })
  })

  // 4. Referencias de ramificación válidas
  const validDest = new Set([...idSet, 'END', '__AREA_ROUTING__'])
  questions.forEach((q) => {
    if (q.nextQuestion && !validDest.has(q.nextQuestion)) {
      errors.push(`${q.id}: "nextQuestion" apunta a ${q.nextQuestion} (no existe)`)
    }
    const opts = Array.isArray(q.options) ? q.options : []
    opts.forEach((o) => {
      if (o?.nextQuestion && !validDest.has(o.nextQuestion)) {
        errors.push(`${q.id} → opción "${o.label}": apunta a ${o.nextQuestion} (no existe)`)
      }
    })
  })

  // 5. Preguntas huérfanas en seccionados (warning, no error — handleSave las recoge)
  if (!isWizard && staticForm?.sections) {
    const sectionIds = new Set(staticForm.sections.map((s) => s.id))
    const orphans = questions.filter((q) => !q._section || !sectionIds.has(q._section))
    if (orphans.length) {
      warnings.push(
        `Preguntas sin sección asignada: ${orphans.map((q) => q.id).join(', ')} (se asignarán automáticamente a "${staticForm.sections[0]?.title}")`
      )
    }
  }

  // 6. F4 — gating inconsistente.
  // Si en un formulario seccionado >50% de las secciones tienen gating
  // (visibleCondition de override O visibleWhen de estático), una sección
  // o pregunta SIN gating es warning explícito. Bypass permitido pero
  // requiere confirmación consciente — convierte el silencio que produjo
  // Q52/Q53 en una decisión documentada.
  if (!isWizard && staticForm?.sections && staticForm.sections.length > 1) {
    const isSectionGated = (s) => {
      if (s.visibleCondition) return true
      const orig = originalStatic?.sections?.find((os) => os.id === s.id)
      return typeof orig?.visibleWhen === 'function'
    }
    const gatedSections = staticForm.sections.filter(isSectionGated)
    const ratio = gatedSections.length / staticForm.sections.length
    if (ratio > 0.5) {
      const ungatedSections = staticForm.sections.filter((s) => !isSectionGated(s))
      ungatedSections.forEach((s) => {
        warnings.push(
          `Sección "${s.title}" aparecerá siempre. Otras secciones del formulario son condicionales — ¿es intencional?`
        )
      })
    }
    // Mismo análisis a nivel pregunta dentro de secciones gateadas
    const isQuestionGated = (q) => {
      if (q.visibleCondition) return true
      // Buscar en estático
      const origSec = originalStatic?.sections?.find((os) =>
        os.questions?.some((sq) => sq.id === q.id)
      )
      const origQ = origSec?.questions?.find((sq) => sq.id === q.id)
      return typeof origQ?.visibleWhen === 'function'
    }
    questions.forEach((q) => {
      if (!q._section) return
      const sec = staticForm.sections.find((s) => s.id === q._section)
      if (!sec) return
      const sectionGated = isSectionGated(sec)
      if (!sectionGated) return
      const siblings = questions.filter((sq) => sq._section === sec.id && sq.id !== q.id)
      if (siblings.length === 0) return
      const gatedSiblings = siblings.filter(isQuestionGated)
      if (gatedSiblings.length / siblings.length > 0.5 && !isQuestionGated(q)) {
        warnings.push(
          `Pregunta ${q.id} ("${String(q.label || '').slice(0, 40)}") en sección "${sec.title}" aparecerá siempre que la sección sea visible. Sus hermanas son condicionales — ¿es intencional?`
        )
      }
    })
  }

  return { errors, warnings }
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
function QuestionEditorPanel({ question, allQuestions, sections, formId, onSave, onClose }) {
  // Normalizar options: si es string (ej '__DYNAMIC_AZURE_AD__') → array vacío;
  // si los items son strings simples (ej select de instalaciones) → convertir a objetos {value, label}
  const normalizedQuestion = {
    ...question,
    options: Array.isArray(question.options)
      ? question.options.map((opt) =>
          typeof opt === 'string' ? { value: opt, label: opt, nextQuestion: 'END' } : opt
        )
      : [],
  }
  const [draft, setDraft] = useState(normalizedQuestion)

  // Columna SP: modo texto libre (independiente de draft.spColumn para evitar bucle)
  const knownCatalog = SP_COLUMN_CATALOG[formId] || []
  const initIsCustom = !!normalizedQuestion.spColumn &&
    !knownCatalog.some((c) => c.internal === normalizedQuestion.spColumn)
  const [customColMode, setCustomColMode] = useState(initIsCustom)
  // Columnas dinámicas leídas desde la Graph API (override del catálogo estático)
  const [dynamicCols, setDynamicCols]   = useState(null)
  const [colFetchStatus, setColFetchStatus] = useState('idle') // idle|loading|ok|error

  const questionsById = Object.fromEntries(allQuestions.map((q) => [q.id, q]))
  const destinationIds = allQuestions.map((q) => q.id).filter((id) => id !== question.id)

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

          {/* Sección (solo en formularios seccionados) */}
          {sections.length > 0 && (
            <div style={sectionStyle}>
              <label style={labelStyle}>Sección</label>
              <select
                value={draft._section || ''}
                onChange={(e) => {
                  const sec = sections.find((s) => s.id === e.target.value)
                  setDraft((d) => ({ ...d, _section: sec?.id || null, _sectionTitle: sec?.title || null }))
                }}
                style={{ ...inputStyle, padding: '9px 12px' }}
              >
                <option value="">— Sin sección asignada</option>
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>{s.title}</option>
                ))}
              </select>
            </div>
          )}

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

          {/* Visibilidad condicional de la pregunta */}
          {(() => {
            const controllers = allQuestions
              .filter((q) => q.id !== draft.id && ['select', 'radio'].includes(q.type) && Array.isArray(q.options) && q.options.length > 0)
            const cond = draft.visibleCondition || null
            const enabled = !!cond?.questionId
            const selected = controllers.find((c) => c.id === cond?.questionId)
            const opts = (selected?.options || []).map((o) =>
              typeof o === 'string' ? { value: o, label: o } : { value: o.value ?? o.label, label: o.label ?? o.value }
            )
            return (
              <div style={sectionStyle}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: enabled ? 10 : 0 }}>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-text-primary)' }}>
                    Mostrar solo si otra pregunta tiene cierto valor
                  </span>
                  <button
                    onClick={() => {
                      if (enabled) update('visibleCondition', null)
                      else update('visibleCondition', { questionId: controllers[0]?.id || '', equals: '' })
                    }}
                    disabled={!enabled && controllers.length === 0}
                    style={{
                      width: 44, height: 24, borderRadius: 12,
                      cursor: !enabled && controllers.length === 0 ? 'default' : 'pointer',
                      border: 'none',
                      background: enabled ? 'var(--color-blue-btn)' : 'rgba(255,255,255,0.1)',
                      position: 'relative', transition: 'background 0.2s',
                      opacity: !enabled && controllers.length === 0 ? 0.4 : 1,
                    }}
                  >
                    <div style={{
                      width: 18, height: 18, borderRadius: '50%', background: '#fff',
                      position: 'absolute', top: 3, transition: 'left 0.2s',
                      left: enabled ? 23 : 3,
                    }} />
                  </button>
                </div>
                {enabled && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <select
                      value={cond.questionId || ''}
                      onChange={(e) => update('visibleCondition', { questionId: e.target.value, equals: '' })}
                      style={inputStyle}
                    >
                      {controllers.map((c) => (
                        <option key={c.id} value={c.id}>{c.id} — {truncateLabel(c.label, 50)}</option>
                      ))}
                    </select>
                    <select
                      value={cond.equals ?? ''}
                      onChange={(e) => update('visibleCondition', { ...cond, equals: e.target.value })}
                      style={inputStyle}
                    >
                      <option value="">— Seleccionar valor —</option>
                      {opts.map((o) => (
                        <option key={String(o.value)} value={String(o.value)}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )
          })()}

          {/* Incluir N/A (solo tipo yesno) */}
          {draft.type === 'yesno' && (
            <div style={{ ...sectionStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-text-primary)' }}>
                Incluir opción N/A
              </span>
              <button
                onClick={() => update('disableNA', !draft.disableNA)}
                style={{
                  width: 44, height: 24, borderRadius: 12, cursor: 'pointer', border: 'none',
                  background: !draft.disableNA ? 'var(--color-blue-btn)' : 'rgba(255,255,255,0.1)',
                  position: 'relative', transition: 'background 0.2s',
                }}
              >
                <div style={{
                  width: 18, height: 18, borderRadius: '50%', background: '#fff',
                  position: 'absolute', top: 3, transition: 'left 0.2s',
                  left: !draft.disableNA ? 23 : 3,
                }} />
              </button>
            </div>
          )}

          {/* Columna SharePoint */}
          {(() => {
            const colList  = dynamicCols ?? knownCatalog
            const isKnown  = colList.some((c) => c.internal === draft.spColumn)
            const selectVal = customColMode ? '__custom__' : (draft.spColumn || '')
            return (
              <div style={sectionStyle}>
                {/* Cabecera con botón "Leer desde SharePoint" */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>Columna SharePoint</label>
                  <button
                    onClick={async () => {
                      setColFetchStatus('loading')
                      const cols = await fetchListColumns(formId)
                      if (cols) { setDynamicCols(cols); setColFetchStatus('ok') }
                      else setColFetchStatus('error')
                      setTimeout(() => setColFetchStatus('idle'), 3000)
                    }}
                    disabled={colFetchStatus === 'loading'}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '4px 10px', borderRadius: 6, cursor: 'pointer',
                      background: colFetchStatus === 'ok'    ? 'rgba(39,174,96,0.12)'
                               : colFetchStatus === 'error'  ? 'rgba(235,87,87,0.10)'
                               : 'rgba(47,128,237,0.10)',
                      border: `1px solid ${colFetchStatus === 'ok'   ? 'rgba(39,174,96,0.3)'
                                         : colFetchStatus === 'error' ? 'rgba(235,87,87,0.3)'
                                         : 'rgba(47,128,237,0.3)'}`,
                      color: colFetchStatus === 'ok'    ? '#6FCF97'
                           : colFetchStatus === 'error' ? '#EB5757'
                           : '#2F80ED',
                      fontFamily: 'var(--font-body)', fontSize: 11,
                    }}
                  >
                    {colFetchStatus === 'loading' ? '⏳ Leyendo…'
                   : colFetchStatus === 'ok'      ? '✓ Actualizadas'
                   : colFetchStatus === 'error'   ? '✗ Sin acceso'
                   : '☁ Leer desde SP'}
                  </button>
                </div>
                <p style={{
                  fontFamily: 'var(--font-body)', fontSize: 11,
                  color: 'var(--color-text-muted)', margin: '0 0 8px', lineHeight: 1.5,
                }}>
                  Nombre interno de la columna donde se depositará la respuesta.
                  Déjalo en blanco si el sistema ya la mapea automáticamente.
                  {dynamicCols && (
                    <span style={{ color: '#6FCF97' }}> ({dynamicCols.length} columnas leídas desde SharePoint)</span>
                  )}
                </p>

                <select
                  value={selectVal}
                  onChange={(e) => {
                    if (e.target.value === '__custom__') {
                      setCustomColMode(true)
                      update('spColumn', '')
                    } else {
                      setCustomColMode(false)
                      update('spColumn', e.target.value)
                    }
                  }}
                  style={{ ...inputStyle, padding: '9px 12px' }}
                >
                  <option value="">— Sin asignación (mapeada automáticamente o no aplica)</option>
                  {colList.map((col) => (
                    <option key={col.internal} value={col.internal}>{col.label}</option>
                  ))}
                  <option value="__custom__">✏ Nombre personalizado…</option>
                </select>

                {customColMode && (
                  <input
                    autoFocus
                    value={draft.spColumn || ''}
                    onChange={(e) => update('spColumn', e.target.value.trim())}
                    placeholder="Ej: Carta_x0020_Amonestaci_x00f3_n"
                    style={{ ...inputStyle, marginTop: 8 }}
                  />
                )}

                {draft.spColumn && isKnown && !customColMode && (
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#27AE60', margin: '6px 0 0' }}>
                    ✓ Columna reconocida — la respuesta se enviará a esta columna al guardar.
                  </p>
                )}
              </div>
            )
          })()}

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
                          <optgroup label="Preguntas">
                            {destinationIds.map((id) => (
                              <option key={id} value={id}>
                                {formatDestinationLabel(id, questionsById)}
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="Destinos especiales">
                            <option value="END">— FIN del formulario</option>
                            <option value="__AREA_ROUTING__">⚙ Enrutamiento por área</option>
                          </optgroup>
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
                <optgroup label="Preguntas">
                  {destinationIds.map((id) => (
                    <option key={id} value={id}>
                      {formatDestinationLabel(id, questionsById)}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Destinos especiales">
                  <option value="END">— FIN del formulario</option>
                  <option value="__AREA_ROUTING__">⚙ Enrutamiento por área</option>
                </optgroup>
              </select>
            </div>
          )}

        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Indicador de sync cloud (nube con estado) ─────────────────────────────
// Muestra tres estados: syncing (animado), success (verde, solo si hubo sync
// reciente), error (rojo con tooltip + botón Reintentar).
function SyncIndicator({ status, error, onRetry }) {
  if (status === 'syncing') {
    return (
      <div title="Sincronizando con SharePoint…" style={{ display: 'flex', alignItems: 'center', padding: '0 6px' }}>
        <RefreshCw size={16} color="#F2994A" style={{ animation: 'mrc-spin 1.2s linear infinite' }} />
        <style>{`@keyframes mrc-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }
  if (status === 'error') {
    return (
      <button
        onClick={onRetry}
        title={`Error al sincronizar: ${error || 'desconocido'}. Clic para reintentar.`}
        style={{
          display: 'flex', alignItems: 'center', gap: 4,
          background: 'rgba(235,87,87,0.1)', border: '1px solid rgba(235,87,87,0.3)',
          borderRadius: 7, padding: '4px 8px', cursor: 'pointer',
        }}
      >
        <CloudOff size={14} color="#EB5757" />
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: '#EB5757', fontWeight: 600 }}>
          REINTENTAR
        </span>
      </button>
    )
  }
  if (status === 'success') {
    return (
      <div title="Sincronizado con SharePoint" style={{ display: 'flex', alignItems: 'center', padding: '0 6px' }}>
        <Cloud size={16} color="#6FCF97" />
      </div>
    )
  }
  return null
}

// ── Gestor de secciones (tab "Secciones") ─────────────────────────────────
function SectionsManager({ sections, questions, onRename, onMove, onDelete, onAdd, onSetVisibleCondition, pendingVisibilityFor, onClearPending, isReglasOroTemplate = false, onOpenAddRegla }) {
  const [editingId, setEditingId] = useState(null)
  const [draftTitle, setDraftTitle] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null) // { id, title, count }
  const [manualConditionFor, setManualConditionFor] = useState(null)

  // F2: si el padre señala pendingVisibilityFor, derivamos conditionFor desde la
  // lista de secciones SIN usar un useEffect que llame setState (evita cascada de
  // renders y la regla react-hooks/set-state-in-effect). El admin ve el modal
  // inmediatamente al crear la sección — no puede ignorar la decisión de gating.
  const pendingSection = pendingVisibilityFor
    ? (sections.find((s) => s.id === pendingVisibilityFor) || null)
    : null
  const conditionFor  = pendingSection || manualConditionFor
  const setConditionFor = (v) => {
    setManualConditionFor(v)
    if (!v) onClearPending?.()
  }

  // Preguntas con opciones discretas (radio/select) que sirven como controladoras
  // de visibilidad. Se ofrecen como base para la condición.
  const controllerQuestions = questions
    .filter((q) => ['select', 'radio'].includes(q.type) && Array.isArray(q.options) && q.options.length > 0)
    .map((q) => ({
      id: q.id,
      label: q.label,
      options: q.options.map((o) => typeof o === 'string' ? { value: o, label: o } : { value: o.value ?? o.label, label: o.label ?? o.value }),
    }))

  const countBySection = sections.reduce((acc, s) => {
    acc[s.id] = questions.filter((q) => q._section === s.id).length
    return acc
  }, {})

  const startEdit = (s) => {
    setEditingId(s.id)
    setDraftTitle(s.title)
  }
  const commitEdit = (id) => {
    const t = draftTitle.trim()
    if (t) onRename(id, t)
    setEditingId(null)
    setDraftTitle('')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <p style={{
        fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-text-muted)',
        margin: '0 0 4px', lineHeight: 1.5,
      }}>
        Las secciones agrupan preguntas dentro del formulario (ej. "DATOS GENERALES", "REGLAS DE ORO", "CIERRE").
        Cada pregunta debe pertenecer a una sección. Al eliminar una sección, sus preguntas se reasignan a otra.
      </p>

      {sections.map((s, idx) => {
        const isEditing = editingId === s.id
        const qCount = countBySection[s.id] || 0
        return (
          <div key={s.id} style={{
            background: 'var(--color-navy-mid)',
            border: '1px solid var(--color-border)',
            borderRadius: 10, padding: '10px 12px',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <button
                onClick={() => onMove(idx, -1)} disabled={idx === 0}
                style={{
                  background: 'none', border: 'none',
                  cursor: idx === 0 ? 'default' : 'pointer',
                  padding: 2, opacity: idx === 0 ? 0.2 : 0.7,
                }}
              >
                <ChevronUp size={14} color="var(--color-text-muted)" />
              </button>
              <button
                onClick={() => onMove(idx, 1)} disabled={idx === sections.length - 1}
                style={{
                  background: 'none', border: 'none',
                  cursor: idx === sections.length - 1 ? 'default' : 'pointer',
                  padding: 2, opacity: idx === sections.length - 1 ? 0.2 : 0.7,
                }}
              >
                <ChevronDown size={14} color="var(--color-text-muted)" />
              </button>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              {isEditing ? (
                <input
                  autoFocus
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  onBlur={() => commitEdit(s.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitEdit(s.id)
                    if (e.key === 'Escape') { setEditingId(null); setDraftTitle('') }
                  }}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(96,165,250,0.4)',
                    borderRadius: 6, padding: '6px 8px',
                    fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700,
                    color: 'var(--color-text-primary)', outline: 'none',
                    letterSpacing: '0.04em',
                  }}
                />
              ) : (
                <div style={{
                  fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700,
                  color: 'var(--color-text-primary)', letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {s.title}
                </div>
              )}
              <div style={{
                fontFamily: 'var(--font-body)', fontSize: 11,
                color: 'var(--color-text-muted)', marginTop: 2,
              }}>
                {qCount} {qCount === 1 ? 'pregunta' : 'preguntas'} · id: <code style={{ fontFamily: 'monospace', fontSize: 10 }}>{s.id}</code>
              </div>
              {/* visibleCondition de override (editable) */}
              {s.visibleCondition && (
                <div style={{
                  fontFamily: 'var(--font-body)', fontSize: 10,
                  color: '#F2994A', marginTop: 3,
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  <Eye size={10} />
                  {renderConditionLabel(s.visibleCondition)}
                </div>
              )}
              {/* F3: visibleCondition heredada del estático (read-only) */}
              {!s.visibleCondition && s._staticVisibleCondition && (
                <div style={{
                  fontFamily: 'var(--font-body)', fontSize: 10,
                  color: '#60A5FA', marginTop: 3,
                  display: 'flex', alignItems: 'center', gap: 4,
                  opacity: 0.8,
                }}>
                  <Eye size={10} />
                  {s._staticVisibleCondition._complex
                    ? 'condición compleja (solo editable en código)'
                    : renderConditionLabel(s._staticVisibleCondition)}
                  &nbsp;<span style={{ opacity: 0.6, fontStyle: 'italic' }}>[estático]</span>
                </div>
              )}
            </div>

            {!isEditing && (
              <>
                <button
                  onClick={() => setConditionFor(s)}
                  title={
                    s.visibleCondition
                      ? 'Editar visibilidad condicional (override)'
                      : s._staticVisibleCondition
                        ? 'Esta sección tiene condición estática — click para sobreescribir con override'
                        : 'Configurar visibilidad condicional'
                  }
                  style={{
                    background: s.visibleCondition
                      ? 'rgba(242,153,74,0.12)'
                      : s._staticVisibleCondition ? 'rgba(96,165,250,0.08)' : 'none',
                    border: `1px solid ${
                      s.visibleCondition
                        ? 'rgba(242,153,74,0.4)'
                        : s._staticVisibleCondition ? 'rgba(96,165,250,0.3)' : 'var(--color-border)'
                    }`,
                    borderRadius: 6, padding: '5px 8px', cursor: 'pointer',
                    color: s.visibleCondition
                      ? '#F2994A'
                      : s._staticVisibleCondition ? '#60A5FA' : 'var(--color-text-muted)',
                  }}
                >
                  <Eye size={13} />
                </button>
                <button
                  onClick={() => startEdit(s)}
                  style={{
                    background: 'none', border: '1px solid var(--color-border)',
                    borderRadius: 6, padding: '5px 10px', cursor: 'pointer',
                    color: '#60A5FA', fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600,
                  }}
                >
                  EDITAR
                </button>
                <button
                  onClick={() => setConfirmDelete({ id: s.id, title: s.title, count: qCount })}
                  disabled={sections.length <= 1}
                  title={sections.length <= 1 ? 'No se puede eliminar la última sección' : 'Eliminar sección'}
                  style={{
                    background: 'none', border: '1px solid rgba(235,87,87,0.3)',
                    borderRadius: 6, padding: '5px 8px',
                    cursor: sections.length <= 1 ? 'default' : 'pointer',
                    opacity: sections.length <= 1 ? 0.4 : 1,
                    color: '#EB5757',
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </>
            )}
          </div>
        )
      })}

      <button
        onClick={onAdd}
        style={{
          marginTop: 4, padding: '10px 12px',
          background: 'rgba(245,124,32,0.08)',
          border: '1px dashed rgba(245,124,32,0.4)',
          borderRadius: 10, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          color: 'var(--color-orange)',
          fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700,
          letterSpacing: '0.06em',
        }}
      >
        <Plus size={14} />
        AGREGAR SECCIÓN
      </button>

      {/* F5: macro template "Reglas de Oro" — solo en formularios con metadata.template === 'reglas-oro' */}
      {isReglasOroTemplate && (
        <button
          onClick={onOpenAddRegla}
          style={{
            marginTop: 4, padding: '10px 12px',
            background: 'rgba(123,63,228,0.1)',
            border: '1px solid rgba(123,63,228,0.5)',
            borderRadius: 10, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            color: '#C084FC',
            fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700,
            letterSpacing: '0.06em',
          }}
          title="Agrega opción a Q20/Q21 + sección + radio + checkbox con gating consistente, en una sola operación"
        >
          <Plus size={14} />
          AGREGAR REGLA DE ORO (TEMPLATE)
        </button>
      )}

      {/* Modal de condición de visibilidad */}
      <AnimatePresence>
        {conditionFor && (
          <SectionVisibilityModal
            section={conditionFor}
            controllers={controllerQuestions.filter((c) => !questions.some((q) => q.id === c.id && q._section === conditionFor.id))}
            forced={pendingVisibilityFor === conditionFor.id}
            onCancel={() => { setConditionFor(null); onClearPending && onClearPending() }}
            onSave={(condition) => {
              onSetVisibleCondition(conditionFor.id, condition)
              setConditionFor(null)
              onClearPending && onClearPending()
            }}
          />
        )}
      </AnimatePresence>

      {/* Modal confirmar eliminación con selector de destino */}
      <AnimatePresence>
        {confirmDelete && (
          <SectionDeleteModal
            section={confirmDelete}
            otherSections={sections.filter((s) => s.id !== confirmDelete.id)}
            onCancel={() => setConfirmDelete(null)}
            onConfirm={(reassignTo) => {
              onDelete(confirmDelete.id, reassignTo)
              setConfirmDelete(null)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ── F5: Modal "Agregar Regla de Oro" ──────────────────────────────────────
//
// Recolecta los datos mínimos para construir una regla nueva: número, área,
// nombre y conductas observables. El handler addReglaOroMacro se encarga de
// crear opción + sección + radio + checkbox con gating consistente en una
// transacción atómica.
function AddReglaOroModal({ onCancel, onCreate }) {
  const [numero, setNumero] = useState('')
  const [area, setArea]     = useState('OP')
  const [nombre, setNombre] = useState('')
  const [conductasText, setConductasText] = useState('')
  const [error, setError]   = useState('')

  const handleSubmit = () => {
    if (!numero.trim() || !/^\d+$/.test(numero.trim())) { setError('Ingresa un número entero (ej: 8)'); return }
    if (!nombre.trim()) { setError('Ingresa el nombre de la regla'); return }
    const conductas = conductasText.split('\n').map((s) => s.trim()).filter(Boolean)
    onCreate({ numero: numero.trim(), area, nombre: nombre.trim(), conductas })
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 60,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        style={{
          background: 'var(--color-navy-mid)', border: '1px solid var(--color-border)',
          borderRadius: 14, padding: 22, maxWidth: 460, width: '100%',
          maxHeight: '88dvh', overflowY: 'auto',
        }}
      >
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 4 }}>
          AGREGAR REGLA DE ORO
        </div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.5, marginBottom: 18 }}>
          Crea atómicamente: opción en Q20/Q21 + sección con visibilidad condicional + pregunta radio (SIN/CON observaciones) + pregunta checkbox de conductas. Todo cableado y consistente.
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Número de la regla *</label>
          <input value={numero} onChange={(e) => { setNumero(e.target.value); setError('') }} placeholder="8" style={{ ...inputStyle, width: 100 }} />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Área *</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { value: 'OP',  label: 'OPERACIONES (controla Q20)' },
              { value: 'ADM', label: 'ADMINISTRACIÓN (controla Q21)' },
            ].map((a) => (
              <button
                key={a.value}
                onClick={() => setArea(a.value)}
                style={{
                  flex: 1, padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                  background: area === a.value ? 'rgba(245,124,32,0.15)' : 'rgba(255,255,255,0.04)',
                  border: `1.5px solid ${area === a.value ? 'rgba(245,124,32,0.5)' : 'var(--color-border)'}`,
                  color: area === a.value ? 'var(--color-orange)' : 'var(--color-text-muted)',
                  fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600,
                }}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Nombre descriptivo *</label>
          <input value={nombre} onChange={(e) => { setNombre(e.target.value); setError('') }} placeholder="Trabajo en Altura" style={inputStyle} />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Conductas observables (una por línea, opcional)</label>
          <textarea
            value={conductasText}
            onChange={(e) => setConductasText(e.target.value)}
            placeholder={'No utiliza arnés\nNo verifica anclaje\nTrabaja sin línea de vida'}
            rows={5}
            style={{ ...inputStyle, fontFamily: 'var(--font-body)', resize: 'vertical' }}
          />
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--color-text-muted)', marginTop: 4 }}>
            Cada línea se vuelve un check seleccionable. Puedes editarlas después en el editor de pregunta.
          </div>
        </div>

        {error && (
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#EB5757', marginBottom: 12 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, height: 42, borderRadius: 10, cursor: 'pointer',
              background: 'rgba(255,255,255,0.06)', border: '1px solid var(--color-border)',
              color: '#fff', fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, letterSpacing: '0.06em',
            }}
          >
            CANCELAR
          </button>
          <button
            onClick={handleSubmit}
            style={{
              flex: 2, height: 42, borderRadius: 10, cursor: 'pointer',
              background: 'var(--color-blue-btn)', border: 'none', color: '#fff',
              fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, letterSpacing: '0.06em',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            <Plus size={14} /> CREAR REGLA COMPLETA
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function SectionVisibilityModal({ section, controllers, onCancel, onSave, forced = false }) {
  const initial = section.visibleCondition || null
  const [enabled, setEnabled] = useState(!!initial?.questionId)
  const [questionId, setQuestionId] = useState(initial?.questionId || controllers[0]?.id || '')
  const [equalsValue, setEqualsValue] = useState(initial?.equals ?? '')

  const selected = controllers.find((c) => c.id === questionId)

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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 60,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        style={{
          background: 'var(--color-navy-mid)', border: '1px solid var(--color-border)',
          borderRadius: 14, padding: 22, maxWidth: 420, width: '100%',
        }}
      >
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 4 }}>
          VISIBILIDAD DE SECCIÓN
        </div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.5, marginBottom: 16 }}>
          Sección "<strong style={{ color: 'var(--color-text-primary)' }}>{section.title}</strong>" — define cuándo se muestra en el formulario.
          Si está desactivada, la sección y sus preguntas serán siempre visibles.
        </div>

        {forced && (
          <div style={{
            background: 'rgba(242,153,74,0.1)',
            border: '1px solid rgba(242,153,74,0.4)',
            borderRadius: 8, padding: '10px 12px', marginBottom: 16,
            display: 'flex', gap: 8, alignItems: 'flex-start',
          }}>
            <AlertTriangle size={14} color="#F2994A" style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#F2994A', lineHeight: 1.5 }}>
              <strong>Decisión obligatoria.</strong> Todas las demás secciones de este formulario tienen visibilidad condicional. Define cuándo aparece esta nueva sección, o confirma "Visible siempre" si es intencional.
            </div>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-text-primary)' }}>
            Mostrar solo si una pregunta tiene cierto valor
          </span>
          <button
            onClick={() => setEnabled(!enabled)}
            style={{
              width: 44, height: 24, borderRadius: 12, cursor: 'pointer', border: 'none',
              background: enabled ? 'var(--color-blue-btn)' : 'rgba(255,255,255,0.1)',
              position: 'relative', transition: 'background 0.2s',
            }}
          >
            <div style={{
              width: 18, height: 18, borderRadius: '50%', background: '#fff',
              position: 'absolute', top: 3, transition: 'left 0.2s',
              left: enabled ? 23 : 3,
            }} />
          </button>
        </div>

        {enabled && controllers.length === 0 && (
          <div style={{
            background: 'rgba(235,87,87,0.1)', border: '1px solid rgba(235,87,87,0.3)',
            borderRadius: 8, padding: 12, marginBottom: 12,
            fontFamily: 'var(--font-body)', fontSize: 12, color: '#FF8A80', lineHeight: 1.5,
          }}>
            No hay preguntas tipo radio o select en otras secciones que sirvan como controladoras.
            Crea primero una pregunta de selección que controle esta visibilidad.
          </div>
        )}

        {enabled && controllers.length > 0 && (
          <>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Pregunta controladora</label>
              <select
                value={questionId}
                onChange={(e) => { setQuestionId(e.target.value); setEqualsValue('') }}
                style={inputStyle}
              >
                {controllers.map((c) => (
                  <option key={c.id} value={c.id}>{c.id} — {truncateLabel(c.label, 50)}</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>Valor que debe tener</label>
              <select
                value={equalsValue}
                onChange={(e) => setEqualsValue(e.target.value)}
                style={inputStyle}
              >
                <option value="">— Seleccionar valor —</option>
                {(selected?.options || []).map((o) => (
                  <option key={String(o.value)} value={String(o.value)}>{o.label}</option>
                ))}
              </select>
            </div>
          </>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, height: 42, background: 'rgba(255,255,255,0.06)',
              border: '1px solid var(--color-border)', borderRadius: 8, cursor: 'pointer',
              color: 'var(--color-text-secondary)', fontFamily: 'var(--font-body)', fontSize: 13,
            }}
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              if (!enabled) return onSave(null)
              if (!questionId || !equalsValue) return
              onSave({ questionId, equals: equalsValue })
            }}
            disabled={enabled && (!questionId || !equalsValue)}
            style={{
              flex: 1, height: 42,
              background: enabled && (!questionId || !equalsValue) ? 'rgba(255,255,255,0.06)' : 'var(--color-blue-btn)',
              border: 'none', borderRadius: 8,
              cursor: enabled && (!questionId || !equalsValue) ? 'default' : 'pointer',
              color: '#fff', fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700,
            }}
          >
            GUARDAR
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function SectionDeleteModal({ section, otherSections, onCancel, onConfirm }) {
  const [target, setTarget] = useState(otherSections[0]?.id || '')
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 60,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        style={{
          background: 'var(--color-navy-mid)', border: '1px solid rgba(235,87,87,0.3)',
          borderRadius: 14, padding: 24, maxWidth: 360, width: '100%',
        }}
      >
        <AlertTriangle size={24} color="#EB5757" style={{ marginBottom: 12 }} />
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 8 }}>
          ¿ELIMINAR SECCIÓN?
        </div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.5, marginBottom: 16 }}>
          Se eliminará "<strong style={{ color: 'var(--color-text-primary)' }}>{section.title}</strong>".
          {section.count > 0 && (
            <> Sus {section.count} {section.count === 1 ? 'pregunta se reasignará' : 'preguntas se reasignarán'} a la sección seleccionada.</>
          )}
        </div>

        {section.count > 0 && otherSections.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <label style={{
              fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600,
              color: 'var(--color-text-muted)', letterSpacing: '0.06em',
              textTransform: 'uppercase', marginBottom: 6, display: 'block',
            }}>
              Reasignar preguntas a
            </label>
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--color-border)',
                borderRadius: 8, padding: '9px 12px',
                fontFamily: 'var(--font-body)', fontSize: 13,
                color: 'var(--color-text-primary)', outline: 'none',
              }}
            >
              {otherSections.map((s) => (
                <option key={s.id} value={s.id}>{s.title}</option>
              ))}
            </select>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, height: 42, background: 'rgba(255,255,255,0.06)',
              border: '1px solid var(--color-border)', borderRadius: 8, cursor: 'pointer',
              color: 'var(--color-text-secondary)', fontFamily: 'var(--font-body)', fontSize: 13,
            }}
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(target || null)}
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
  )
}

// ── Panel "Conexión SharePoint" ───────────────────────────────────────────
//
// Visible para todos los formularios (estáticos, editados y custom). Muestra
// la lista SharePoint destino actual, permite cambiarla a otra del catálogo
// o pegar un GUID custom. Para estáticos guarda en `mrc-sp-connections-override`
// (saveConnectionOverride). Para customForms actualiza directamente
// customForms[formId].listId.
function ConexionSharePointPanel({ formId, isCustom, defaultListId, onChange }) {
  const [resolvedGuid, setResolvedGuid] = useState(defaultListId || '')
  const [editing, setEditing]           = useState(false)
  const [pickerKey, setPickerKey]       = useState('')
  const [customGuid, setCustomGuid]     = useState('')
  const [readingCols, setReadingCols]   = useState(false)
  const [columnsResult, setColumnsResult] = useState(null) // { ok: bool, count, sample, error }

  const knownEntry = findListByGuid(resolvedGuid)
  const isUnknown  = !!resolvedGuid && !knownEntry

  const startEdit = () => {
    if (knownEntry) { setPickerKey(knownEntry.key); setCustomGuid('') }
    else if (resolvedGuid) { setPickerKey('__custom__'); setCustomGuid(resolvedGuid) }
    else { setPickerKey(''); setCustomGuid('') }
    setEditing(true)
  }

  const applyChange = () => {
    let newGuid = ''
    if (pickerKey === '__custom__') {
      const trimmed = customGuid.trim()
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed)) {
        alert('GUID inválido. Formato esperado: 8-4-4-4-12 caracteres hex.')
        return
      }
      newGuid = trimmed
    } else if (pickerKey) {
      const entry = SHAREPOINT_LISTS.find((l) => l.key === pickerKey)
      if (!entry?.guid) { alert('La lista seleccionada no tiene GUID configurado.'); return }
      newGuid = entry.guid
    } else {
      alert('Selecciona una lista o pega un GUID personalizado.')
      return
    }
    setResolvedGuid(newGuid)
    setEditing(false)
    setColumnsResult(null)
    onChange(newGuid)
  }

  const handleReadColumns = async () => {
    setReadingCols(true)
    setColumnsResult(null)
    try {
      const cols = await fetchListColumns(formId)
      setColumnsResult({ ok: true, count: cols.length, sample: cols.slice(0, 8) })
    } catch (e) {
      setColumnsResult({ ok: false, error: e?.message || 'Error desconocido' })
    } finally {
      setReadingCols(false)
    }
  }

  const cardStyle = {
    background: 'rgba(47,128,237,0.06)',
    border: '1px solid rgba(47,128,237,0.25)',
    borderRadius: 12, padding: 16,
    display: 'flex', flexDirection: 'column', gap: 14,
  }

  const labelStyle = {
    fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600,
    color: 'var(--color-text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase',
  }

  const buttonStyle = {
    height: 36, padding: '0 14px', borderRadius: 8, cursor: 'pointer',
    fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700,
    letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 6,
  }

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Link2 size={18} color="#60A5FA" />
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, letterSpacing: '0.05em', color: '#fff' }}>
          LISTA SHAREPOINT DESTINO
        </span>
      </div>

      {!editing && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {resolvedGuid ? (
            <>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: '#fff', fontWeight: 600 }}>
                {knownEntry?.label || 'Lista personalizada (no en catálogo)'}
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--color-text-muted)', wordBreak: 'break-all' }}>
                GUID: {resolvedGuid}
              </div>
              {isUnknown && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-body)', fontSize: 11, color: '#F2994A' }}>
                  <AlertTriangle size={12} /> No registrada en el catálogo — se usará tal cual al enviar
                </div>
              )}
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-body)', fontSize: 12, color: '#EB5757' }}>
              <AlertTriangle size={14} /> Sin lista asignada — los envíos fallarán hasta configurar
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
            <button onClick={startEdit} style={{ ...buttonStyle, background: 'var(--color-blue-btn)', border: 'none', color: '#fff' }}>
              <Pencil size={12} /> CAMBIAR LISTA
            </button>
            <button
              onClick={handleReadColumns}
              disabled={!resolvedGuid || readingCols}
              style={{
                ...buttonStyle,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid var(--color-border)',
                color: resolvedGuid && !readingCols ? '#fff' : 'var(--color-text-muted)',
                opacity: resolvedGuid && !readingCols ? 1 : 0.5,
              }}
            >
              <Cloud size={12} /> {readingCols ? 'LEYENDO…' : 'LEER COLUMNAS'}
            </button>
          </div>
          {columnsResult && (
            <div style={{
              marginTop: 6, padding: 10, borderRadius: 8,
              background: columnsResult.ok ? 'rgba(39,174,96,0.1)' : 'rgba(235,87,87,0.1)',
              border: `1px solid ${columnsResult.ok ? 'rgba(39,174,96,0.35)' : 'rgba(235,87,87,0.35)'}`,
              fontFamily: 'var(--font-body)', fontSize: 11,
              color: columnsResult.ok ? '#5FCE85' : '#EB5757',
            }}>
              {columnsResult.ok ? (
                <>
                  ✓ {columnsResult.count} columnas leídas. Ej: {columnsResult.sample.map((c) => c.label || c.internal).join(', ')}…
                </>
              ) : (
                <>✗ Error al leer columnas: {columnsResult.error}</>
              )}
            </div>
          )}
        </div>
      )}

      {editing && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <label style={labelStyle}>Selecciona una lista del catálogo</label>
          <select
            value={pickerKey}
            onChange={(e) => setPickerKey(e.target.value)}
            style={{
              height: 38, padding: '0 12px', borderRadius: 8,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
              fontFamily: 'var(--font-body)', fontSize: 13,
            }}
          >
            <option value="">— Seleccionar —</option>
            {SHAREPOINT_LISTS.filter((l) => l.guid).map((l) => (
              <option key={l.key} value={l.key}>{l.label}</option>
            ))}
            <option value="__custom__">✏ GUID personalizado…</option>
          </select>
          {pickerKey === '__custom__' && (
            <input
              value={customGuid}
              onChange={(e) => setCustomGuid(e.target.value)}
              placeholder="d123a245-0aeb-4f51-9b20-693639c963b6"
              style={{
                height: 38, padding: '0 12px', borderRadius: 8,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
                fontFamily: 'monospace', fontSize: 11,
              }}
            />
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button onClick={applyChange} style={{ ...buttonStyle, background: 'var(--color-blue-btn)', border: 'none', color: '#fff' }}>
              <CheckCircle2 size={12} /> APLICAR
            </button>
            <button onClick={() => setEditing(false)} style={{ ...buttonStyle, background: 'rgba(255,255,255,0.06)', border: '1px solid var(--color-border)', color: '#fff' }}>
              <X size={12} /> CANCELAR
            </button>
          </div>
        </div>
      )}

      <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
        {isCustom
          ? 'Este formulario es personalizado. La lista se guarda en su propia definición y se sincroniza a SharePoint.'
          : 'Cambiar la lista guarda un override local. El estático del código no se modifica — puedes resetear desde el botón Reset.'}
      </div>
    </div>
  )
}

// ── Panel "Archivar formulario" ───────────────────────────────────────────
//
// Acción de ciclo de vida — marca el formulario como archived:true en su
// override (estático) o en customForms (custom). ToolsMenuScreen filtra por
// este flag para ocultarlo a usuarios finales. El editor sigue listándolo
// con badge "ARCHIVADO" para poder rehabilitarlo.
function ArchiveFormPanel({ isCustom, isArchived, onArchive, onUnarchive }) {
  const [confirmOpen, setConfirmOpen] = useState(false)

  return (
    <div style={{
      background: isArchived ? 'rgba(242,153,74,0.06)' : 'rgba(235,87,87,0.04)',
      border: `1px solid ${isArchived ? 'rgba(242,153,74,0.3)' : 'rgba(235,87,87,0.2)'}`,
      borderRadius: 12, padding: 16,
      display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Archive size={18} color={isArchived ? '#F2994A' : '#EB5757'} />
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, letterSpacing: '0.05em', color: '#fff' }}>
          {isArchived ? 'FORMULARIO ARCHIVADO' : 'ARCHIVAR FORMULARIO'}
        </span>
      </div>

      <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
        {isArchived
          ? 'Este formulario está oculto del menú de herramientas para usuarios finales. Sigue editable acá. Los registros históricos en SharePoint no se ven afectados.'
          : `Oculta el formulario del menú "Herramientas Preventivas" para todos los usuarios. ${isCustom ? 'Esta acción se sincroniza con SharePoint.' : 'El override se persiste localmente y en cloud.'} Reversible.`}
      </div>

      {!isArchived && !confirmOpen && (
        <button
          onClick={() => setConfirmOpen(true)}
          style={{
            alignSelf: 'flex-start',
            height: 36, padding: '0 14px', borderRadius: 8, cursor: 'pointer',
            background: 'rgba(235,87,87,0.15)',
            border: '1px solid rgba(235,87,87,0.4)',
            color: '#EB5757',
            fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700,
            letterSpacing: '0.06em',
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          <Archive size={12} /> ARCHIVAR
        </button>
      )}

      {!isArchived && confirmOpen && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={() => { onArchive(); setConfirmOpen(false) }}
            style={{
              height: 36, padding: '0 14px', borderRadius: 8, cursor: 'pointer',
              background: '#EB5757', border: 'none', color: '#fff',
              fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700,
              letterSpacing: '0.06em',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <CheckCircle2 size={12} /> CONFIRMAR ARCHIVO
          </button>
          <button
            onClick={() => setConfirmOpen(false)}
            style={{
              height: 36, padding: '0 14px', borderRadius: 8, cursor: 'pointer',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid var(--color-border)',
              color: '#fff',
              fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700,
              letterSpacing: '0.06em',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <X size={12} /> CANCELAR
          </button>
        </div>
      )}

      {isArchived && (
        <button
          onClick={onUnarchive}
          style={{
            alignSelf: 'flex-start',
            height: 36, padding: '0 14px', borderRadius: 8, cursor: 'pointer',
            background: 'var(--color-blue-btn)', border: 'none', color: '#fff',
            fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700,
            letterSpacing: '0.06em',
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          <RotateCcw size={12} /> REACTIVAR
        </button>
      )}
    </div>
  )
}

// Helper: Pencil icon — defino un pequeño SVG inline para evitar otro import
function Pencil({ size = 12, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3Z" />
    </svg>
  )
}

// ── Pantalla principal ────────────────────────────────────────────────────
export default function FormEditorDetailScreen() {
  const { formId } = useParams()
  const navigate = useNavigate()
  const {
    saveFormEdits, resetFormEdits,
    customForms, updateCustomForm, deleteCustomForm,
    retryCloudSync,
  } = useFormEditorStore()
  // Subscripciones separadas para que los cambios de sync re-rendericen
  const syncStatus    = useFormEditorStore((s) => s.syncStatus)
  const lastSyncedAt  = useFormEditorStore((s) => s.lastSyncedAt)
  const lastSyncError = useFormEditorStore((s) => s.lastSyncError)

  // ¿Es un formulario personalizado creado por admin (no existe en formDefinitions)?
  const isCustom   = !formDefinitions[formId] && !!customForms[formId]
  const staticForm = formDefinitions[formId] || customForms[formId] || null
  const isWizard   = staticForm?.mode === 'wizard'

  // Carga el estado inicial leyendo del store en tiempo real (getState evita closure stale)
  const initQuestions = useCallback(() => {
    const { editedForms: ef, customForms: cf } = useFormEditorStore.getState()
    if (isCustom) {
      const form = cf[formId]
      if (form?.questions) return dictToArray(form.questions)
      if (form?.sections) {
        return form.sections.flatMap((s) =>
          s.questions.map((q) => ({ ...q, _section: s.id, _sectionTitle: s.title }))
        )
      }
      return []
    }
    const override = ef[formId]
    if (override?.questions) return dictToArray(override.questions)
    if (isWizard && staticForm?.questions) return dictToArray(staticForm.questions)
    // Override autoritativo (regla v1.9.12): si existe override.sections, es la
    // fuente de verdad — preguntas eliminadas en el editor NO reaparecen desde
    // el estático. El estático solo se usa como semilla cuando no hay override.
    if (override?.sections) {
      return override.sections.flatMap((s) =>
        (s.questions || []).map((q) => ({ ...q, _section: s.id, _sectionTitle: s.title }))
      )
    }
    if (staticForm?.sections) {
      return staticForm.sections.flatMap((s) =>
        s.questions.map((q) => ({ ...q, _section: s.id, _sectionTitle: s.title }))
      )
    }
    return []
  }, [formId, isCustom, isWizard, staticForm])

  const [questions, setQuestions] = useState(initQuestions)

  // ── Estado de secciones (override autoritativo) ─────────────────────────
  // Inicializa desde override.sections o, si no existe, desde el estático.
  // A partir de aquí TODAS las operaciones (guardar, asignar, dropdown del
  // panel) leen de este estado — nunca más de staticForm.sections.
  const initSections = useCallback(() => {
    const { editedForms: ef, customForms: cf } = useFormEditorStore.getState()

    // F3: mapa de secciones estáticas por ID — para leer visibleWhen y mostrarlo
    // como badge read-only cuando no hay visibleCondition de override.
    const staticSectionMap = (staticForm?.sections || []).reduce((acc, s) => {
      acc[s.id] = s; return acc
    }, {})

    const pick = (s) => {
      const base = { id: s.id, title: s.title }
      if (s.visibleCondition) {
        base.visibleCondition = s.visibleCondition
      } else {
        // F3: intentar parsear visibleWhen (directo en s o en el estático homólogo)
        const visWhenFn = s.visibleWhen ?? staticSectionMap[s.id]?.visibleWhen
        if (visWhenFn) {
          const parsed = parseVisibleWhen(visWhenFn)
          // _complex = true indica "condición existe pero no se pudo parsear"
          base._staticVisibleCondition = parsed ?? { _complex: true }
        }
      }
      return base
    }

    if (isCustom) {
      const f = cf[formId]
      if (f?.sections) return f.sections.map(pick)
      return []
    }
    const override = ef[formId]
    if (override?.sections) return override.sections.map(pick)
    if (staticForm?.sections) return staticForm.sections.map(pick)
    return []
  }, [formId, isCustom, staticForm])

  const [sectionsState, setSectionsState] = useState(initSections)

  const [activeTab, setActiveTab] = useState('lista')
  const [editingQ, setEditingQ] = useState(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [showDeleteFormConfirm, setShowDeleteFormConfirm] = useState(false)
  const [showSaveToast, setShowSaveToast] = useState(false)   // 'local' | 'cloud-ok' | 'cloud-error' | false
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  // Última sección usada al crear una pregunta (recordada entre clicks al FAB).
  // null = preguntar. Para seccionados, arranca en la primera sección.
  const isSectioned = !isWizard && (sectionsState.length > 0 || !!staticForm?.sections)
  const firstSectionId = sectionsState[0]?.id || staticForm?.sections?.[0]?.id || null
  const [addingToSection, setAddingToSection] = useState(null) // id de sección destino del próximo add (o null)
  const [lastSectionUsed, setLastSectionUsed] = useState(firstSectionId)
  const [validationResult, setValidationResult] = useState(null) // { errors, warnings } | null
  const [discardNavConfirm, setDiscardNavConfirm] = useState(null) // función a ejecutar si se descarta

  const markChanged = (newQs) => {
    setQuestions(newQs)
    setHasChanges(true)
  }

  // Warn nativo del browser al cerrar pestaña / navegar fuera con cambios.
  useEffect(() => {
    if (!hasChanges) return undefined
    const handler = (e) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [hasChanges])

  // Segundo toast: después del "Guardado local", al cambiar syncStatus
  // mostramos el resultado real (cloud-ok / cloud-error). Solo corre si se
  // disparó un guardado reciente (lastSyncedAt se actualiza al llamar save*).
  useEffect(() => {
    if (!lastSyncedAt) return undefined
    if (syncStatus !== 'success' && syncStatus !== 'error') return undefined
    const nextState = syncStatus === 'success' ? 'cloud-ok' : 'cloud-error'
    const duration  = syncStatus === 'success' ? 2500 : 6000
    // setTimeout(..., 0) evita el lint de "setState sincrónico en effect"
    const show = setTimeout(() => setShowSaveToast(nextState), 0)
    const hide = setTimeout(() => {
      setShowSaveToast((curr) => (curr === nextState ? false : curr))
    }, duration)
    return () => { clearTimeout(show); clearTimeout(hide) }
  }, [syncStatus, lastSyncedAt])

  // Navegar "Volver" con protección contra pérdida de cambios.
  const handleBack = () => {
    if (hasChanges) {
      setDiscardNavConfirm(() => () => navigate('/admin/form-editor'))
      return
    }
    navigate('/admin/form-editor')
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
    const remaining = questions.filter((q) => q.id !== id)
    // Renormalizar order para que sea secuencial sin huecos tras la eliminación
    const renumbered = remaining.map((q, idx) => ({ ...q, order: idx + 1 }))
    markChanged(renumbered)
    setDeleteConfirm(null)
  }

  // Guardar edición de pregunta
  const saveQuestion = (updatedQ) => {
    markChanged(questions.map(q => q.id === updatedQ.id ? updatedQ : q))
    setEditingQ(null)
  }

  // Agregar nueva pregunta.
  // En formularios seccionados, primero abre el selector de sección (si hay >1).
  // Si solo hay 1 sección (o es wizard), salta directo a crear la pregunta.
  const addQuestion = (sectionIdOverride = null) => {
    const sections = sectionsState
    // Para seccionados con múltiples secciones: pedir sección antes de crear
    if (isSectioned && sections.length > 1 && !sectionIdOverride) {
      setAddingToSection(lastSectionUsed || sections[0].id)
      return
    }
    const sectionId = sectionIdOverride || (isSectioned ? sections[0]?.id : null)
    const targetSection = sectionId ? sections.find((s) => s.id === sectionId) : null
    const sectionTitle = targetSection?.title || null
    const id = newQId(questions, staticForm)
    const order = questions.length + 1
    const newQ = emptyQuestion(id, order, sectionId, sectionTitle)
    // F1: si la sección destino tiene gating (visibleCondition), la pregunta lo
    // hereda por defecto. Evita que preguntas nuevas en secciones condicionales
    // se vuelvan permanentemente visibles por olvido del admin (caso Q52/Q53).
    if (targetSection?.visibleCondition) {
      newQ.visibleCondition = { ...targetSection.visibleCondition }
    }
    markChanged([...questions, newQ])
    setEditingQ(newQ)
    if (sectionId) setLastSectionUsed(sectionId)
    setAddingToSection(null)
  }

  // Strip campos internos del editor y funciones no serializables antes de guardar.
  // visibleWhen es una función → se pierde en JSON.stringify; se restaura desde el estático en FormScreen.
  // _section / _sectionTitle son metadata del editor, no deben persistirse en el override.
  const stripInternal = ({ _section, _sectionTitle, visibleWhen: _vw, ...q }) => q

  // Agrupa preguntas por sección con red de seguridad: preguntas sin _section
  // (o con _section inválido) se asignan a la primera sección y se logean como warn.
  // NUNCA se descartan silenciosamente (regla 5c en CLAUDE.md).
  const groupQuestionsBySections = (qs, sections) => {
    const bySection = new Map(sections.map((s) => [s.id, []]))
    const orphans = []
    qs.forEach((q) => {
      if (q._section && bySection.has(q._section)) bySection.get(q._section).push(q)
      else orphans.push(q)
    })
    if (orphans.length) {
      const fallback = sections[0]
      console.warn('[FormEditor] Preguntas huérfanas auto-asignadas a', fallback?.id, orphans.map((q) => q.id))
      if (fallback) {
        orphans.forEach((q) => {
          bySection.get(fallback.id).push({ ...q, _section: fallback.id, _sectionTitle: fallback.title })
        })
      }
    }
    return bySection
  }

  // Intenta guardar: corre validación, si hay errores abre modal; si hay warnings
  // pide confirmación (handleSaveConfirmed). Sin problemas, guarda directo.
  const handleSave = () => {
    // Para validación de huérfanas usamos las secciones EFECTIVAS (sectionsState).
    // Pasamos también el estático original para que F4 detecte gating heredado
    // de visibleWhen (no serializable, pero válido como fuente de "está gateada").
    const sectionsForValidation = isWizard ? null : { sections: sectionsState }
    const originalStatic = !isCustom ? formDefinitions[formId] : null
    const result = validateForm(questions, sectionsForValidation, isWizard, originalStatic)
    if (result.errors.length || result.warnings.length) {
      setValidationResult(result)
      return
    }
    handleSaveConfirmed()
  }

  // Guarda efectivamente el override en el store (el store dispara _syncToCloud).
  const handleSaveConfirmed = () => {
    if (isCustom) {
      const updatedForm = isWizard
        ? { ...staticForm, questions: arrayToDict(questions) }
        : (() => {
            const bySection = groupQuestionsBySections(questions, sectionsState)
            return {
              ...staticForm,
              sections: sectionsState.map((s) => ({
                id: s.id,
                title: s.title,
                ...(s.visibleCondition ? { visibleCondition: s.visibleCondition } : {}),
                questions: bySection.get(s.id) || [],
              })),
            }
          })()
      updateCustomForm(formId, updatedForm)
    } else {
      const override = isWizard
        ? { questions: arrayToDict(questions.map(stripInternal)) }
        : (() => {
            const bySection = groupQuestionsBySections(questions, sectionsState)
            return {
              sections: sectionsState.map((s) => ({
                id: s.id,
                title: s.title,
                ...(s.visibleCondition ? { visibleCondition: s.visibleCondition } : {}),
                questions: (bySection.get(s.id) || []).map(stripInternal),
              })),
            }
          })()
      saveFormEdits(formId, override)
    }
    setHasChanges(false)
    setValidationResult(null)
    // Toast 1 instantáneo: guardado local confirmado
    setShowSaveToast('local')
    setTimeout(() => {
      // Si en ~400ms aún está syncing, se cierra este toast y el efecto de syncStatus
      // se encarga del segundo (cloud-ok / cloud-error).
      setShowSaveToast((curr) => (curr === 'local' ? false : curr))
    }, 2500)
  }

  // Resetear a definición estática (solo formularios no-custom)
  const handleReset = () => {
    resetFormEdits(formId)
    setQuestions(initQuestions())
    setSectionsState(initSections())
    setHasChanges(false)
    setShowResetConfirm(false)
  }

  // ── Operaciones de secciones (CRUD) ────────────────────────────────────
  const slugifySection = (title) => {
    const base = String(title || 'seccion').toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      .slice(0, 40) || 'seccion'
    const existing = new Set(sectionsState.map((s) => s.id))
    let id = base
    let n = 2
    while (existing.has(id)) { id = `${base}-${n}`; n++ }
    return id
  }

  // F2: detecta si el formulario tiene gating en TODAS sus secciones existentes,
  // considerando tanto override.visibleCondition como estático.visibleWhen.
  // Si lo está, una sección nueva sin gating es casi seguro un descuido — el
  // editor obliga al admin a tomar una decisión consciente abriendo el modal
  // de visibilidad apenas se crea la sección.
  const allSectionsGated = () => {
    if (sectionsState.length === 0) return false
    return sectionsState.every((s) => {
      if (s.visibleCondition) return true
      const staticSec = staticForm?.sections?.find((ss) => ss.id === s.id)
      return typeof staticSec?.visibleWhen === 'function'
    })
  }

  const [pendingVisibilityFor, setPendingVisibilityFor] = useState(null)
  const [showAddReglaModal, setShowAddReglaModal] = useState(false)

  // F5: ¿este formulario es del template "reglas-oro"? Si lo es, mostramos
  // el botón "AGREGAR REGLA DE ORO" en SectionsManager. Solo aplica al
  // formulario estático original, no a custom forms.
  const isReglasOroTemplate = !isCustom && staticForm?.metadata?.template === 'reglas-oro'

  // Macro: agrega una Regla de Oro completa (opción Q20/Q21 + sección + radio + checkbox)
  // de forma atómica. Toda la red de gating se cablea en una sola transacción.
  const addReglaOroMacro = ({ numero, area, nombre, conductas }) => {
    const sufijo = area === 'OP' ? '(OP)' : '(ADM)'
    const controllerId = area === 'OP' ? 'Q20' : 'Q21'
    const newOption = `N°${numero} ${nombre} ${sufijo}`

    // 1. Agregar opción al controlador (Q20 u Q21) si no existe ya
    const newQuestions = questions.map((q) => {
      if (q.id !== controllerId) return q
      const opts = Array.isArray(q.options) ? [...q.options] : []
      const exists = opts.some((o) => {
        const v = typeof o === 'string' ? o : (o.value ?? o.label)
        return v === newOption
      })
      if (!exists) opts.push(newOption)
      return { ...q, options: opts }
    })

    // 2. Crear sección con visibleCondition Q?? = newOption
    const baseId = `regla-${area.toLowerCase()}-${numero}`
    const existingIds = new Set(sectionsState.map((s) => s.id))
    let sectionId = baseId
    let n = 2
    while (existingIds.has(sectionId)) { sectionId = `${baseId}-${n}`; n++ }
    const sectionTitle = `VERIFICACIÓN — REGLA N°${numero} ${area}`
    const visibleCond = { questionId: controllerId, equals: newOption }
    const newSection = { id: sectionId, title: sectionTitle, visibleCondition: visibleCond }

    // 3. Crear radio + checkbox con IDs frescos
    const radioId = newQId(newQuestions, staticForm)
    const radioQ = {
      id: radioId,
      order: newQuestions.length + 1,
      label: `REGLA N°${numero}: ${nombre}`,
      type: 'radio',
      required: true,
      visibleCondition: visibleCond,
      conductasList: conductas.length ? conductas : ['Conducta a observar'],
      options: [
        { value: 'SIN_OBSERVACIONES', label: 'SIN OBSERVACIONES', style: 'positive' },
        { value: 'CON_OBSERVACIONES', label: 'CON OBSERVACIONES', style: 'negative' },
      ],
      _section: sectionId,
      _sectionTitle: sectionTitle,
    }
    const checkboxId = newQId([...newQuestions, radioQ], staticForm)
    const checkboxQ = {
      id: checkboxId,
      order: newQuestions.length + 2,
      label: `Conductas observadas — REGLA N°${numero}`,
      subtitle: 'Marque una o más conductas observadas.',
      type: 'checkbox',
      required: true,
      // Visible cuando la sección está activa Y el radio = CON_OBSERVACIONES
      visibleCondition: { all: [visibleCond, { questionId: radioId, equals: 'CON_OBSERVACIONES' }] },
      options: conductas.length
        ? conductas.map((c, i) => ({ value: `c${i + 1}`, label: c, severity: 'NORMAL' }))
        : [{ value: 'c1', label: 'Conducta a configurar', severity: 'NORMAL' }],
      _section: sectionId,
      _sectionTitle: sectionTitle,
    }

    // 4. Limpiar preguntas huérfanas de la sección CIERRE antes de añadir la nueva Regla.
    // Una pregunta es huérfana si: pertenece a _section === 'cierre', no existe en el
    // estático (Q46/Q48) y no tiene visibleCondition. Esto corrige residuos de sesiones de
    // edición manual anteriores (ej. Q51) que de otro modo aparecerían en rutas incorrectas.
    const staticCierreIds = new Set(
      (staticForm?.sections?.find((s) => s.id === 'cierre')?.questions || []).map((q) => q.id)
    )
    const cleanedQuestions = newQuestions.filter(
      (q) =>
        q._section !== 'cierre' ||
        staticCierreIds.has(q.id) ||
        !!q.visibleCondition
    )

    // 5. Aplicar todo en una sola transacción
    setSectionsState([...sectionsState, newSection])
    markChanged([...cleanedQuestions, radioQ, checkboxQ])
    setActiveTab('secciones')
  }

  const addSection = () => {
    const title = 'NUEVA SECCIÓN'
    const id = slugifySection(title)
    const shouldForceModal = allSectionsGated()
    setSectionsState([...sectionsState, { id, title }])
    setHasChanges(true)
    setActiveTab('secciones')
    if (shouldForceModal) setPendingVisibilityFor(id)
  }

  // Establece (o limpia) la condición de visibilidad serializable de una sección.
  // null/undefined elimina la condición; un objeto la persiste.
  const setSectionVisibleCondition = (id, condition) => {
    setSectionsState(sectionsState.map((s) => {
      if (s.id !== id) return s
      if (!condition) {
        const { visibleCondition: _vc, ...rest } = s
        return rest
      }
      return { ...s, visibleCondition: condition }
    }))
    setHasChanges(true)
  }

  const renameSection = (id, newTitle) => {
    setSectionsState(sectionsState.map((s) => s.id === id ? { ...s, title: newTitle } : s))
    setQuestions(questions.map((q) =>
      q._section === id ? { ...q, _sectionTitle: newTitle } : q
    ))
    setHasChanges(true)
  }

  const moveSection = (idx, dir) => {
    const target = idx + dir
    if (target < 0 || target >= sectionsState.length) return
    const next = [...sectionsState]
    ;[next[idx], next[target]] = [next[target], next[idx]]
    setSectionsState(next)
    setHasChanges(true)
  }

  // Elimina una sección. Las preguntas que tenía se reasignan al destino indicado
  // (o a la primera sección restante si no se indica). Si no quedan secciones,
  // la operación se cancela (un formulario seccionado debe tener ≥1 sección).
  const deleteSection = (id, reassignTo = null) => {
    if (sectionsState.length <= 1) return
    const remaining = sectionsState.filter((s) => s.id !== id)
    const target = reassignTo
      ? remaining.find((s) => s.id === reassignTo) || remaining[0]
      : remaining[0]
    setSectionsState(remaining)
    setQuestions(questions.map((q) =>
      q._section === id ? { ...q, _section: target.id, _sectionTitle: target.title } : q
    ))
    setHasChanges(true)
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
          onClick={handleBack}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: 6, display: 'flex', alignItems: 'center',
          }}
        >
          <ChevronDown size={20} color="var(--color-text-muted)" style={{ transform: 'rotate(90deg)' }} />
        </motion.button>

        {/* Título — header siempre navy oscuro → texto siempre blanco */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14,
            letterSpacing: '0.05em', textTransform: 'uppercase',
            color: '#FFFFFF',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {staticForm.title}
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 1 }}>
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

        {/* Indicador de sync cloud */}
        <SyncIndicator
          status={syncStatus}
          error={lastSyncError}
          onRetry={retryCloudSync}
        />

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
          ...(isSectioned ? [{ id: 'secciones', label: 'Secciones', icon: <List size={13} /> }] : []),
          { id: 'conexion', label: 'Conexión SP', icon: <Link2 size={13} /> },
          { id: 'flujo', label: 'Vista de flujo', icon: <GitBranch size={13} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1, height: 44, background: 'none', border: 'none', cursor: 'pointer',
              borderBottom: activeTab === tab.id ? '2px solid var(--color-orange)' : '2px solid transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              color: activeTab === tab.id ? '#FFFFFF' : 'rgba(255,255,255,0.5)',
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
      <div className="content-col" style={{ flex: 1, overflowY: 'auto', padding: '16px', paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}>
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
          ) : activeTab === 'secciones' ? (
            <motion.div key="secciones" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SectionsManager
                sections={sectionsState}
                questions={questions}
                onRename={renameSection}
                onMove={moveSection}
                onDelete={deleteSection}
                onAdd={addSection}
                onSetVisibleCondition={setSectionVisibleCondition}
                pendingVisibilityFor={pendingVisibilityFor}
                onClearPending={() => setPendingVisibilityFor(null)}
                isReglasOroTemplate={isReglasOroTemplate}
                onOpenAddRegla={() => setShowAddReglaModal(true)}
              />
              <AnimatePresence>
                {showAddReglaModal && (
                  <AddReglaOroModal
                    onCancel={() => setShowAddReglaModal(false)}
                    onCreate={(payload) => {
                      addReglaOroMacro(payload)
                      setShowAddReglaModal(false)
                    }}
                  />
                )}
              </AnimatePresence>
            </motion.div>
          ) : activeTab === 'conexion' ? (
            <motion.div key="conexion" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <ConexionSharePointPanel
                formId={formId}
                isCustom={isCustom}
                defaultListId={
                  isCustom
                    ? (customForms[formId]?.listId || '')
                    : (getAllConnectionOverrides()[formId]?.listId
                        || (SHAREPOINT_LISTS.find((l) => l.defaultFormType === formId)?.guid || ''))
                }
                onChange={(newGuid) => {
                  if (isCustom) {
                    updateCustomForm(formId, { ...customForms[formId], listId: newGuid })
                  } else if (newGuid) {
                    saveConnectionOverride(formId, newGuid)
                  } else {
                    clearConnectionOverride(formId)
                  }
                }}
              />

              <ArchiveFormPanel
                formId={formId}
                isCustom={isCustom}
                isArchived={
                  isCustom
                    ? !!customForms[formId]?.archived
                    : !!useFormEditorStore.getState().editedForms[formId]?.archived
                }
                onArchive={() => {
                  const store = useFormEditorStore.getState()
                  if (isCustom) store.archiveCustomForm(formId)
                  else store.archiveForm(formId)
                }}
                onUnarchive={() => {
                  const store = useFormEditorStore.getState()
                  if (isCustom) store.unarchiveCustomForm(formId)
                  else store.unarchiveForm(formId)
                }}
              />
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
            sections={sectionsState}
            formId={formId}
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

      {/* Modal: errores/warnings de validación pre-guardado */}
      <AnimatePresence>
        {validationResult && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 70,
              background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              style={{
                background: 'var(--color-navy-mid)', border: '1px solid var(--color-border)',
                borderRadius: 14, padding: 24, maxWidth: 420, width: '100%',
                maxHeight: '80vh', overflowY: 'auto',
              }}
            >
              <AlertTriangle size={24} color={validationResult.errors.length ? '#EB5757' : '#F2994A'} style={{ marginBottom: 12 }} />
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 12 }}>
                {validationResult.errors.length
                  ? 'REVISAR ANTES DE GUARDAR'
                  : 'ADVERTENCIAS'}
              </div>

              {validationResult.errors.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#EB5757', fontWeight: 700, letterSpacing: '0.06em', marginBottom: 6 }}>
                    ERRORES ({validationResult.errors.length})
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 18, fontFamily: 'var(--font-body)', fontSize: 12.5, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                    {validationResult.errors.map((e, i) => (
                      <li key={i} style={{ marginBottom: 4 }}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}

              {validationResult.warnings.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#F2994A', fontWeight: 700, letterSpacing: '0.06em', marginBottom: 6 }}>
                    AVISOS ({validationResult.warnings.length})
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 18, fontFamily: 'var(--font-body)', fontSize: 12.5, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                    {validationResult.warnings.map((w, i) => (
                      <li key={i} style={{ marginBottom: 4 }}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                <button
                  onClick={() => setValidationResult(null)}
                  style={{
                    flex: 1, height: 42, background: 'rgba(255,255,255,0.06)',
                    border: '1px solid var(--color-border)', borderRadius: 8, cursor: 'pointer',
                    color: 'var(--color-text-secondary)', fontFamily: 'var(--font-body)', fontSize: 13,
                  }}
                >
                  {validationResult.errors.length ? 'Corregir' : 'Cancelar'}
                </button>
                {validationResult.errors.length === 0 && (
                  <button
                    onClick={handleSaveConfirmed}
                    style={{
                      flex: 1, height: 42, background: 'var(--color-blue-btn)',
                      border: 'none', borderRadius: 8, cursor: 'pointer',
                      color: '#fff', fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, letterSpacing: '0.05em',
                    }}
                  >
                    GUARDAR IGUAL
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal: seleccionar sección destino al crear pregunta nueva */}
      <AnimatePresence>
        {addingToSection && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 60,
              background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              style={{
                background: 'var(--color-navy-mid)', border: '1px solid var(--color-border)',
                borderRadius: 14, padding: 20, maxWidth: 360, width: '100%',
              }}
            >
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 4 }}>
                ¿EN QUÉ SECCIÓN?
              </div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 14 }}>
                Elige la sección donde se añadirá la nueva pregunta.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                {(staticForm?.sections || []).map((s) => (
                  <label
                    key={s.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                      background: addingToSection === s.id ? 'rgba(26,82,184,0.18)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${addingToSection === s.id ? 'rgba(26,82,184,0.5)' : 'var(--color-border)'}`,
                      borderRadius: 8, cursor: 'pointer',
                    }}
                  >
                    <input
                      type="radio"
                      name="sectionPick"
                      checked={addingToSection === s.id}
                      onChange={() => setAddingToSection(s.id)}
                      style={{ accentColor: 'var(--color-orange)' }}
                    />
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-text-primary)' }}>
                      {s.title}
                    </span>
                  </label>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setAddingToSection(null)}
                  style={{
                    flex: 1, height: 40, background: 'rgba(255,255,255,0.06)',
                    border: '1px solid var(--color-border)', borderRadius: 8, cursor: 'pointer',
                    color: 'var(--color-text-secondary)', fontFamily: 'var(--font-body)', fontSize: 13,
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={() => addQuestion(addingToSection)}
                  style={{
                    flex: 1, height: 40, background: 'var(--color-blue-btn)',
                    border: 'none', borderRadius: 8, cursor: 'pointer',
                    color: '#fff', fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, letterSpacing: '0.05em',
                  }}
                >
                  CREAR AQUÍ
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal: confirmar descarte de cambios al navegar fuera */}
      <AnimatePresence>
        {discardNavConfirm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 70,
              background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              style={{
                background: 'var(--color-navy-mid)', border: '1px solid rgba(242,153,74,0.35)',
                borderRadius: 14, padding: 24, maxWidth: 340, width: '100%',
              }}
            >
              <AlertTriangle size={24} color="#F2994A" style={{ marginBottom: 12 }} />
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 8 }}>
                ¿DESCARTAR CAMBIOS?
              </div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.5, marginBottom: 20 }}>
                Tienes cambios sin guardar. Si sales ahora, se perderán.
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setDiscardNavConfirm(null)}
                  style={{
                    flex: 1, height: 42, background: 'rgba(255,255,255,0.06)',
                    border: '1px solid var(--color-border)', borderRadius: 8, cursor: 'pointer',
                    color: 'var(--color-text-secondary)', fontFamily: 'var(--font-body)', fontSize: 13,
                  }}
                >
                  Seguir editando
                </button>
                <button
                  onClick={() => { const fn = discardNavConfirm; setDiscardNavConfirm(null); fn?.() }}
                  style={{
                    flex: 1, height: 42, background: 'rgba(235,87,87,0.15)',
                    border: '1px solid rgba(235,87,87,0.3)', borderRadius: 8, cursor: 'pointer',
                    color: '#EB5757', fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700,
                  }}
                >
                  DESCARTAR
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast de guardado — cuatro estados: local / cloud-ok / cloud-error / error */}
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
              background: showSaveToast === 'cloud-error' || showSaveToast === 'error'
                ? 'rgba(235,87,87,0.15)'
                : showSaveToast === 'local'
                  ? 'rgba(47,128,237,0.15)'
                  : 'rgba(39,174,96,0.15)',
              border: showSaveToast === 'cloud-error' || showSaveToast === 'error'
                ? '1px solid rgba(235,87,87,0.4)'
                : showSaveToast === 'local'
                  ? '1px solid rgba(47,128,237,0.4)'
                  : '1px solid rgba(39,174,96,0.4)',
              borderRadius: 10, padding: '10px 20px',
              display: 'flex', alignItems: 'center', gap: 8,
              zIndex: 20, backdropFilter: 'blur(8px)',
              maxWidth: 'min(92vw, 420px)',
            }}
          >
            {showSaveToast === 'local' && (
              <>
                <CheckCircle2 size={14} color="#60A5FA" />
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#60A5FA' }}>
                  Guardado localmente — sincronizando…
                </span>
              </>
            )}
            {showSaveToast === 'cloud-ok' && (
              <>
                <Cloud size={14} color="#6FCF97" />
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#6FCF97' }}>
                  Sincronizado con SharePoint ✓
                </span>
              </>
            )}
            {showSaveToast === 'cloud-error' && (
              <>
                <CloudOff size={14} color="#EB5757" />
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 12.5, color: '#EB5757' }}>
                  Error al sincronizar: {lastSyncError || 'desconocido'}. Guardado local está a salvo.
                </span>
              </>
            )}
            {showSaveToast === 'error' && (
              <>
                <AlertTriangle size={14} color="#EB5757" />
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#EB5757' }}>
                  Error al guardar — intenta nuevamente
                </span>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
