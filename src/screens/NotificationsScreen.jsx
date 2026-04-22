import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell, CalendarCheck, Megaphone, Settings, CheckCheck,
  ChevronRight, RefreshCw, BellOff, ToggleLeft, ToggleRight,
} from 'lucide-react'
import AppHeader from '../components/layout/AppHeader'
import useUserStore from '../store/userStore'
import useNotificationStore from '../store/notificationStore'
import {
  requestNotificationPermission,
  mostrarNotificacionNativa,
} from '../hooks/useNotifications'

const IS_DEV_MODE =
  !import.meta.env.VITE_AZURE_CLIENT_ID ||
  import.meta.env.VITE_AZURE_CLIENT_ID === 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'

const TIPO_CONFIG = {
  actividad: { icon: CalendarCheck, color: '#1A52B8',  label: 'Actividad' },
  plan_accion: { icon: CheckCheck,  color: '#27AE60',  label: 'Plan de acción' },
  difusion:  { icon: Megaphone,     color: '#2F80ED',  label: 'Difusión SSO' },
  sistema:   { icon: Settings,      color: '#7B3FE4',  label: 'Sistema' },
}

function tiempoRelativo(isoStr) {
  if (!isoStr) return ''
  const diff = Date.now() - new Date(isoStr).getTime()
  const min  = Math.floor(diff / 60000)
  if (min < 1)   return 'Ahora'
  if (min < 60)  return `Hace ${min} min`
  const hrs = Math.floor(min / 60)
  if (hrs < 24)  return `Hace ${hrs} h`
  const dias = Math.floor(hrs / 24)
  if (dias < 7)  return `Hace ${dias} día${dias > 1 ? 's' : ''}`
  return new Date(isoStr).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
}

function NotifCard({ notif, leida, onTocar }) {
  const cfg  = TIPO_CONFIG[notif.tipo] || TIPO_CONFIG.sistema
  const Icon = cfg.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onTocar(notif)}
      style={{
        background: leida ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.06)',
        border: `1px solid ${leida ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.12)'}`,
        borderLeft: `3px solid ${leida ? 'rgba(255,255,255,0.1)' : cfg.color}`,
        borderRadius: 12,
        padding: '14px 16px',
        cursor: 'pointer',
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
      }}
    >
      {/* Icono de tipo */}
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: `${cfg.color}22`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, marginTop: 1,
      }}>
        <Icon size={17} color={leida ? 'rgba(255,255,255,0.3)' : cfg.color} strokeWidth={2} />
      </div>

      {/* Contenido */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
          <span style={{
            fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700,
            color: leida ? 'rgba(255,255,255,0.5)' : '#fff',
            lineHeight: 1.3,
          }}>
            {notif.titulo}
          </span>
          {!leida && (
            <div style={{
              width: 7, height: 7, borderRadius: '50%',
              background: 'var(--color-orange)',
              flexShrink: 0, marginTop: 4,
            }} />
          )}
        </div>

        <p style={{
          fontFamily: 'var(--font-body)', fontSize: 13,
          color: leida ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.65)',
          margin: 0, lineHeight: 1.5,
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {notif.cuerpo}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
          <span style={{
            fontFamily: 'var(--font-body)', fontSize: 11,
            color: 'rgba(255,255,255,0.25)', letterSpacing: '0.02em',
          }}>
            {tiempoRelativo(notif.creadaEn)}
          </span>

          {notif.accionRuta && (
            <span style={{
              fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700,
              color: cfg.color, display: 'flex', alignItems: 'center', gap: 2,
              letterSpacing: '0.04em', textTransform: 'uppercase',
            }}>
              Ver <ChevronRight size={12} />
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function PermisosNativos() {
  const [permiso, setPermiso] = useState(
    'Notification' in window ? Notification.permission : 'unsupported'
  )
  const [solicitando, setSolicitando] = useState(false)

  const esPWA = window.matchMedia('(display-mode: standalone)').matches

  // Solo mostrar si la app está instalada como PWA y el permiso no está decidido
  if (!esPWA || permiso === 'unsupported' || permiso === 'granted') return null

  const handleSolicitar = async () => {
    setSolicitando(true)
    const resultado = await requestNotificationPermission()
    setPermiso(resultado)
    setSolicitando(false)
    if (resultado === 'granted') {
      await mostrarNotificacionNativa({
        titulo: 'Notificaciones activadas',
        cuerpo: 'Ahora recibirás alertas de Misión Riesgo Cero.',
        accionRuta: '/notifications',
      })
    }
  }

  return (
    <div style={{
      background: 'rgba(26,82,184,0.12)',
      border: '1px solid rgba(26,82,184,0.25)',
      borderRadius: 12, padding: '14px 16px',
      display: 'flex', alignItems: 'center', gap: 12,
      marginBottom: 12,
    }}>
      {permiso === 'denied'
        ? <ToggleLeft size={20} color="rgba(255,255,255,0.3)" />
        : <ToggleLeft size={20} color="#1A52B8" />
      }
      <div style={{ flex: 1 }}>
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700,
          color: '#fff', marginBottom: 2,
        }}>
          {permiso === 'denied' ? 'Notificaciones bloqueadas' : 'Activar notificaciones del sistema'}
        </div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
          {permiso === 'denied'
            ? 'Actívalas desde la configuración del navegador'
            : 'Recibe alertas aunque la app esté cerrada'
          }
        </div>
      </div>
      {permiso !== 'denied' && (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleSolicitar}
          disabled={solicitando}
          style={{
            background: '#1A52B8', color: '#fff', border: 'none',
            borderRadius: 8, padding: '8px 14px',
            fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700,
            cursor: 'pointer', flexShrink: 0, letterSpacing: '0.04em',
            opacity: solicitando ? 0.6 : 1,
          }}
        >
          {solicitando ? '...' : 'ACTIVAR'}
        </motion.button>
      )}
    </div>
  )
}

export default function NotificationsScreen() {
  const navigate = useNavigate()
  const { email, instalacionMRC, mrcNivel } = useUserStore()
  const {
    notificaciones, leidasIds, loading, error,
    cargar, cargarMock, marcarLeida, marcarTodasLeidas, clearError,
  } = useNotificationStore()

  const [tab, setTab] = useState('sinleer')

  useEffect(() => {
    if (IS_DEV_MODE) {
      cargarMock()
    } else if (email) {
      cargar(email, instalacionMRC, mrcNivel)
    }
  }, [email, instalacionMRC, mrcNivel, cargar, cargarMock])

  const noLeidas = notificaciones.filter(n => !leidasIds.includes(n.id))
  const lista    = tab === 'sinleer' ? noLeidas : notificaciones

  const handleTocar = (notif) => {
    marcarLeida(notif.id, email)
    if (notif.accionRuta) navigate(notif.accionRuta)
  }

  const handleRefresh = () => {
    if (IS_DEV_MODE) cargarMock()
    else if (email) cargar(email, instalacionMRC, mrcNivel)
  }

  const HeaderRight = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {noLeidas.length > 0 && (
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => marcarTodasLeidas(email)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'rgba(255,255,255,0.55)', padding: '6px',
            display: 'flex', alignItems: 'center', gap: 4,
            fontFamily: 'var(--font-body)', fontSize: 11,
          }}
          title="Marcar todo como leído"
        >
          <CheckCheck size={16} />
        </motion.button>
      )}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={handleRefresh}
        disabled={loading}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'rgba(255,255,255,0.55)', padding: '6px',
          display: 'flex', alignItems: 'center',
        }}
        title="Actualizar"
      >
        <RefreshCw size={16} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
      </motion.button>
    </div>
  )

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--color-navy)' }}>
      <AppHeader title="Notificaciones" rightAction={HeaderRight} />

      <div className="content-col" style={{ flex: 1, padding: '16px 16px 32px' }}>
        {/* Activar notificaciones nativas (solo en PWA instalada) */}
        <PermisosNativos />

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{
                background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.25)',
                borderRadius: 10, padding: '12px 14px', marginBottom: 12,
                fontFamily: 'var(--font-body)', fontSize: 12, color: '#E74C3C',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}
            >
              <span>{error}</span>
              <button
                onClick={clearError}
                style={{ background: 'none', border: 'none', color: '#E74C3C', cursor: 'pointer', fontSize: 16 }}
              >×</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {[
            { key: 'sinleer', label: `Sin leer${noLeidas.length ? ` (${noLeidas.length})` : ''}` },
            { key: 'todas',   label: 'Todas' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                background: tab === t.key ? 'rgba(26,82,184,0.25)' : 'transparent',
                border: `1px solid ${tab === t.key ? 'rgba(26,82,184,0.5)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 8, padding: '8px 16px',
                fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700,
                color: tab === t.key ? '#fff' : 'rgba(255,255,255,0.4)',
                cursor: 'pointer', letterSpacing: '0.04em',
                transition: 'all 0.2s ease',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Lista de notificaciones */}
        {loading && !notificaciones.length ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', paddingTop: 60, gap: 12,
          }}>
            <Bell size={32} color="rgba(255,255,255,0.15)" />
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
              Cargando notificaciones...
            </span>
          </div>
        ) : lista.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', paddingTop: 60, gap: 12,
            }}
          >
            <BellOff size={36} color="rgba(255,255,255,0.12)" />
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>
              {tab === 'sinleer' ? 'Sin notificaciones pendientes' : 'Sin notificaciones'}
            </span>
          </motion.div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {lista.map(notif => (
              <NotifCard
                key={notif.id}
                notif={notif}
                leida={leidasIds.includes(notif.id)}
                onTocar={handleTocar}
              />
            ))}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
