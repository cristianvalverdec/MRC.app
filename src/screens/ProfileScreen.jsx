import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LogOut, User, Mail, Building2, Shield, Clock, AlertCircle } from 'lucide-react'
import AppHeader from '../components/layout/AppHeader'
import useUserStore from '../store/userStore'
import useFormStore from '../store/formStore'
import { msalInstance } from '../config/msalInstance'
import { IS_DEV_MODE } from '../services/sharepointData'

const ROLE_META = {
  admin: { label: 'Administrador', color: '#60A5FA', bg: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.3)' },
  user:  { label: 'Usuario',        color: '#9CA3AF', bg: 'rgba(156,163,175,0.1)', border: 'rgba(156,163,175,0.2)' },
}

const UNIT_LABEL = {
  'sucursales':       'Sucursales / CD',
  'fuerza-de-ventas': 'Fuerza de Ventas',
}

// ── Avatar con foto real o iniciales ──────────────────────────────────────
function Avatar({ name, role, photoUrl, size = 72 }) {
  const initials = name
    ? name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
    : '?'
  const roleMeta = ROLE_META[role] || ROLE_META.user

  if (photoUrl) {
    return (
      <div style={{
        width: size, height: size, borderRadius: '50%',
        border: `2.5px solid ${roleMeta.border}`,
        overflow: 'hidden', flexShrink: 0,
      }}>
        <img
          src={photoUrl}
          alt={name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>
    )
  }

  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: roleMeta.bg,
      border: `2px solid ${roleMeta.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <span style={{
        fontFamily: 'var(--font-display)', fontSize: size * 0.36, fontWeight: 800,
        color: roleMeta.color, letterSpacing: '0.02em',
      }}>
        {initials}
      </span>
    </div>
  )
}

// ── Fila de dato de perfil ─────────────────────────────────────────────────
function ProfileRow({ icon, label, value }) {
  if (!value) return null
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 12,
      padding: '12px 16px',
      borderBottom: '1px solid var(--color-border)',
    }}>
      <div style={{ color: 'var(--color-text-muted)', flexShrink: 0, marginTop: 2 }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 2 }}>
          {label}
        </div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>
          {value}
        </div>
      </div>
    </div>
  )
}

// ── Pantalla principal ─────────────────────────────────────────────────────
export default function ProfileScreen() {
  const navigate  = useNavigate()
  const { name, email, role, unit, branch, photoUrl, clearUser } = useUserStore()
  const pendingQueue = useFormStore((s) => s.pendingQueue)

  const pendingCount = pendingQueue.filter((i) => !i.synced).length
  const roleMeta = ROLE_META[role] || ROLE_META.user

  const handleLogout = async () => {
    clearUser()
    if (!IS_DEV_MODE) {
      try {
        await msalInstance.logoutRedirect()
      } catch {
        // redirect fallback
      }
    }
    navigate('/', { replace: true })
  }

  // Nombre de display: usar nombre del store o "Usuario Demo" en dev
  const displayName = name || (IS_DEV_MODE ? 'Usuario Demo' : '')
  const displayEmail = email || (IS_DEV_MODE ? 'demo@agrosuper.cl' : '')

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--color-navy)' }}>
      <AppHeader title="Mi Perfil" />

      <div style={{ flex: 1, padding: '24px 16px', overflowY: 'auto', paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── Cabecera de perfil ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'var(--color-navy-mid)',
            border: '1px solid var(--color-border)',
            borderRadius: 14, padding: '20px 16px',
            display: 'flex', alignItems: 'center', gap: 16,
          }}
        >
          <Avatar name={displayName} role={role} photoUrl={photoUrl} size={72} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 800, color: 'var(--color-text-primary)', letterSpacing: '0.02em' }}>
              {displayName || 'Sin nombre'}
            </div>
            {displayEmail && (
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-text-muted)', marginTop: 3 }}>
                {displayEmail}
              </div>
            )}
            <div style={{ marginTop: 8 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '4px 10px', borderRadius: 20,
                background: roleMeta.bg, border: `1px solid ${roleMeta.border}`,
                fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700,
                letterSpacing: '0.06em', color: roleMeta.color,
              }}>
                <Shield size={11} />
                {roleMeta.label.toUpperCase()}
              </span>
            </div>
          </div>
        </motion.div>

        {/* ── Datos de asignación ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          style={{
            background: 'var(--color-navy-mid)',
            border: '1px solid var(--color-border)',
            borderRadius: 12, overflow: 'hidden',
          }}
        >
          <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--color-border)' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Asignación
            </span>
          </div>
          <ProfileRow icon={<User size={15} />}     label="Nombre"    value={displayName} />
          <ProfileRow icon={<Mail size={15} />}     label="Email"     value={displayEmail} />
          <ProfileRow icon={<Building2 size={15} />} label="Unidad"   value={UNIT_LABEL[unit] || unit} />
          <ProfileRow icon={<Building2 size={15} />} label="Sucursal / CD" value={branch} />
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 16px',
          }}>
            <div style={{ color: 'var(--color-text-muted)', flexShrink: 0, marginTop: 2 }}>
              <Clock size={15} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 2 }}>
                Envíos pendientes de sync
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{
                  fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700,
                  color: pendingCount > 0 ? 'var(--color-orange)' : '#27AE60',
                }}>
                  {pendingCount}
                </div>
                {pendingCount > 0 && (
                  <AlertCircle size={13} color="var(--color-orange)" />
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Modo dev badge ── */}
        {IS_DEV_MODE && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            style={{
              background: 'rgba(245,124,32,0.07)',
              border: '1px solid rgba(245,124,32,0.2)',
              borderRadius: 8, padding: '8px 14px',
              fontFamily: 'var(--font-body)', fontSize: 11,
              color: 'var(--color-orange)', textAlign: 'center',
            }}
          >
            Modo desarrollo activo — datos de demo
          </motion.div>
        )}

        {/* ── Cerrar sesión ── */}
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleLogout}
          style={{
            width: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            padding: '14px',
            background: 'rgba(235,87,87,0.08)',
            border: '1px solid rgba(235,87,87,0.25)',
            borderRadius: 12, cursor: 'pointer',
            fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700,
            letterSpacing: '0.06em', color: '#EB5757',
          }}
        >
          <LogOut size={16} />
          CERRAR SESIÓN
        </motion.button>

        {/* ── Versión ── */}
        <div style={{ textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--color-text-muted)', paddingTop: 4 }}>
          Misión Riesgo Cero · v1.0.0 · Agrosuper SST
        </div>
      </div>
    </div>
  )
}
