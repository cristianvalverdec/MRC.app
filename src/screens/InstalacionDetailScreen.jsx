// ── InstalacionDetailScreen.jsx ───────────────────────────────────────────────
// Detalle de una instalación para el perfil administrador.
// Permite ver, agregar, editar y dar de baja líderes.
// Muestra el historial completo de cambios de la instalación.

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  UserPlus, Pencil, Trash2, ChevronDown, ChevronUp, Loader,
  History, Mail, AlertTriangle, CheckCircle, X,
} from 'lucide-react'
import AppHeader from '../components/layout/AppHeader'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import useUserStore from '../store/userStore'
import useLideresStore from '../store/lideresStore'
import { CARGOS_MRC, INSTALACIONES_MRC, CARGOS_CRITICOS } from '../config/mrcCatalog'
import { IS_DEV_MODE } from '../services/sharepointData'

// ── Helpers ───────────────────────────────────────────────────────────────────
const NIVEL_COLORES = {
  1: '#6B7280', 2: '#3B82F6', 3: '#0891B2',
  4: '#7C3AED', 5: '#D97706', 6: '#DC2626',
  7: '#DB2777', 8: '#059669', 9: '#065F46', 10: '#1B2A4A',
}

function nivelDeCargo(cargoNombre) {
  return CARGOS_MRC.find(c => c.nombre === cargoNombre)?.nivel ?? 0
}

function extraerPin(rut = '') {
  const limpio = rut.split('-')[0].replace(/\./g, '').trim()
  return limpio.length >= 4 ? limpio.slice(-4) : limpio.padStart(4, '0')
}

function formatFecha(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch { return iso }
}

const TIPO_CAMBIO_LABEL = {
  asignacion:   { label: 'Asignación',   color: '#27AE60' },
  modificacion: { label: 'Modificación', color: '#3B82F6' },
  baja:         { label: 'Baja',         color: '#EB5757' },
  reporte:      { label: 'Reporte',      color: '#F2994A' },
}

// ── Modal para crear / editar líder ──────────────────────────────────────────
function ModalLider({ lider, instalacion, onClose, onGuardar }) {
  const isEditing = !!lider

  const [nombre,  setNombre]  = useState(lider?.nombre  || '')
  const [email,   setEmail]   = useState(lider?.email   || '')
  const [cargo,   setCargo]   = useState(lider?.cargoMRC || '')
  const [rut,     setRut]     = useState(lider?.rut     || '')
  const [saving,  setSaving]  = useState(false)
  const [errores, setErrores] = useState({})

  const pin = rut ? extraerPin(rut) : ''

  const instInfo = INSTALACIONES_MRC.find(i => i.nombre === instalacion)

  function validar() {
    const e = {}
    if (!nombre.trim())          e.nombre = 'El nombre es obligatorio'
    if (!cargo)                  e.cargo  = 'Selecciona un cargo'
    if (email && !email.includes('@')) e.email = 'Email inválido'
    return e
  }

  const handleGuardar = async () => {
    const e = validar()
    if (Object.keys(e).length > 0) { setErrores(e); return }
    setSaving(true)
    try {
      await onGuardar({
        nombre:           nombre.trim(),
        email:            email.trim().toLowerCase(),
        cargoMRC:         cargo,
        nivelJerarquico:  nivelDeCargo(cargo),
        instalacion,
        tipoInstalacion:  instInfo?.tipo || 'Sucursal',
        rut:              rut.trim(),
        pin,
      })
      onClose()
    } catch (err) {
      setErrores({ general: err.message || 'Error al guardar' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.65)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
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
          padding: '24px 20px calc(32px + env(safe-area-inset-bottom, 0px))',
          display: 'flex', flexDirection: 'column', gap: 14,
          maxHeight: '90dvh', overflowY: 'auto',
        }}
      >
        {/* Handle */}
        <div style={{ width: 36, height: 4, borderRadius: 999, background: 'var(--color-border)', margin: '0 auto -6px' }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 800, color: 'var(--color-text-primary)' }}>
            {isEditing ? 'Editar líder' : 'Agregar líder'}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {/* Instalación (read-only) */}
        <div style={{
          padding: '10px 14px', borderRadius: 8,
          background: 'rgba(245,124,32,0.08)', border: '1px solid rgba(245,124,32,0.2)',
          fontFamily: 'var(--font-body)', fontSize: 13,
          color: 'var(--color-orange)', fontWeight: 600,
        }}>
          📍 {instalacion} {instInfo?.tipo === 'Distribuidora' ? '· Distribuidora' : ''}
        </div>

        {/* Campos */}
        {[
          { label: 'Nombre completo *', value: nombre, setter: setNombre, key: 'nombre', placeholder: 'Ej: Juan Pérez González', type: 'text' },
          { label: 'Email',             value: email,  setter: setEmail,  key: 'email',  placeholder: 'juan.perez@agrosuper.com', type: 'email' },
          { label: 'RUT',               value: rut,    setter: setRut,    key: 'rut',    placeholder: 'Ej: 12.345.678-9',         type: 'text' },
        ].map(({ label, value, setter, key, placeholder, type }) => (
          <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {label}
            </span>
            <input
              type={type}
              value={value}
              placeholder={placeholder}
              onChange={e => { setter(e.target.value); setErrores(p => ({ ...p, [key]: '' })) }}
              style={{
                padding: '10px 12px', borderRadius: 8,
                background: errores[key] ? 'rgba(235,87,87,0.06)' : 'var(--color-surface)',
                border: `1px solid ${errores[key] ? 'rgba(235,87,87,0.4)' : 'var(--color-border)'}`,
                color: 'var(--color-text-primary)', fontFamily: 'var(--font-body)', fontSize: 13,
                outline: 'none',
              }}
            />
            {errores[key] && <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#EB5757' }}>{errores[key]}</span>}
          </div>
        ))}

        {/* PIN derivado */}
        {rut && (
          <div style={{
            padding: '8px 14px', borderRadius: 8,
            background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.2)',
            fontFamily: 'var(--font-body)', fontSize: 12, color: '#60A5FA',
          }}>
            🔑 PIN asignado: <strong>{pin}</strong> (últimos 4 dígitos del RUT)
          </div>
        )}

        {/* Cargo */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Cargo MRC *
          </span>
          <select
            value={cargo}
            onChange={e => { setCargo(e.target.value); setErrores(p => ({ ...p, cargo: '' })) }}
            style={{
              padding: '10px 12px', borderRadius: 8,
              background: errores.cargo ? 'rgba(235,87,87,0.06)' : 'var(--color-surface)',
              border: `1px solid ${errores.cargo ? 'rgba(235,87,87,0.4)' : 'var(--color-border)'}`,
              color: 'var(--color-text-primary)', fontFamily: 'var(--font-body)', fontSize: 13,
              outline: 'none',
            }}
          >
            <option value="">Seleccionar cargo...</option>
            {CARGOS_MRC.map(c => (
              <option key={c.nivel} value={c.nombre}>
                Nivel {c.nivel} — {c.nombre}
              </option>
            ))}
          </select>
          {errores.cargo && <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#EB5757' }}>{errores.cargo}</span>}
        </div>

        {/* Error general */}
        {errores.general && (
          <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(235,87,87,0.08)', border: '1px solid rgba(235,87,87,0.25)', fontFamily: 'var(--font-body)', fontSize: 13, color: '#EB5757' }}>
            {errores.general}
          </div>
        )}

        {/* Botón guardar */}
        <button
          onClick={handleGuardar}
          disabled={saving}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '13px', borderRadius: 10, cursor: saving ? 'wait' : 'pointer',
            background: saving ? 'rgba(39,174,96,0.08)' : 'rgba(39,174,96,0.15)',
            border: '1px solid rgba(39,174,96,0.35)',
            fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700,
            letterSpacing: '0.06em', color: '#27AE60',
          }}
        >
          {saving
            ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />
            : <CheckCircle size={14} />
          }
          {saving ? 'GUARDANDO...' : (isEditing ? 'GUARDAR CAMBIOS' : 'AGREGAR LÍDER')}
        </button>
      </motion.div>
    </motion.div>
  )
}

// ── Tarjeta de líder (modo admin) ─────────────────────────────────────────────
function LiderAdminCard({ lider, onEditar, onBaja }) {
  const color = NIVEL_COLORES[lider.nivelJerarquico] || 'var(--color-text-muted)'

  return (
    <div style={{
      background: 'var(--color-navy-mid)',
      border: '1px solid var(--color-border)',
      borderRadius: 12, padding: '12px 14px',
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      {/* Avatar */}
      <div style={{
        width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
        background: `${color}22`, border: `2px solid ${color}55`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 800, color }}>
          {lider.nombre ? lider.nombre.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() : '?'}
        </span>
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {lider.nombre || 'Sin nombre'}
        </div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color, fontWeight: 600, marginTop: 1 }}>
          {lider.cargoMRC}
        </div>
        {lider.email && (
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--color-text-muted)', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {lider.email}
          </div>
        )}
        {lider.pin && (
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'rgba(96,165,250,0.7)', marginTop: 1 }}>
            PIN: {lider.pin}
          </div>
        )}
      </div>

      {/* Acciones */}
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        <button
          onClick={() => onEditar(lider)}
          title="Editar"
          style={{
            width: 32, height: 32, borderRadius: 7, cursor: 'pointer',
            background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#60A5FA',
          }}
        >
          <Pencil size={13} />
        </button>
        <button
          onClick={() => onBaja(lider)}
          title="Dar de baja"
          style={{
            width: 32, height: 32, borderRadius: 7, cursor: 'pointer',
            background: 'rgba(235,87,87,0.08)', border: '1px solid rgba(235,87,87,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#EB5757',
          }}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}

// ── Pantalla principal ────────────────────────────────────────────────────────
export default function InstalacionDetailScreen() {
  const { instalacion: instalacionParam } = useParams()
  const instalacion = decodeURIComponent(instalacionParam || '')

  const { email: adminEmail } = useUserStore()
  const {
    cargarInstalacion, lideresActivos, loading, error, errorCode,
    crear, actualizar, darBaja,
    cargarHistorial, historialPorInstalacion, loadingHistorial,
  } = useLideresStore()

  const [modalLider,    setModalLider]    = useState(null)   // null | 'nuevo' | objeto líder
  const [confirmBaja,   setConfirmBaja]   = useState(null)   // objeto líder a dar de baja
  const [verHistorial,  setVerHistorial]  = useState(false)
  const [bajando,       setBajando]       = useState(false)

  const instInfo = INSTALACIONES_MRC.find(i => i.nombre === instalacion)

  // Datos demo
  const lideresDemo = [
    { id: '1', nombre: 'Juan Pérez González',  cargoMRC: 'Jefe de Zona',        nivelJerarquico: 6, email: 'jperez@agrosuper.com',  rut: '12.345.678-9', pin: '5678', instalacion },
    { id: '2', nombre: 'María Soto Arenas',    cargoMRC: 'Jefe de Frigorífico', nivelJerarquico: 3, email: 'msoto@agrosuper.com',   rut: '13.456.789-0', pin: '6789', instalacion },
    { id: '3', nombre: 'Luis Vega Contreras',  cargoMRC: 'Jefe de Operaciones', nivelJerarquico: 4, email: 'lvega@agrosuper.com',   rut: '14.567.890-1', pin: '7890', instalacion },
    { id: '4', nombre: 'Pedro Díaz Muñoz',     cargoMRC: 'Jefe de Despacho',    nivelJerarquico: 2, email: 'pdiaz@agrosuper.com',   rut: '15.678.901-2', pin: '8901', instalacion },
  ]

  const historialDemo = [
    { id: 'h1', instalacion, cargoMRC: 'Jefe de Zona', nombreAnterior: 'Rosa Campos', nombreNuevo: 'Juan Pérez González', emailAnterior: 'rcampos@agrosuper.com', emailNuevo: 'jperez@agrosuper.com', tipoCambio: 'modificacion', cambiadoPor: 'admin@agrosuper.com', fecha: new Date(Date.now() - 86400000 * 3).toISOString() },
    { id: 'h2', instalacion, cargoMRC: 'Jefe de Zona', nombreAnterior: '', nombreNuevo: 'Rosa Campos', emailAnterior: '', emailNuevo: 'rcampos@agrosuper.com', tipoCambio: 'asignacion', cambiadoPor: 'admin@agrosuper.com', fecha: new Date(Date.now() - 86400000 * 90).toISOString() },
  ]

  useEffect(() => {
    if (!IS_DEV_MODE && instalacion) cargarInstalacion(instalacion)
  }, [instalacion, cargarInstalacion])

  const handleVerHistorial = useCallback(() => {
    setVerHistorial(v => {
      if (!v && !IS_DEV_MODE) cargarHistorial(instalacion)
      return !v
    })
  }, [instalacion, cargarHistorial])

  const lideres   = IS_DEV_MODE ? lideresDemo  : lideresActivos
  const historial = IS_DEV_MODE ? historialDemo : (historialPorInstalacion[instalacion] || [])

  // Cargos presentes y vacantes críticos
  const cargosPresentes = lideres.map(l => l.cargoMRC)
  const vacantesCriticas = CARGOS_CRITICOS.filter(c => !cargosPresentes.includes(c))

  // Ordenar líderes por nivel desc
  const lideresOrdenados = [...lideres].sort((a, b) => b.nivelJerarquico - a.nivelJerarquico)

  const handleGuardar = async (datos) => {
    if (IS_DEV_MODE) return
    if (modalLider && modalLider !== 'nuevo') {
      await actualizar(modalLider.id, datos, modalLider, adminEmail)
    } else {
      await crear(datos, adminEmail)
    }
    // Forzar re-fetch desde SharePoint para reflejar el estado real
    // (la respuesta del POST no incluye $expand=fields, así que el caché local queda incompleto)
    await cargarInstalacion(instalacion, true)
  }

  const handleConfirmarBaja = async () => {
    if (!confirmBaja || IS_DEV_MODE) { setConfirmBaja(null); return }
    setBajando(true)
    try {
      await darBaja(confirmBaja.id, confirmBaja, adminEmail)
      // Forzar re-fetch tras dar de baja
      await cargarInstalacion(instalacion, true)
    } finally {
      setBajando(false)
      setConfirmBaja(null)
    }
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--color-navy)' }}>
      <AppHeader title={instalacion} />

      <div style={{
        flex: 1, overflowY: 'auto', padding: '16px 16px',
        paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
        display: 'flex', flexDirection: 'column', gap: 14,
      }}>

        {/* ── Cabecera instalación ── */}
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} style={{
          background: 'var(--color-navy-mid)', border: '1px solid var(--color-border)',
          borderRadius: 12, padding: '12px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: 'var(--color-text-primary)' }}>
              {instalacion}
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
              {instInfo?.tipo || 'Sucursal'} · {instInfo?.zona || ''}
            </div>
          </div>
          <button
            onClick={() => setModalLider('nuevo')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px',
              borderRadius: 8, cursor: 'pointer',
              background: 'rgba(39,174,96,0.12)', border: '1px solid rgba(39,174,96,0.3)',
              fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700,
              letterSpacing: '0.06em', color: '#27AE60',
            }}
          >
            <UserPlus size={13} /> AGREGAR
          </button>
        </motion.div>

        {/* ── Alertas de vacantes ── */}
        {vacantesCriticas.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{
            background: 'rgba(242,153,74,0.08)', border: '1px solid rgba(242,153,74,0.3)',
            borderRadius: 10, padding: '10px 14px',
            display: 'flex', alignItems: 'flex-start', gap: 10,
          }}>
            <AlertTriangle size={15} color="#F2994A" style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#F2994A' }}>
              <strong>Cargos críticos vacantes:</strong> {vacantesCriticas.join(', ')}
            </div>
          </motion.div>
        )}

        {/* ── Aviso de configuración inicial ── */}
        {!loading && error && errorCode === 'SP_SETUP_REQUIRED' && !IS_DEV_MODE && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{
            background: 'rgba(242,153,74,0.08)', border: '1px solid rgba(242,153,74,0.3)',
            borderRadius: 10, padding: '12px 14px',
            display: 'flex', flexDirection: 'column', gap: 4,
          }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, color: '#F2994A' }}>
              ⚙ Configuración inicial pendiente
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(242,153,74,0.85)', lineHeight: 1.5 }}>
              Cristian Valverde debe crear las listas en SharePoint antes de poder registrar líderes.
            </div>
          </motion.div>
        )}

        {/* ── Loading ── */}
        {loading && !IS_DEV_MODE && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
            <LoadingSpinner size={24} label="Cargando..." />
          </div>
        )}

        {/* ── Lista de líderes ── */}
        {!loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{
              fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700,
              color: 'var(--color-text-muted)', textTransform: 'uppercase',
              letterSpacing: '0.08em', paddingLeft: 2,
            }}>
              Líderes registrados ({lideres.length})
            </div>
            {lideresOrdenados.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-text-muted)' }}>
                No hay líderes registrados. Agrega el primero con el botón de arriba.
              </div>
            ) : (
              lideresOrdenados.map((l, idx) => (
                <motion.div key={l.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}>
                  <LiderAdminCard
                    lider={l}
                    onEditar={lider => setModalLider(lider)}
                    onBaja={lider => setConfirmBaja(lider)}
                  />
                </motion.div>
              ))
            )}
          </div>
        )}

        {/* ── Historial de cambios ── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{
          background: 'var(--color-navy-mid)', border: '1px solid var(--color-border)',
          borderRadius: 12, overflow: 'hidden',
        }}>
          <button
            onClick={handleVerHistorial}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px', background: 'transparent', border: 'none', cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <History size={14} color="var(--color-text-muted)" />
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Historial de cambios
              </span>
            </div>
            {verHistorial
              ? <ChevronUp size={14} color="var(--color-text-muted)" />
              : <ChevronDown size={14} color="var(--color-text-muted)" />
            }
          </button>

          <AnimatePresence>
            {verHistorial && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {loadingHistorial && !IS_DEV_MODE ? (
                    <div style={{ textAlign: 'center', padding: 12 }}>
                      <Loader size={16} color="var(--color-text-muted)" style={{ animation: 'spin 1s linear infinite' }} />
                    </div>
                  ) : historial.length === 0 ? (
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-text-muted)', textAlign: 'center', padding: 12 }}>
                      Sin cambios registrados aún.
                    </div>
                  ) : (
                    historial.map(h => {
                      const meta = TIPO_CAMBIO_LABEL[h.tipoCambio] || { label: h.tipoCambio, color: 'var(--color-text-muted)' }
                      return (
                        <div key={h.id} style={{
                          background: 'var(--color-surface)', borderRadius: 8,
                          padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 4,
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{
                              fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700,
                              color: meta.color, letterSpacing: '0.06em', textTransform: 'uppercase',
                              padding: '2px 7px', borderRadius: 999,
                              background: `${meta.color}18`, border: `1px solid ${meta.color}33`,
                            }}>
                              {meta.label}
                            </span>
                            <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--color-text-muted)' }}>
                              {formatFecha(h.fecha)}
                            </span>
                          </div>
                          <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-text-primary)', fontWeight: 600 }}>
                            {h.cargoMRC}
                          </div>
                          {h.tipoCambio === 'reporte' ? (
                            <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--color-text-muted)' }}>
                              {h.detalle}
                            </div>
                          ) : (
                            <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--color-text-muted)' }}>
                              {h.nombreAnterior && <><span>{h.nombreAnterior}</span><span style={{ margin: '0 4px' }}>→</span></>}
                              {h.nombreNuevo && <span style={{ color: 'var(--color-text-secondary)' }}>{h.nombreNuevo}</span>}
                              {!h.nombreAnterior && !h.nombreNuevo && h.detalle}
                            </div>
                          )}
                          <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--color-text-muted)' }}>
                            Por: {h.cambiadoPor}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

      </div>

      {/* ── Modal crear/editar ── */}
      <AnimatePresence>
        {modalLider !== null && (
          <ModalLider
            lider={modalLider === 'nuevo' ? null : modalLider}
            instalacion={instalacion}
            onClose={() => setModalLider(null)}
            onGuardar={handleGuardar}
          />
        )}
      </AnimatePresence>

      {/* ── Confirmación de baja ── */}
      <AnimatePresence>
        {confirmBaja && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 200,
              background: 'rgba(0,0,0,0.65)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '0 24px',
            }}
            onClick={() => setConfirmBaja(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{
                width: '100%', maxWidth: 340,
                background: 'var(--color-navy-mid)',
                borderRadius: 16, padding: 24,
                display: 'flex', flexDirection: 'column', gap: 14,
                border: '1px solid rgba(235,87,87,0.3)',
              }}
            >
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800, color: 'var(--color-text-primary)' }}>
                ¿Dar de baja?
              </div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-text-secondary)' }}>
                <strong>{confirmBaja.nombre}</strong> será removido como <strong>{confirmBaja.cargoMRC}</strong> de {instalacion}. El historial se conserva.
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setConfirmBaja(null)} style={{
                  flex: 1, padding: '11px', borderRadius: 8, cursor: 'pointer',
                  background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                  fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700,
                  letterSpacing: '0.06em', color: 'var(--color-text-muted)',
                }}>
                  CANCELAR
                </button>
                <button onClick={handleConfirmarBaja} disabled={bajando} style={{
                  flex: 1, padding: '11px', borderRadius: 8, cursor: bajando ? 'wait' : 'pointer',
                  background: 'rgba(235,87,87,0.12)', border: '1px solid rgba(235,87,87,0.35)',
                  fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700,
                  letterSpacing: '0.06em', color: '#EB5757',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}>
                  {bajando ? <Loader size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={12} />}
                  DAR DE BAJA
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
