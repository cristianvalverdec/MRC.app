import { useNavigate } from 'react-router-dom'
import AppHeader from '../layout/AppHeader'
import useScreenVisibilityStore from '../../store/screenVisibilityStore'

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
          Esta funcionalidad aún no está habilitada. Puedes habilitarla desde el panel de Visibilidad de Pantallas.
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

export default function ScreenGuard({ screenKey, children }) {
  const isScreenDisabled = useScreenVisibilityStore((s) => s.isScreenDisabled)

  if (isScreenDisabled(screenKey)) {
    return <NotAvailableScreen />
  }

  return children
}
