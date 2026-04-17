// ── ContratistasScreen ────────────────────────────────────────────────────
//
// Pantalla de gestión de Permisos de Trabajo para Contratistas.
// Muestra los permisos activos y ofrece dos acciones:
//   1. Nuevo Permiso de Trabajo
//   2. Cierre de Trabajos (obliga a las jefaturas a ir a terreno)

import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HardHat, ClipboardCheck, Clock, MapPin,
  CheckCircle2, ChevronRight, X, Wrench,
} from 'lucide-react'
import AppHeader from '../components/layout/AppHeader'
import useContratistasStore from '../store/contratistasStore'

export default function ContratistasScreen() {
  const navigate    = useNavigate()
  const { unitType } = useParams()

  // Selector defensivo — (s.permisosActivos || []) evita crash si el store
  // devuelve undefined durante hidratación inicial de Zustand persist
  const permisosActivos = useContratistasStore(
    (s) => (s.permisosActivos || []).filter((p) => p.estado === 'activo')
  )

  const [showCierreModal, setShowCierreModal] = useState(false)
  const returnTo = `/unit/${unitType}/contratistas`

  // ── Nuevo Permiso ────────────────────────────────────────────────────────
  const handleNuevoPermiso = () => {
    navigate('/form/permiso-trabajo-contratista', { state: { returnTo } })
  }

  // ── Seleccionar permiso para cierre ─────────────────────────────────────
  // Pasa los datos del permiso como prefillData en navigation state.
  // FormScreen los usa para pre-rellenar el borrador sin depender de formStore aquí.
  const handleCierreSelect = (permiso) => {
    setShowCierreModal(false)
    navigate('/form/cierre-trabajo-contratista', {
      state: {
        returnTo,
        permisoId: permiso.id,
        prefillData: {
          ctc_01: permiso.empresa  || '',
          ctc_02: permiso.ubicacion || '',
          ctc_03: permiso.tipoTrabajo || '',
        },
      },
    })
  }

  // ── Botón "Cierre de Trabajos" ─────────────────────────────────────────
  const handleCierreClick = () => {
    if (permisosActivos.length === 0) return
    if (permisosActivos.length === 1) {
      handleCierreSelect(permisosActivos[0])
    } else {
      setShowCierreModal(true)
    }
  }

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--color-navy)',
    }}>
      <AppHeader title="Permiso de Trabajo" />

      {/* ── Panel de trabajos activos ──────────────────────────────────── */}
      <div style={{ flex: 1, padding: '20px 16px 140px', overflowY: 'auto' }}>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          {/* Encabezado del panel */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 14,
          }}>
            <span style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 12,
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
              color: 'var(--color-orange)',
            }}>
              Trabajos en Curso
            </span>

            {permisosActivos.length > 0 && (
              <span style={{
                background: '#E85D04',
                color: '#fff',
                borderRadius: 10,
                padding: '2px 10px',
                fontFamily: 'var(--font-body)',
                fontSize: 11,
                fontWeight: 700,
              }}>
                {permisosActivos.length} activo{permisosActivos.length > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Estado vacío */}
          {permisosActivos.length === 0 ? (
            <div style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 12,
              padding: '28px 16px',
              textAlign: 'center',
            }}>
              <CheckCircle2
                size={30}
                color="var(--color-text-muted)"
                style={{ margin: '0 auto 10px', display: 'block' }}
              />
              <div style={{
                fontFamily: 'var(--font-body)',
                fontSize: 14,
                color: 'var(--color-text-muted)',
                lineHeight: 1.5,
              }}>
                Sin trabajos activos en este momento
              </div>
            </div>
          ) : (
            /* Lista de permisos activos */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {permisosActivos.map((permiso, i) => (
                <motion.div
                  key={permiso.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  style={{
                    background: 'var(--color-surface)',
                    border: '1px solid rgba(232,93,4,0.30)',
                    borderLeft: '3px solid #E85D04',
                    borderRadius: 10,
                    padding: '14px 16px',
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 8,
                  }}>
                    <span style={{
                      fontFamily: 'var(--font-display)',
                      fontWeight: 700,
                      fontSize: 15,
                      color: 'var(--color-text)',
                      flex: 1,
                      marginRight: 8,
                      lineHeight: 1.3,
                    }}>
                      {permiso.empresa}
                    </span>
                    <span style={{
                      background: 'rgba(232,93,4,0.15)',
                      color: '#E85D04',
                      borderRadius: 6,
                      padding: '2px 8px',
                      fontFamily: 'var(--font-body)',
                      fontSize: 11,
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}>
                      ACTIVO
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {permiso.tipoTrabajo ? (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        fontFamily: 'var(--font-body)', fontSize: 12,
                        color: 'var(--color-text-muted)',
                      }}>
                        <Wrench size={12} style={{ flexShrink: 0 }} />
                        {permiso.tipoTrabajo}
                      </div>
                    ) : null}
                    {permiso.ubicacion ? (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        fontFamily: 'var(--font-body)', fontSize: 12,
                        color: 'var(--color-text-muted)',
                      }}>
                        <MapPin size={12} style={{ flexShrink: 0 }} />
                        {permiso.ubicacion}
                      </div>
                    ) : null}
                    {permiso.horaMaxima ? (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        fontFamily: 'var(--font-body)', fontSize: 12,
                        color: 'rgba(232,93,4,0.9)',
                        fontWeight: 600,
                      }}>
                        <Clock size={12} style={{ flexShrink: 0 }} />
                        Vence: {permiso.horaMaxima}
                      </div>
                    ) : null}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* ── Botones de acción (fijos en el fondo) ─────────────────────────── */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '14px 16px',
        paddingBottom: 'calc(14px + env(safe-area-inset-bottom, 0px))',
        borderTop: '1px solid var(--color-border)',
        background: 'rgba(27,42,74,0.97)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleNuevoPermiso}
          style={{
            height: 52,
            background: '#E85D04',
            border: 'none',
            borderRadius: 'var(--radius-btn)',
            color: '#fff',
            fontFamily: 'var(--font-display)',
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            boxShadow: '0 4px 20px rgba(232,93,4,0.35)',
          }}
        >
          <HardHat size={18} />
          Permiso de Trabajo
        </motion.button>

        <motion.button
          whileTap={permisosActivos.length > 0 ? { scale: 0.97 } : undefined}
          onClick={handleCierreClick}
          disabled={permisosActivos.length === 0}
          style={{
            height: 52,
            background: permisosActivos.length > 0
              ? 'var(--color-surface)'
              : 'rgba(255,255,255,0.04)',
            border: `1.5px solid ${permisosActivos.length > 0
              ? 'rgba(39,174,96,0.55)'
              : 'var(--color-border)'}`,
            borderRadius: 'var(--radius-btn)',
            color: permisosActivos.length > 0 ? '#27AE60' : 'var(--color-text-muted)',
            fontFamily: 'var(--font-display)',
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            cursor: permisosActivos.length > 0 ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            opacity: permisosActivos.length > 0 ? 1 : 0.45,
            transition: 'all 0.2s ease',
          }}
        >
          <ClipboardCheck size={18} />
          Cierre de Trabajos
          {permisosActivos.length > 0 ? <ChevronRight size={16} /> : null}
        </motion.button>
      </div>

      {/* ── Modal selector de permiso a cerrar ────────────────────────────── */}
      <AnimatePresence>
        {showCierreModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.72)',
              zIndex: 200,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
            }}
            onClick={() => setShowCierreModal(false)}
          >
            <motion.div
              initial={{ y: 400 }}
              animate={{ y: 0 }}
              exit={{ y: 400 }}
              transition={{ type: 'spring', damping: 32, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'var(--color-surface)',
                borderRadius: '18px 18px 0 0',
                padding: '24px 16px',
                paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
                maxHeight: '75vh',
                overflowY: 'auto',
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
              }}>
                <span style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize: 16,
                  color: 'var(--color-text)',
                }}>
                  ¿Qué trabajo vas a cerrar?
                </span>
                <button
                  onClick={() => setShowCierreModal(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--color-text-muted)',
                    cursor: 'pointer',
                    padding: 4,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {permisosActivos.map((permiso) => (
                  <motion.button
                    key={permiso.id}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleCierreSelect(permiso)}
                    style={{
                      background: 'var(--color-navy)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 10,
                      padding: '14px 16px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      width: '100%',
                    }}
                  >
                    <div style={{ flex: 1, marginRight: 8 }}>
                      <div style={{
                        fontFamily: 'var(--font-display)',
                        fontWeight: 700,
                        fontSize: 14,
                        color: 'var(--color-text)',
                        marginBottom: 4,
                      }}>
                        {permiso.empresa}
                      </div>
                      <div style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: 12,
                        color: 'var(--color-text-muted)',
                      }}>
                        {[permiso.tipoTrabajo, permiso.ubicacion].filter(Boolean).join(' · ')}
                      </div>
                    </div>
                    <ChevronRight size={16} color="var(--color-text-muted)" style={{ flexShrink: 0 }} />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
