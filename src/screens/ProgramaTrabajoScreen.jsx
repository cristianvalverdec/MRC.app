import { useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FolderOpen, ClipboardList, Search, Camera, Paperclip,
  FileText, X, CheckCircle2, ChevronDown, ChevronUp,
  CalendarDays, Megaphone,
} from 'lucide-react'
import AppHeader from '../components/layout/AppHeader'

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

// ── Componente de carga de foto + archivo ─────────────────────────────────
function UploadPanel({ title, accentColor, icon }) {
  const cameraRef = useRef(null)
  const fileRef   = useRef(null)

  const [photos, setPhotos]   = useState([])   // Array<{ name, url }>
  const [files, setFiles]     = useState([])    // Array<{ name, size }>
  const [saved, setSaved]     = useState(false)
  const [open, setOpen]       = useState(false)

  const handleCamera = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotos((prev) => [...prev, { name: file.name, url: URL.createObjectURL(file) }])
    setSaved(false)
  }

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const kb = (file.size / 1024).toFixed(0)
    const mb = (file.size / (1024 * 1024)).toFixed(1)
    setFiles((prev) => [...prev, { name: file.name, size: file.size > 1024 * 1024 ? `${mb} MB` : `${kb} KB` }])
    setSaved(false)
  }

  const removePhoto = (i) => setPhotos((prev) => prev.filter((_, idx) => idx !== i))
  const removeFile  = (i) => setFiles((prev) => prev.filter((_, idx) => idx !== i))

  const handleSave = () => {
    if (photos.length === 0 && files.length === 0) return
    setSaved(true)
  }

  const hasContent = photos.length > 0 || files.length > 0

  return (
    <div style={{
      background: 'var(--color-card)',
      border: `1px solid ${open ? accentColor + '55' : 'var(--color-border)'}`,
      borderRadius: 14, overflow: 'hidden',
      transition: 'border-color 0.2s',
    }}>
      {/* Header row */}
      <div
        onClick={() => setOpen((v) => !v)}
        style={{
          padding: '13px 16px',
          display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
          position: 'relative',
        }}
      >
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: 4, background: accentColor, borderRadius: '14px 0 0 14px',
        }} />
        <div style={{
          width: 38, height: 38, borderRadius: 9, background: accentColor,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, marginLeft: 8,
        }}>
          {icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>
            {title}
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--color-text-muted)', marginTop: 1 }}>
            {saved
              ? <span style={{ color: '#27AE60' }}>✓ Guardado ({photos.length} foto{photos.length !== 1 ? 's' : ''}{files.length > 0 ? `, ${files.length} archivo${files.length !== 1 ? 's' : ''}` : ''})</span>
              : hasContent
                ? `${photos.length} foto${photos.length !== 1 ? 's' : ''}${files.length > 0 ? `, ${files.length} archivo${files.length !== 1 ? 's' : ''}` : ''} adjunto${hasContent ? 's' : ''}`
                : 'Toca para adjuntar foto o archivo'}
          </div>
        </div>
        {open ? <ChevronUp size={16} color="var(--color-text-muted)" /> : <ChevronDown size={16} color="var(--color-text-muted)" />}
      </div>

      {/* Expandable content */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ height: 1, background: 'var(--color-border)' }} />

              {/* Botones de acción */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => cameraRef.current.click()}
                  style={{
                    flex: 1, height: 44,
                    background: 'rgba(245,124,32,0.12)',
                    border: '1px solid rgba(245,124,32,0.35)',
                    borderRadius: 10, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    fontFamily: 'var(--font-body)', fontSize: 13, color: '#F57C20', fontWeight: 600,
                  }}
                >
                  <Camera size={16} color="#F57C20" /> Tomar foto
                </button>
                <button
                  onClick={() => fileRef.current.click()}
                  style={{
                    flex: 1, height: 44,
                    background: 'rgba(47,128,237,0.10)',
                    border: '1px solid rgba(47,128,237,0.30)',
                    borderRadius: 10, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    fontFamily: 'var(--font-body)', fontSize: 13, color: '#2F80ED', fontWeight: 600,
                  }}
                >
                  <Paperclip size={16} color="#2F80ED" /> Adjuntar
                </button>
              </div>

              {/* Inputs ocultos */}
              <input
                ref={cameraRef}
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: 'none' }}
                onChange={handleCamera}
              />
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,image/*,.zip,.rar"
                style={{ display: 'none' }}
                onChange={handleFile}
              />

              {/* Fotos capturadas */}
              {photos.length > 0 && (
                <div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    Fotografías
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {photos.map((ph, i) => (
                      <div key={i} style={{ position: 'relative' }}>
                        <img
                          src={ph.url}
                          alt={ph.name}
                          style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--color-border)' }}
                        />
                        <button
                          onClick={() => removePhoto(i)}
                          style={{
                            position: 'absolute', top: -6, right: -6,
                            width: 20, height: 20, borderRadius: '50%',
                            background: 'var(--color-danger)', border: 'none',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          <X size={11} color="#fff" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Archivos adjuntos */}
              {files.length > 0 && (
                <div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    Archivos adjuntos
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {files.map((f, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        background: 'rgba(47,128,237,0.07)',
                        border: '1px solid rgba(47,128,237,0.2)',
                        borderRadius: 8, padding: '8px 10px',
                      }}>
                        <FileText size={14} color="#2F80ED" />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.name}</div>
                          <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--color-text-muted)' }}>{f.size}</div>
                        </div>
                        <button
                          onClick={() => removeFile(i)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex' }}
                        >
                          <X size={13} color="var(--color-text-muted)" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Botón guardar */}
              {hasContent && !saved && (
                <button
                  onClick={handleSave}
                  style={{
                    width: '100%', height: 42,
                    background: accentColor, border: 'none', borderRadius: 10,
                    cursor: 'pointer', fontFamily: 'var(--font-display)',
                    fontSize: 14, fontWeight: 700, color: '#fff',
                    letterSpacing: '0.05em', textTransform: 'uppercase',
                  }}
                >
                  Guardar registro
                </button>
              )}

              {saved && (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '10px 0',
                  fontFamily: 'var(--font-body)', fontSize: 13, color: '#27AE60',
                }}>
                  <CheckCircle2 size={16} color="#27AE60" /> Registro guardado correctamente
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Main Screen ───────────────────────────────────────────────────────────
export default function ProgramaTrabajoScreen() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const instalacion = searchParams.get('instalacion') || 'Instalación'

  const now   = new Date()
  const mes   = MESES[now.getMonth()]
  const anio  = now.getFullYear()

  // URL carpeta SharePoint — reemplazar con la URL real de Agrosuper
  const spFolderUrl = `https://agrosuper.sharepoint.com/sites/MRC/Shared%20Documents/Forms/AllItems.aspx`

  const actionCards = [
    {
      id: 'pauta',
      icon: <ClipboardList size={20} color="#fff" />,
      label: 'Pautas de Verificación CPHS',
      sublabel: 'Pauta de Reglas de Oro — modo representante CPHS',
      accentColor: '#1A52B8',
      onClick: () => navigate(`/form/pauta-verificacion-reglas-oro?cphs=true&instalacion=${encodeURIComponent(instalacion)}`),
    },
    {
      id: 'inspeccion',
      icon: <Search size={20} color="#fff" />,
      label: 'Inspección Simple CPHS',
      sublabel: 'Inspección de equipos y espacios — modo representante CPHS',
      accentColor: '#F57C20',
      onClick: () => navigate(`/form/inspeccion-simple?cphs=true&instalacion=${encodeURIComponent(instalacion)}`),
    },
  ]

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--color-navy)' }}>
      <AppHeader title="Programa de Trabajo" />

      <div className="content-col" style={{ flex: 1, padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Banner instalación + mes */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'linear-gradient(135deg, #B85C00 0%, #F57C20 100%)',
            borderRadius: 14, padding: '14px 18px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 700, color: '#fff' }}>
              {instalacion}
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.78)', marginTop: 2 }}>
              Programa CPHS · {mes} {anio}
            </div>
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.18)', borderRadius: 8,
            padding: '4px 10px', fontFamily: 'var(--font-body)',
            fontSize: 11, fontWeight: 700, color: '#fff', letterSpacing: '0.06em',
          }}>
            CPHS
          </div>
        </motion.div>

        {/* Acceso carpeta SharePoint */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          <div style={{
            fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--color-text-muted)',
            letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8,
          }}>
            Documentos del mes
          </div>
          <a
            href={spFolderUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: 'none' }}
          >
            <div style={{
              background: 'rgba(39,174,96,0.1)',
              border: '1.5px solid rgba(39,174,96,0.35)',
              borderRadius: 14, padding: '14px 18px',
              display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer',
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 11,
                background: '#27AE60',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <FolderOpen size={22} color="#fff" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>
                  Carpeta SharePoint — {mes} {anio}
                </div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                  Descargar archivos del programa mensual
                </div>
              </div>
              <div style={{
                background: '#27AE60', borderRadius: 8,
                padding: '4px 10px', fontFamily: 'var(--font-body)',
                fontSize: 11, fontWeight: 700, color: '#fff',
              }}>
                ABRIR
              </div>
            </div>
          </a>
        </motion.div>

        {/* Formularios CPHS */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
          <div style={{
            fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--color-text-muted)',
            letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8,
          }}>
            Actividades de verificación
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {actionCards.map((card, i) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.18 + i * 0.07 }}
              >
                <div
                  onClick={card.onClick}
                  style={{
                    background: 'var(--color-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 14, padding: '13px 16px',
                    display: 'flex', alignItems: 'center', gap: 12,
                    cursor: 'pointer', position: 'relative', overflow: 'hidden',
                  }}
                >
                  <div style={{
                    position: 'absolute', left: 0, top: 0, bottom: 0,
                    width: 4, background: card.accentColor, borderRadius: '14px 0 0 14px',
                  }} />
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: card.accentColor,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, marginLeft: 8,
                  }}>
                    {card.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>
                      {card.label}
                    </div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-text-muted)', marginTop: 1 }}>
                      {card.sublabel}
                    </div>
                  </div>
                  <div style={{
                    background: card.accentColor + '22',
                    border: `1px solid ${card.accentColor}55`,
                    borderRadius: 6, padding: '3px 8px',
                    fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700,
                    color: card.accentColor, whiteSpace: 'nowrap',
                  }}>
                    INICIAR
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Registro de actividades — carga foto/archivo */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <div style={{
            fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--color-text-muted)',
            letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8,
          }}>
            Registro de actividades
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <UploadPanel
              title="Actas de Reunión"
              accentColor="#7B3FE4"
              icon={<CalendarDays size={18} color="#fff" />}
            />
            <UploadPanel
              title="Charlas CPHS"
              accentColor="#0EA5E9"
              icon={<Megaphone size={18} color="#fff" />}
            />
          </div>
        </motion.div>

      </div>
    </div>
  )
}
