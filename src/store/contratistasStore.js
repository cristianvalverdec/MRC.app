// ── Store de Permisos de Trabajo — Contratistas ───────────────────────────
//
// Mantiene el estado de los permisos activos en la instalación.
// Persiste en localStorage para que los permisos sobrevivan cierres de app.
// Se actualiza desde FormScreen al enviar permiso-trabajo-contratista y
// cierre-trabajo-contratista.

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useContratistasStore = create(
  persist(
    (set) => ({
      // Array de permisos: { id, estado, empresa, ubicacion, tipoTrabajo, ... }
      permisosActivos: [],

      // Agrega un permiso nuevo al enviar "permiso-trabajo-contratista"
      addPermiso: (answers) =>
        set((state) => ({
          permisosActivos: [
            ...state.permisosActivos,
            {
              id: Date.now(),
              estado: 'activo',
              empresa:      answers.ptc_01 || 'Empresa sin nombre',
              ubicacion:    answers.ptc_05 || '',
              tipoTrabajo:  answers.ptc_11 || '',
              horaAutorizada: answers.ptc_44 || '',
              horaMaxima:   answers.ptc_45 || '',
              fechaInicio:  answers.ptc_07 || new Date().toISOString().slice(0, 10),
              createdAt:    new Date().toISOString(),
            },
          ],
        })),

      // Marca un permiso como cerrado al enviar "cierre-trabajo-contratista"
      cerrarPermiso: (id) =>
        set((state) => ({
          permisosActivos: state.permisosActivos.map((p) =>
            p.id === id
              ? { ...p, estado: 'cerrado', cerradoAt: new Date().toISOString() }
              : p
          ),
        })),

      // Elimina del array los permisos ya cerrados
      limpiarCerrados: () =>
        set((state) => ({
          permisosActivos: state.permisosActivos.filter((p) => p.estado === 'activo'),
        })),
    }),
    {
      name: 'mrc-contratistas-store',
      partialize: (state) => ({ permisosActivos: state.permisosActivos }),
    }
  )
)

export default useContratistasStore
