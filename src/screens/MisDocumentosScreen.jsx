// ── MisDocumentosScreen.jsx ────────────────────────────────────────────────────
// Vista del usuario: historial de sus registros enviados con estado de validación.
//
// Ruta: /unit/:unitType/mis-documentos (todos los usuarios autenticados)
//
// Pestañas: Pendientes | Aprobados | Rechazados
// Se carga desde validacionStore (persistido en localStorage entre sesiones).
// Al montar, actualiza desde SharePoint si los datos tienen más de 5 min.

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Clock, CheckCircle, XCircle, FileText, Paperclip,
  Inbox, AlertCircle, RefreshCw, MapPin,
} from 'lucide-react'
import { useState } from 'react'
import AppHeader from '../components/layout/AppHeader'
import useUserStore from '../store/userStore'
import useValidacionStore from '../store/validacionStore'
import { IS_DEV_MODE } from '../services/sharepointData'

const POLL_INTERVAL = 5 * 60 * 1000  // 5 min

// ── Helpers ───────────────────────────────────────────────────────────────────

function tiempoRelativo(isoStr) {
  if (!isoStr) return ''
  const diff = Date.now() - new Date(isoStr).getTime()
  const min  = Math.floor(diff / 60000)
  if (min < 1)  return 'Ahora'
  if (min < 60) return `Hace ${min} min`
  const hrs = Math.floor(min / 60)
  if (hrs < 24) return `Hace ${hrs} h`
  const dias = Math.floor(hrs / 24)
  if (dias < 7) return `Hace ${dias} día${dias > 1 ? 's' : ''}`
  return new Date(isoStr).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })
}

const ESTADO_CONFIG = {
  pendiente:  {
    color: '#F57C20',
    bg:    'rgba(245,124,32,0.10)',
    border: 'rgba(245,124,32,0.25)',
    label: 'En revisión',
    Icon:  Clock,
    texto: 'Enviado y esperando revisión del equipo de SSO.',
  },
  aprobado:   {
    color: '#27AE60',
    bg:    'rgba(39,174,96,0.10)',
    border: 'rgba(39,174,96,0.25)',
    label: 'Aprobado',
    Icon:  CheckCircle,
    texto: 'Registro validado oficialmente.',
  },
  rechazado:  {
    color: '#EB5757',
    bg:    'rgba(235,87,87,0.10)',
    border: 'rgba(235,87,87,0.25)',
    label: 'Rechazado',
    Icon:  XCircle,
    texto: 'El registro fue rechazado. Revisa el motivo y vuelve a enviar.',
  },
}

const TIPO_LABEL = {
  difusion:   'Difusión SSO',
  formulario: 'Formulario',
  documento:  'Documento',
}

// ── Card de documento ─────────────────────────────────────────────────────────

function DocumentoCard({ registro }) {
  const [expandido, setExpandido] = useState(false)
  const cfg = ESTADO_CONFIG[registro.estado] || ESTADO_CONFIG.pendiente
  const { Icon } = cfg

  const archivos = registro.archivoUrl
    ? registro.archivoUrl.split('\n').filter(Boolean)
    : []

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: 'var(--color-navy-mid)',
        border: `1px solid ${cfg.border}`,
        borderLeft: `3px solid ${cfg.color}`,
        borderRadius: 12, overflow: 'hidden',
      }}
    >
      {/* Cabecera */}
      <div
        style={{ padding: '14px', cursor: 'pointer' }}
        onClick={() => setExpandido(v => !v)}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          {/* Ícono de estado */}
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: cfg.bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon size={18} color={cfg.color} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Badge de estado */}
            <span style={{
              display: 'inline-block',
              background: cfg.bg, color: cfg.color,
              fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700,
              padding: '2px 8px', borderRadius: 999, letterSpacing: '0.06em',
              textTransform: 'uppercase', marginBottom: 5,
            }}>
              {cfg.label}
            </span>

            {/* Nombre del documento */}
            <div style={{
              fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600,
              color: 'var(--color-text-primary)', lineHeight: 1.3, marginBottom: 6,
            }}>
              {registro.nombreDocumento || TIPO_LABEL[registro.tipoRegistro] || 'Registro'}
            </div>

            {/* Metadatos */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {registro.instalacionOrigen && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--color-text-muted)' }}>
                  <MapPin size={10} />
                  {registro.instalacionOrigen}
                </span>
              )}
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--color-text-muted)' }}>
                {tiempoRelativo(registro.fechaSubida)}
              </span>
              {archivos.length > 0 && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-body)', fontSize: 11, color: '#2F80ED' }}>
                  <Paperclip size={10} />
                  {archivos.length} archivo{archivos.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Detalle expandido */}
      <AnimatePresence>
        {expandido && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0 14px 14px', borderTop: '1px solid var(--color-border)' }}>
              <div style={{ height: 12 }} />

              {/* Texto de estado */}
              <div style={{
                background: cfg.bg,
                border: `1px solid ${cfg.border}`,
                borderRadius: 8, padding: '10px 12px', marginBottom: 12,
                fontFamily: 'var(--font-body)', fontSize: 12,
                color: cfg.color, lineHeight: 1.5,
              }}>
                {cfg.texto}
              </div>

              {/* Motivo de rechazo */}
              {registro.estado === 'rechazado' && registro.observaciones && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Motivo de rechazo
                  </div>
                  <div style={{
                    background: 'rgba(235,87,87,0.08)',
                    border: '1px solid rgba(235,87,87,0.2)',
                    borderRadius: 8, padding: '10px 12px',
                    fontFamily: 'var(--font-body)', fontSize: 13,
                    color: '#EB5757', lineHeight: 1.5,
                  }}>
                    {registro.observaciones}
                  </div>
                </div>
              )}

              {/* Comentarios de aprobación */}
              {registro.estado === 'aprobado' && registro.observaciones && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Comentarios del validador
                  </div>
                  <div style={{
                    background: 'rgba(39,174,96,0.08)',
                    border: '1px solid rgba(39,174,96,0.2)',
                    borderRadius: 8, padding: '10px 12px',
                    fontFamily: 'var(--font-body)', fontSize: 13,
                    color: 'rgba(255,255,255,0.7)', lineHeight: 1.5,
                  }}>
                    {registro.observaciones}
                  </div>
                </div>
              )}

              {/* Validador */}
              {registro.validadoPor && (
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 10 }}>
                  Revisado por <strong style={{ color: 'var(--color-text-secondary)' }}>{registro.validadoPor}</strong>
                  {registro.fechaValidacion && ` · ${tiempoRelativo(registro.fechaValidacion)}`}
                </div>
              )}

              {/* Archivos */}
              {archivos.length > 0 && (
                <div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Archivos adjuntos
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {archivos.map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          background: 'rgba(47,128,237,0.08)',
                          border: '1px solid rgba(47,128,237,0.2)',
                          borderRadius: 8, padding: '8px 12px',
                          fontFamily: 'var(--font-body)', fontSize: 12, color: '#2F80ED',
                          textDecoration: 'none',
                        }}
                      >
                        <Paperclip size={13} />
                        Ver archivo {i + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Pantalla principal ─────────────────────────────────────────────────────────

const TABS = [
  { id: 'todos',      label: 'Todos'     },
  { id: 'pendiente',  label: 'Pendientes' },
  { id: 'aprobado',   label: 'Aprobados'  },
  { id: 'rechazado',  label: 'Rechazados' },
]

export default function MisDocumentosScreen() {
  const { email, isAuthenticated } = useUserStore()
  const {
    misValidaciones, loading, error, ultimaSync,
    cargarMisValidaciones, cargarMock, clearError,
  } = useValidacionStore()

  const [tabActiva, setTabActiva] = useState('todos')

  const cargar = async () => {
    if (IS_DEV_MODE) {
      cargarMock()
      return
    }
    if (!email) return
    await cargarMisValidaciones(email)
  }

  // Carga inicial (respeta caché de 5 min igual que notificaciones)
  useEffect(() => {
    if (!isAuthenticated && !IS_DEV_MODE) return
    const ahora   = Date.now()
    const ultimaMs = ultimaSync ? new Date(ultimaSync).getTime() : 0
    if (ahora - ultimaMs > POLL_INTERVAL) cargar()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Filtrar por tab
  const listaFiltrada = tabActiva === 'todos'
    ? misValidaciones
    : misValidaciones.filter(v => v.estado === tabActiva)

  const contadores = {
    todos:     misValidaciones.length,
    pendiente: misValidaciones.filter(v => v.estado === 'pendiente').length,
    aprobado:  misValidaciones.filter(v => v.estado === 'aprobado').length,
    rechazado: misValidaciones.filter(v => v.estado === 'rechazado').length,
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--color-navy)' }}>
      <AppHeader title="Mis Documentos" />

      <div style={{
        flex: 1, padding: '16px 16px 48px',
        paddingBottom: 'calc(48px + env(safe-area-inset-bottom, 0px))',
        overflowY: 'auto', maxWidth: 'var(--content-max-w)', width: '100%', margin: '0 auto',
        boxSizing: 'border-box',
      }}>

        {/* ── Descripción ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'rgba(47,128,237,0.08)',
            border: '1px solid rgba(47,128,237,0.2)',
            borderRadius: 12, padding: '12px 14px', marginBottom: 16,
            display: 'flex', alignItems: 'flex-start', gap: 10,
          }}
        >
          <FileText size={16} color="#2F80ED" style={{ flexShrink: 0, marginTop: 1 }} />
          <span style={{
            fontFamily: 'var(--font-body)', fontSize: 12,
            color: 'rgba(255,255,255,0.6)', lineHeight: 1.5,
          }}>
            Aquí puedes revisar el estado de los registros que has enviado. El equipo de SSO los valida dentro de los próximos días hábiles.
          </span>
        </motion.div>

        {/* ── Botón actualizar ── */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={cargar}
          disabled={loading}
          style={{
            width: '100%', boxSizing: 'border-box',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 10, padding: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            color: 'rgba(255,255,255,0.4)',
            fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700,
            cursor: 'pointer', letterSpacing: '0.06em', marginBottom: 16,
            opacity: loading ? 0.5 : 1,
          }}
        >
          <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          {loading ? 'ACTUALIZANDO...' : 'ACTUALIZAR'}
        </motion.button>

        {/* ── Tabs ── */}
        <div style={{
          display: 'flex', gap: 4,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12, padding: '4px', marginBottom: 16,
        }}>
          {TABS.map(tab => {
            const activa = tabActiva === tab.id
            const count  = contadores[tab.id]
            return (
              <button
                key={tab.id}
                onClick={() => setTabActiva(tab.id)}
                style={{
                  flex: 1, padding: '8px 4px', borderRadius: 8,
                  background: activa ? 'rgba(255,255,255,0.1)' : 'transparent',
                  border: 'none', cursor: 'pointer',
                  fontFamily: 'var(--font-display)', fontSize: 10,
                  fontWeight: activa ? 700 : 400,
                  color: activa ? '#fff' : 'rgba(255,255,255,0.35)',
                  letterSpacing: '0.03em',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                  transition: 'all 0.15s',
                }}
              >
                <span>{tab.label}</span>
                {count > 0 && (
                  <span style={{
                    background:
                      tab.id === 'pendiente' ? '#F57C20' :
                      tab.id === 'aprobado'  ? '#27AE60' :
                      tab.id === 'rechazado' ? '#EB5757' :
                      'rgba(255,255,255,0.3)',
                    color: '#fff', borderRadius: 999,
                    fontFamily: 'var(--font-body)', fontSize: 9, fontWeight: 700,
                    padding: '1px 5px', lineHeight: 1.4,
                    minWidth: 16, textAlign: 'center',
                  }}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* ── Error ── */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{
                background: 'rgba(235,87,87,0.1)', border: '1px solid rgba(235,87,87,0.25)',
                borderRadius: 10, padding: '12px 14px', marginBottom: 14,
                fontFamily: 'var(--font-body)', fontSize: 12, color: '#EB5757',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertCircle size={13} />
                {error}
              </span>
              <button onClick={clearError} style={{ background: 'none', border: 'none', color: '#EB5757', cursor: 'pointer', fontSize: 16 }}>×</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Lista de documentos ── */}
        {loading && listaFiltrada.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 40, gap: 10 }}>
            <FileText size={28} color="rgba(255,255,255,0.12)" />
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
              Cargando registros...
            </span>
          </div>
        ) : listaFiltrada.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 40, gap: 12 }}>
            <Inbox size={36} color="rgba(255,255,255,0.12)" />
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'rgba(255,255,255,0.3)', textAlign: 'center', maxWidth: 280 }}>
              {tabActiva === 'todos'
                ? 'Aún no tienes registros enviados. Comienza cargando una difusión SSO.'
                : `No tienes registros ${tabActiva === 'pendiente' ? 'pendientes de revisión' : tabActiva === 'aprobado' ? 'aprobados' : 'rechazados'}.`}
            </span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {listaFiltrada.map(registro => (
              <DocumentoCard key={registro.id} registro={registro} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
