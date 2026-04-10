import { useNavigate } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LogOut, User, Mail, Building2, Shield, Clock, AlertCircle, UserPlus, Trash2, Users, ChevronDown, ChevronUp, Loader, Sun, Moon } from 'lucide-react'
import AppHeader from '../components/layout/AppHeader'
import useUserStore from '../store/userStore'
import useFormStore from '../store/formStore'
import { msalInstance } from '../config/msalInstance'
import { IS_DEV_MODE } from '../services/sharepointData'
import { getAdmins, addAdmin, removeAdmin, SUPER_ADMIN } from '../services/adminService'

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

// ── Panel de administración ────────────────────────────────────────────────
function AdminPanel({ currentEmail }) {
  const [open,    setOpen]    = useState(false)
  const [admins,  setAdmins]  = useState([])
  const [loading, setLoading] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [adding,   setAdding]   = useState(false)
  const [error,    setError]    = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const list = await getAdmins()
      setAdmins(list)
    } catch (_e) {
      setError('No se pudo cargar la lista de administradores')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { if (open) load() }, [open, load])

  const handleAdd = async () => {
    const email = newEmail.trim().toLowerCase()
    if (!email || !email.includes('@')) { setError('Ingresa un email válido'); return }
    if (admins.some(a => a.email === email)) { setError('Ese email ya es administrador'); return }
    setAdding(true); setError('')
    try {
      await addAdmin(email)
      setNewEmail('')
      await load()
    } catch {
      setError('Error al agregar administrador')
    } finally {
      setAdding(false)
    }
  }

  const handleRemove = async (admin) => {
    if (admin.email === SUPER_ADMIN) return
    try {
      await removeAdmin(admin.id, admin.email)
      await load()
    } catch {
      setError('Error al eliminar administrador')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12 }}
      style={{
        background: 'var(--color-navy-mid)',
        border: '1px solid rgba(96,165,250,0.3)',
        borderRadius: 12, overflow: 'hidden',
      }}
    >
      {/* Header colapsable */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', background: 'transparent', border: 'none', cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Users size={15} color="#60A5FA" />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, color: '#60A5FA', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Gestión de Administradores
          </span>
        </div>
        {open ? <ChevronUp size={15} color="#60A5FA" /> : <ChevronDown size={15} color="#60A5FA" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

              {/* Lista de admins actuales */}
              {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0' }}>
                  <Loader size={18} color="#60A5FA" style={{ animation: 'spin 1s linear infinite' }} />
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {admins.map(admin => (
                    <div key={admin.id || admin.email} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: 'rgba(96,165,250,0.06)',
                      border: '1px solid rgba(96,165,250,0.15)',
                      borderRadius: 8,
                    }}>
                      <div>
                        <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                          {admin.nombre || admin.email}
                        </div>
                        {admin.nombre && (
                          <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--color-text-muted)' }}>
                            {admin.email}
                          </div>
                        )}
                      </div>
                      {admin.email === SUPER_ADMIN ? (
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 700, color: '#60A5FA', letterSpacing: '0.06em', padding: '3px 7px', background: 'rgba(96,165,250,0.12)', borderRadius: 20 }}>
                          SUPER ADMIN
                        </span>
                      ) : admin.email !== currentEmail?.toLowerCase() ? (
                        <button
                          onClick={() => handleRemove(admin)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#EB5757', display: 'flex' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      ) : (
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.06em', padding: '3px 7px', background: 'rgba(156,163,175,0.1)', borderRadius: 20 }}>
                          TÚ
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Separador */}
              <div style={{ borderTop: '1px solid var(--color-border)' }} />

              {/* Formulario para agregar admin */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600 }}>
                  AGREGAR ADMINISTRADOR
                </div>
                <input
                  type="email"
                  placeholder="correo@agrosuper.com"
                  value={newEmail}
                  onChange={e => { setNewEmail(e.target.value); setError('') }}
                  style={{
                    padding: '10px 12px', borderRadius: 8,
                    background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)', fontFamily: 'var(--font-body)', fontSize: 13,
                    outline: 'none',
                  }}
                />
                {error && (
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#EB5757' }}>
                    {error}
                  </div>
                )}
                <button
                  onClick={handleAdd}
                  disabled={adding || !newEmail.trim()}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '10px', borderRadius: 8, cursor: adding ? 'wait' : 'pointer',
                    background: adding ? 'rgba(96,165,250,0.08)' : 'rgba(96,165,250,0.15)',
                    border: '1px solid rgba(96,165,250,0.3)',
                    color: '#60A5FA', fontFamily: 'var(--font-display)', fontSize: 12,
                    fontWeight: 700, letterSpacing: '0.06em',
                    opacity: !newEmail.trim() ? 0.5 : 1,
                  }}
                >
                  {adding ? <Loader size={13} /> : <UserPlus size={13} />}
                  {adding ? 'GUARDANDO...' : 'ASIGNAR ROL ADMIN'}
                </button>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Toggle modo claro / oscuro ────────────────────────────────────────────
function ThemeToggle() {
  const { theme, setTheme } = useUserStore()
  const isDark = theme === 'dark'

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.20 }}
      style={{
        background: 'var(--color-navy-mid)',
        border: '1px solid var(--color-border)',
        borderRadius: 12, padding: '14px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {isDark
          ? <Moon size={16} color="var(--color-text-secondary)" />
          : <Sun  size={16} color="var(--color-orange)" />
        }
        <div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>
            {isDark ? 'Modo oscuro' : 'Modo claro'}
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--color-text-muted)' }}>
            Apariencia de la aplicación
          </div>
        </div>
      </div>

      {/* Switch pill */}
      <motion.button
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        style={{
          width: 48, height: 26, borderRadius: 999,
          background: isDark ? 'rgba(255,255,255,0.12)' : 'var(--color-orange)',
          border: isDark ? '1px solid rgba(255,255,255,0.2)' : '1px solid var(--color-orange-dark)',
          cursor: 'pointer', padding: 3,
          display: 'flex', alignItems: 'center',
          justifyContent: isDark ? 'flex-start' : 'flex-end',
          transition: 'background 0.25s ease, justify-content 0.25s ease',
          flexShrink: 0,
        }}
        aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      >
        <motion.div
          layout
          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
          style={{
            width: 20, height: 20, borderRadius: '50%',
            background: '#FFFFFF',
            boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {isDark
            ? <Moon size={10} color="#1B2A4A" strokeWidth={2.5} />
            : <Sun  size={10} color="#F57C20" strokeWidth={2.5} />
          }
        </motion.div>
      </motion.button>
    </motion.div>
  )
}

// ── Pantalla principal ─────────────────────────────────────────────────────
export default function ProfileScreen() {
  const navigate  = useNavigate()
  const { name, email, jobTitle, role, unit, branch, photoUrl, clearUser } = useUserStore()
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
  const displayName    = name     || (IS_DEV_MODE ? 'Usuario Demo' : '')
  const displayEmail   = email    || (IS_DEV_MODE ? 'demo@agrosuper.cl' : '')
  const displayJobTitle = jobTitle || (IS_DEV_MODE ? 'Colaborador' : '')

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
            {displayJobTitle && (
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-orange)', marginTop: 2, fontWeight: 600 }}>
                {displayJobTitle}
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
          <ProfileRow icon={<User size={15} />}     label="Nombre"        value={displayName} />
          <ProfileRow icon={<Mail size={15} />}     label="Email"         value={displayEmail} />
          <ProfileRow icon={<Shield size={15} />}   label="Cargo"         value={displayJobTitle} />
          <ProfileRow icon={<Building2 size={15} />} label="Unidad"       value={UNIT_LABEL[unit] || unit} />
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

        {/* ── Panel de administración (solo admins) ── */}
        {role === 'admin' && !IS_DEV_MODE && (
          <AdminPanel currentEmail={email} />
        )}

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

        {/* ── Toggle modo claro / oscuro ── */}
        <ThemeToggle />

        {/* ── Cerrar sesión ── */}
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
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
          Misión Riesgo Cero · v{__APP_VERSION__} · build {__BUILD_DATE__}
        </div>
      </div>
    </div>
  )
}
