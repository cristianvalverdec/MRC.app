// ── Metas semanales de Pautas por Factor de Accidentabilidad ─────────────
//
// Factor > 1.5  → META 18:  Mañana=5, Tarde=5, Noche=5, Administración=3
// Factor 1.0–1.5 → META 14: Mañana=4, Tarde=4, Noche=4, Administración=2
// Factor < 1.0  → META 11:  Mañana=3, Tarde=3, Noche=3, Administración=2
//
// Fuente: tabla factor accidentabilidad mensual (actualizar cada mes)

export const PAUTA_TIER_TARGETS = {
  high: { total: 18, shifts: { Mañana: 5, Tarde: 5, Noche: 5, Administración: 3 } },
  med:  { total: 14, shifts: { Mañana: 4, Tarde: 4, Noche: 4, Administración: 2 } },
  low:  { total: 11, shifts: { Mañana: 3, Tarde: 3, Noche: 3, Administración: 2 } },
}

// Factor accidentabilidad de este mes → tier
// high: > 1.5 | med: 1.0–1.5 | low: < 1.0
export const BRANCH_TIER = {
  // ── Tier ALTO (factor > 1.5) ──────────────────────────────────────
  'Miraflores':    'high',   // 4.8
  'Arica':         'high',   // 3.3
  'Chillán':       'high',   // 2.3
  'Puerto Montt':  'high',   // 2.3
  'Coquimbo':      'high',   // 2.1

  // ── Tier MEDIO (factor 1.0–1.5) ───────────────────────────────────
  'Antofagasta':   'med',    // 1.4
  'Huechuraba':    'med',    // 1.4

  // ── Tier BAJO (factor < 1.0) — resto de sucursales ────────────────
  // Viña del Mar, Concepción, Temuco, Rancagua, Lo Espejo,
  // Punta Arenas, Copiapó, Hijuelas, Los Ángeles, San Antonio,
  // Osorno, Iquique, Valdivia, Calama → default 'low'
}

/**
 * Devuelve el tier ('high' | 'med' | 'low') de una sucursal.
 * Si no se filtra por sucursal específica retorna null.
 */
export function getBranchTier(branch) {
  if (!branch || branch === 'all') return null
  return BRANCH_TIER[branch] || 'low'
}

/**
 * Retorna las metas semanales por turno para una sucursal dada.
 * Si no hay sucursal seleccionada retorna null.
 */
export function getShiftTargets(branch) {
  const tier = getBranchTier(branch)
  if (!tier) return null
  return PAUTA_TIER_TARGETS[tier]
}
