// ── Store de Metas del Programa ───────────────────────────────────────────
//
// Gestiona:
//  - Factor de Accidentabilidad (FA) por sucursal/mes
//  - Metas de actividades mensuales por tramo de riesgo
//
// Fórmula FA:
//   ((ATP * 0.70) + (ASTP * 0.30)) / Dotación * 100
//   ATP  = Accidentes con tiempo perdido
//   ASTP = Accidentes sin tiempo perdido
//
// Tramos:
//   Bajo   0.0 – 1.0   🟢  meta conservadora
//   Medio  1.1 – 2.0   🟡  meta moderada
//   Alto   2.1 – 5.0   🔴  meta intensiva

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ── Helpers exportados ────────────────────────────────────────────────────

export function calcFA({ atp = 0, astp = 0, dotacion = 1 }) {
  if (dotacion <= 0) return 0
  return +((( atp * 0.7 + astp * 0.3) / dotacion) * 100).toFixed(2)
}

export function getTramo(fa) {
  if (fa <= 1.0) return 'bajo'
  if (fa <= 2.0) return 'medio'
  return 'alto'
}

export const TRAMO_META = {
  bajo:  { label: 'Riesgo Bajo',  color: '#27AE60', bg: 'rgba(39,174,96,0.15)',  border: 'rgba(39,174,96,0.35)',  range: '0.0 – 1.0' },
  medio: { label: 'Riesgo Medio', color: '#F2994A', bg: 'rgba(242,153,74,0.15)', border: 'rgba(242,153,74,0.35)', range: '1.1 – 2.0' },
  alto:  { label: 'Riesgo Alto',  color: '#EB5757', bg: 'rgba(235,87,87,0.15)',  border: 'rgba(235,87,87,0.35)',  range: '2.1 – 5.0' },
}

// Metas de actividades mensuales por tramo.
// pautasTurnos : Pautas por cada turno operacional (Mañana, Tarde, Noche)
// pautasAdmin  : Pautas para Administración
// caminatas    : Caminatas de Seguridad para líderes
// difusiones   : Siempre 2 bi-semanales
export const DEFAULT_ACTIVITY_TARGETS = {
  bajo:  { pautasTurnos: 3, pautasAdmin: 2, caminatas: 3, difusiones: 2, periodicidadDifusiones: 'bi-semanales' },
  medio: { pautasTurnos: 4, pautasAdmin: 2, caminatas: 3, difusiones: 2, periodicidadDifusiones: 'bi-semanales' },
  alto:  { pautasTurnos: 5, pautasAdmin: 3, caminatas: 4, difusiones: 2, periodicidadDifusiones: 'bi-semanales' },
}

// ── FA real Abril 2026 (datos de ejemplo) ─────────────────────────────────
// Sucursales con FA real cargado para el mes de abril 2026.
// Las sucursales no listadas aquí usan valor 0.0 (sin dato).
const FA_ABRIL_2026 = {
  'Miraflores':   4.8,
  'Arica':        3.3,
  'Chillán':      2.3,
  'Puerto Montt': 2.3,
  'Coquimbo':     2.1,
  'Antofagasta':  1.4,
  'Huechuraba':   1.4,
  'Viña del Mar': 0.8,
  'Concepción':   0.7,
  'Temuco':       0.6,
  'Rancagua':     0.6,
  'Lo Espejo':    0.6,
  'Punta Arenas': 0.0,
  'Copiapó':      0.0,
  'Hijuelas':     0.0,
  'Los Ángeles':  0.0,
  'San Antonio':  0.0,
  'Osorno':       0.0,
  'Iquique':      0.0,
  'Valdivia':     0.0,
  'Calama':       0.0,
}

export function getMockFA(branch) {
  const fa = FA_ABRIL_2026[branch] ?? 0.0
  return fa
}

// ── Store ─────────────────────────────────────────────────────────────────

const useGoalsStore = create(
  persist(
    (set, get) => ({
      // { [branch]: { atp, astp, dotacion, fa, month, updatedBy, updatedAt } }
      faData: {},

      // Metas por tramo (editables desde admin en el futuro)
      activityTargets: DEFAULT_ACTIVITY_TARGETS,

      // Guardar/actualizar FA de una sucursal
      setFAData: (branch, { atp, astp, dotacion, updatedBy = '' }) => {
        const fa = calcFA({ atp, astp, dotacion })
        const month = new Date().toISOString().slice(0, 7) // YYYY-MM
        set((state) => ({
          faData: {
            ...state.faData,
            [branch]: { atp, astp, dotacion, fa, month, updatedBy, updatedAt: new Date().toISOString() },
          },
        }))
      },

      // Obtener FA de una sucursal (real o demo)
      getFAForBranch: (branch) => {
        const stored = get().faData[branch]
        if (stored) return stored
        // Dev/demo: retornar dato de ejemplo Abril 2026
        const fa = getMockFA(branch)
        return { fa, atp: null, astp: null, dotacion: null, month: '2026-04', mock: true }
      },

      // Actualizar metas por tramo
      setActivityTargets: (targets) => set({ activityTargets: targets }),

      // Metas para un tramo específico
      getTargetsForTramo: (tramo) => get().activityTargets[tramo] || DEFAULT_ACTIVITY_TARGETS[tramo],
    }),
    { name: 'mrc-goals-store' }
  )
)

export default useGoalsStore
