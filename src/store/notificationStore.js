// ── notificationStore.js ──────────────────────────────────────────────────────
// Estado de notificaciones con persistencia localStorage.
// Las notificaciones se persisten para mostrarlas offline.
// Los IDs de leídas también se persisten para evitar round-trips a SP en cada apertura.

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  getNotificaciones,
  getLeidasIds,
  marcarLeida as spMarcarLeida,
  marcarVariasLeidas,
  crearNotificacion,
  desactivarNotificacion,
  getTodasNotificaciones,
} from '../services/notificationService'

// Datos mock para dev mode (sin Azure AD real)
const MOCK_NOTIFS = [
  {
    id: 'mock-1',
    titulo: 'Pauta de verificación pendiente',
    cuerpo: 'Tienes una pauta de verificación de Reglas de Oro pendiente para esta semana.',
    tipo: 'actividad',
    destinatarios: 'todos',
    creadoPor: 'admin@agrosuper.cl',
    fechaExpiracion: null,
    activa: true,
    accionRuta: '/unit/sucursales/tools',
    creadaEn: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-2',
    titulo: 'Material nuevo disponible',
    cuerpo: 'Se ha cargado material nuevo para la charla semanal de SSO. Revisa las Difusiones.',
    tipo: 'difusion',
    destinatarios: 'todos',
    creadoPor: 'admin@agrosuper.cl',
    fechaExpiracion: null,
    activa: true,
    accionRuta: '/unit/sucursales/difusiones-sso',
    creadaEn: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
]

const useNotificationStore = create(
  persist(
    (set, get) => ({
      // ── Estado del usuario ────────────────────────────────────────────────
      notificaciones: [],
      leidasIds: [],
      ultimaSync: null,

      // ── Estado del admin ──────────────────────────────────────────────────
      todasNotificaciones: [],

      // ── Loading / error ───────────────────────────────────────────────────
      loading:      false,
      loadingAdmin: false,
      error:        null,

      // ── Acciones usuario ──────────────────────────────────────────────────

      /**
       * Carga notificaciones del usuario desde SharePoint.
       * Se llama desde useNotifications hook en el ciclo de polling.
       */
      cargar: async (email, instalacion, nivel) => {
        set({ loading: true, error: null })
        try {
          const [notifs, leidasSet] = await Promise.all([
            getNotificaciones(email, instalacion, nivel),
            getLeidasIds(email),
          ])
          set({
            notificaciones: notifs,
            leidasIds: [...leidasSet],
            loading: false,
            ultimaSync: new Date().toISOString(),
          })
        } catch (err) {
          console.warn('[notificationStore] cargar error:', err.message)
          set({ loading: false, error: err.message })
        }
      },

      /**
       * Carga datos mock para dev mode.
       */
      cargarMock: () => {
        set({
          notificaciones: MOCK_NOTIFS,
          leidasIds: [],
          ultimaSync: new Date().toISOString(),
        })
      },

      /**
       * Marca una notificación como leída localmente (optimista) y en SP (fire-and-forget).
       */
      marcarLeida: (id, email) => {
        set(state => ({
          leidasIds: state.leidasIds.includes(id)
            ? state.leidasIds
            : [...state.leidasIds, id],
        }))
        spMarcarLeida(id, email).catch(err =>
          console.warn('[notificationStore] marcarLeida SP failed:', err)
        )
      },

      /**
       * Marca todas las notificaciones no leídas como leídas.
       */
      marcarTodasLeidas: (email) => {
        const { notificaciones, leidasIds } = get()
        const noLeidas = notificaciones
          .filter(n => !leidasIds.includes(n.id))
          .map(n => n.id)
        if (!noLeidas.length) return

        set(state => ({
          leidasIds: [...new Set([...state.leidasIds, ...noLeidas])],
        }))
        marcarVariasLeidas(noLeidas, email).catch(() => {})
      },

      clearError: () => set({ error: null }),

      // ── Acciones admin ────────────────────────────────────────────────────

      /**
       * Carga todas las notificaciones (activas e inactivas) para el panel admin.
       */
      cargarAdmin: async () => {
        set({ loadingAdmin: true, error: null })
        try {
          const todas = await getTodasNotificaciones()
          set({ todasNotificaciones: todas, loadingAdmin: false })
        } catch (err) {
          console.warn('[notificationStore] cargarAdmin error:', err.message)
          set({ loadingAdmin: false, error: err.message })
        }
      },

      /**
       * Crea una nueva notificación y la agrega al estado del admin.
       */
      crear: async (notif, adminEmail) => {
        const nueva = await crearNotificacion(notif, adminEmail)
        set(state => ({
          todasNotificaciones: [nueva, ...state.todasNotificaciones],
        }))
        return nueva
      },

      /**
       * Desactiva una notificación (soft-delete).
       */
      desactivar: async (id) => {
        await desactivarNotificacion(id)
        set(state => ({
          todasNotificaciones: state.todasNotificaciones.map(n =>
            n.id === id ? { ...n, activa: false } : n
          ),
        }))
      },
    }),
    {
      name: 'mrc-notifications-store',
      partialize: (state) => ({
        notificaciones: state.notificaciones,
        leidasIds:      state.leidasIds,
        ultimaSync:     state.ultimaSync,
        // datos admin no persisten — efímeros
      }),
    }
  )
)

export default useNotificationStore
