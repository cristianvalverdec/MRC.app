// ── ValidacionAdminScreen.jsx ──────────────────────────────────────────────────
// Panel administrativo de validación de documentos y registros.
//
// Acceso: solo role === 'admin'
// Ruta:  /admin/validaciones
//
// Pestañas: Pendientes | Aprobados | Rechazados | Todos
// Acciones: Aprobar (optimistic) / Rechazar (modal con motivo obligatorio)
// Polling: recarga pendientes cada 5 min (misma estrategia que useNotifications)

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ClipboardCheck, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp,
  Paperclip, User, MapPin, Calendar, Users, RefreshCw, X, AlertCircle,
  FileText, Inbox,
} from 'lucide-react'
import AppHeader from '../components/layout/AppHeader'
import useUserStore from '../store/userStore'
import useValidacionStore from '../store/validacionStore'
import { IS_DEV_MODE } from '../services/sharepointData'

const POLL_INTERVAL = 5 * 60 * 1000  // 5 min — misma cadencia que notificaciones

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
  pendiente:  { color: '#F57C20', bg: 'rgba(245,124,32,0.12)',  label: 'Pendiente',  icon: Clock },
  aprobado:   { color: '#27AE60', bg: 'rgba(39,174,96,0.12)',   label: 'Aprobado',   icon: CheckCircle },
  rechazado:  { color: '#EB5757', bg: 'rgba(235,87,87,0.12)',   label: 'Rechazado',  icon: XCircle },
}

const TIPO_LABEL = {
  difusion:  'Difusión SSO',
  formulario: 'Formulario',
  documento:  'Documento',
}

// ── Modal de rechazo ──────────────────────────────────────────────────────────

function ModalRechazo({ registro, onConfirmar, onCancelar, procesando }) {
  const [motivo, setMotivo] = useState('')
  const [localError, setLocalError] = useState('')

  const handleConfirmar = () => {
    if (!motivo.trim()) {
      setLocalError('El motivo de rechazo es obligatorio')
      return
    }
    setLocalError('')
    onConfirmar(motivo.trim())
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}
      onClick={e => { if (e.target === e.currentTarget) onCancelar() }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 10 }}
        style={{
          background: '#1B2A4A',
          border: '1px solid rgba(235,87,87,0.3)',
          borderRadius: 16, padding: '24px 20px',
          width: '100%', maxWidth: 420,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <XCircle size={18} color="#EB5757" />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: '#fff' }}>
              Rechazar registro
            </span>
          </div>
          <button
            onClick={onCancelar}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: 4 }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Nombre del documento */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 8, padding: '10px 12px', marginBottom: 16,
        }}>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Registro
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>
            {registro?.nombreDocumento || 'Sin nombre'}
          </div>
        </div>

        {/* Motivo */}
        <div style={{ marginBottom: 16 }}>
          <label style={{
            display: 'block',
            fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.5)',
            marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            Motivo de rechazo <span style={{ color: '#EB5757' }}>*</span>
          </label>
          <textarea
            value={motivo}
            onChange={e => { setMotivo(e.target.value); setLocalError('') }}
            placeholder="Describe el motivo del rechazo para que el usuario pueda corregir el registro..."
            rows={4}
            maxLength={500}
            autoFocus
            style={{
              width: '100%', boxSizing: 'border-box', resize: 'vertical',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 10, padding: '10px 12px', color: '#fff',
              fontFamily: 'var(--font-body)', fontSize: 13, outline: 'none',
              lineHeight: 1.5,
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>
              {motivo.length}/500
            </span>
          </div>
        </div>

        {/* Error */}
        {localError && (
          <div style={{
            background: 'rgba(235,87,87,0.1)', border: '1px solid rgba(235,87,87,0.25)',
            borderRadius: 8, padding: '8px 12px', marginBottom: 12,
            fontFamily: 'var(--font-body)', fontSize: 12, color: '#EB5757',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <AlertCircle size={13} />
            {localError}
          </div>
        )}

        {/* Botones */}
        <div style={{ display: 'flex', gap: 10 }}>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onCancelar}
            disabled={procesando}
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 10, padding: '12px', color: 'rgba(255,255,255,0.5)',
              fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700,
              cursor: 'pointer', letterSpacing: '0.04em',
            }}
          >
            CANCELAR
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleConfirmar}
            disabled={procesando || !motivo.trim()}
            style={{
              flex: 2,
              background: procesando || !motivo.trim() ? 'rgba(235,87,87,0.3)' : 'rgba(235,87,87,0.85)',
              border: 'none',
              borderRadius: 10, padding: '12px', color: '#fff',
              fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700,
              cursor: procesando || !motivo.trim() ? 'not-allowed' : 'pointer',
              letterSpacing: '0.04em',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              opacity: procesando || !motivo.trim() ? 0.7 : 1,
            }}
          >
            <XCircle size={14} />
            {procesando ? 'RECHAZANDO...' : 'CONFIRMAR RECHAZO'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Card de validación ─────────────────────────────────────────────────────────

function ValidacionCard({ registro, onAprobar, onRechazar, aprobando, rechazando }) {
  const [expandido, setExpandido] = useState(false)
  const cfg = ESTADO_CONFIG[registro.estado] || ESTADO_CONFIG.pendiente
  const IconEstado = cfg.icon
  const esPendiente = registro.estado === 'pendiente'

  const archivos = registro.archivoUrl
    ? registro.archivoUrl.split('\n').filter(Boolean)
    : []

  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: `1px solid rgba(255,255,255,0.08)`,
      borderLeft: `3px solid ${cfg.color}`,
      borderRadius: 12, overflow: 'hidden',
    }}>
      {/* Cabecera clickeable */}
      <div
        style={{ padding: '12px 14px', cursor: 'pointer' }}
        onClick={() => setExpandido(v => !v)}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Nombre del documento */}
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700,
              color: '#fff', marginBottom: 5,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {registro.nombreDocumento || 'Sin nombre'}
            </div>

            {/* Badges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
              {/* Tipo */}
              <span style={{
                background: 'rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.5)',
                fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600,
                padding: '2px 7px', borderRadius: 999,
                textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>
                {TIPO_LABEL[registro.tipoRegistro] || registro.tipoRegistro}
              </span>

              {/* Estado */}
              <span style={{
                background: cfg.bg, color: cfg.color,
                fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700,
                padding: '2px 8px', borderRadius: 999,
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                <IconEstado size={9} />
                {cfg.label}
              </span>

              {/* Archivos */}
              {archivos.length > 0 && (
                <span style={{
                  background: 'rgba(47,128,237,0.12)', color: '#2F80ED',
                  fontFamily: 'var(--font-body)', fontSize: 10,
                  padding: '2px 7px', borderRadius: 999,
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  <Paperclip size={9} />
                  {archivos.length} archivo{archivos.length > 1 ? 's' : ''}
                </span>
              )}
            </div>

            {/* Metadatos */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                <User size={10} />
                {registro.subidoPor || '—'}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                <MapPin size={10} />
                {registro.instalacionOrigen || '—'}
              </span>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
                {tiempoRelativo(registro.fechaSubida)}
              </span>
            </div>
          </div>

          <div style={{ color: 'rgba(255,255,255,0.3)', marginTop: 2, flexShrink: 0 }}>
            {expandido ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
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
            <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>

              {/* Archivos adjuntos */}
              {archivos.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Archivos adjuntos
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {archivos.map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'flex', alignItems: 'center', gap: 7,
                          background: 'rgba(47,128,237,0.08)',
                          border: '1px solid rgba(47,128,237,0.2)',
                          borderRadius: 8, padding: '7px 10px',
                          fontFamily: 'var(--font-body)', fontSize: 12, color: '#2F80ED',
                          textDecoration: 'none',
                        }}
                      >
                        <Paperclip size={12} />
                        Ver archivo {i + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Observaciones (si fue validado) */}
              {registro.observaciones && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {registro.estado === 'rechazado' ? 'Motivo de rechazo' : 'Observaciones'}
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-body)', fontSize: 13,
                    color: registro.estado === 'rechazado' ? '#EB5757' : 'rgba(255,255,255,0.6)',
                    lineHeight: 1.5,
                  }}>
                    {registro.observaciones}
                  </div>
                </div>
              )}

              {/* Validador (si fue validado) */}
              {registro.validadoPor && (
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.25)', marginBottom: 12 }}>
                  Validado por {registro.validadoPor} · {tiempoRelativo(registro.fechaValidacion)}
                </div>
              )}

              {/* Acciones (solo si está pendiente) */}
              {esPendiente && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={() => onAprobar(registro)}
                    disabled={aprobando || rechazando}
                    style={{
                      flex: 1,
                      background: aprobando ? 'rgba(39,174,96,0.15)' : 'rgba(39,174,96,0.85)',
                      border: 'none', borderRadius: 10,
                      padding: '11px 0', color: '#fff',
                      fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700,
                      cursor: aprobando || rechazando ? 'not-allowed' : 'pointer',
                      letterSpacing: '0.04em',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                      opacity: aprobando || rechazando ? 0.65 : 1,
                    }}
                  >
                    <CheckCircle size={14} />
                    {aprobando ? 'APROBANDO...' : 'APROBAR'}
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={() => onRechazar(registro)}
                    disabled={aprobando || rechazando}
                    style={{
                      flex: 1,
                      background: 'rgba(235,87,87,0.12)',
                      border: '1px solid rgba(235,87,87,0.3)',
                      borderRadius: 10, padding: '11px 0', color: '#EB5757',
                      fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700,
                      cursor: aprobando || rechazando ? 'not-allowed' : 'pointer',
                      letterSpacing: '0.04em',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                      opacity: aprobando || rechazando ? 0.65 : 1,
                    }}
                  >
                    <XCircle size={14} />
                    {rechazando ? 'RECHAZANDO...' : 'RECHAZAR'}
                  </motion.button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Pantalla principal ─────────────────────────────────────────────────────────

const TABS = [
  { id: 'pendientes',  label: 'Pendientes' },
  { id: 'aprobados',   label: 'Aprobados'  },
  { id: 'rechazados',  label: 'Rechazados' },
  { id: 'todos',       label: 'Todos'      },
]

export default function ValidacionAdminScreen() {
  const { email, role } = useUserStore()
  const {
    todasValidaciones, loadingAdmin, error,
    cargarTodas, cargarMock, aprobar, rechazar, clearError,
  } = useValidacionStore()

  const [tabActiva,      setTabActiva]      = useState('pendientes')
  const [aprobandoId,    setAprobandoId]    = useState(null)
  const [modalRechazo,   setModalRechazo]   = useState(null) // registro o null
  const [rechazandoId,   setRechazandoId]   = useState(null)
  const [exito,          setExito]          = useState('')
  const timerRef = useRef(null)

  // Guard de admin
  const esAdmin = role === 'admin' || IS_DEV_MODE

  const cargar = useCallback(async () => {
    if (IS_DEV_MODE) {
      cargarMock()
      return
    }
    await cargarTodas()
  }, [cargarTodas, cargarMock])

  // Carga inicial + polling cada 5 min
  useEffect(() => {
    cargar()
    timerRef.current = setInterval(cargar, POLL_INTERVAL)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') cargar()
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      clearInterval(timerRef.current)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [cargar])

  // Filtrar por tab
  const listaFiltrada = (() => {
    switch (tabActiva) {
      case 'pendientes':  return todasValidaciones.filter(v => v.estado === 'pendiente')
      case 'aprobados':   return todasValidaciones.filter(v => v.estado === 'aprobado')
      case 'rechazados':  return todasValidaciones.filter(v => v.estado === 'rechazado')
      default:            return todasValidaciones
    }
  })()

  const contadores = {
    pendientes:  todasValidaciones.filter(v => v.estado === 'pendiente').length,
    aprobados:   todasValidaciones.filter(v => v.estado === 'aprobado').length,
    rechazados:  todasValidaciones.filter(v => v.estado === 'rechazado').length,
    todos:       todasValidaciones.length,
  }

  const handleAprobar = async (registro) => {
    setAprobandoId(registro.id)
    try {
      await aprobar(registro.id, email, '')
      setExito(`✅ Registro aprobado y notificado a ${registro.subidoPor}`)
      setTimeout(() => setExito(''), 3500)
    } catch (err) {
      console.error('[ValidacionAdmin] aprobar error:', err)
    } finally {
      setAprobandoId(null)
    }
  }

  const handleAbrirRechazo = (registro) => setModalRechazo(registro)
  const handleCerrarRechazo = () => { setModalRechazo(null); setRechazandoId(null) }

  const handleConfirmarRechazo = async (motivo) => {
    if (!modalRechazo) return
    setRechazandoId(modalRechazo.id)
    try {
      await rechazar(modalRechazo.id, email, motivo)
      setExito(`❌ Registro rechazado. Se notificó a ${modalRechazo.subidoPor}`)
      setTimeout(() => setExito(''), 3500)
      setModalRechazo(null)
    } catch (err) {
      console.error('[ValidacionAdmin] rechazar error:', err)
    } finally {
      setRechazandoId(null)
    }
  }

  if (!esAdmin) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--color-navy)' }}>
        <AppHeader title="Validaciones" />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, padding: '24px' }}>
          <AlertCircle size={40} color="rgba(255,255,255,0.15)" />
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'rgba(255,255,255,0.35)', textAlign: 'center' }}>
            Acceso restringido a administradores
          </span>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--color-navy)' }}>
      <AppHeader title="Validaciones de Registros" />

      <div className="content-col" style={{ flex: 1, padding: '16px 16px 48px', overflowY: 'auto' }}>

        {/* ── Resumen KPIs ── */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {[
            { label: 'Pendientes', valor: contadores.pendientes, color: '#F57C20' },
            { label: 'Aprobados',  valor: contadores.aprobados,  color: '#27AE60' },
            { label: 'Rechazados', valor: contadores.rechazados, color: '#EB5757' },
          ].map(stat => (
            <div
              key={stat.label}
              style={{
                flex: 1, background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12, padding: '12px 10px', textAlign: 'center',
              }}
            >
              <div style={{
                fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800,
                color: stat.color, lineHeight: 1,
              }}>
                {loadingAdmin ? '–' : stat.valor}
              </div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* ── Botón refrescar ── */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={cargar}
          disabled={loadingAdmin}
          style={{
            width: '100%', boxSizing: 'border-box',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10, padding: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            color: 'rgba(255,255,255,0.4)',
            fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700,
            cursor: 'pointer', letterSpacing: '0.06em', marginBottom: 16,
            opacity: loadingAdmin ? 0.5 : 1,
          }}
        >
          <RefreshCw size={13} style={{ animation: loadingAdmin ? 'spin 1s linear infinite' : 'none' }} />
          {loadingAdmin ? 'ACTUALIZANDO...' : 'ACTUALIZAR'}
        </motion.button>

        {/* ── Tabs ── */}
        <div style={{
          display: 'flex', gap: 6,
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
                  fontFamily: 'var(--font-display)', fontSize: 11,
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
                    background: tab.id === 'pendientes' ? '#F57C20' :
                                tab.id === 'aprobados'  ? '#27AE60' :
                                tab.id === 'rechazados' ? '#EB5757' : 'rgba(255,255,255,0.3)',
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

        {/* ── Mensaje de éxito ── */}
        <AnimatePresence>
          {exito && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{
                background: 'rgba(39,174,96,0.1)', border: '1px solid rgba(39,174,96,0.25)',
                borderRadius: 10, padding: '12px 14px', marginBottom: 14,
                fontFamily: 'var(--font-body)', fontSize: 13, color: '#27AE60',
              }}
            >
              {exito}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Error ── */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{
                background: 'rgba(235,87,87,0.1)', border: '1px solid rgba(235,87,87,0.25)',
                borderRadius: 10, padding: '12px 14px', marginBottom: 14,
                fontFamily: 'var(--font-body)', fontSize: 12, color: '#EB5757',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}
            >
              <span>{error}</span>
              <button onClick={clearError} style={{ background: 'none', border: 'none', color: '#EB5757', cursor: 'pointer', fontSize: 16 }}>×</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Lista de registros ── */}
        {loadingAdmin && listaFiltrada.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 40, gap: 10 }}>
            <ClipboardCheck size={28} color="rgba(255,255,255,0.12)" />
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
              Cargando...
            </span>
          </div>
        ) : listaFiltrada.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 40, gap: 12 }}>
            <Inbox size={36} color="rgba(255,255,255,0.12)" />
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>
              {tabActiva === 'pendientes'
                ? 'No hay registros pendientes de validación'
                : `No hay registros ${tabActiva}`}
            </span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {listaFiltrada.map(registro => (
              <ValidacionCard
                key={registro.id}
                registro={registro}
                onAprobar={handleAprobar}
                onRechazar={handleAbrirRechazo}
                aprobando={aprobandoId === registro.id}
                rechazando={rechazandoId === registro.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Modal de rechazo ── */}
      <AnimatePresence>
        {modalRechazo && (
          <ModalRechazo
            registro={modalRechazo}
            onConfirmar={handleConfirmarRechazo}
            onCancelar={handleCerrarRechazo}
            procesando={!!rechazandoId}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
