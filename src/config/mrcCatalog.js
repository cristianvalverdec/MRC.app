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
//
// Tipos de estructura organizativa:
//   completa        → tiene frigorífico + jefe de operaciones (estructura estándar)
//   sin_frigorifico → no opera frigorífico propio (ej. ciudades sin planta fría)
//   sin_joperaciones → estructura reducida, sin Jefe de Operaciones (instalaciones pequeñas)
//
// sin_frigorifico:  Arica, Calama, Copiapó, San Antonio, Los Ángeles, Valdivia, Osorno
// sin_joperaciones: Hijuelas, Puerto Montt, Punta Arenas
// Distribuidoras:   estructura completa por defecto (se revisará caso a caso)
export const INSTALACIONES_MRC = [
  // Norte Grande
  { nombre: 'Antofagasta',  tipo: 'Sucursal',      zona: 'Norte Grande',  estructura: 'completa'         },
  { nombre: 'Arica',        tipo: 'Sucursal',      zona: 'Norte Grande',  estructura: 'sin_frigorifico'  },
  { nombre: 'Calama',       tipo: 'Sucursal',      zona: 'Norte Grande',  estructura: 'sin_frigorifico'  },
  { nombre: 'Iquique',      tipo: 'Sucursal',      zona: 'Norte Grande',  estructura: 'completa'         },
  // Norte Chico
  { nombre: 'Copiapó',      tipo: 'Sucursal',      zona: 'Norte Chico',   estructura: 'sin_frigorifico'  },
  { nombre: 'Coquimbo',     tipo: 'Sucursal',      zona: 'Norte Chico',   estructura: 'completa'         },
  // Centro
  { nombre: 'San Felipe',   tipo: 'Distribuidora', zona: 'Centro',        estructura: 'completa'         },
  { nombre: 'Viña del Mar', tipo: 'Sucursal',      zona: 'Centro',        estructura: 'completa'         },
  { nombre: 'Hijuelas',     tipo: 'Sucursal',      zona: 'Centro',        estructura: 'sin_joperaciones' },
  // Metropolitana
  { nombre: 'Huechuraba',   tipo: 'Sucursal',      zona: 'Metropolitana', estructura: 'completa'         },
  { nombre: 'Miraflores',   tipo: 'Sucursal',      zona: 'Metropolitana', estructura: 'completa'         },
  { nombre: 'Lo Espejo',    tipo: 'Sucursal',      zona: 'Metropolitana', estructura: 'completa'         },
  // O'Higgins
  { nombre: 'Rancagua',     tipo: 'Sucursal',      zona: "O'Higgins",     estructura: 'completa'         },
  // Maule
  { nombre: 'Curicó',       tipo: 'Distribuidora', zona: 'Maule',         estructura: 'completa'         },
  { nombre: 'Talca',        tipo: 'Distribuidora', zona: 'Maule',         estructura: 'completa'         },
  // Valparaíso
  { nombre: 'San Antonio',  tipo: 'Sucursal',      zona: 'Valparaíso',    estructura: 'sin_frigorifico'  },
  // Ñuble
  { nombre: 'Chillán',      tipo: 'Sucursal',      zona: 'Ñuble',         estructura: 'completa'         },
  // Biobío
  { nombre: 'Concepción',   tipo: 'Sucursal',      zona: 'Biobío',        estructura: 'completa'         },
  { nombre: 'Los Ángeles',  tipo: 'Sucursal',      zona: 'Biobío',        estructura: 'sin_frigorifico'  },
  // Araucanía
  { nombre: 'Temuco',       tipo: 'Sucursal',      zona: 'Araucanía',     estructura: 'completa'         },
  // Los Ríos
  { nombre: 'Valdivia',     tipo: 'Sucursal',      zona: 'Los Ríos',      estructura: 'sin_frigorifico'  },
  // Los Lagos
  { nombre: 'Osorno',       tipo: 'Sucursal',      zona: 'Los Lagos',     estructura: 'sin_frigorifico'  },
  { nombre: 'Puerto Montt', tipo: 'Sucursal',      zona: 'Los Lagos',     estructura: 'sin_joperaciones' },
  { nombre: 'Castro',       tipo: 'Distribuidora', zona: 'Los Lagos',     estructura: 'completa'         },
  // Aysén
  { nombre: 'Coyhaique',    tipo: 'Distribuidora', zona: 'Aysén',         estructura: 'completa'         },
  // Magallanes
  { nombre: 'Punta Arenas', tipo: 'Sucursal',      zona: 'Magallanes',    estructura: 'sin_joperaciones' },
]

// ── Reglas de negocio ─────────────────────────────────────────────────────────

// Nivel mínimo para ver el directorio de líderes (lectura)
export const NIVEL_MIN_DIRECTORIO = 2  // Jefe de Despacho en adelante

// Cargos críticos por tipo de estructura organizativa.
// El Jefe Administrativo es OBLIGATORIO en TODAS las estructuras sin excepción.
export const CARGOS_CRITICOS_POR_ESTRUCTURA = {
  completa:         ['Jefe de Zona', 'Jefe de Operaciones', 'Jefe de Frigorífico', 'Jefe Administrativo'],
  sin_frigorifico:  ['Jefe de Zona', 'Jefe de Operaciones', 'Jefe Administrativo'],
  sin_joperaciones: ['Jefe de Zona', 'Jefe Administrativo'],
}

// Alias para instalaciones de estructura completa (referencia y compatibilidad)
export const CARGOS_CRITICOS = CARGOS_CRITICOS_POR_ESTRUCTURA.completa

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

// Devuelve los cargos críticos requeridos para una instalación específica,
// según su tipo de estructura organizativa.
// Si la instalación no existe en el catálogo, usa la estructura 'completa' por defecto.
export function getCargosEstructura(instalacionNombre) {
  const inst = INSTALACIONES_MRC.find(i => i.nombre === instalacionNombre)
  const tipo = inst?.estructura ?? 'completa'
  return CARGOS_CRITICOS_POR_ESTRUCTURA[tipo] ?? CARGOS_CRITICOS_POR_ESTRUCTURA.completa
}
