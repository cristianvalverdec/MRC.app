// ── LideresAdminScreen.jsx ────────────────────────────────────────────────────
// Panel de administración: vista general de todas las instalaciones.
// Muestra semáforo de cobertura de cargos críticos y permite navegar al detalle.

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Building2, AlertTriangle, CheckCircle, ChevronRight, Search, Loader, RefreshCw } from 'lucide-react'
import AppHeader from '../components/layout/AppHeader'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import useLideresStore from '../store/lideresStore'
import { INSTALACIONES_MRC, CARGOS_CRITICOS } from '../config/mrcCatalog'
import { IS_DEV_MODE } from '../services/sharepointData'

// ── Helpers ───────────────────────────────────────────────────────────────────

function semaforo(lideres) {
  // Sin líderes = rojo
  if (!lideres || lideres.length === 0) return 'rojo'
  const cargos = lideres.map(l => l.cargoMRC)
  const vacantes = CARGOS_CRITICOS.filter(c => !cargos.includes(c))
  if (vacantes.length === 0) return 'verde'
  if (vacantes.length <= 1) return 'amarillo'
  return 'rojo'
}

const COLORES_SEMAFORO = {
  verde:    { bg: 'rgba(39,174,96,0.12)',  border: 'rgba(39,174,96,0.3)',  dot: '#27AE60' },
  amarillo: { bg: 'rgba(242,153,74,0.10)', border: 'rgba(242,153,74,0.3)', dot: '#F2994A' },
  rojo:     { bg: 'rgba(235,87,87,0.10)',  border: 'rgba(235,87,87,0.3)',  dot: '#EB5757' },
}

// Datos de demo para dev mode
const DEMO_LIDERES = {
  'Miraflores': [
    { cargoMRC: 'Jefe de Zona' },  { cargoMRC: 'Jefe de Frigorífico' },
    { cargoMRC: 'Jefe de Operaciones' }, { cargoMRC: 'Jefe Administrativo' },
    { cargoMRC: 'Jefe de Despacho' }, { cargoMRC: 'Jefe de Despacho' }, { cargoMRC: 'Jefe de Despacho' },
  ],
  'Arica': [{ cargoMRC: 'Jefe de Operaciones' }, { cargoMRC: 'Jefe de Despacho' }],
  'Antofagasta': [
    { cargoMRC: 'Jefe de Zona' }, { cargoMRC: 'Jefe de Frigorífico' },
    { cargoMRC: 'Jefe de Operaciones' },
  ],
}

// ── Tarjeta de instalación ────────────────────────────────────────────────────
function InstalacionCard({ instalacion, lideres, onClick }) {
  const estado   = semaforo(lideres)
  const colores  = COLORES_SEMAFORO[estado]
  const esDistrib = instalacion.tipo === 'Distribuidora'

  const cargosPresentes = (lideres || []).map(l => l.cargoMRC)
  const vacanteCritica  = CARGOS_CRITICOS.filter(c => !cargosPresentes.includes(c))

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      style={{
        width: '100%', cursor: 'pointer', textAlign: 'left',
        background: 'var(--color-navy-mid)',
        border: `1px solid ${colores.border}`,
        borderRadius: 12, padding: '14px 16px',
        display: 'flex', alignItems: 'center', gap: 12,
      }}
    >
      {/* Semáforo dot */}
      <div style={{
        width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
        background: colores.dot,
        boxShadow: `0 0 6px ${colores.dot}88`,
      }} />

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 800,
            color: 'var(--color-text-primary)', letterSpacing: '0.01em',
          }}>
            {instalacion.nombre}
          </span>
          {esDistrib && (
            <span style={{
              fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 700,
              color: '#F57C20', letterSpacing: '0.06em',
              padding: '2px 6px', borderRadius: 999,
              background: 'rgba(245,124,32,0.12)',
              border: '1px solid rgba(245,124,32,0.25)',
            }}>
              DIST
            </span>
          )}
        </div>

        {vacanteCritica.length > 0 ? (
          <div style={{
            fontFamily: 'var(--font-body)', fontSize: 11,
            color: estado === 'rojo' ? '#EB5757' : '#F2994A',
            marginTop: 3, fontWeight: 600,
          }}>
            ⚠ Vacante: {vacanteCritica.join(', ')}
          </div>
        ) : (
          <div style={{
            fontFamily: 'var(--font-body)', fontSize: 11,
            color: 'var(--color-text-muted)', marginTop: 3,
          }}>
            {(lideres || []).length} líderes registrados
          </div>
        )}
      </div>

      <ChevronRight size={16} color="var(--color-text-muted)" />
    </motion.button>
  )
}

// ── Pantalla principal ────────────────────────────────────────────────────────
export default function LideresAdminScreen() {
  const navigate = useNavigate()
  const { lidereresPorInstalacion, cargarTodos, loading, error, errorCode } = useLideresStore()

  const [busqueda,   setBusqueda]   = useState('')
  const [filtroDist, setFiltroDist] = useState('todas')  // 'todas' | 'sucursales' | 'distribuidoras'

  useEffect(() => {
    if (!IS_DEV_MODE) cargarTodos()
  }, [cargarTodos])

  const mapa = IS_DEV_MODE ? DEMO_LIDERES : lidereresPorInstalacion

  // Filtrar instalaciones
  const instalacionesFiltradas = INSTALACIONES_MRC.filter(inst => {
    const coincideBusqueda = inst.nombre.toLowerCase().includes(busqueda.toLowerCase())
    const coincideFiltro   =
      filtroDist === 'todas' ? true :
      filtroDist === 'sucursales' ? inst.tipo === 'Sucursal' :
      inst.tipo === 'Distribuidora'
    return coincideBusqueda && coincideFiltro
  })

  // Conteo de alertas
  const totalAlertas = INSTALACIONES_MRC.filter(inst =>
    semaforo(mapa[inst.nombre]) !== 'verde'
  ).length

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--color-navy)' }}>
      <AppHeader title="Gestión de Líderes" />

      <div style={{
        flex: 1, overflowY: 'auto',
        padding: '16px 16px',
        paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
        display: 'flex', flexDirection: 'column', gap: 14,
      }}>

        {/* ── Resumen ── */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', gap: 10 }}
        >
          {/* Total */}
          <div style={{
            flex: 1, background: 'var(--color-navy-mid)',
            border: '1px solid var(--color-border)',
            borderRadius: 12, padding: '12px 14px',
            display: 'flex', flexDirection: 'column', gap: 2,
          }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'var(--color-text-primary)' }}>
              {INSTALACIONES_MRC.length}
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--color-text-muted)' }}>
              Instalaciones
            </div>
          </div>
          {/* Alertas */}
          <div style={{
            flex: 1, background: totalAlertas > 0 ? 'rgba(235,87,87,0.08)' : 'rgba(39,174,96,0.08)',
            border: `1px solid ${totalAlertas > 0 ? 'rgba(235,87,87,0.25)' : 'rgba(39,174,96,0.25)'}`,
            borderRadius: 12, padding: '12px 14px',
            display: 'flex', flexDirection: 'column', gap: 2,
          }}>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800,
              color: totalAlertas > 0 ? '#EB5757' : '#27AE60',
            }}>
              {loading && !IS_DEV_MODE ? '...' : totalAlertas}
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--color-text-muted)' }}>
              Con vacantes
            </div>
          </div>
          {/* Refresh */}
          <button
            onClick={() => { if (!IS_DEV_MODE) cargarTodos() }}
            disabled={loading}
            style={{
              width: 52, borderRadius: 12, cursor: loading ? 'wait' : 'pointer',
              background: 'var(--color-navy-mid)', border: '1px solid var(--color-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--color-text-muted)',
            }}
            title="Actualizar"
          >
            {loading
              ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
              : <RefreshCw size={16} />
            }
          </button>
        </motion.div>

        {/* ── Buscador ── */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.04 }}
          style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
        >
          <div style={{ position: 'relative' }}>
            <Search size={14} color="var(--color-text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Buscar instalación..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              style={{
                width: '100%', padding: '10px 12px 10px 34px', borderRadius: 8,
                background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)', fontFamily: 'var(--font-body)', fontSize: 13,
                outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
          {/* Filtro tipo */}
          <div style={{ display: 'flex', gap: 6 }}>
            {['todas', 'sucursales', 'distribuidoras'].map(f => (
              <button key={f} onClick={() => setFiltroDist(f)} style={{
                flex: 1, padding: '7px', borderRadius: 8, cursor: 'pointer',
                background: filtroDist === f ? 'rgba(96,165,250,0.15)' : 'var(--color-surface)',
                border: `1px solid ${filtroDist === f ? 'rgba(96,165,250,0.4)' : 'var(--color-border)'}`,
                fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: filtroDist === f ? 700 : 400,
                color: filtroDist === f ? '#60A5FA' : 'var(--color-text-muted)',
                textTransform: 'capitalize',
              }}>
                {f}
              </button>
            ))}
          </div>
        </motion.div>

        {/* ── Aviso de configuración inicial (listas SharePoint no creadas) ── */}
        {error && !loading && errorCode === 'SP_SETUP_REQUIRED' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{
            background: 'rgba(242,153,74,0.08)', border: '1px solid rgba(242,153,74,0.3)',
            borderRadius: 10, padding: '14px 16px',
            display: 'flex', flexDirection: 'column', gap: 6,
          }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: '#F2994A' }}>
              ⚙ Configuración inicial pendiente
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(242,153,74,0.85)', lineHeight: 1.5 }}>
              Las listas <strong>"Líderes MRC"</strong> e <strong>"Historial Líderes MRC"</strong> aún no existen en SharePoint.
              Cristian Valverde debe crearlas desde su cuenta (tiene permisos de propietario del sitio).
              Mientras tanto puedes navegar por las instalaciones.
            </div>
          </motion.div>
        )}

        {/* ── Error genérico ── */}
        {error && !loading && errorCode !== 'SP_SETUP_REQUIRED' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{
            background: 'rgba(235,87,87,0.08)', border: '1px solid rgba(235,87,87,0.25)',
            borderRadius: 10, padding: '12px 16px',
            fontFamily: 'var(--font-body)', fontSize: 13, color: '#EB5757',
          }}>
            Error al cargar datos: {error}
          </motion.div>
        )}

        {/* ── Lista de instalaciones ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {instalacionesFiltradas.map((inst, idx) => (
            <motion.div
              key={inst.nombre}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.02 }}
            >
              <InstalacionCard
                instalacion={inst}
                lideres={mapa[inst.nombre]}
                onClick={() => navigate(`/admin/lideres/${encodeURIComponent(inst.nombre)}`)}
              />
            </motion.div>
          ))}

          {instalacionesFiltradas.length === 0 && (
            <div style={{
              textAlign: 'center', padding: '32px 0',
              fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-text-muted)',
            }}>
              No se encontraron instalaciones.
            </div>
          )}
        </div>

        {/* ── Leyenda semáforo ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          style={{
            background: 'var(--color-surface)', borderRadius: 10, padding: '12px 14px',
            display: 'flex', flexDirection: 'column', gap: 6,
          }}
        >
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>
            Semáforo
          </div>
          {[
            { dot: '#27AE60', texto: 'Todos los cargos críticos cubiertos' },
            { dot: '#F2994A', texto: '1 cargo crítico vacante' },
            { dot: '#EB5757', texto: '2+ cargos críticos vacantes o sin líderes' },
          ].map(({ dot, texto }) => (
            <div key={texto} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: dot, flexShrink: 0 }} />
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--color-text-muted)' }}>{texto}</span>
            </div>
          ))}
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--color-text-muted)', marginTop: 2, fontStyle: 'italic' }}>
            Cargos críticos: {CARGOS_CRITICOS.join(', ')}
          </div>
        </motion.div>

      </div>
    </div>
  )
}
