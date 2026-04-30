import { useNavigate } from 'react-router-dom'
import AppHeader from '../layout/AppHeader'
import useScreenVisibilityStore from '../../store/screenVisibilityStore'
import useUserStore from '../../store/userStore'

const IS_DEV_MODE =
  !import.meta.env.VITE_AZURE_CLIENT_ID ||
  import.meta.env.VITE_AZURE_CLIENT_ID === 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'

function NotAvailableScreen() {
  const navigate = useNavigate()
  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--color-navy)',
    }}>
      <AppHeader title="No disponible" />
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 52, marginBottom: 20 }}>🔒</div>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: 20,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: 'var(--color-text-primary)',
          marginBottom: 10,
        }}>
          Pantalla no disponible
        </div>
        <div style={{
          fontFamily: 'var(--font-body)',
          fontSize: 14,
          color: 'var(--color-text-muted)',
          lineHeight: 1.55,
          maxWidth: 280,
          marginBottom: 32,
        }}>
          Esta funcionalidad aún no está habilitada. Contacta al administrador del programa.
        </div>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'var(--color-orange)',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            padding: '14px 28px',
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: 14,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            cursor: 'pointer',
          }}
        >
          ← Volver
        </button>
      </div>
    </div>
  )
}

function AdminDisabledBanner() {
  return (
    <div style={{
      background: 'rgba(180,83,9,0.15)',
      border: '1px solid rgba(180,83,9,0.4)',
      borderRadius: 0,
      padding: '10px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
    }}>
      <span style={{ fontSize: 15, flexShrink: 0 }}>⚠️</span>
      <span style={{
        fontFamily: 'var(--font-body)',
        fontSize: 12,
        color: '#FCD34D',
        lineHeight: 1.4,
      }}>
        Esta pantalla está <strong>deshabilitada</strong> para usuarios regulares. Solo los administradores pueden acceder.
      </span>
    </div>
  )
}

export default function ScreenGuard({ screenKey, children }) {
  const isScreenDisabled = useScreenVisibilityStore((s) => s.isScreenDisabled)
  const role = useUserStore((s) => s.role)
  const isAdmin = role === 'admin' || IS_DEV_MODE
  const disabled = isScreenDisabled(screenKey)

  if (disabled && !isAdmin) {
    return <NotAvailableScreen />
  }

  return (
    <>
      {disabled && isAdmin && <AdminDisabledBanner />}
      {children}
    </>
  )
}
