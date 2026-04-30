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

// Modos disponibles con etiqueta, color activo y descripción tooltip
const MODES = [
  {
    value: null,
    label: 'HABILITADA',
    color: '#22C55E',
    dot: '#22C55E',
    shadow: 'rgba(34,197,94,0.5)',
  },
  {
    value: 'users',
    label: 'SOLO USUARIOS',
    color: '#F57C20',
    dot: '#F97316',
    shadow: 'rgba(249,115,22,0.5)',
  },
  {
    value: 'all',
    label: 'TODOS',
    color: '#EF4444',
    dot: '#EF4444',
    shadow: 'rgba(239,68,68,0.5)',
  },
]

function ModeSelector({ currentMode, onChange }) {
  return (
    <div style={{
      display: 'flex',
      borderRadius: 8,
      overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.1)',
      flexShrink: 0,
    }}>
      {MODES.map((m, idx) => {
        const active = currentMode === m.value
        return (
          <button
            key={idx}
            onClick={() => onChange(m.value)}
            style={{
              padding: '5px 9px',
              border: 'none',
              borderLeft: idx > 0 ? '1px solid rgba(255,255,255,0.1)' : 'none',
              background: active ? m.color : 'rgba(255,255,255,0.04)',
              color: active ? '#fff' : 'rgba(255,255,255,0.35)',
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 9,
              letterSpacing: '0.08em',
              cursor: 'pointer',
              transition: 'background 0.15s, color 0.15s',
              whiteSpace: 'nowrap',
            }}
          >
            {m.label}
          </button>
        )
      })}
    </div>
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
  const getScreenMode   = useScreenVisibilityStore((s) => s.getScreenMode)
  const setScreenMode   = useScreenVisibilityStore((s) => s.setScreenMode)
  const syncStatus      = useFormEditorStore((s) => s.syncStatus)
  const lastSyncError   = useFormEditorStore((s) => s.lastSyncError)
  const retryCloudSync  = useFormEditorStore((s) => s.retryCloudSync)

  const handleChange = (screenKey, mode) => {
    setScreenMode(screenKey, mode)
    useFormEditorStore.getState()._syncToCloud()
      .catch((e) => console.warn('[MRC Visibility] Sync falló:', e?.message))
  }

  // Descripción del modo actual para mostrar bajo el label
  const modeInfo = {
    null: null,
    users: { text: 'Bloqueada para usuarios — admins acceden con aviso', color: '#F97316' },
    all:   { text: 'Bloqueada para todos los perfiles', color: '#F87171' },
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

          {/* Descripción + leyenda */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
          >
            <div style={{
              fontFamily: 'var(--font-body)', fontSize: 13,
              color: 'var(--color-text-muted)', lineHeight: 1.55,
              padding: '12px 14px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 10,
            }}>
              Elige el nivel de restricción para cada pantalla. El panel de administración siempre es accesible.
            </div>

            {/* Leyenda de modos */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', paddingLeft: 2 }}>
              {MODES.map((m) => (
                <div key={String(m.value)} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{
                    width: 7, height: 7, borderRadius: '50%',
                    background: m.dot, flexShrink: 0,
                  }} />
                  <span style={{
                    fontFamily: 'var(--font-body)', fontSize: 11,
                    color: 'rgba(255,255,255,0.45)',
                  }}>
                    {m.label === 'HABILITADA' ? 'Habilitada' :
                     m.label === 'SOLO USUARIOS' ? 'Solo usuarios bloqueados' :
                     'Todos bloqueados'}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {groups.map((group, gIdx) => {
            const items = SCREEN_REGISTRY.filter((s) => s.menu === group)
            return (
              <motion.div
                key={group}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: gIdx * 0.08 }}
              >
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
                    const mode = getScreenMode(screen.key)
                    const dotConfig = MODES.find((m) => m.value === mode) || MODES[0]
                    const info = modeInfo[String(mode)] || null
                    const isLast = idx === items.length - 1

                    return (
                      <div
                        key={screen.key}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '12px 14px',
                          borderBottom: isLast ? 'none' : '1px solid var(--color-border)',
                        }}
                      >
                        {/* Indicador de estado */}
                        <div style={{
                          width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                          background: dotConfig.dot,
                          boxShadow: `0 0 6px ${dotConfig.shadow}`,
                        }} />

                        {/* Label + sublabel */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontFamily: 'var(--font-display)',
                            fontWeight: 700,
                            fontSize: 12,
                            letterSpacing: '0.03em',
                            color: mode ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}>
                            {screen.label}
                          </div>
                          {info && (
                            <div style={{
                              fontFamily: 'var(--font-body)',
                              fontSize: 10,
                              color: info.color,
                              marginTop: 1,
                              lineHeight: 1.3,
                            }}>
                              {info.text}
                            </div>
                          )}
                        </div>

                        {/* Selector de 3 estados */}
                        <ModeSelector
                          currentMode={mode}
                          onChange={(newMode) => handleChange(screen.key, newMode)}
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
              transition={{ delay: 0.2 }}
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
