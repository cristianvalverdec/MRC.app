import { motion } from 'framer-motion'
import AppHeader from '../components/layout/AppHeader'
import useScreenVisibilityStore from '../store/screenVisibilityStore'
import useFormEditorStore from '../store/formEditorStore'
import { SCREEN_REGISTRY } from '../config/screenRegistry'

const IS_DEV_MODE =
  !import.meta.env.VITE_AZURE_CLIENT_ID ||
  import.meta.env.VITE_AZURE_CLIENT_ID === 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'

const GROUP_LABELS = {
  principal:    'Menú Principal',
  herramientas: 'Herramientas Preventivas',
}

function Toggle({ active, onToggle }) {
  return (
    <button
      onClick={onToggle}
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        background: active ? '#22C55E' : '#374151',
        border: 'none',
        cursor: 'pointer',
        position: 'relative',
        flexShrink: 0,
        transition: 'background 0.2s',
      }}
    >
      <div style={{
        width: 18,
        height: 18,
        borderRadius: '50%',
        background: '#fff',
        position: 'absolute',
        top: 3,
        left: active ? 23 : 3,
        transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
      }} />
    </button>
  )
}

function SyncIndicator({ syncStatus, lastSyncError, onRetry }) {
  const color = syncStatus === 'success' ? '#22C55E'
    : syncStatus === 'error' ? '#F87171'
    : syncStatus === 'syncing' ? '#60A5FA'
    : 'rgba(255,255,255,0.3)'

  const label = syncStatus === 'success' ? 'Sincronizado con SharePoint'
    : syncStatus === 'error' ? `Error: ${lastSyncError || 'desconocido'}`
    : syncStatus === 'syncing' ? 'Sincronizando…'
    : 'Sin cambios pendientes'

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '10px 14px',
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 10,
    }}>
      <div style={{
        width: 8, height: 8, borderRadius: '50%',
        background: color, flexShrink: 0,
      }} />
      <span style={{
        fontFamily: 'var(--font-body)', fontSize: 12,
        color: 'var(--color-text-muted)', flex: 1,
      }}>
        {label}
      </span>
      {syncStatus === 'error' && (
        <button
          onClick={onRetry}
          style={{
            background: 'none', border: '1px solid rgba(248,113,113,0.4)',
            borderRadius: 6, padding: '3px 8px',
            color: '#F87171', fontFamily: 'var(--font-body)', fontSize: 11,
            cursor: 'pointer',
          }}
        >
          Reintentar
        </button>
      )}
    </div>
  )
}

export default function ScreenVisibilityAdminScreen() {
  const disabledScreens = useScreenVisibilityStore((s) => s.disabledScreens)
  const toggleScreen    = useScreenVisibilityStore((s) => s.toggleScreen)
  const syncStatus      = useFormEditorStore((s) => s.syncStatus)
  const lastSyncError   = useFormEditorStore((s) => s.lastSyncError)
  const retryCloudSync  = useFormEditorStore((s) => s.retryCloudSync)

  const handleToggle = (screenKey) => {
    toggleScreen(screenKey)
    // Disparar sync cloud después del toggle
    useFormEditorStore.getState()._syncToCloud()
      .catch((e) => console.warn('[MRC Visibility] Sync falló:', e?.message))
  }

  const groups = ['principal', 'herramientas']

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--color-navy)',
    }}>
      <AppHeader title="Visibilidad de Pantallas" />

      <div style={{ flex: 1, padding: '20px 16px 32px' }}>
        <div className="content-col" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Descripción */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              fontFamily: 'var(--font-body)', fontSize: 13,
              color: 'var(--color-text-muted)', lineHeight: 1.55,
              padding: '12px 14px',
              background: 'rgba(245,124,32,0.08)',
              border: '1px solid rgba(245,124,32,0.2)',
              borderRadius: 10,
            }}
          >
            Las pantallas <strong style={{ color: '#F57C20' }}>deshabilitadas</strong> se muestran en gris a los usuarios y bloquean el acceso directo por URL. Los administradores siempre pueden acceder.
          </motion.div>

          {groups.map((group) => {
            const items = SCREEN_REGISTRY.filter((s) => s.menu === group)
            return (
              <motion.div
                key={group}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: group === 'herramientas' ? 0.1 : 0 }}
              >
                {/* Encabezado de grupo */}
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize: 11,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.35)',
                  marginBottom: 10,
                  paddingLeft: 2,
                }}>
                  {GROUP_LABELS[group]}
                </div>

                <div style={{
                  background: 'var(--color-navy-mid)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-card)',
                  overflow: 'hidden',
                }}>
                  {items.map((screen, idx) => {
                    const isDisabled = !!disabledScreens[screen.key]
                    const isLast = idx === items.length - 1
                    return (
                      <div
                        key={screen.key}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: '14px 16px',
                          borderBottom: isLast ? 'none' : '1px solid var(--color-border)',
                        }}
                      >
                        {/* Indicador de estado */}
                        <div style={{
                          width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                          background: isDisabled ? '#EF4444' : '#22C55E',
                          boxShadow: isDisabled
                            ? '0 0 6px rgba(239,68,68,0.5)'
                            : '0 0 6px rgba(34,197,94,0.5)',
                        }} />

                        {/* Label */}
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontFamily: 'var(--font-display)',
                            fontWeight: 700,
                            fontSize: 13,
                            letterSpacing: '0.04em',
                            color: isDisabled
                              ? 'var(--color-text-muted)'
                              : 'var(--color-text-primary)',
                          }}>
                            {screen.label}
                          </div>
                          {isDisabled && (
                            <div style={{
                              fontFamily: 'var(--font-body)',
                              fontSize: 11,
                              color: '#F87171',
                              marginTop: 2,
                            }}>
                              Deshabilitada
                            </div>
                          )}
                        </div>

                        {/* Toggle */}
                        <Toggle
                          active={!isDisabled}
                          onToggle={() => handleToggle(screen.key)}
                        />
                      </div>
                    )
                  })}
                </div>
              </motion.div>
            )
          })}

          {/* Sync status */}
          {!IS_DEV_MODE && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
            >
              <SyncIndicator
                syncStatus={syncStatus}
                lastSyncError={lastSyncError}
                onRetry={retryCloudSync}
              />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
