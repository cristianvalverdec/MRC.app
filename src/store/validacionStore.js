// ── validacionStore.js ─────────────────────────────────────────────────────────
// Estado de validaciones con persistencia localStorage.
//
// misValidaciones  → persistidas (para mostrar offline al usuario)
// pendientes       → efímero (admin, siempre fresco desde SP)
// todasValidaciones → efímero (admin, historial completo)
//
// Modelo: notificationStore.js

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  getValidacionesPendientes,
  getTodasValidaciones,
  getValidacionesUsuario,
  aprobarValidacion as spAprobar,
  rechazarValidacion as spRechazar,
} from '../services/validacionService'

// ── Mock data para dev mode ───────────────────────────────────────────────────
const MOCK_VALIDACIONES_USUARIO = [
  {
    id: 'mock-val-1',
    tipoRegistro:      'difusion',
    referenciaId:      null,
    referenciaLista:   '',
    nombreDocumento:   'Difusión SSO — CD Temuco — Operaciones',
    instalacionOrigen: 'CD Temuco',
    subidoPor:         'demo@agrosuper.cl',
    fechaSubida:       new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    estado:            'aprobado',
    validadoPor:       'admin@agrosuper.cl',
    fechaValidacion:   new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    observaciones:     '',
    archivoUrl:        '',
    creadoEn:          new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-val-2',
    tipoRegistro:      'difusion',
    referenciaId:      null,
    referenciaLista:   '',
    nombreDocumento:   'Difusión SSO — Sucursal Quilicura — Administración',
    instalacionOrigen: 'Sucursal Quilicura',
    subidoPor:         'demo@agrosuper.cl',
    fechaSubida:       new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    estado:            'rechazado',
    validadoPor:       'admin@agrosuper.cl',
    fechaValidacion:   new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    observaciones:     'El registro de asistencia no tiene firmas. Por favor adjuntar el listado firmado.',
    archivoUrl:        '',
    creadoEn:          new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-val-3',
    tipoRegistro:      'difusion',
    referenciaId:      null,
    referenciaLista:   '',
    nombreDocumento:   'Difusión SSO — Sucursal Huechuraba — Operaciones',
    instalacionOrigen: 'Sucursal Huechuraba',
    subidoPor:         'demo@agrosuper.cl',
    fechaSubida:       new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    estado:            'pendiente',
    validadoPor:       '',
    fechaValidacion:   '',
    observaciones:     '',
    archivoUrl:        '',
    creadoEn:          new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
]

const MOCK_VALIDACIONES_ADMIN = [
  {
    id: 'mock-admin-1',
    tipoRegistro:      'difusion',
    referenciaId:      null,
    referenciaLista:   '',
    nombreDocumento:   'Difusión SSO — Sucursal Miraflores — Operaciones',
    instalacionOrigen: 'Sucursal Miraflores',
    subidoPor:         'jgarcia@agrosuper.cl',
    fechaSubida:       new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    estado:            'pendiente',
    validadoPor:       '',
    fechaValidacion:   '',
    observaciones:     '',
    archivoUrl:        '',
    creadoEn:          new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-admin-2',
    tipoRegistro:      'difusion',
    referenciaId:      null,
    referenciaLista:   '',
    nombreDocumento:   'Difusión SSO — Sucursal Rancagua — Administración',
    instalacionOrigen: 'Sucursal Rancagua',
    subidoPor:         'mlopez@agrosuper.cl',
    fechaSubida:       new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    estado:            'pendiente',
    validadoPor:       '',
    fechaValidacion:   '',
    observaciones:     '',
    archivoUrl:        '',
    creadoEn:          new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  ...MOCK_VALIDACIONES_USUARIO,
]

// ── Store ─────────────────────────────────────────────────────────────────────

const useValidacionStore = create(
  persist(
    (set, get) => ({
      // ── Estado del usuario ────────────────────────────────────────────────
      misValidaciones: [],
      ultimaSync: null,

      // ── Estado del admin ──────────────────────────────────────────────────
      pendientes: [],
      todasValidaciones: [],

      // ── Loading / error ───────────────────────────────────────────────────
      loading:      false,
      loadingAdmin: false,
      error:        null,

      // ── Acciones usuario ──────────────────────────────────────────────────

      /**
       * Carga las validaciones del usuario desde SharePoint.
       * Ideal llamarlo al montar MisDocumentosScreen.
       */
      cargarMisValidaciones: async (email) => {
        set({ loading: true, error: null })
        try {
          const validaciones = await getValidacionesUsuario(email)
          set({
            misValidaciones: validaciones,
            loading: false,
            ultimaSync: new Date().toISOString(),
          })
        } catch (err) {
          console.warn('[validacionStore] cargarMisValidaciones error:', err.message)
          set({ loading: false, error: err.message })
        }
      },

      /**
       * Carga datos mock para dev mode.
       */
      cargarMock: () => {
        set({
          misValidaciones:  MOCK_VALIDACIONES_USUARIO,
          pendientes:       MOCK_VALIDACIONES_ADMIN.filter(v => v.estado === 'pendiente'),
          todasValidaciones: MOCK_VALIDACIONES_ADMIN,
          ultimaSync:       new Date().toISOString(),
        })
      },

      clearError: () => set({ error: null }),

      // ── Acciones admin ────────────────────────────────────────────────────

      /**
       * Carga los registros pendientes de validación.
       * Llamado desde ValidacionAdminScreen (polling).
       */
      cargarPendientes: async () => {
        set({ loadingAdmin: true, error: null })
        try {
          const pendientes = await getValidacionesPendientes()
          set({ pendientes, loadingAdmin: false })
        } catch (err) {
          console.warn('[validacionStore] cargarPendientes error:', err.message)
          set({ loadingAdmin: false, error: err.message })
        }
      },

      /**
       * Carga todos los registros (historial completo) para el panel admin.
       */
      cargarTodas: async () => {
        set({ loadingAdmin: true, error: null })
        try {
          const todas = await getTodasValidaciones()
          set({
            todasValidaciones: todas,
            pendientes: todas.filter(v => v.estado === 'pendiente'),
            loadingAdmin: false,
          })
        } catch (err) {
          console.warn('[validacionStore] cargarTodas error:', err.message)
          set({ loadingAdmin: false, error: err.message })
        }
      },

      /**
       * Aprueba un registro.
       * Optimistic update local → actualiza SP → notifica al usuario.
       * Si SP falla, revierte el estado local.
       */
      aprobar: async (id, adminEmail, observaciones = '') => {
        // Buscar el registro para obtener datos de notificación
        const { pendientes, todasValidaciones } = get()
        const registro = [...pendientes, ...todasValidaciones].find(v => v.id === id)

        // Optimistic update
        const updateList = (list) =>
          list.map(v =>
            v.id === id
              ? { ...v, estado: 'aprobado', validadoPor: adminEmail, fechaValidacion: new Date().toISOString(), observaciones }
              : v
          )

        set(state => ({
          pendientes:        state.pendientes.filter(v => v.id !== id),
          todasValidaciones: updateList(state.todasValidaciones),
          error: null,
        }))

        try {
          await spAprobar(
            id,
            adminEmail,
            observaciones,
            registro?.subidoPor,
            registro?.nombreDocumento
          )
        } catch (err) {
          console.error('[validacionStore] aprobar error:', err)
          // Revertir optimistic update
          set(state => ({
            pendientes: registro ? [registro, ...state.pendientes] : state.pendientes,
            todasValidaciones: state.todasValidaciones.map(v =>
              v.id === id ? { ...v, estado: 'pendiente', validadoPor: '', fechaValidacion: '', observaciones: '' } : v
            ),
            error: err?.message || 'Error al aprobar el registro',
          }))
          throw err
        }
      },

      /**
       * Rechaza un registro.
       * Requiere observaciones (motivo de rechazo) obligatorio.
       * Optimistic update → SP → notificación usuario.
       */
      rechazar: async (id, adminEmail, observaciones) => {
        if (!observaciones?.trim()) {
          throw new Error('El motivo de rechazo es obligatorio')
        }

        const { pendientes, todasValidaciones } = get()
        const registro = [...pendientes, ...todasValidaciones].find(v => v.id === id)

        // Optimistic update
        const updateList = (list) =>
          list.map(v =>
            v.id === id
              ? { ...v, estado: 'rechazado', validadoPor: adminEmail, fechaValidacion: new Date().toISOString(), observaciones }
              : v
          )

        set(state => ({
          pendientes:        state.pendientes.filter(v => v.id !== id),
          todasValidaciones: updateList(state.todasValidaciones),
          error: null,
        }))

        try {
          await spRechazar(
            id,
            adminEmail,
            observaciones,
            registro?.subidoPor,
            registro?.nombreDocumento
          )
        } catch (err) {
          console.error('[validacionStore] rechazar error:', err)
          // Revertir optimistic update
          set(state => ({
            pendientes: registro ? [registro, ...state.pendientes] : state.pendientes,
            todasValidaciones: state.todasValidaciones.map(v =>
              v.id === id ? { ...v, estado: 'pendiente', validadoPor: '', fechaValidacion: '', observaciones: '' } : v
            ),
            error: err?.message || 'Error al rechazar el registro',
          }))
          throw err
        }
      },
    }),
    {
      name: 'mrc-validacion-store',
      // Solo persistir datos del usuario — los del admin siempre son frescos
      partialize: (state) => ({
        misValidaciones: state.misValidaciones,
        ultimaSync:      state.ultimaSync,
      }),
    }
  )
)

export default useValidacionStore
