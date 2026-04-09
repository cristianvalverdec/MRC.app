// ── lideresStore.js ───────────────────────────────────────────────────────────
// Estado global del directorio de líderes.
// No se persiste en localStorage: siempre se obtiene fresco desde SharePoint.
// El admin ve todas las instalaciones; los líderes solo la suya.

import { create } from 'zustand'
import {
  getLideres,
  crearLider,
  actualizarLider,
  darBajaLider,
  getHistorial,
  reportarActualizacion,
} from '../services/lideresService'

const useLideresStore = create((set, get) => ({
  // ── Estado ────────────────────────────────────────────────────────────────
  // Mapa { instalacion: [líder, ...] } — cargado bajo demanda
  lidereresPorInstalacion: {},

  // Historial de cambios por instalación { instalacion: [entrada, ...] }
  historialPorInstalacion: {},

  // Instalación actualmente cargada en detalle
  instalacionActiva: null,

  // Líderes de la instalación activa
  lideresActivos: [],

  loading:          false,
  loadingHistorial: false,
  error:            null,
  errorCode:        null,  // 'SP_SETUP_REQUIRED' u otro código específico

  // ── Acciones ──────────────────────────────────────────────────────────────

  /**
   * Carga los líderes de UNA instalación específica.
   * Usa caché; forzar = true lo omite.
   */
  cargarInstalacion: async (instalacion, forzar = false) => {
    const cache = get().lidereresPorInstalacion
    if (!forzar && cache[instalacion]) {
      set({ instalacionActiva: instalacion, lideresActivos: cache[instalacion] })
      return
    }

    set({ loading: true, error: null, errorCode: null, instalacionActiva: instalacion })
    try {
      const lideres = await getLideres(instalacion)
      set(state => ({
        lidereresPorInstalacion: { ...state.lidereresPorInstalacion, [instalacion]: lideres },
        lideresActivos: lideres,
        loading: false,
      }))
    } catch (err) {
      set({ error: err.message, errorCode: err.code || null, loading: false })
    }
  },

  /**
   * Carga todos los líderes (para el panel admin).
   * Devuelve un mapa { instalacion: [líder, ...] }.
   */
  cargarTodos: async () => {
    set({ loading: true, error: null, errorCode: null })
    try {
      const todos = await getLideres()
      // Agrupar por instalación
      const mapa = {}
      for (const l of todos) {
        if (!mapa[l.instalacion]) mapa[l.instalacion] = []
        mapa[l.instalacion].push(l)
      }
      set({ lidereresPorInstalacion: mapa, loading: false })
      return mapa
    } catch (err) {
      set({ error: err.message, errorCode: err.code || null, loading: false })
      return {}
    }
  },

  /**
   * Crea un nuevo líder y actualiza el caché local.
   */
  crear: async (lider, adminEmail) => {
    const nuevo = await crearLider(lider, adminEmail)
    set(state => {
      const inst = lider.instalacion
      const prev = state.lidereresPorInstalacion[inst] || []
      const actualizado = { ...state.lidereresPorInstalacion, [inst]: [...prev, nuevo] }
      return {
        lidereresPorInstalacion: actualizado,
        lideresActivos: state.instalacionActiva === inst ? actualizado[inst] : state.lideresActivos,
      }
    })
    return nuevo
  },

  /**
   * Actualiza un líder y sincroniza el caché.
   */
  actualizar: async (id, cambios, liderAnterior, adminEmail) => {
    await actualizarLider(id, cambios, liderAnterior, adminEmail)
    set(state => {
      const inst = liderAnterior.instalacion
      const prev = state.lidereresPorInstalacion[inst] || []
      const actualizado = {
        ...state.lidereresPorInstalacion,
        [inst]: prev.map(l => l.id === id ? { ...l, ...cambios } : l),
      }
      return {
        lidereresPorInstalacion: actualizado,
        lideresActivos: state.instalacionActiva === inst ? actualizado[inst] : state.lideresActivos,
      }
    })
  },

  /**
   * Da de baja un líder (lo oculta de la vista activa).
   */
  darBaja: async (id, lider, adminEmail) => {
    await darBajaLider(id, lider, adminEmail)
    set(state => {
      const inst = lider.instalacion
      const prev = state.lidereresPorInstalacion[inst] || []
      const actualizado = {
        ...state.lidereresPorInstalacion,
        [inst]: prev.filter(l => l.id !== id),
      }
      return {
        lidereresPorInstalacion: actualizado,
        lideresActivos: state.instalacionActiva === inst ? actualizado[inst] : state.lideresActivos,
      }
    })
  },

  /**
   * Carga el historial de una instalación.
   */
  cargarHistorial: async (instalacion) => {
    set({ loadingHistorial: true })
    try {
      const entradas = await getHistorial(instalacion, 30)
      set(state => ({
        historialPorInstalacion: { ...state.historialPorInstalacion, [instalacion]: entradas },
        loadingHistorial: false,
      }))
    } catch {
      set({ loadingHistorial: false })
    }
  },

  /**
   * Envía un reporte de actualización desde un líder.
   */
  enviarReporte: async (reporte, emailReportador) => {
    await reportarActualizacion(reporte, emailReportador)
  },

  clearError: () => set({ error: null, errorCode: null }),
}))

export default useLideresStore
