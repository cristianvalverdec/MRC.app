// ── LideresScreen.jsx ─────────────────────────────────────────────────────────
// Vista de lectura del directorio de líderes para perfiles con nivel ≥ 2.
// Cada usuario ve solo su instalación (excepción: nivel 7+ ve todas).
// Incluye botón para reportar información desactualizada al administrador.

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Building2, AlertCircle, ChevronDown, ChevronUp, Send, Loader, Users, ArrowLeft } from 'lucide-react'
import AppHeader from '../components/layout/AppHeader'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import useUserStore from '../store/userStore'
import useLideresStore from '../store/lideresStore'
import { CARGOS_MRC, nivelPuedeVerDirectorio } from '../config/mrcCatalog'
import { IS_DEV_MODE } from '../services/sharepointData'

// ── Constantes de estilo ──────────────────────────────────────────────────────
const NIVEL_COLORES = {
  1: '#6B7280', 2: '#3B82F6', 3: '#0891B2',
  4: '#7C3AED', 5: '#D97706', 6: '#DC2626',
  7: '#DB2777', 8: '#059669', 9: '#065F46', 10: '#1B2A4A',
}

// ── Componente: tarjeta de un líder ──────────────────────────────────────────
function LiderCard({ lider }) {
  const color = NIVEL_COLORES[lider.nivelJerarquico] || 'var(--color-text-muted)'

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: 'var(--color-navy-mid)',
        border: '1px solid var(--color-border)',
        borderRadius: 12,
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
      }}
    >
      {/* Avatar inicial */}
      <div style={{
        width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
        background: `${color}22`,
        border: `2px solid ${color}55`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{
          fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 800,
          color,
        }}>
          {lider.nombre ? lider.nombre.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() : '?'}
        </span>
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700,
          color: 'var(--color-text-primary)', letterSpacing: '0.01em',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {lider.nombre || 'Sin nombre'}
        </div>
        <div style={{
          fontFamily: 'var(--font-body)', fontSize: 12,
          color, fontWeight: 600, marginTop: 2,
        }}>
          {lider.cargoMRC}
        </div>
        {lider.email && (
          <div style={{
            fontFamily: 'var(--font-body)', fontSize: 11,
            color: 'var(--color-text-muted)', marginTop: 3,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {lider.email}
          </div>
        )}
      </div>

      {/* Botón contactar */}
      {lider.email && (
        <a
          href={`mailto:${lider.email}`}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 36, height: 36, borderRadius: 8, flexShrink: 0,
            background: 'rgba(96,165,250,0.1)',
            border: '1px solid rgba(96,165,250,0.25)',
            color: '#60A5FA', textDecoration: 'none',
          }}
          title={`Enviar email a ${lider.nombre}`}
        >
          <Mail size={15} />
        </a>
      )}
    </motion.div>
  )
}

// ── Componente: modal de reporte ──────────────────────────────────────────────
const TIPOS_REPORTE = [
  'Un cargo está vacante',
  'El nombre de un líder cambió',
  'El email de un líder cambió',
  'Otro',
]

function ModalReporte({ instalacion, onClose, onEnviar }) {
  const [tipo,    setTipo]    = useState('')
  const [cargo,   setCargo]   = useState('')
  const [detalle, setDetalle] = useState('')
  const [sending, setSending] = useState(false)
  const [enviado, setEnviado] = useState(false)

  const handleEnviar = async () => {
    if (!tipo) return
    setSending(true)
    try {
      await onEnviar({ instalacion, tipo, cargoAfectado: cargo, detalle })
      setEnviado(true)
    } finally {
      setSending(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        padding: '0 0 env(safe-area-inset-bottom, 0px)',
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 520,
          background: 'var(--color-navy-mid)',
          borderRadius: '20px 20px 0 0',
          padding: '24px 20px 32px',
          display: 'flex', flexDirection: 'column', gap: 16,
        }}
      >
        {/* Handle */}
        <div style={{ width: 36, height: 4, borderRadius: 999, background: 'var(--color-border)', margin: '0 auto -8px' }} />

        {!enviado ? (
          <>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 800, color: 'var(--color-text-primary)' }}>
              Reportar actualización
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-text-muted)' }}>
              Ayúdanos a mantener el directorio actualizado. El administrador recibirá tu reporte.
            </div>

            {/* Tipo */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                ¿Qué necesita actualizarse?
              </span>
              {TIPOS_REPORTE.map(t => (
                <button key={t} onClick={() => setTipo(t)} style={{
                  padding: '10px 14px', borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                  background: tipo === t ? 'rgba(96,165,250,0.15)' : 'var(--color-surface)',
                  border: `1px solid ${tipo === t ? 'rgba(96,165,250,0.4)' : 'var(--color-border)'}`,
                  fontFamily: 'var(--font-body)', fontSize: 13,
                  color: tipo === t ? '#60A5FA' : 'var(--color-text-primary)',
                  fontWeight: tipo === t ? 600 : 400,
                }}>
                  {t}
                </button>
              ))}
            </div>

            {/* Cargo afectado */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Cargo afectado (opcional)
              </span>
              <select
                value={cargo}
                onChange={e => setCargo(e.target.value)}
                style={{
                  padding: '10px 12px', borderRadius: 8,
                  background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                  color: 'var(--color-text-primary)', fontFamily: 'var(--font-body)', fontSize: 13,
                  outline: 'none',
                }}
              >
                <option value="">Seleccionar cargo...</option>
                {CARGOS_MRC.map(c => (
                  <option key={c.nivel} value={c.nombre}>{c.nombre}</option>
                ))}
              </select>
            </div>

            {/* Detalle */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Detalle adicional
              </span>
              <textarea
                value={detalle}
                onChange={e => setDetalle(e.target.value)}
                placeholder="Ej: El nombre correcto es..."
                rows={3}
                style={{
                  padding: '10px 12px', borderRadius: 8, resize: 'none',
                  background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                  color: 'var(--color-text-primary)', fontFamily: 'var(--font-body)', fontSize: 13,
                  outline: 'none',
                }}
              />
            </div>

            <button
              onClick={handleEnviar}
              disabled={!tipo || sending}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '13px', borderRadius: 10, cursor: (!tipo || sending) ? 'not-allowed' : 'pointer',
                background: (!tipo || sending) ? 'rgba(96,165,250,0.08)' : 'rgba(96,165,250,0.15)',
                border: '1px solid rgba(96,165,250,0.3)',
                fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700,
                letterSpacing: '0.06em', color: '#60A5FA',
                opacity: !tipo ? 0.5 : 1,
              }}
            >
              {sending ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={14} />}
              {sending ? 'ENVIANDO...' : 'ENVIAR REPORTE'}
            </button>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '16px 0', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
            <div style={{ fontSize: 40 }}>✅</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 800, color: 'var(--color-text-primary)' }}>
              Reporte enviado
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-text-muted)' }}>
              El administrador revisará y actualizará el sistema a la brevedad.
            </div>
            <button onClick={onClose} style={{
              padding: '12px 32px', borderRadius: 10, cursor: 'pointer', marginTop: 8,
              background: 'rgba(39,174,96,0.12)', border: '1px solid rgba(39,174,96,0.3)',
              fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700,
              letterSpacing: '0.06em', color: '#27AE60',
            }}>
              CERRAR
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

// ── Pantalla principal ─────────────────────────────────────────────────────────
export default function LideresScreen() {
  const { role, mrcNivel, instalacionMRC, email } = useUserStore()
  const { cargarInstalacion, lideresActivos, loading, error, enviarReporte } = useLideresStore()

  const [mostrarReporte, setMostrarReporte] = useState(false)

  // Instalación a mostrar: la del perfil MRC del usuario
  const instalacion = instalacionMRC || ''
  const puedeVer    = role === 'admin' || nivelPuedeVerDirectorio(mrcNivel, role)

  useEffect(() => {
    if (!puedeVer || !instalacion) return
    if (IS_DEV_MODE) return  // en dev no hay SharePoint
    cargarInstalacion(instalacion)
  }, [instalacion, puedeVer, cargarInstalacion])

  // Datos de demo para dev mode
  const lideresDemo = IS_DEV_MODE ? [
    { id: '1', nombre: 'Juan Pérez González',  cargoMRC: 'Jefe de Zona',        nivelJerarquico: 6, email: 'jperez@agrosuper.com',    instalacion },
    { id: '2', nombre: 'María Soto Arenas',    cargoMRC: 'Jefe de Frigorífico', nivelJerarquico: 3, email: 'msoto@agrosuper.com',     instalacion },
    { id: '3', nombre: 'Luis Vega Contreras',  cargoMRC: 'Jefe de Operaciones', nivelJerarquico: 4, email: 'lvega@agrosuper.com',     instalacion },
    { id: '4', nombre: 'Rosa Gil Fuentes',     cargoMRC: 'Jefe Administrativo', nivelJerarquico: 5, email: 'rgil@agrosuper.com',      instalacion },
    { id: '5', nombre: 'Pedro Díaz Muñoz',     cargoMRC: 'Jefe de Despacho',    nivelJerarquico: 2, email: 'pdiaz@agrosuper.com',     instalacion },
    { id: '6', nombre: 'Carla Muñoz Reyes',    cargoMRC: 'Jefe de Despacho',    nivelJerarquico: 2, email: 'cmunoz@agrosuper.com',    instalacion },
    { id: '7', nombre: 'Felipe Rojas Salinas', cargoMRC: 'Jefe de Despacho',    nivelJerarquico: 2, email: 'frojas@agrosuper.com',    instalacion },
  ] : []

  const lideres = IS_DEV_MODE ? lideresDemo : lideresActivos

  // Agrupar por nivel (mayor a menor para mostrar jefaturas primero)
  const agrupados = lideres.reduce((acc, l) => {
    if (!acc[l.cargoMRC]) acc[l.cargoMRC] = []
    acc[l.cargoMRC].push(l)
    return acc
  }, {})
  const cargosOrdenados = CARGOS_MRC
    .filter(c => agrupados[c.nombre])
    .sort((a, b) => b.nivel - a.nivel)  // mayor nivel primero

  // Sin acceso
  if (!puedeVer) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--color-navy)' }}>
        <AppHeader title="Líderes" />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 }}>
          <AlertCircle size={40} color="var(--color-text-muted)" />
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--color-text-secondary)', textAlign: 'center' }}>
            Acceso no disponible
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-text-muted)', textAlign: 'center' }}>
            Esta sección está disponible desde el cargo de Jefe de Despacho en adelante.
          </div>
        </div>
      </div>
    )
  }

  // Sin instalación asignada
  if (!instalacion && !IS_DEV_MODE) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--color-navy)' }}>
        <AppHeader title="Líderes" />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 }}>
          <Building2 size={40} color="var(--color-text-muted)" />
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--color-text-secondary)', textAlign: 'center' }}>
            Sin instalación asignada
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-text-muted)', textAlign: 'center' }}>
            El administrador aún no ha registrado tu instalación en el sistema MRC.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--color-navy)' }}>
      <AppHeader title="Líderes de Instalación" />

      <div style={{
        flex: 1, padding: '20px 16px',
        paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
        overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16,
        maxWidth: 'var(--content-max-w)', marginLeft: 'auto', marginRight: 'auto', width: '100%', boxSizing: 'border-box',
      }}>

        {/* ── Cabecera con instalación ── */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'var(--color-navy-mid)',
            border: '1px solid var(--color-border)',
            borderRadius: 12, padding: '14px 16px',
            display: 'flex', alignItems: 'center', gap: 12,
          }}
        >
          <div style={{
            width: 38, height: 38, borderRadius: 10, flexShrink: 0,
            background: 'rgba(245,124,32,0.12)',
            border: '1px solid rgba(245,124,32,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Building2 size={18} color="var(--color-orange)" />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Tu instalación
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 800, color: 'var(--color-text-primary)', letterSpacing: '0.01em' }}>
              {IS_DEV_MODE ? 'Demo — Miraflores' : instalacion}
            </div>
          </div>
        </motion.div>

        {/* ── Loading ── */}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
            <LoadingSpinner size={28} label="Cargando líderes..." />
          </div>
        )}

        {/* ── Error ── */}
        {error && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              background: 'rgba(235,87,87,0.08)', border: '1px solid rgba(235,87,87,0.25)',
              borderRadius: 10, padding: '12px 16px',
              fontFamily: 'var(--font-body)', fontSize: 13, color: '#EB5757',
            }}
          >
            No se pudo cargar el directorio. Verifica tu conexión.
          </motion.div>
        )}

        {/* ── Lista de líderes agrupada por cargo ── */}
        {!loading && !error && (
          <>
            {cargosOrdenados.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  textAlign: 'center', padding: '32px 0',
                  fontFamily: 'var(--font-body)', fontSize: 13,
                  color: 'var(--color-text-muted)',
                }}
              >
                No hay líderes registrados para esta instalación.
              </motion.div>
            ) : (
              cargosOrdenados.map((cargo, idx) => (
                <motion.div
                  key={cargo.nombre}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
                >
                  {/* Label de cargo */}
                  <div style={{
                    fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700,
                    color: NIVEL_COLORES[cargo.nivel] || 'var(--color-text-muted)',
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                    paddingLeft: 4,
                  }}>
                    {cargo.nombre}
                  </div>
                  {agrupados[cargo.nombre].map(l => (
                    <LiderCard key={l.id} lider={l} />
                  ))}
                </motion.div>
              ))
            )}
          </>
        )}

        {/* ── Botón reportar actualización ── */}
        {!loading && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            onClick={() => setMostrarReporte(true)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              padding: '13px', borderRadius: 12, cursor: 'pointer', marginTop: 4,
              background: 'rgba(242,153,74,0.06)',
              border: '1px solid rgba(242,153,74,0.25)',
              fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700,
              letterSpacing: '0.06em', color: 'var(--color-warning)',
              width: '100%',
            }}
          >
            <AlertCircle size={14} />
            ¿INFORMACIÓN DESACTUALIZADA? REPÓRTALA
          </motion.button>
        )}

      </div>

      {/* ── Modal de reporte ── */}
      <AnimatePresence>
        {mostrarReporte && (
          <ModalReporte
            instalacion={IS_DEV_MODE ? 'Demo — Miraflores' : instalacion}
            onClose={() => setMostrarReporte(false)}
            onEnviar={async (reporte) => {
              if (!IS_DEV_MODE) await enviarReporte(reporte, email)
              setMostrarReporte(false)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
