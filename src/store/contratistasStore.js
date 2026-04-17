// ── Store de Permisos de Trabajo — Contratistas ───────────────────────────
//
// NO usa el middleware `persist` de Zustand porque en React 19 + Zustand v5
// el rehydrate() del persist llama a setState durante el render del primer
// componente que usa el store (lazy-loaded), lo que viola las reglas de
// concurrent mode y lanza el error React #185.
//
// Solución: inicialización síncrona desde localStorage en el initializer
// del store (ocurre durante la importación del módulo, ANTES del render)
// + escritura manual a localStorage en cada acción.

import { create } from 'zustand'

const STORAGE_KEY = 'mrc-contratistas-v1'

// Lee el estado guardado de forma SÍNCRONA durante la importación del módulo,
// antes de que React empiece a renderizar.
function readStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed.permisosActivos) ? parsed.permisosActivos : []
  } catch {
    return []
  }
}

function writeStorage(permisosActivos) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ permisosActivos }))
  } catch { /* ignore: safari private mode, storage full */ }
}

const useContratistasStore = create((set) => ({
  // Estado inicial leído SÍNCRONAMENTE — no dispara setState en React
  permisosActivos: readStorage(),

  // Agrega un permiso nuevo al enviar "permiso-trabajo-contratista"
  addPermiso: (answers) =>
    set((state) => {
      const newPermiso = {
        id:             Date.now(),
        estado:         'activo',
        empresa:        answers.ptc_01 || 'Empresa sin nombre',
        ubicacion:      answers.ptc_05 || '',
        tipoTrabajo:    answers.ptc_11 || '',
        horaAutorizada: answers.ptc_44 || '',
        horaMaxima:     answers.ptc_45 || '',
        fechaInicio:    answers.ptc_07 || new Date().toISOString().slice(0, 10),
        createdAt:      new Date().toISOString(),
      }
      const next = [...state.permisosActivos, newPermiso]
      writeStorage(next)
      return { permisosActivos: next }
    }),

  // Marca un permiso como cerrado al enviar "cierre-trabajo-contratista"
  cerrarPermiso: (id) =>
    set((state) => {
      const next = state.permisosActivos.map((p) =>
        p.id === id
          ? { ...p, estado: 'cerrado', cerradoAt: new Date().toISOString() }
          : p
      )
      writeStorage(next)
      return { permisosActivos: next }
    }),

  // Elimina del array los permisos ya cerrados
  limpiarCerrados: () =>
    set((state) => {
      const next = state.permisosActivos.filter((p) => p.estado === 'activo')
      writeStorage(next)
      return { permisosActivos: next }
    }),
}))

export default useContratistasStore
