// ── mrcCatalog.js ────────────────────────────────────────────────────────────
// Catálogo estático de cargos e instalaciones Misión Riesgo Cero.
// Fuente de verdad para jerarquía, directorio de líderes y control de acceso.
// Solo actualizar aquí cuando cambie la estructura organizacional.

// ── Jerarquía de cargos ───────────────────────────────────────────────────────
// Nivel 0 (Operario de Despacho) excluido: son personas observadas, no usuarios.
export const CARGOS_MRC = [
  { nivel: 1,  nombre: 'Ayudante de Despacho',         alcance: 'turno',       requierePIN: true  },
  { nivel: 2,  nombre: 'Jefe de Despacho',             alcance: 'turno',       requierePIN: true  },
  { nivel: 3,  nombre: 'Jefe de Frigorífico',          alcance: 'instalacion', requierePIN: false },
  { nivel: 4,  nombre: 'Jefe de Operaciones',          alcance: 'instalacion', requierePIN: false },
  { nivel: 5,  nombre: 'Jefe Administrativo',          alcance: 'instalacion', requierePIN: false },
  { nivel: 6,  nombre: 'Jefe de Zona',                 alcance: 'instalacion', requierePIN: false },
  { nivel: 7,  nombre: 'Subgerente de Zona',           alcance: 'zona',        requierePIN: false },
  { nivel: 8,  nombre: 'Gerente de Sucursales',        alcance: 'nacional',    requierePIN: false },
  { nivel: 9,  nombre: 'Gerente de Ventas Nacionales', alcance: 'nacional',    requierePIN: false },
  { nivel: 10, nombre: 'Gerente Comercial',            alcance: 'nacional',    requierePIN: false },
]

// ── Instalaciones ─────────────────────────────────────────────────────────────
// 21 sucursales propias + 5 distribuidoras adheridas (sin dotación SAP)
// "Hijuelas" = nombre oficial en sistema (antes "La Calera" en SAP)
export const INSTALACIONES_MRC = [
  // Norte Grande
  { nombre: 'Antofagasta',  tipo: 'Sucursal',      zona: 'Norte Grande'   },
  { nombre: 'Arica',        tipo: 'Sucursal',      zona: 'Norte Grande'   },
  { nombre: 'Calama',       tipo: 'Sucursal',      zona: 'Norte Grande'   },
  { nombre: 'Iquique',      tipo: 'Sucursal',      zona: 'Norte Grande'   },
  // Norte Chico
  { nombre: 'Copiapó',      tipo: 'Sucursal',      zona: 'Norte Chico'    },
  { nombre: 'Coquimbo',     tipo: 'Sucursal',      zona: 'Norte Chico'    },
  // Centro
  { nombre: 'San Felipe',   tipo: 'Distribuidora', zona: 'Centro'         },
  { nombre: 'Viña del Mar', tipo: 'Sucursal',      zona: 'Centro'         },
  { nombre: 'Hijuelas',     tipo: 'Sucursal',      zona: 'Centro'         },
  // Metropolitana
  { nombre: 'Huechuraba',   tipo: 'Sucursal',      zona: 'Metropolitana'  },
  { nombre: 'Miraflores',   tipo: 'Sucursal',      zona: 'Metropolitana'  },
  { nombre: 'Lo Espejo',    tipo: 'Sucursal',      zona: 'Metropolitana'  },
  // O'Higgins
  { nombre: 'Rancagua',     tipo: 'Sucursal',      zona: "O'Higgins"      },
  // Maule
  { nombre: 'Curicó',       tipo: 'Distribuidora', zona: 'Maule'          },
  { nombre: 'Talca',        tipo: 'Distribuidora', zona: 'Maule'          },
  // Valparaíso
  { nombre: 'San Antonio',  tipo: 'Sucursal',      zona: 'Valparaíso'     },
  // Ñuble
  { nombre: 'Chillán',      tipo: 'Sucursal',      zona: 'Ñuble'          },
  // Biobío
  { nombre: 'Concepción',   tipo: 'Sucursal',      zona: 'Biobío'         },
  { nombre: 'Los Ángeles',  tipo: 'Sucursal',      zona: 'Biobío'         },
  // Araucanía
  { nombre: 'Temuco',       tipo: 'Sucursal',      zona: 'Araucanía'      },
  // Los Ríos
  { nombre: 'Valdivia',     tipo: 'Sucursal',      zona: 'Los Ríos'       },
  // Los Lagos
  { nombre: 'Osorno',       tipo: 'Sucursal',      zona: 'Los Lagos'      },
  { nombre: 'Puerto Montt', tipo: 'Sucursal',      zona: 'Los Lagos'      },
  { nombre: 'Castro',       tipo: 'Distribuidora', zona: 'Los Lagos'      },
  // Aysén
  { nombre: 'Coyhaique',    tipo: 'Distribuidora', zona: 'Aysén'          },
  // Magallanes
  { nombre: 'Punta Arenas', tipo: 'Sucursal',      zona: 'Magallanes'     },
]

// ── Reglas de negocio ─────────────────────────────────────────────────────────

// Nivel mínimo para ver el directorio de líderes (lectura)
export const NIVEL_MIN_DIRECTORIO = 2  // Jefe de Despacho en adelante

// Cargos cuya ausencia genera alerta ⚠️ en el panel admin
export const CARGOS_CRITICOS = [
  'Jefe de Zona',
  'Jefe de Operaciones',
  'Jefe de Frigorífico',
]

// Cargos con alcance nacional (ven todas las instalaciones)
export const ALCANCE_NACIONAL = ['zona', 'nacional']

// Helpers
export function getCargoByNivel(nivel) {
  return CARGOS_MRC.find(c => c.nivel === nivel) ?? null
}

export function getCargoByNombre(nombre) {
  return CARGOS_MRC.find(c => c.nombre === nombre) ?? null
}

export function getInstalacion(nombre) {
  return INSTALACIONES_MRC.find(i => i.nombre === nombre) ?? null
}

export function nivelPuedeVerDirectorio(nivel, role) {
  return role === 'admin' || nivel >= NIVEL_MIN_DIRECTORIO
}

// Dado un nivel, devuelve qué instalaciones puede ver
// Admin y alcance nacional/zona → todas
// Instalación → solo la suya (filtrado externo)
export function alcanceDeNivel(nivel) {
  const cargo = getCargoByNivel(nivel)
  if (!cargo) return 'none'
  return cargo.alcance
}
