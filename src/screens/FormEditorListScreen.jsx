import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ClipboardList, PersonStanding, Search, Megaphone,
  Eye, CalendarCheck, ChevronRight, Pencil,
  ShieldCheck, Plus, X, FileText, Check,
  Cloud, CloudOff, RefreshCw, Home,
} from 'lucide-react'
import AppHeader from '../components/layout/AppHeader'
import useFormEditorStore from '../store/formEditorStore'
import { containerVariants, itemVariants } from '../components/ui/menuCardVariants'

// ── Catálogo de formularios estáticos ─────────────────────────────────────
const FORM_CATALOG = [
  {
    id: 'pauta-verificacion-reglas-oro',
    label: 'Pauta de Verificación',
    sublabel: 'Reglas de Oro — Verificación conductual (Wizard, 47 preguntas)',
    icon: <ClipboardList size={20} color="#fff" />,
    accentColor: '#1A52B8',
    mode: 'wizard',
    unit: 'Sucursales',
  },
  {
    id: 'pauta-verificacion',
    label: 'Pauta de Verificación Simple',
    sublabel: 'Control de condiciones del área de trabajo',
    icon: <ClipboardList size={20} color="#fff" />,
    accentColor: '#2F80ED',
    mode: 'sections',
    unit: 'Sucursales',
  },
  {
    id: 'caminata-seguridad',
    label: 'Caminata de Seguridad',
    sublabel: 'Recorrido de inspección en terreno',
    icon: <PersonStanding size={20} color="#fff" />,
    accentColor: '#27AE60',
    mode: 'sections',
    unit: 'Sucursales',
  },
  {
    id: 'inspeccion-simple',
    label: 'Inspección Simple',
    sublabel: 'Revisión de equipos y espacios',
    icon: <Search size={20} color="#fff" />,
    accentColor: '#F57C20',
    mode: 'sections',
    unit: 'Sucursales',
  },
  {
    id: 'difusiones-sso',
    label: 'Difusiones SSO',
    sublabel: 'Registro de charlas y capacitaciones',
    icon: <Megaphone size={20} color="#fff" />,
    accentColor: '#EB5757',
    mode: 'sections',
    unit: 'Ambas',
  },
  {
    id: 'observacion-conductual',
    label: 'Observación Conductual',
    sublabel: 'Registro de comportamientos seguros',
    icon: <Eye size={20} color="#fff" />,
    accentColor: '#1A52B8',
    mode: 'sections',
    unit: 'Fuerza de Ventas',
  },
  {
    id: 'inspeccion-planificada',
    label: 'Inspección Planificada',
    sublabel: 'Inspección programada de riesgos',
    icon: <CalendarCheck size={20} color="#fff" />,
    accentColor: '#27AE60',
    mode: 'sections',
    unit: 'Fuerza de Ventas',
  },
]

// Colores disponibles para nuevos formularios
const ACCENT_COLORS = [
  '#1A52B8', '#2F80ED', '#27AE60', '#F57C20',
  '#EB5757', '#7B3FE4', '#F2994A', '#0097A7',
]

// Slugify: "Mi Formulario" → "mi-formulario"
function slugify(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
}

// ── Modal de nuevo formulario ─────────────────────────────────────────────
function NewFormModal({ onClose, onCreate }) {
  const [title, setTitle]       = useState('')
  const [desc, setDesc]         = useState('')
  const [mode, setMode]         = useState('sections')
  const [unit, setUnit]         = useState('Sucursales')
  const [color, setColor]       = useState('#2F80ED')
  const [error, setError]       = useState('')

  const inputBase = {
    width: '100%', boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid var(--color-border)',
    borderRadius: 8, padding: '10px 12px',
    fontFamily: 'var(--font-body)', fontSize: 13,
    color: 'var(--color-text-primary)', outline: 'none',
  }

  const labelBase = {
    fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600,
    color: 'var(--color-text-muted)', letterSpacing: '0.06em',
    textTransform: 'uppercase', marginBottom: 6, display: 'block',
  }

  const handleCreate = () => {
    if (!title.trim()) { setError('El título es obligatorio'); return }
    const id = `custom-${slugify(title)}-${Date.now()}`
    const formDef = {
      id,
      title: title.trim(),
      description: desc.trim(),
      mode,
      unit,
      accentColor: color,
      isCustom: true,
      createdAt: new Date().toISOString(),
      // Estructura base según modo
      ...(mode === 'wizard'
        ? {
            questions: {
              Q1: {
                id: 'Q1', order: 1,
                label: 'Nueva pregunta de observación',
                type: 'radio', required: true, branching: true,
                conductasList: ['Conducta a observar 1'],
                options: [
                  { value: 'SIN_OBSERVACIONES', label: 'SIN OBSERVACIONES', style: 'positive', nextQuestion: 'END' },
                  { value: 'CON_OBSERVACIONES', label: 'CON OBSERVACIONES', style: 'negative', nextQuestion: 'END' },
                ],
              },
            },
          }
        : {
            sections: [
              {
                id: 'seccion-1',
                title: 'Sección 1',
                questions: [
                  { id: 'Q1', order: 1, label: 'Primera pregunta', type: 'yesno', required: true },
                ],
              },
            ],
          }
      ),
    }
    onCreate(formDef)
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
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
          width: '100%', maxHeight: '90dvh',
          background: 'var(--color-navy-mid)',
          borderRadius: '16px 16px 0 0',
          border: '1px solid var(--color-border)',
          borderBottom: 'none',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '14px 16px', borderBottom: '1px solid var(--color-border)',
          display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9,
            background: 'rgba(47,128,237,0.18)',
            border: '1.5px solid rgba(47,128,237,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Plus size={16} color="#2F80ED" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700,
              letterSpacing: '0.05em', color: 'var(--color-text-primary)',
            }}>
              NUEVO FORMULARIO
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--color-text-muted)' }}>
              Se podrá editar completamente después de crear
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            style={{
              width: 34, height: 34, background: 'rgba(255,255,255,0.06)',
              border: '1px solid var(--color-border)', borderRadius: 8,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={16} color="var(--color-text-muted)" />
          </motion.button>
        </div>

        {/* Cuerpo */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px', paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))' }}>

          {/* Título */}
          <div style={{ marginBottom: 18 }}>
            <label style={labelBase}>Nombre del formulario *</label>
            <input
              value={title}
              onChange={(e) => { setTitle(e.target.value); setError('') }}
              placeholder="Ej: Inspección de EPP Mensual"
              style={{ ...inputBase, borderColor: error ? 'rgba(235,87,87,0.6)' : 'var(--color-border)' }}
            />
            {error && (
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#EB5757', marginTop: 4 }}>
                {error}
              </div>
            )}
          </div>

          {/* Descripción */}
          <div style={{ marginBottom: 18 }}>
            <label style={labelBase}>Descripción breve</label>
            <input
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Ej: Control mensual de equipos de protección"
              style={inputBase}
            />
          </div>

          {/* Modo */}
          <div style={{ marginBottom: 18 }}>
            <label style={labelBase}>Modo de formulario</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { value: 'sections', label: 'Secciones', desc: 'Vista por bloques temáticos' },
                { value: 'wizard',   label: 'Wizard',    desc: 'Paso a paso con ramificaciones' },
              ].map(({ value, label, desc: d }) => (
                <button
                  key={value}
                  onClick={() => setMode(value)}
                  style={{
                    flex: 1, padding: '10px 12px', borderRadius: 9, cursor: 'pointer',
                    background: mode === value ? 'rgba(26,82,184,0.2)' : 'rgba(255,255,255,0.04)',
                    border: `1.5px solid ${mode === value ? 'rgba(26,82,184,0.6)' : 'var(--color-border)'}`,
                    textAlign: 'left',
                  }}
                >
                  <div style={{
                    fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700,
                    color: mode === value ? '#93B4F8' : 'var(--color-text-muted)',
                    letterSpacing: '0.04em',
                  }}>
                    {label.toUpperCase()}
                  </div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--color-text-muted)', marginTop: 2 }}>
                    {d}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Unidad */}
          <div style={{ marginBottom: 18 }}>
            <label style={labelBase}>Unidad</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['Sucursales', 'Fuerza de Ventas', 'Ambas'].map((u) => (
                <button
                  key={u}
                  onClick={() => setUnit(u)}
                  style={{
                    padding: '7px 14px', borderRadius: 8, cursor: 'pointer',
                    background: unit === u ? 'rgba(245,124,32,0.15)' : 'rgba(255,255,255,0.04)',
                    border: `1.5px solid ${unit === u ? 'rgba(245,124,32,0.5)' : 'var(--color-border)'}`,
                    fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600,
                    color: unit === u ? 'var(--color-orange)' : 'var(--color-text-muted)',
                  }}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div style={{ marginBottom: 24 }}>
            <label style={labelBase}>Color de acento</label>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {ACCENT_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  style={{
                    width: 34, height: 34, borderRadius: '50%',
                    background: c, border: 'none', cursor: 'pointer',
                    outline: color === c ? `3px solid white` : 'none',
                    outlineOffset: 2,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {color === c && <Check size={14} color="#fff" strokeWidth={3} />}
                </button>
              ))}
            </div>
          </div>

          {/* Botón crear */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleCreate}
            style={{
              width: '100%', height: 48,
              background: 'var(--color-blue-btn)',
              border: 'none', borderRadius: 12, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            }}
          >
            <Plus size={18} color="#fff" />
            <span style={{
              fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700,
              letterSpacing: '0.08em', color: '#fff',
            }}>
              CREAR FORMULARIO
            </span>
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Card individual de formulario ─────────────────────────────────────────
function FormCard({ form, hasEdits, isCustom, onEdit }) {
  return (
    <motion.div
      variants={itemVariants}
      onClick={onEdit}
      style={{
        background: 'var(--color-navy-mid)',
        border: `1px solid ${hasEdits ? 'rgba(123,63,228,0.4)' : isCustom ? 'rgba(47,128,237,0.3)' : 'var(--color-border)'}`,
        borderRadius: 'var(--radius-card)',
        padding: '14px 16px',
        display: 'flex', alignItems: 'center', gap: 14,
        cursor: 'pointer', position: 'relative', overflow: 'hidden',
      }}
    >
      {/* Accent line */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: 3, background: form.accentColor, borderRadius: '3px 0 0 3px',
      }} />

      {/* Icon */}
      <div style={{
        width: 42, height: 42, borderRadius: 10,
        background: form.accentColor,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, marginLeft: 8,
      }}>
        {form.icon || <FileText size={20} color="#fff" />}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14,
            letterSpacing: '0.04em', textTransform: 'uppercase',
            color: 'var(--color-text-primary)',
          }}>
            {form.label}
          </span>
          {hasEdits && (
            <span style={{
              fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600,
              padding: '1px 6px', borderRadius: 4,
              background: 'rgba(123,63,228,0.18)', color: '#C084FC',
              border: '1px solid rgba(123,63,228,0.35)',
            }}>
              EDITADO
            </span>
          )}
          {isCustom && (
            <span style={{
              fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600,
              padding: '1px 6px', borderRadius: 4,
              background: 'rgba(47,128,237,0.15)', color: '#60A5FA',
              border: '1px solid rgba(47,128,237,0.35)',
            }}>
              PERSONALIZADO
            </span>
          )}
        </div>
        <div style={{
          fontFamily: 'var(--font-body)', fontSize: 12,
          color: 'var(--color-text-muted)', marginTop: 2,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {form.sublabel}
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
          <span style={{
            fontFamily: 'var(--font-body)', fontSize: 10,
            padding: '1px 7px', borderRadius: 4,
            background: form.mode === 'wizard' ? 'rgba(26,82,184,0.25)' : 'rgba(39,174,96,0.15)',
            color: form.mode === 'wizard' ? '#93B4F8' : '#6FCF97',
            border: `1px solid ${form.mode === 'wizard' ? 'rgba(26,82,184,0.4)' : 'rgba(39,174,96,0.3)'}`,
          }}>
            {form.mode === 'wizard' ? 'WIZARD' : 'SECCIONES'}
          </span>
          <span style={{
            fontFamily: 'var(--font-body)', fontSize: 10,
            padding: '1px 7px', borderRadius: 4,
            background: 'rgba(255,255,255,0.05)',
            color: 'var(--color-text-muted)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            {form.unit}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: 'rgba(123,63,228,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid rgba(123,63,228,0.3)',
        }}>
          <Pencil size={14} color="#C084FC" />
        </div>
        <ChevronRight size={18} color="var(--color-orange)" />
      </div>
    </motion.div>
  )
}

// ── Indicador de sincronización ───────────────────────────────────────────
function SyncBadge({ syncStatus, lastSyncedAt }) {
  if (syncStatus === 'idle' && !lastSyncedAt) return null

  const configs = {
    syncing: { icon: <RefreshCw size={11} color="#60A5FA" style={{ animation: 'spin 1s linear infinite' }} />, label: 'Sincronizando…', color: '#60A5FA', bg: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.25)' },
    success: { icon: <Cloud size={11} color="#6FCF97" />, label: 'Sincronizado', color: '#6FCF97', bg: 'rgba(39,174,96,0.1)', border: 'rgba(39,174,96,0.25)' },
    error:   { icon: <CloudOff size={11} color="#EB5757" />, label: 'Sin conexión — cambios guardados localmente', color: '#EB5757', bg: 'rgba(235,87,87,0.1)', border: 'rgba(235,87,87,0.25)' },
    idle:    { icon: <Cloud size={11} color="var(--color-text-muted)" />, label: 'Local', color: 'var(--color-text-muted)', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)' },
  }
  const c = configs[syncStatus] || configs.idle

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 8px', borderRadius: 6,
      background: c.bg, border: `1px solid ${c.border}`,
    }}>
      {c.icon}
      <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: c.color }}>
        {c.label}
      </span>
    </div>
  )
}

// ── Pantalla principal ────────────────────────────────────────────────────
export default function FormEditorListScreen() {
  const navigate     = useNavigate()
  const editedForms  = useFormEditorStore((s) => s.editedForms)
  const customForms  = useFormEditorStore((s) => s.customForms)
  const syncStatus   = useFormEditorStore((s) => s.syncStatus)
  const lastSyncedAt = useFormEditorStore((s) => s.lastSyncedAt)
  const addCustomForm = useFormEditorStore((s) => s.addCustomForm)

  const [showNewModal, setShowNewModal] = useState(false)

  // Convertir customForms dict → array para listar
  const customFormsList = Object.values(customForms).map((f) => ({
    id: f.id,
    label: f.title,
    sublabel: f.description || 'Formulario personalizado',
    accentColor: f.accentColor || '#2F80ED',
    mode: f.mode,
    unit: f.unit || 'Ambas',
    isCustom: true,
  }))

  const totalForms = FORM_CATALOG.length + customFormsList.length

  const handleCreate = (formDef) => {
    addCustomForm(formDef)
    navigate(`/admin/form-editor/${formDef.id}`)
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--color-navy)' }}>
      <AppHeader
        title="Editor de Formularios"
        rightAction={
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => navigate('/select-unit')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: 8, margin: -8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--color-orange)',
              borderRadius: 8, minWidth: 44, minHeight: 44,
            }}
            aria-label="Ir al menú principal"
          >
            <Home size={22} strokeWidth={2.2} />
          </motion.button>
        }
      />

      <div style={{ flex: 1, padding: '20px 16px', paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))' }}>

        {/* Banner admin */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'rgba(123,63,228,0.08)',
            border: '1px solid rgba(123,63,228,0.25)',
            borderRadius: 10,
            padding: '12px 16px',
            display: 'flex', alignItems: 'flex-start', gap: 12,
            marginBottom: 16,
          }}
        >
          <ShieldCheck size={18} color="#C084FC" style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700,
              letterSpacing: '0.04em', color: '#C084FC', marginBottom: 3,
            }}>
              ACCESO ADMINISTRADOR
            </div>
            <div style={{
              fontFamily: 'var(--font-body)', fontSize: 12,
              color: 'var(--color-text-muted)', lineHeight: 1.5,
            }}>
              Edita preguntas, opciones y ramificaciones. Los cambios se sincronizan
              automáticamente a todos los dispositivos con la app instalada.
            </div>
            <div style={{ marginTop: 8 }}>
              <SyncBadge syncStatus={syncStatus} lastSyncedAt={lastSyncedAt} />
            </div>
          </div>
        </motion.div>

        {/* Botón nuevo formulario */}
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowNewModal(true)}
          style={{
            width: '100%', height: 46, marginBottom: 20,
            background: 'rgba(47,128,237,0.12)',
            border: '1.5px dashed rgba(47,128,237,0.5)',
            borderRadius: 12, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          }}
        >
          <Plus size={18} color="#60A5FA" />
          <span style={{
            fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700,
            letterSpacing: '0.06em', color: '#60A5FA',
          }}>
            NUEVO FORMULARIO
          </span>
        </motion.button>

        {/* Contador */}
        <div style={{
          fontFamily: 'var(--font-body)', fontSize: 12,
          color: 'var(--color-text-muted)', marginBottom: 12,
        }}>
          {totalForms} formulario{totalForms !== 1 ? 's' : ''} disponibles
          {customFormsList.length > 0 && (
            <span style={{ color: '#60A5FA', marginLeft: 6 }}>
              ({customFormsList.length} personalizado{customFormsList.length !== 1 ? 's' : ''})
            </span>
          )}
        </div>

        {/* Lista */}
        <motion.div
          variants={containerVariants}
          initial="initial"
          animate="animate"
          style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
        >
          {/* Formularios estáticos */}
          {FORM_CATALOG.map((form) => (
            <FormCard
              key={form.id}
              form={form}
              hasEdits={!!editedForms[form.id]}
              isCustom={false}
              onEdit={() => navigate(`/admin/form-editor/${form.id}`)}
            />
          ))}

          {/* Separador si hay formularios custom */}
          {customFormsList.length > 0 && (
            <motion.div
              variants={itemVariants}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                margin: '4px 0',
              }}
            >
              <div style={{ flex: 1, height: 1, background: 'rgba(47,128,237,0.2)' }} />
              <span style={{
                fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600,
                color: '#60A5FA', letterSpacing: '0.06em',
              }}>
                PERSONALIZADOS
              </span>
              <div style={{ flex: 1, height: 1, background: 'rgba(47,128,237,0.2)' }} />
            </motion.div>
          )}

          {/* Formularios custom */}
          {customFormsList.map((form) => (
            <FormCard
              key={form.id}
              form={form}
              hasEdits={false}
              isCustom={true}
              onEdit={() => navigate(`/admin/form-editor/${form.id}`)}
            />
          ))}
        </motion.div>
      </div>

      {/* Modal nuevo formulario */}
      <AnimatePresence>
        {showNewModal && (
          <NewFormModal
            onClose={() => setShowNewModal(false)}
            onCreate={handleCreate}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
