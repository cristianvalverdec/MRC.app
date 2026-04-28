import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, AlertCircle, ChevronRight, Users } from 'lucide-react'
import AppHeader from '../components/layout/AppHeader'
import QuestionYesNo    from '../components/form/QuestionYesNo'
import QuestionRating   from '../components/form/QuestionRating'
import QuestionText     from '../components/form/QuestionText'
import QuestionSelect   from '../components/form/QuestionSelect'
import QuestionRadio    from '../components/form/QuestionRadio'
import QuestionCheckbox from '../components/form/QuestionCheckbox'
import QuestionPhoto        from '../components/form/QuestionPhoto'
import QuestionPeoplePicker from '../components/form/QuestionPeoplePicker'
import QuestionRut          from '../components/form/QuestionRut'
import { formDefinitions } from '../forms/formDefinitions'
import useFormStore from '../store/formStore'
import useFormEditorStore from '../store/formEditorStore'
import useUserStore from '../store/userStore'
import useContratistasStore from '../store/contratistasStore'
import { IS_DEV_MODE, resolveListConfig } from '../services/sharepointData'

// ── Question dispatcher (shared) ──────────────────────────────────────────
function QuestionRenderer({ question, value, onChange, hasError }) {
  const Component = {
    yesno:          QuestionYesNo,
    rating:         QuestionRating,
    text:           QuestionText,
    select:         QuestionSelect,
    radio:          QuestionRadio,
    checkbox:       QuestionCheckbox,
    photo:          QuestionPhoto,
    'people-picker': QuestionPeoplePicker,
    rut:             QuestionRut,
  }[question.type]

  if (!Component) return null

  return (
    <div
      style={{
        padding: '16px',
        background: hasError ? 'rgba(235,87,87,0.06)' : 'var(--color-surface)',
        border: `1px solid ${hasError ? 'rgba(235,87,87,0.40)' : 'var(--color-border)'}`,
        borderRadius: 10,
        transition: 'all 0.2s ease',
      }}
    >
      <Component question={question} value={value} onChange={onChange} />
      {hasError && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            marginTop: 10, fontFamily: 'var(--font-body)',
            fontSize: 12, color: 'var(--color-danger)',
          }}
        >
          <AlertCircle size={13} />
          Este campo es obligatorio
        </motion.div>
      )}
    </div>
  )
}

// ── Success Screen (shared) ───────────────────────────────────────────────
function SuccessScreen({ formTitle, onNewRecord, onGoMenu }) {
  const syncStatus      = useFormStore((s) => s.syncStatus)
  const lastSubmitError = useFormStore((s) => s.lastSubmitError)
  const clearSubmitError = useFormStore((s) => s.clearSubmitError)
  const permissionDenied = syncStatus === 'permission_denied' || lastSubmitError?.code === 'PERMISSION_DENIED'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        position: 'fixed', inset: 0,
        background: 'radial-gradient(ellipse 120% 100% at 50% 80%, #1e3260 0%, #1B2A4A 60%, #111d33 100%)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        zIndex: 100, padding: '24px',
      }}
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
      >
        <CheckCircle2 size={80} color="var(--color-success)" strokeWidth={1.5} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={{ textAlign: 'center', marginTop: 24 }}
      >
        <div style={{
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 26,
          letterSpacing: '0.04em', textTransform: 'uppercase',
          color: 'var(--color-text-primary)',
        }}>
          ¡Registro enviado!
        </div>
        <div style={{
          fontFamily: 'var(--font-body)', fontSize: 14,
          color: 'var(--color-text-secondary)', marginTop: 8,
          maxWidth: 280, lineHeight: 1.5,
        }}>
          {permissionDenied
            ? 'Guardado localmente. No pudo subirse a SharePoint — sin permiso.'
            : `${formTitle} guardado correctamente.`}
        </div>
      </motion.div>

      {/* Aviso de permiso denegado */}
      {permissionDenied && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          style={{
            width: '100%', maxWidth: 360, marginTop: 20,
            background: 'rgba(245,124,32,0.1)',
            border: '1px solid rgba(245,124,32,0.35)',
            borderRadius: 12, padding: '12px 14px',
            textAlign: 'left',
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: '#F57C20', marginBottom: 4, fontFamily: "'Barlow Condensed', sans-serif" }}>
            🔒 Sin permiso en SharePoint
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.4 }}>
            El registro quedó en cola local. Para que se sincronice, un admin debe darte acceso al sitio.
            Ve a <strong style={{ color: '#F57C20' }}>Mi Perfil → Solicitar acceso</strong> para pedirlo desde la app.
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 360, marginTop: permissionDenied ? 16 : 48 }}
      >
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => { clearSubmitError(); onNewRecord() }}
          style={{
            width: '100%', height: 52, background: 'var(--color-blue-btn)',
            color: '#fff', border: 'none', borderRadius: 'var(--radius-btn)',
            fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700,
            letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer',
          }}
        >
          Nuevo registro
        </motion.button>
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => { clearSubmitError(); onGoMenu() }}
          style={{
            width: '100%', height: 52, background: 'transparent',
            color: 'var(--color-text-secondary)',
            border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-btn)',
            fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700,
            letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer',
          }}
        >
          Volver al menú
        </motion.button>
      </motion.div>
    </motion.div>
  )
}

// ── WIZARD MODE ───────────────────────────────────────────────────────────

// Resolve next question ID given a question and the current answers map
function resolveNext(question, answers) {
  const val = answers[question.id]

  // Special routing: look at Q18 area selection to decide OP or ADM path
  if (question.nextQuestion === '__AREA_ROUTING__') {
    return answers['Q18'] === 'Área Operaciones Sucursal' ? 'Q20' : 'Q21'
  }

  // Radio/checkbox: per-option nextQuestion
  if (question.branching && Array.isArray(question.options)) {
    const selected = question.options.find((o) => o.value === val)
    if (selected?.nextQuestion) return selected.nextQuestion
  }

  // Select with optionRouting map (Q20, Q21)
  if (question.optionRouting && val) {
    return question.optionRouting[val] || question.nextQuestion || 'END'
  }

  return question.nextQuestion || 'END'
}

function isAnswered(question, value) {
  if (value == null || value === '') return false
  if (Array.isArray(value)) return value.length > 0
  return true
}

// Slide animation variants
const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? 48 : -48, opacity: 0 }),
  center: { x: 0, opacity: 1, transition: { duration: 0.22, ease: 'easeOut' } },
  exit: (dir) => ({ x: dir > 0 ? -48 : 48, opacity: 0, transition: { duration: 0.16, ease: 'easeIn' } }),
}

function WizardMode({ form, formType, cphsMode }) {
  const navigate = useNavigate()
  const { saveDraft, clearDraft, addToPendingQueue, syncQueue, drafts } = useFormStore()
  const { name: userName, email: userEmail, jobTitle: userJobTitle, branch } = useUserStore()

  const [answers, setAnswers]   = useState(() => drafts[formType] || {})
  const [history, setHistory]   = useState([form.entryQuestion])
  const [direction, setDirection] = useState(1)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showRequired, setShowRequired] = useState(false)
  const [noListError, setNoListError] = useState(false)

  const currentQId = history[history.length - 1]
  const question = form.questions[currentQId]
  const currentValue = answers[currentQId] ?? null
  const answered = question ? isAnswered(question, currentValue) : false
  const nextQId = question ? resolveNext(question, answers) : 'END'
  const isLastQuestion = nextQId === 'END'

  // Auto-save draft
  useEffect(() => {
    if (Object.keys(answers).length > 0) saveDraft(formType, answers)
  }, [answers, formType, saveDraft])

  const handleChange = useCallback((qId, val) => {
    setAnswers((prev) => ({ ...prev, [qId]: val }))
    setShowRequired(false)
  }, [])

  const handleNext = () => {
    if (!answered && question?.required) {
      setShowRequired(true)
      return
    }
    const next = resolveNext(question, answers)
    if (next === 'END') {
      handleSubmit()
      return
    }
    setDirection(1)
    setHistory((prev) => [...prev, next])
    setShowRequired(false)
  }

  const handleBack = () => {
    if (history.length <= 1) {
      navigate(-1)
      return
    }
    setDirection(-1)
    setHistory((prev) => prev.slice(0, -1))
    setShowRequired(false)
  }

  const handleSubmit = async () => {
    // Fail-loud: bloquear envío si el formulario no tiene lista SharePoint asignada.
    // En dev mode se omite para no interrumpir el flujo de pruebas locales.
    if (!IS_DEV_MODE) {
      const cfg = resolveListConfig(formType)
      if (!cfg?.listId) {
        setNoListError(true)
        return
      }
    }
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 900))
    // Solo enviar respuestas de las preguntas efectivamente recorridas (history).
    // Si el usuario retrocedió en Q18 y cambió de área, las respuestas del camino
    // abandonado quedan en answers pero NO en history → se excluyen aquí.
    const historySet = new Set(history)
    const cleanedAnswers = Object.fromEntries(
      Object.entries(answers).filter(([qid]) => historySet.has(qid))
    )
    addToPendingQueue({ formType, answers: { ...cleanedAnswers, ...(cphsMode ? { cphsRepresentante: true } : {}) }, formTitle: form.title, userName, userEmail, userJobTitle, branch })
    clearDraft(formType)
    setSubmitted(true)
    setSubmitting(false)
    // Disparar sync inmediatamente al enviar (no esperar al dashboard)
    if (!IS_DEV_MODE) syncQueue().catch(() => {})
  }

  if (submitted) {
    return (
      <SuccessScreen
        formTitle={form.title}
        onNewRecord={() => {
          setAnswers({})
          setHistory([form.entryQuestion])
          setSubmitted(false)
        }}
        onGoMenu={() => navigate(-2)}
      />
    )
  }

  if (!question) {
    return (
      <div style={{ minHeight: '100dvh', background: 'var(--color-navy)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--color-danger)', fontFamily: 'var(--font-body)' }}>
          Error: pregunta no encontrada ({currentQId})
        </p>
      </div>
    )
  }

  const estimatedTotal = form.estimatedTotal || 24
  const progress = Math.min((history.length - 1) / estimatedTotal, 0.98)
  const stepLabel = `Paso ${history.length} de ~${estimatedTotal}`

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--color-navy)' }}>
      {/* Header */}
      <AppHeader title={form.title} onBack={handleBack} />

      {/* Banner CPHS */}
      {cphsMode && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 16px',
          background: 'rgba(245,124,32,0.12)',
          borderBottom: '1px solid rgba(245,124,32,0.30)',
        }}>
          <Users size={14} color="#F57C20" />
          <span style={{
            fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600,
            color: '#F57C20', letterSpacing: '0.02em',
          }}>
            Actividad realizada por Representante CPHS
          </span>
        </div>
      )}

      {/* Progress bar */}
      <div style={{ height: 3, background: 'var(--color-border)', flexShrink: 0 }}>
        <motion.div
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          style={{ height: '100%', background: 'var(--color-orange)', borderRadius: '0 2px 2px 0' }}
        />
      </div>

      {/* Section + step counter */}
      <div
        style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '8px 16px',
          fontFamily: 'var(--font-body)', fontSize: 11, letterSpacing: '0.04em',
        }}
      >
        <span
          style={{
            color: 'var(--color-orange)', fontFamily: 'var(--font-display)',
            fontWeight: 700, fontSize: 11, letterSpacing: '0.10em', textTransform: 'uppercase',
          }}
        >
          {question.section || ''}
        </span>
        <span style={{ color: 'var(--color-text-muted)' }}>{stepLabel}</span>
      </div>

      {/* Animated question area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px 0' }}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentQId}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
          >
            {/* Question label */}
            <div
              style={{
                fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16,
                letterSpacing: '0.02em', color: 'var(--color-text-primary)',
                lineHeight: 1.35, marginBottom: 20,
              }}
            >
              {question.labelParts ? (
                <>
                  {question.labelParts.prefix}
                  <span style={{ color: 'var(--color-orange)' }}>
                    {question.labelParts.highlight}
                  </span>
                  {question.labelParts.suffix || ''}
                </>
              ) : (
                question.label
              )}
              {question.required && (
                <span style={{ color: 'var(--color-orange)', marginLeft: 4, fontWeight: 400, fontSize: 14 }}>*</span>
              )}
            </div>

            {/* Answer component — hide internal label (shown as heading above) */}
            <QuestionRenderer
              question={{ ...question, _noLabel: true }}
              value={currentValue}
              onChange={handleChange}
              hasError={false}
            />

            {/* Required warning */}
            {showRequired && !answered && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, marginTop: 10,
                  fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-danger)',
                }}
              >
                <AlertCircle size={13} />
                Este campo es obligatorio para continuar
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        <div style={{ height: 80 }} />
      </div>

      {/* Navigation footer */}
      <div
        style={{
          padding: '12px 16px',
          paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
          borderTop: '1px solid var(--color-border)',
          background: 'rgba(27,42,74,0.95)',
          backdropFilter: 'blur(8px)',
          flexShrink: 0,
          display: 'flex',
          gap: 10,
        }}
      >
        {/* Back button */}
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={handleBack}
          style={{
            flex: history.length > 1 ? '0 0 80px' : '0 0 0px',
            overflow: 'hidden',
            height: 52,
            background: 'transparent',
            border: history.length > 1 ? '1.5px solid var(--color-border)' : 'none',
            borderRadius: 'var(--radius-btn)',
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-display)',
            fontSize: 15,
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            transition: 'flex 0.2s ease',
          }}
        >
          {history.length > 1 ? 'ATRÁS' : ''}
        </motion.button>

        {/* Next / Submit button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleNext}
          disabled={submitting}
          style={{
            flex: 1,
            height: 52,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: answered ? (isLastQuestion ? 'var(--color-orange)' : 'var(--color-blue-btn)') : 'var(--color-surface)',
            color: answered ? '#fff' : 'var(--color-text-muted)',
            border: answered ? 'none' : '1px solid var(--color-border)',
            borderRadius: 'var(--radius-btn)',
            fontFamily: 'var(--font-display)',
            fontSize: 18, fontWeight: 700,
            letterSpacing: '0.06em', textTransform: 'uppercase',
            cursor: submitting ? 'wait' : 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: answered ? (isLastQuestion ? '0 4px 20px rgba(245,124,32,0.35)' : '0 4px 20px rgba(26,82,184,0.35)') : 'none',
          }}
        >
          {submitting ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
              style={{
                width: 20, height: 20, borderRadius: '50%',
                border: '2.5px solid rgba(255,255,255,0.3)',
                borderTopColor: '#fff',
              }}
            />
          ) : isLastQuestion ? (
            'ENVIAR'
          ) : (
            <>
              SIGUIENTE
              <ChevronRight size={18} strokeWidth={2.5} />
            </>
          )}
        </motion.button>
      </div>

      {/* Fail-loud: formulario sin lista SharePoint asignada */}
      {noListError && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 2000,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }}>
          <div style={{
            background: 'var(--color-navy-mid)', border: '1px solid rgba(235,87,87,0.5)',
            borderRadius: 16, padding: 28, maxWidth: 360, width: '100%',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <AlertCircle size={22} color="#EB5757" />
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: '#EB5757', letterSpacing: '0.04em' }}>
                SIN LISTA SHAREPOINT
              </span>
            </div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--color-text-primary)', lineHeight: 1.6, margin: '0 0 20px' }}>
              Este formulario no tiene lista SharePoint asignada. Los registros no se podrán guardar.
              Contacta al administrador para que configure la lista destino desde el Editor de Formularios.
            </p>
            <button
              onClick={() => setNoListError(false)}
              style={{
                width: '100%', padding: '12px', borderRadius: 10, border: 'none',
                background: 'rgba(235,87,87,0.15)', cursor: 'pointer',
                fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700,
                color: '#EB5757', letterSpacing: '0.06em',
              }}
            >
              ENTENDIDO
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── SECTIONS MODE (original) ──────────────────────────────────────────────
function SectionsMode({ form, formType }) {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { saveDraft, clearDraft, addToPendingQueue, syncQueue, drafts } = useFormStore()
  const { name: userName, email: userEmail, jobTitle: userJobTitle, branch } = useUserStore()

  // Prioridad: borrador guardado → prefillData de navigation state → vacío
  const [answers, setAnswers] = useState(() => {
    const raw = drafts[formType] || location.state?.prefillData || {}
    // Limpiar el draft al cargar: solo conservar respuestas de secciones/preguntas
    // visibles con los valores iniciales del draft. Evita que respuestas de una
    // sección (ej. OP) persistan cuando el área ya apunta a otra (ej. ADM).
    const visibleQIds = new Set(
      form.sections
        .filter((s) => !s.visibleWhen || s.visibleWhen(raw))
        .flatMap((s) => s.questions.filter((q) => !q.visibleWhen || q.visibleWhen(raw)).map((q) => q.id))
    )
    return Object.fromEntries(Object.entries(raw).filter(([qid]) => visibleQIds.has(qid)))
  })
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [noListError, setNoListError] = useState(false)
  const firstErrorRef = useRef(null)

  useEffect(() => {
    if (Object.keys(answers).length > 0) saveDraft(formType, answers)
  }, [answers, formType, saveDraft])

  const handleChange = useCallback((questionId, value) => {
    setAnswers((prev) => {
      const next = { ...prev, [questionId]: value }
      // Al cambiar una respuesta que controla visibleWhen (ej. área OP vs ADM),
      // eliminamos las respuestas de preguntas que quedan ocultas con el nuevo valor.
      // Esto evita que datos de la sección OP se mezclen con los de ADM al enviar.
      const nowVisibleQIds = new Set(
        form.sections
          .filter(s => !s.visibleWhen || s.visibleWhen(next))
          .flatMap(s => s.questions.filter(q => !q.visibleWhen || q.visibleWhen(next)).map(q => q.id))
      )
      const cleaned = {}
      Object.keys(next).forEach(qid => {
        if (nowVisibleQIds.has(qid)) cleaned[qid] = next[qid]
      })
      return cleaned
    })
  }, [form.sections])

  // Filtrar secciones y preguntas según visibleWhen(answers)
  const visibleSections = form.sections.filter(s => !s.visibleWhen || s.visibleWhen(answers))
  const allQuestions = visibleSections.flatMap(s =>
    s.questions.filter(q => !q.visibleWhen || q.visibleWhen(answers))
  )
  const requiredQuestions = allQuestions.filter((q) => q.required)
  const answeredRequired = requiredQuestions.filter((q) => answers[q.id] != null && answers[q.id] !== '')
  const progress = requiredQuestions.length > 0 ? answeredRequired.length / requiredQuestions.length : 0
  const isValid = answeredRequired.length === requiredQuestions.length

  const unansweredIds = new Set(
    submitAttempted
      ? requiredQuestions.filter((q) => answers[q.id] == null || answers[q.id] === '').map((q) => q.id)
      : []
  )

  const handleSubmit = async () => {
    if (!isValid) {
      setSubmitAttempted(true)
      setTimeout(() => {
        if (firstErrorRef.current) {
          firstErrorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 50)
      return
    }
    // Fail-loud: bloquear envío si el formulario no tiene lista SharePoint asignada.
    if (!IS_DEV_MODE) {
      const cfg = resolveListConfig(formType)
      if (!cfg?.listId) {
        setNoListError(true)
        return
      }
    }
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 900))
    // Solo enviar respuestas de preguntas actualmente visibles (secciones filtradas por visibleWhen).
    // Elimina respuestas de secciones ocultas que pudieran haber quedado del draft o de un
    // cambio de área previo que no disparó handleChange (ej. área ya seleccionada al cargar).
    const visibleQIds = new Set(allQuestions.map((q) => q.id))
    const cleanedAnswers = Object.fromEntries(Object.entries(answers).filter(([qid]) => visibleQIds.has(qid)))
    addToPendingQueue({ formType, answers: cleanedAnswers, formTitle: form.title, userName, userEmail, userJobTitle, branch })
    clearDraft(formType)
    setSubmitted(true)
    setSubmitting(false)

    // ── Actualizar store de contratistas según tipo de formulario ──────────
    if (formType === 'permiso-trabajo-contratista') {
      useContratistasStore.getState().addPermiso(cleanedAnswers)
    }
    if (formType === 'cierre-trabajo-contratista' && location.state?.permisoId) {
      useContratistasStore.getState().cerrarPermiso(location.state.permisoId)
    }

    // Disparar sync inmediatamente al enviar (no esperar al dashboard)
    if (!IS_DEV_MODE) syncQueue().catch(() => {})
  }

  if (submitted) {
    return (
      <SuccessScreen
        formTitle={form.title}
        onNewRecord={() => { setAnswers({}); setSubmitted(false); setSubmitAttempted(false) }}
        onGoMenu={() => navigate(location.state?.returnTo || -2)}
      />
    )
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--color-navy)' }}>
      <AppHeader title={form.title} />

      <div style={{ height: 3, background: 'var(--color-border)', flexShrink: 0 }}>
        <motion.div
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          style={{ height: '100%', background: 'var(--color-orange)', borderRadius: '0 2px 2px 0' }}
        />
      </div>

      <div
        className="content-col"
        style={{
          display: 'flex', justifyContent: 'space-between',
          padding: '8px 16px 0',
          fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--color-text-muted)', letterSpacing: '0.03em',
        }}
      >
        <span>{form.description}</span>
        <span style={{ color: isValid ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
          {answeredRequired.length}/{requiredQuestions.length} requeridas
        </span>
      </div>

      <div className="content-col" style={{ flex: 1, padding: '16px 16px 0', overflowY: 'auto' }}>
        {(() => {
          // Compute the first error question ID before rendering (avoids reading ref during render)
          const firstErrorId = unansweredIds.size > 0
            ? visibleSections.flatMap(s => s.questions.filter(q => !q.visibleWhen || q.visibleWhen(answers))).find(q => unansweredIds.has(q.id))?.id ?? null
            : null
          return visibleSections.map((section, si) => (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: si * 0.04, duration: 0.3, ease: 'easeOut' }}
            style={{ marginBottom: 24 }}
          >
            <div
              style={{
                fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13,
                letterSpacing: '0.10em', textTransform: 'uppercase',
                color: 'var(--color-orange)', marginBottom: 12,
                paddingBottom: 8, borderBottom: '1px solid var(--color-border)',
              }}
            >
              {section.title}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {section.questions.filter(q => !q.visibleWhen || q.visibleWhen(answers)).map((question) => {
                const hasError = unansweredIds.has(question.id)
                const isFirstError = hasError && question.id === firstErrorId
                return (
                  <div
                    key={question.id}
                    ref={isFirstError ? (el) => { firstErrorRef.current = el } : null}
                  >
                    <QuestionRenderer
                      question={question}
                      value={answers[question.id] ?? null}
                      onChange={handleChange}
                      hasError={hasError}
                    />
                  </div>
                )
              })}
            </div>
          </motion.div>
        ))
        })()}
        <div style={{ height: 16 }} />
      </div>

      <div
        style={{
          borderTop: '1px solid var(--color-border)',
          background: 'var(--color-navy)', flexShrink: 0,
        }}
      >
        <div className="content-col" style={{ padding: '12px 16px', paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))' }}>
        {submitAttempted && !isValid && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
              fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-danger)',
            }}
          >
            <AlertCircle size={14} />
            Completa todos los campos obligatorios antes de enviar.
          </motion.div>
        )}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSubmit}
          disabled={submitting}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            width: '100%', height: 52,
            background: isValid ? 'var(--color-blue-btn)' : 'var(--color-surface)',
            color: isValid ? '#fff' : 'var(--color-text-muted)',
            border: isValid ? 'none' : '1px solid var(--color-border)',
            borderRadius: 'var(--radius-btn)',
            fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700,
            letterSpacing: '0.06em', textTransform: 'uppercase',
            cursor: submitting ? 'wait' : 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: isValid ? '0 4px 20px rgba(26,82,184,0.35)' : 'none',
          }}
        >
          {submitting ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
              style={{
                width: 20, height: 20, borderRadius: '50%',
                border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: '#fff',
              }}
            />
          ) : (
            'Enviar registro'
          )}
        </motion.button>
        </div>
      </div>

      {/* Fail-loud: formulario sin lista SharePoint asignada */}
      {noListError && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 2000,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }}>
          <div style={{
            background: 'var(--color-navy-mid)', border: '1px solid rgba(235,87,87,0.5)',
            borderRadius: 16, padding: 28, maxWidth: 360, width: '100%',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <AlertCircle size={22} color="#EB5757" />
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: '#EB5757', letterSpacing: '0.04em' }}>
                SIN LISTA SHAREPOINT
              </span>
            </div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--color-text-primary)', lineHeight: 1.6, margin: '0 0 20px' }}>
              Este formulario no tiene lista SharePoint asignada. Los registros no se podrán guardar.
              Contacta al administrador para que configure la lista destino desde el Editor de Formularios.
            </p>
            <button
              onClick={() => setNoListError(false)}
              style={{
                width: '100%', padding: '12px', borderRadius: 10, border: 'none',
                background: 'rgba(235,87,87,0.15)', cursor: 'pointer',
                fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700,
                color: '#EB5757', letterSpacing: '0.06em',
              }}
            >
              ENTENDIDO
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main entry point ──────────────────────────────────────────────────────
export default function FormScreen() {
  const { formType } = useParams()
  const [searchParams] = useSearchParams()
  const cphsMode = searchParams.get('cphs') === 'true'

  // Orden de prioridad para cargar la definición:
  // 1. Override de editedForms (admin editó un formulario estático)
  // 2. Formulario personalizado creado por admin (customForms)
  // 3. Definición estática (formDefinitions)
  const editedForms    = useFormEditorStore((s) => s.editedForms)
  const customForms    = useFormEditorStore((s) => s.customForms)
  const editedOverride = editedForms[formType]
  const staticForm     = formDefinitions[formType] || customForms[formType] || null

  // El override guardado por el editor es AUTORITATIVO: contiene exactamente las secciones y
  // preguntas que el administrador configuró. No se mezcla con el estático como base porque
  // eso causaría que preguntas intencionalmente eliminadas reaparecieran.
  // El estático solo provee las funciones visibleWhen (no serializables en JSON).
  // Si no hay override → se usa directamente el estático (formDefinitions.js es la base correcta).
  const form = (() => {
    if (!editedOverride) return staticForm

    // Reconstruye una función visibleWhen a partir de un objeto serializable
    // visibleCondition = { questionId, equals } o { questionId, in: [...] } o
    // { all: [{questionId, equals}, ...] } / { any: [...] }
    // Si la condición no es válida, devuelve null (se trata como "siempre visible").
    const buildVisibleFn = (cond) => {
      if (!cond || typeof cond !== 'object') return null
      const evalSingle = (c, ans) => {
        if (!c?.questionId) return true
        const v = ans?.[c.questionId]
        if (Array.isArray(c.in)) return c.in.includes(v)
        if ('equals' in c) return v === c.equals
        return true
      }
      if (Array.isArray(cond.all)) return (a) => cond.all.every((c) => evalSingle(c, a))
      if (Array.isArray(cond.any)) return (a) => cond.any.some((c) => evalSingle(c, a))
      return (a) => evalSingle(cond, a)
    }

    // Formularios de secciones: override autoritativo + restaurar visibleWhen desde estático.
    // Si la sección/pregunta no tiene visibleWhen estático pero sí tiene visibleCondition
    // (configurado desde el editor), se construye la función a partir de la condición serializable.
    if (editedOverride.sections && staticForm?.sections) {
      const staticVWMap = {}
      staticForm.sections.forEach((sec) => {
        sec.questions?.forEach((q) => { if (q.visibleWhen) staticVWMap[q.id] = q.visibleWhen })
      })
      const mergedSections = editedOverride.sections.map((overrideSec) => {
        const staticSec = staticForm.sections.find((s) => s.id === overrideSec.id)
        const secVisible = staticSec?.visibleWhen || buildVisibleFn(overrideSec.visibleCondition)
        return {
          ...overrideSec,
          visibleWhen: secVisible,
          questions: (overrideSec.questions || []).map((q) => ({
            ...q,
            visibleWhen: staticVWMap[q.id] || buildVisibleFn(q.visibleCondition),
          })),
        }
      })
      return { ...staticForm, ...editedOverride, sections: mergedSections }
    }

    // Formularios wizard: restaurar visibleWhen en cada pregunta del dict
    if (editedOverride.questions && staticForm?.questions) {
      const mergedQuestions = {}
      const allQids = new Set([...Object.keys(editedOverride.questions), ...Object.keys(staticForm.questions)])
      allQids.forEach((qid) => {
        const sq = staticForm.questions[qid]
        const oq = editedOverride.questions[qid]
        if (!oq) return
        const fn = sq?.visibleWhen || buildVisibleFn(oq.visibleCondition)
        mergedQuestions[qid] = sq ? { ...sq, ...oq, visibleWhen: fn } : { ...oq, visibleWhen: fn }
      })
      return { ...staticForm, ...editedOverride, questions: mergedQuestions }
    }

    return { ...staticForm, ...editedOverride }
  })()

  if (!form) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--color-navy)' }}>
        <AppHeader title="Formulario" />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <p style={{ fontFamily: 'var(--font-body)', color: 'var(--color-text-muted)', textAlign: 'center' }}>
            Formulario no encontrado: <code>{formType}</code>
          </p>
        </div>
      </div>
    )
  }

  if (form.mode === 'wizard') {
    return <WizardMode form={form} formType={formType} cphsMode={cphsMode} />
  }

  return <SectionsMode form={form} formType={formType} />
}
