import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen, Download, ChevronRight, Users, Calendar,
  MapPin, Clock, CheckCircle, X, Paperclip, Camera,
  AlertCircle, Loader, Megaphone, ClipboardCheck,
} from 'lucide-react'
import AppHeader from '../components/layout/AppHeader'
import useUserStore from '../store/userStore'
import { submitDifusion } from '../services/difusionesService'

// ── Helpers ───────────────────────────────────────────────────────────────
function getWeekInfo() {
  const now = new Date()
  const day = now.getDay() || 7
  const monday = new Date(now)
  monday.setDate(now.getDate() - day + 1)
  const friday = new Date(monday)
  friday.setDate(monday.getDate() + 4)
  const start = new Date(now.getFullYear(), 0, 1)
  const week = Math.ceil(((now - start) / 86400000 + start.getDay() + 1) / 7)
  const fmt = (d) => d.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
  return { week, range: `${fmt(monday)} – ${fmt(friday)}` }
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const EQUIPOS = [
  { id: 'operaciones',    label: 'Operaciones',    color: '#1A52B8', spUrl: import.meta.env.VITE_SP_SEMANA_OP },
  { id: 'administracion', label: 'Administración', color: '#27AE60', spUrl: import.meta.env.VITE_SP_SEMANA_ADM },
  { id: 'distribuidoras', label: 'Distribuidoras', color: '#F57C20', spUrl: import.meta.env.VITE_SP_SEMANA_DIST },
]
const TURNOS = ['Mañana', 'Tarde', 'Noche']
const MAX_FILES = 5

// ── Sección 1: Material de la Semana ─────────────────────────────────────
function WeekMaterialCard() {
  const { week, range } = getWeekInfo()
  return (
    <div style={{
      background: 'linear-gradient(135deg, #1A3A8F 0%, #0d2b72 100%)',
      borderRadius: 16, padding: '20px',
      boxShadow: '0 8px 32px rgba(26,58,143,0.45)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Círculo decorativo */}
      <div style={{
        position: 'absolute', top: -50, right: -50,
        width: 180, height: 180, borderRadius: '50%',
        background: 'rgba(255,255,255,0.05)', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: -30, left: -30,
        width: 120, height: 120, borderRadius: '50%',
        background: 'rgba(255,255,255,0.04)', pointerEvents: 'none',
      }} />

      {/* Badge semana */}
      <div style={{ marginBottom: 12 }}>
        <span style={{
          background: 'rgba(255,255,255,0.15)',
          borderRadius: 999, padding: '3px 12px',
          fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700,
          color: 'rgba(255,255,255,0.9)', letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}>
          Semana {week} · {range}
        </span>
      </div>

      <div style={{
        fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 21,
        color: '#fff', letterSpacing: '0.03em', textTransform: 'uppercase',
        lineHeight: 1.1, marginBottom: 6,
      }}>
        Material de Difusión
      </div>
      <div style={{
        fontFamily: 'var(--font-body)', fontSize: 12,
        color: 'rgba(255,255,255,0.65)', marginBottom: 18,
      }}>
        Descarga las presentaciones y fichas para tu equipo
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {EQUIPOS.map((equipo) => (
          <motion.button
            key={equipo.id}
            whileTap={{ scale: equipo.spUrl ? 0.97 : 1 }}
            onClick={() => equipo.spUrl && window.open(equipo.spUrl, '_blank', 'noopener')}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: equipo.spUrl ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${equipo.spUrl ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.10)'}`,
              borderRadius: 10, padding: '11px 14px', cursor: equipo.spUrl ? 'pointer' : 'default',
              width: '100%', transition: 'background 0.2s',
            }}
          >
            <div style={{
              width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
              background: equipo.spUrl ? equipo.color : 'rgba(255,255,255,0.25)',
              boxShadow: equipo.spUrl ? `0 0 8px ${equipo.color}99` : 'none',
            }} />
            <span style={{
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14,
              color: equipo.spUrl ? '#fff' : 'rgba(255,255,255,0.35)',
              letterSpacing: '0.04em', textTransform: 'uppercase', flex: 1, textAlign: 'left',
            }}>
              {equipo.label}
            </span>
            {equipo.spUrl ? (
              <Download size={14} color="rgba(255,255,255,0.7)" />
            ) : (
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
                Por configurar
              </span>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  )
}

// ── Sección 2: Biblioteca ─────────────────────────────────────────────────
function BibliotecaCard() {
  const url = import.meta.env.VITE_SP_BIBLIOTECA_URL
  return (
    <motion.button
      whileTap={{ scale: url ? 0.98 : 1 }}
      onClick={() => url && window.open(url, '_blank', 'noopener')}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        width: '100%', background: 'var(--color-navy-mid)',
        border: '1px solid var(--color-border)', borderRadius: 14,
        padding: '16px 18px', cursor: url ? 'pointer' : 'default',
        textAlign: 'left',
      }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 10, flexShrink: 0,
        background: 'rgba(47,128,237,0.12)',
        border: '1px solid rgba(47,128,237,0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <BookOpen size={20} color="#2F80ED" />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15,
          color: 'var(--color-text-primary)', textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}>
          Biblioteca de Difusiones
        </div>
        <div style={{
          fontFamily: 'var(--font-body)', fontSize: 11,
          color: 'var(--color-text-muted)', marginTop: 2,
        }}>
          {url ? 'Archivo histórico de material del año' : 'Enlace por configurar en producción'}
        </div>
      </div>
      <ChevronRight size={18} color="var(--color-text-muted)" />
    </motion.button>
  )
}

// ── Sección 3: Formulario de Registro ────────────────────────────────────
function PillSelector({ options, value, onChange, color = '#1A52B8' }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {options.map((opt) => {
        const active = value === opt
        return (
          <motion.button
            key={opt}
            whileTap={{ scale: 0.95 }}
            onClick={() => onChange(opt)}
            style={{
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12,
              letterSpacing: '0.04em', textTransform: 'uppercase',
              padding: '6px 14px', borderRadius: 999, cursor: 'pointer',
              border: `1.5px solid ${active ? color : 'var(--color-border)'}`,
              background: active ? `${color}22` : 'transparent',
              color: active ? color : 'var(--color-text-secondary)',
              transition: 'all 0.15s',
            }}
          >
            {opt}
          </motion.button>
        )
      })}
    </div>
  )
}

function FormField({ icon, label, children }) {
  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8,
      }}>
        <span style={{ color: 'var(--color-text-muted)', display: 'flex' }}>{icon}</span>
        <span style={{
          fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700,
          color: 'var(--color-text-secondary)', letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}>
          {label}
        </span>
      </div>
      {children}
    </div>
  )
}

function TextInput({ value, onChange, placeholder, type = 'text' }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%', background: 'var(--color-surface)',
        border: '1px solid var(--color-border)', borderRadius: 10,
        padding: '10px 14px', outline: 'none',
        fontFamily: 'var(--font-body)', fontSize: 15,
        color: 'var(--color-text-primary)',
        boxSizing: 'border-box',
      }}
    />
  )
}

function FileItem({ file, onRemove }) {
  const isImage = file.type.startsWith('image/')
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      background: 'var(--color-surface)', border: '1px solid var(--color-border)',
      borderRadius: 10, padding: '10px 12px',
    }}>
      {isImage ? (
        <img
          src={URL.createObjectURL(file)}
          alt=""
          style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }}
        />
      ) : (
        <div style={{
          width: 36, height: 36, borderRadius: 6, flexShrink: 0,
          background: 'rgba(47,128,237,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Paperclip size={16} color="#2F80ED" />
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600,
          color: 'var(--color-text-primary)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {file.name}
        </div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--color-text-muted)' }}>
          {formatBytes(file.size)}
        </div>
      </div>
      <motion.button
        whileTap={{ scale: 0.88 }}
        onClick={onRemove}
        style={{
          background: 'rgba(235,87,87,0.12)', border: 'none', borderRadius: 6,
          padding: '4px 6px', cursor: 'pointer', display: 'flex', flexShrink: 0,
        }}
      >
        <X size={14} color="#EB5757" />
      </motion.button>
    </div>
  )
}

function RegistroForm() {
  const branch = useUserStore((s) => s.branch)
  const email  = useUserStore((s) => s.email)

  const [instalacion,   setInstalacion]   = useState(branch || '')
  const [equipo,        setEquipo]        = useState('')
  const [turno,         setTurno]         = useState('')
  const [fecha,         setFecha]         = useState(todayISO())
  const [participantes, setParticipantes] = useState('')
  const [files,         setFiles]         = useState([])
  const [status,        setStatus]        = useState('idle') // idle | uploading | success | error
  const [errorMsg,      setErrorMsg]      = useState('')
  const fileInputRef = useRef(null)

  const addFiles = (newFiles) => {
    const combined = [...files, ...Array.from(newFiles)]
    setFiles(combined.slice(0, MAX_FILES))
  }

  const removeFile = (idx) => setFiles((prev) => prev.filter((_, i) => i !== idx))

  const isValid = instalacion.trim() && equipo && turno && fecha && participantes

  const handleSubmit = async () => {
    if (!isValid) return
    setStatus('uploading')
    setErrorMsg('')
    try {
      await submitDifusion({ instalacion, equipo, turno, fecha, participantes, files, userEmail: email })
      setStatus('success')
    } catch (err) {
      setErrorMsg(err.message || 'Error al enviar el registro')
      setStatus('error')
    }
  }

  const handleReset = () => {
    setInstalacion(branch || '')
    setEquipo('')
    setTurno('')
    setFecha(todayISO())
    setParticipantes('')
    setFiles([])
    setStatus('idle')
    setErrorMsg('')
  }

  // ── Estado: éxito ────────────────────────────────────────────────────────
  if (status === 'success') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          background: 'var(--color-navy-mid)', border: '1px solid rgba(39,174,96,0.3)',
          borderRadius: 16, padding: '32px 20px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
          textAlign: 'center',
        }}
      >
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: 'rgba(39,174,96,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <CheckCircle size={28} color="#27AE60" />
        </div>
        <div style={{
          fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18,
          color: '#27AE60', textTransform: 'uppercase', letterSpacing: '0.05em',
        }}>
          Charla Registrada
        </div>
        <div style={{
          fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-text-secondary)',
          lineHeight: 1.5,
        }}>
          El registro de la charla en <strong>{instalacion}</strong> fue enviado
          exitosamente. {files.length > 0 && `Se adjuntaron ${files.length} archivo${files.length > 1 ? 's' : ''}.`}
        </div>

        {/* Aviso de validación pendiente */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 10,
          background: 'rgba(245,124,32,0.08)',
          border: '1px solid rgba(245,124,32,0.2)',
          borderRadius: 10, padding: '11px 13px',
          width: '100%', boxSizing: 'border-box', textAlign: 'left',
        }}>
          <ClipboardCheck size={15} color="var(--color-orange)" style={{ flexShrink: 0, marginTop: 1 }} />
          <span style={{
            fontFamily: 'var(--font-body)', fontSize: 11,
            color: 'rgba(255,165,50,0.85)', lineHeight: 1.5,
          }}>
            Tu registro está <strong>pendiente de validación</strong>. El equipo SSO lo revisará en los próximos días hábiles. Puedes consultar el estado en <strong>Perfil → Mis Documentos</strong>.
          </span>
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleReset}
          style={{
            marginTop: 4, background: 'var(--color-surface)',
            border: '1px solid var(--color-border)', borderRadius: 10,
            padding: '10px 24px', cursor: 'pointer',
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13,
            color: 'var(--color-text-secondary)', letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}
        >
          Registrar otra charla
        </motion.button>
      </motion.div>
    )
  }

  return (
    <div style={{
      background: 'var(--color-navy-mid)', border: '1px solid var(--color-border)',
      borderRadius: 16, padding: '20px',
    }}>
      {/* Header del formulario */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          background: 'rgba(245,124,32,0.12)',
          border: '1px solid rgba(245,124,32,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Megaphone size={18} color="var(--color-orange)" />
        </div>
        <div>
          <div style={{
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14,
            color: 'var(--color-text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em',
          }}>
            Registrar Charla
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--color-text-muted)' }}>
            Completa los datos de la charla realizada
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Instalación */}
        <FormField icon={<MapPin size={14} />} label="Instalación">
          <TextInput
            value={instalacion}
            onChange={setInstalacion}
            placeholder="Ej: CD Santiago, Planta Rancagua…"
          />
        </FormField>

        {/* Equipo */}
        <FormField icon={<Users size={14} />} label="Equipo">
          <PillSelector
            options={['Operaciones', 'Administración', 'Distribuidoras']}
            value={equipo}
            onChange={setEquipo}
            color="#1A52B8"
          />
        </FormField>

        {/* Turno */}
        <FormField icon={<Clock size={14} />} label="Turno">
          <PillSelector
            options={TURNOS}
            value={turno}
            onChange={setTurno}
            color="#F57C20"
          />
        </FormField>

        {/* Fecha y participantes en fila */}
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1.5 }}>
            <FormField icon={<Calendar size={14} />} label="Fecha">
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                style={{
                  width: '100%', background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)', borderRadius: 10,
                  padding: '10px 12px', outline: 'none',
                  fontFamily: 'var(--font-body)', fontSize: 14,
                  color: 'var(--color-text-primary)', boxSizing: 'border-box',
                  colorScheme: 'dark',
                }}
              />
            </FormField>
          </div>
          <div style={{ flex: 1 }}>
            <FormField icon={<Users size={14} />} label="Participantes">
              <input
                type="number"
                min="1"
                value={participantes}
                onChange={(e) => setParticipantes(e.target.value)}
                placeholder="Nº"
                style={{
                  width: '100%', background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)', borderRadius: 10,
                  padding: '10px 12px', outline: 'none',
                  fontFamily: 'var(--font-body)', fontSize: 14,
                  color: 'var(--color-text-primary)', boxSizing: 'border-box',
                }}
              />
            </FormField>
          </div>
        </div>

        {/* Adjuntar evidencia */}
        <FormField icon={<Paperclip size={14} />} label={`Evidencias (máx. ${MAX_FILES})`}>
          {files.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
              {files.map((file, idx) => (
                <FileItem key={idx} file={file} onRemove={() => removeFile(idx)} />
              ))}
            </div>
          )}

          {files.length < MAX_FILES && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                multiple
                style={{ display: 'none' }}
                onChange={(e) => addFiles(e.target.files)}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                {/* Tomar foto con cámara */}
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    const inp = document.createElement('input')
                    inp.type = 'file'
                    inp.accept = 'image/*'
                    inp.capture = 'environment'
                    inp.onchange = (e) => addFiles(e.target.files)
                    inp.click()
                  }}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    background: 'var(--color-surface)', border: '1px dashed var(--color-border)',
                    borderRadius: 10, padding: '11px 0', cursor: 'pointer',
                  }}
                >
                  <Camera size={16} color="var(--color-text-secondary)" />
                  <span style={{
                    fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600,
                    color: 'var(--color-text-secondary)',
                  }}>
                    Cámara
                  </span>
                </motion.button>

                {/* Adjuntar desde archivos */}
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    background: 'var(--color-surface)', border: '1px dashed var(--color-border)',
                    borderRadius: 10, padding: '11px 0', cursor: 'pointer',
                  }}
                >
                  <Paperclip size={16} color="var(--color-text-secondary)" />
                  <span style={{
                    fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600,
                    color: 'var(--color-text-secondary)',
                  }}>
                    Archivos
                  </span>
                </motion.button>
              </div>
              <div style={{
                fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--color-text-muted)',
                marginTop: 6, textAlign: 'center',
              }}>
                {files.length === 0
                  ? 'Fotos, capturas o PDF del registro de asistencia'
                  : `${files.length} de ${MAX_FILES} archivos · puedes agregar ${MAX_FILES - files.length} más`}
              </div>
            </>
          )}
        </FormField>

        {/* Error */}
        <AnimatePresence>
          {status === 'error' && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 8,
                background: 'rgba(235,87,87,0.10)',
                border: '1px solid rgba(235,87,87,0.25)',
                borderRadius: 10, padding: '10px 12px',
              }}
            >
              <AlertCircle size={15} color="#EB5757" style={{ flexShrink: 0, marginTop: 1 }} />
              <span style={{
                fontFamily: 'var(--font-body)', fontSize: 12,
                color: '#EB5757', lineHeight: 1.4,
              }}>
                {errorMsg}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Botón enviar */}
        <motion.button
          whileTap={{ scale: isValid && status !== 'uploading' ? 0.97 : 1 }}
          onClick={handleSubmit}
          disabled={!isValid || status === 'uploading'}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            width: '100%', height: 52,
            background: isValid ? 'var(--btn-primary)' : 'var(--color-surface)',
            border: 'none', borderRadius: 12, cursor: isValid ? 'pointer' : 'default',
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16,
            color: isValid ? '#fff' : 'var(--color-text-muted)',
            letterSpacing: '0.06em', textTransform: 'uppercase',
            boxShadow: isValid ? '0 4px 20px var(--btn-primary-shadow)' : 'none',
            transition: 'all 0.2s',
          }}
        >
          {status === 'uploading' ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
                style={{
                  width: 18, height: 18, borderRadius: '50%',
                  border: '2.5px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#fff',
                }}
              />
              Enviando…
            </>
          ) : (
            'Enviar Registro'
          )}
        </motion.button>

        {!isValid && (
          <div style={{
            fontFamily: 'var(--font-body)', fontSize: 11,
            color: 'var(--color-text-muted)', textAlign: 'center', marginTop: -8,
          }}>
            Completa instalación, equipo, turno, fecha y participantes para continuar
          </div>
        )}
      </div>
    </div>
  )
}

// ── Pantalla principal ─────────────────────────────────────────────────────
export default function DifusionesSSOScreen() {
  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex', flexDirection: 'column',
      background: 'var(--color-navy)',
    }}>
      <AppHeader title="Difusiones SSO" />

      <div style={{
        flex: 1,
        padding: '20px 16px',
        paddingBottom: 'calc(32px + env(safe-area-inset-bottom, 0px))',
        display: 'flex', flexDirection: 'column', gap: 14,
        maxWidth: 600, width: '100%', margin: '0 auto', boxSizing: 'border-box',
      }}>

        {/* ── 1. Material de la semana ─────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <WeekMaterialCard />
        </motion.div>

        {/* ── 2. Biblioteca ────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.08 }}
        >
          <BibliotecaCard />
        </motion.div>

        {/* Divisor */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
          <span style={{
            fontFamily: 'var(--font-body)', fontSize: 10,
            color: 'var(--color-text-muted)', letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}>
            Registro
          </span>
          <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
        </div>

        {/* ── 3. Formulario de registro ─────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
        >
          <RegistroForm />
        </motion.div>

      </div>
    </div>
  )
}
