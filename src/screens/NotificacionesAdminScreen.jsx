import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell, Plus, X, Send, CalendarCheck, Megaphone, Settings,
  CheckCheck, Users, MapPin, Hash, Mail, ChevronDown, ChevronUp,
  ToggleLeft, Trash2, BellOff,
} from 'lucide-react'
import AppHeader from '../components/layout/AppHeader'
import useUserStore from '../store/userStore'
import useNotificationStore from '../store/notificationStore'
import { INSTALACIONES_MRC } from '../config/mrcCatalog'

const TIPOS = [
  { value: 'actividad',   label: 'Actividad pendiente',  icon: CalendarCheck, color: '#1A52B8' },
  { value: 'plan_accion', label: 'Plan de acción',       icon: CheckCheck,    color: '#27AE60' },
  { value: 'difusion',    label: 'Difusión SSO',         icon: Megaphone,     color: '#2F80ED' },
  { value: 'sistema',     label: 'Sistema',              icon: Settings,      color: '#7B3FE4' },
]

const FILTROS_DEST = [
  { value: 'todos',        label: 'Todos los usuarios',    icon: Users },
  { value: 'instalacion',  label: 'Por instalación',       icon: MapPin },
  { value: 'nivel',        label: 'Por nivel jerárquico',  icon: Hash },
  { value: 'email',        label: 'Email específico',      icon: Mail },
]

const TIPO_CONFIG = {
  actividad:  { color: '#1A52B8', label: 'Actividad' },
  plan_accion:{ color: '#27AE60', label: 'Plan de acción' },
  difusion:   { color: '#2F80ED', label: 'Difusión SSO' },
  sistema:    { color: '#7B3FE4', label: 'Sistema' },
}

function tiempoRelativo(isoStr) {
  if (!isoStr) return ''
  const diff = Date.now() - new Date(isoStr).getTime()
  const min  = Math.floor(diff / 60000)
  if (min < 60)  return `Hace ${min} min`
  const hrs = Math.floor(min / 60)
  if (hrs < 24)  return `Hace ${hrs} h`
  const dias = Math.floor(hrs / 24)
  if (dias < 7)  return `Hace ${dias} día${dias > 1 ? 's' : ''}`
  return new Date(isoStr).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })
}

function buildDestinatariosStr(filtroTipo, filtroValor) {
  if (filtroTipo === 'todos') return 'todos'
  if (!filtroValor.trim()) return 'todos'
  return `${filtroTipo}:${filtroValor.trim()}`
}

function labelDestinatarios(dest) {
  if (!dest || dest === 'todos') return 'Todos'
  if (dest.startsWith('instalacion:')) return `Inst: ${dest.split(':')[1]}`
  if (dest.startsWith('nivel:')) return `Nivel ≥ ${dest.split(':')[1]}`
  if (dest.startsWith('email:')) return dest.split(':')[1]
  return dest
}

function FormularioNotif({ onCerrar, onCrear, enviando }) {
  const [titulo,      setTitulo]      = useState('')
  const [cuerpo,      setCuerpo]      = useState('')
  const [tipo,        setTipo]        = useState('sistema')
  const [filtroTipo,  setFiltroTipo]  = useState('todos')
  const [filtroValor, setFiltroValor] = useState('')
  const [accionRuta,  setAccionRuta]  = useState('')
  const [expira,      setExpira]      = useState('')
  const [localError,  setLocalError]  = useState('')

  const handleEnviar = () => {
    if (!titulo.trim()) { setLocalError('El título es obligatorio'); return }
    if (!cuerpo.trim()) { setLocalError('El cuerpo del mensaje es obligatorio'); return }
    if (filtroTipo !== 'todos' && !filtroValor.trim()) {
      setLocalError('Ingresa el valor del filtro de destinatarios'); return
    }
    setLocalError('')
    onCrear({
      titulo:          titulo.trim(),
      cuerpo:          cuerpo.trim(),
      tipo,
      destinatarios:   buildDestinatariosStr(filtroTipo, filtroValor),
      accionRuta:      accionRuta.trim(),
      fechaExpiracion: expira || null,
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 14, padding: '20px 16px', marginBottom: 20,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: '#fff' }}>
          Nueva notificación
        </span>
        <motion.button whileTap={{ scale: 0.9 }} onClick={onCerrar}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: 4 }}
        >
          <X size={18} />
        </motion.button>
      </div>

      {/* Título */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Título
        </label>
        <input
          value={titulo}
          onChange={e => setTitulo(e.target.value)}
          placeholder="Ej: Pauta de verificación pendiente"
          maxLength={120}
          style={{
            width: '100%', boxSizing: 'border-box',
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 8, padding: '10px 12px', color: '#fff',
            fontFamily: 'var(--font-body)', fontSize: 14, outline: 'none',
          }}
        />
      </div>

      {/* Cuerpo */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Mensaje
        </label>
        <textarea
          value={cuerpo}
          onChange={e => setCuerpo(e.target.value)}
          placeholder="Describe la acción o novedad para el equipo..."
          rows={3}
          maxLength={500}
          style={{
            width: '100%', boxSizing: 'border-box', resize: 'vertical',
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 8, padding: '10px 12px', color: '#fff',
            fontFamily: 'var(--font-body)', fontSize: 14, outline: 'none',
          }}
        />
      </div>

      {/* Tipo */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Categoría
        </label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {TIPOS.map(t => {
            const Icon = t.icon
            const sel  = tipo === t.value
            return (
              <button
                key={t.value}
                onClick={() => setTipo(t.value)}
                style={{
                  background: sel ? `${t.color}33` : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${sel ? t.color : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: 8, padding: '7px 12px',
                  display: 'flex', alignItems: 'center', gap: 6,
                  cursor: 'pointer', transition: 'all 0.15s ease',
                }}
              >
                <Icon size={13} color={sel ? t.color : 'rgba(255,255,255,0.35)'} />
                <span style={{
                  fontFamily: 'var(--font-body)', fontSize: 12,
                  color: sel ? t.color : 'rgba(255,255,255,0.35)',
                  fontWeight: sel ? 600 : 400,
                }}>
                  {t.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Destinatarios */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Destinatarios
        </label>
        <select
          value={filtroTipo}
          onChange={e => { setFiltroTipo(e.target.value); setFiltroValor('') }}
          style={{
            width: '100%', boxSizing: 'border-box',
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 8, padding: '10px 12px', color: '#fff',
            fontFamily: 'var(--font-body)', fontSize: 14, outline: 'none',
            marginBottom: filtroTipo !== 'todos' ? 8 : 0,
          }}
        >
          {FILTROS_DEST.map(f => (
            <option key={f.value} value={f.value} style={{ background: '#1B2A4A' }}>
              {f.label}
            </option>
          ))}
        </select>

        {/* Valor condicional */}
        {filtroTipo === 'instalacion' && (
          <select
            value={filtroValor}
            onChange={e => setFiltroValor(e.target.value)}
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 8, padding: '10px 12px', color: filtroValor ? '#fff' : 'rgba(255,255,255,0.3)',
              fontFamily: 'var(--font-body)', fontSize: 14, outline: 'none',
            }}
          >
            <option value="" style={{ background: '#1B2A4A' }}>Selecciona instalación...</option>
            {(INSTALACIONES_MRC || []).map(inst => (
              <option key={inst.nombre} value={inst.nombre} style={{ background: '#1B2A4A' }}>{inst.nombre}</option>
            ))}
          </select>
        )}

        {filtroTipo === 'nivel' && (
          <select
            value={filtroValor}
            onChange={e => setFiltroValor(e.target.value)}
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 8, padding: '10px 12px', color: filtroValor ? '#fff' : 'rgba(255,255,255,0.3)',
              fontFamily: 'var(--font-body)', fontSize: 14, outline: 'none',
            }}
          >
            <option value="" style={{ background: '#1B2A4A' }}>Nivel mínimo...</option>
            {[1,2,3,4,5,6,7,8,9,10].map(n => (
              <option key={n} value={n} style={{ background: '#1B2A4A' }}>Nivel {n} y superior</option>
            ))}
          </select>
        )}

        {filtroTipo === 'email' && (
          <input
            type="email"
            value={filtroValor}
            onChange={e => setFiltroValor(e.target.value)}
            placeholder="usuario@agrosuper.cl"
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 8, padding: '10px 12px', color: '#fff',
              fontFamily: 'var(--font-body)', fontSize: 14, outline: 'none',
            }}
          />
        )}
      </div>

      {/* Ruta de acción (opcional) */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Ruta de acción <span style={{ color: 'rgba(255,255,255,0.2)' }}>(opcional)</span>
        </label>
        <input
          value={accionRuta}
          onChange={e => setAccionRuta(e.target.value)}
          placeholder="Ej: /unit/sucursales/difusiones-sso"
          style={{
            width: '100%', boxSizing: 'border-box',
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 8, padding: '10px 12px', color: '#fff',
            fontFamily: 'var(--font-body)', fontSize: 14, outline: 'none',
          }}
        />
      </div>

      {/* Fecha de expiración (opcional) */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Expira <span style={{ color: 'rgba(255,255,255,0.2)' }}>(opcional)</span>
        </label>
        <input
          type="date"
          value={expira}
          onChange={e => setExpira(e.target.value ? new Date(e.target.value).toISOString() : '')}
          style={{
            width: '100%', boxSizing: 'border-box',
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 8, padding: '10px 12px', color: '#fff',
            fontFamily: 'var(--font-body)', fontSize: 14, outline: 'none',
            colorScheme: 'dark',
          }}
        />
      </div>

      {/* Error local */}
      {localError && (
        <div style={{
          background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.25)',
          borderRadius: 8, padding: '8px 12px', marginBottom: 12,
          fontFamily: 'var(--font-body)', fontSize: 12, color: '#E74C3C',
        }}>
          {localError}
        </div>
      )}

      {/* Botones */}
      <div style={{ display: 'flex', gap: 10 }}>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onCerrar}
          style={{
            flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 10, padding: '12px 16px', color: 'rgba(255,255,255,0.5)',
            fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700,
            cursor: 'pointer', letterSpacing: '0.04em',
          }}
        >
          CANCELAR
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleEnviar}
          disabled={enviando}
          style={{
            flex: 2, background: '#1A52B8', border: 'none',
            borderRadius: 10, padding: '12px 16px', color: '#fff',
            fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700,
            cursor: enviando ? 'not-allowed' : 'pointer', letterSpacing: '0.04em',
            opacity: enviando ? 0.6 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          <Send size={14} />
          {enviando ? 'ENVIANDO...' : 'ENVIAR'}
        </motion.button>
      </div>
    </motion.div>
  )
}

function NotifAdminCard({ notif, onDesactivar, desactivando }) {
  const [expandida, setExpandida] = useState(false)
  const cfg = TIPO_CONFIG[notif.tipo] || TIPO_CONFIG.sistema

  return (
    <div style={{
      background: notif.activa ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
      border: `1px solid ${notif.activa ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)'}`,
      borderLeft: `3px solid ${notif.activa ? cfg.color : 'rgba(255,255,255,0.1)'}`,
      borderRadius: 12, padding: '12px 14px',
      opacity: notif.activa ? 1 : 0.55,
    }}>
      <div
        style={{ cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 10 }}
        onClick={() => setExpandida(v => !v)}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
            <span style={{
              fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700,
              color: notif.activa ? '#fff' : 'rgba(255,255,255,0.4)',
            }}>
              {notif.titulo}
            </span>
            <span style={{
              background: `${cfg.color}33`, color: cfg.color,
              fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600,
              padding: '2px 7px', borderRadius: 999, letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}>
              {cfg.label}
            </span>
            <span style={{
              background: notif.activa ? 'rgba(39,174,96,0.15)' : 'rgba(255,255,255,0.05)',
              color: notif.activa ? '#27AE60' : 'rgba(255,255,255,0.25)',
              fontFamily: 'var(--font-body)', fontSize: 10,
              padding: '2px 7px', borderRadius: 999,
            }}>
              {notif.activa ? 'Activa' : 'Inactiva'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
              {tiempoRelativo(notif.creadaEn)}
            </span>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
              · {labelDestinatarios(notif.destinatarios)}
            </span>
          </div>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
          {expandida ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </div>
      </div>

      <AnimatePresence>
        {expandida && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.07)', marginTop: 10 }}>
              <p style={{
                fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.55)',
                margin: '0 0 10px', lineHeight: 1.6,
              }}>
                {notif.cuerpo}
              </p>
              {notif.accionRuta && (
                <div style={{ marginBottom: 8 }}>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                    Ruta: <code style={{ color: 'rgba(255,255,255,0.5)' }}>{notif.accionRuta}</code>
                  </span>
                </div>
              )}
              {notif.fechaExpiracion && (
                <div style={{ marginBottom: 10 }}>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                    Expira: {new Date(notif.fechaExpiracion).toLocaleDateString('es-CL')}
                  </span>
                </div>
              )}
              {notif.activa && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onDesactivar(notif.id)}
                  disabled={desactivando}
                  style={{
                    background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.25)',
                    borderRadius: 8, padding: '8px 14px', color: '#E74C3C',
                    fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                    letterSpacing: '0.04em', opacity: desactivando ? 0.6 : 1,
                  }}
                >
                  <Trash2 size={13} />
                  {desactivando ? 'DESACTIVANDO...' : 'DESACTIVAR'}
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function NotificacionesAdminScreen() {
  const { email } = useUserStore()
  const {
    todasNotificaciones, loadingAdmin, error,
    cargarAdmin, crear, desactivar, clearError,
  } = useNotificationStore()

  const [mostrarForm, setMostrarForm] = useState(false)
  const [enviando,    setEnviando]    = useState(false)
  const [desactivandoId, setDesactivandoId] = useState(null)
  const [exito,       setExito]       = useState('')

  useEffect(() => {
    cargarAdmin()
  }, [cargarAdmin])

  const activas   = todasNotificaciones.filter(n => n.activa)
  const inactivas = todasNotificaciones.filter(n => !n.activa)

  const handleCrear = async (notif) => {
    setEnviando(true)
    try {
      await crear(notif, email)
      setMostrarForm(false)
      setExito('Notificación enviada correctamente')
      setTimeout(() => setExito(''), 3000)
    } catch (err) {
      console.error('[NotificacionesAdmin] crear error:', err)
    } finally {
      setEnviando(false)
    }
  }

  const handleDesactivar = async (id) => {
    setDesactivandoId(id)
    try {
      await desactivar(id)
    } catch (err) {
      console.error('[NotificacionesAdmin] desactivar error:', err)
    } finally {
      setDesactivandoId(null)
    }
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--color-navy)' }}>
      <AppHeader title="Gestión de Notificaciones" />

      <div className="content-col" style={{ flex: 1, padding: '16px 16px 40px' }}>
        {/* Resumen */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Total enviadas', valor: todasNotificaciones.length, color: '#7B3FE4' },
            { label: 'Activas',        valor: activas.length,             color: '#27AE60' },
          ].map(stat => (
            <div
              key={stat.label}
              style={{
                flex: 1, background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '14px 16px',
              }}
            >
              <div style={{
                fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800,
                color: stat.color, lineHeight: 1,
              }}>
                {loadingAdmin ? '–' : stat.valor}
              </div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Botón nueva notificación */}
        {!mostrarForm && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setMostrarForm(true)}
            style={{
              width: '100%', boxSizing: 'border-box',
              background: '#1A52B8', border: 'none',
              borderRadius: 12, padding: '14px 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              color: '#fff', fontFamily: 'var(--font-display)', fontSize: 14,
              fontWeight: 700, cursor: 'pointer', letterSpacing: '0.05em',
              marginBottom: 20,
            }}
          >
            <Plus size={18} />
            NUEVA NOTIFICACIÓN
          </motion.button>
        )}

        {/* Formulario de creación */}
        <AnimatePresence>
          {mostrarForm && (
            <FormularioNotif
              onCerrar={() => setMostrarForm(false)}
              onCrear={handleCrear}
              enviando={enviando}
            />
          )}
        </AnimatePresence>

        {/* Mensaje de éxito */}
        <AnimatePresence>
          {exito && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{
                background: 'rgba(39,174,96,0.1)', border: '1px solid rgba(39,174,96,0.25)',
                borderRadius: 10, padding: '12px 14px', marginBottom: 16,
                fontFamily: 'var(--font-body)', fontSize: 13, color: '#27AE60',
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              <Bell size={15} /> {exito}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{
                background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.25)',
                borderRadius: 10, padding: '12px 14px', marginBottom: 16,
                fontFamily: 'var(--font-body)', fontSize: 12, color: '#E74C3C',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}
            >
              <span>{error}</span>
              <button onClick={clearError} style={{ background: 'none', border: 'none', color: '#E74C3C', cursor: 'pointer', fontSize: 16 }}>×</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Lista de notificaciones activas */}
        {loadingAdmin ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            paddingTop: 40, gap: 10,
          }}>
            <Bell size={28} color="rgba(255,255,255,0.15)" />
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
              Cargando...
            </span>
          </div>
        ) : (
          <>
            {/* Activas */}
            {activas.length > 0 && (
              <>
                <div style={{ marginBottom: 10 }}>
                  <span style={{
                    fontFamily: 'var(--font-body)', fontSize: 11,
                    color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em',
                  }}>
                    Activas ({activas.length})
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                  {activas.map(n => (
                    <NotifAdminCard
                      key={n.id}
                      notif={n}
                      onDesactivar={handleDesactivar}
                      desactivando={desactivandoId === n.id}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Inactivas */}
            {inactivas.length > 0 && (
              <>
                <div style={{ marginBottom: 10 }}>
                  <span style={{
                    fontFamily: 'var(--font-body)', fontSize: 11,
                    color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.08em',
                  }}>
                    Historial inactivas ({inactivas.length})
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {inactivas.map(n => (
                    <NotifAdminCard
                      key={n.id}
                      notif={n}
                      onDesactivar={handleDesactivar}
                      desactivando={desactivandoId === n.id}
                    />
                  ))}
                </div>
              </>
            )}

            {todasNotificaciones.length === 0 && (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                paddingTop: 40, gap: 12,
              }}>
                <BellOff size={36} color="rgba(255,255,255,0.12)" />
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>
                  Sin notificaciones enviadas
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
