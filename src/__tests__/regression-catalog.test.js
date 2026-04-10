// ── Tests centinela: Catálogo organizacional ────────────────────────────────
// Protege la integridad del catálogo que alimenta líderes, perfiles y accesos.

import { describe, it, expect } from 'vitest'
import {
  CARGOS_MRC,
  INSTALACIONES_MRC,
  CARGOS_CRITICOS,
  CARGOS_CRITICOS_POR_ESTRUCTURA,
  NIVEL_MIN_DIRECTORIO,
  getCargoByNivel,
  getCargoByNombre,
  getInstalacion,
  getCargosEstructura,
  nivelPuedeVerDirectorio,
  alcanceDeNivel,
} from '../config/mrcCatalog.js'

describe('CARGOS_MRC — jerarquía', () => {
  it('debe tener exactamente 10 niveles', () => {
    expect(CARGOS_MRC).toHaveLength(10)
  })

  it('niveles van de 1 a 10 sin saltos', () => {
    const niveles = CARGOS_MRC.map((c) => c.nivel)
    expect(niveles).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  })

  it('cada cargo tiene nombre, alcance y requierePIN', () => {
    CARGOS_MRC.forEach((c) => {
      expect(c.nombre).toBeTruthy()
      expect(['turno', 'instalacion', 'zona', 'nacional']).toContain(c.alcance)
      expect(typeof c.requierePIN).toBe('boolean')
    })
  })
})

describe('INSTALACIONES_MRC', () => {
  it('debe tener 26 instalaciones (21 sucursales + 5 distribuidoras)', () => {
    expect(INSTALACIONES_MRC).toHaveLength(26)
    const sucursales = INSTALACIONES_MRC.filter((i) => i.tipo === 'Sucursal')
    const distribuidoras = INSTALACIONES_MRC.filter((i) => i.tipo === 'Distribuidora')
    expect(sucursales).toHaveLength(21)
    expect(distribuidoras).toHaveLength(5)
  })

  it('cada instalación tiene nombre, tipo, zona y estructura', () => {
    INSTALACIONES_MRC.forEach((i) => {
      expect(i.nombre).toBeTruthy()
      expect(['Sucursal', 'Distribuidora']).toContain(i.tipo)
      expect(i.zona).toBeTruthy()
      expect(['completa', 'sin_frigorifico', 'sin_joperaciones']).toContain(i.estructura)
    })
  })
})

describe('CARGOS_CRITICOS', () => {
  it('apunta a la estructura completa (4 cargos, incluye Jefe Administrativo)', () => {
    expect(CARGOS_CRITICOS).toContain('Jefe de Zona')
    expect(CARGOS_CRITICOS).toContain('Jefe de Operaciones')
    expect(CARGOS_CRITICOS).toContain('Jefe de Frigorífico')
    expect(CARGOS_CRITICOS).toContain('Jefe Administrativo')
    expect(CARGOS_CRITICOS).toHaveLength(4)
  })
})

describe('CARGOS_CRITICOS_POR_ESTRUCTURA', () => {
  it('tiene los 3 tipos de estructura', () => {
    expect(CARGOS_CRITICOS_POR_ESTRUCTURA).toHaveProperty('completa')
    expect(CARGOS_CRITICOS_POR_ESTRUCTURA).toHaveProperty('sin_frigorifico')
    expect(CARGOS_CRITICOS_POR_ESTRUCTURA).toHaveProperty('sin_joperaciones')
  })

  it('Jefe Administrativo está en todas las estructuras', () => {
    Object.values(CARGOS_CRITICOS_POR_ESTRUCTURA).forEach((cargos) => {
      expect(cargos).toContain('Jefe Administrativo')
    })
  })

  it('completa tiene 4 cargos, sin_frigorifico tiene 3, sin_joperaciones tiene 3', () => {
    expect(CARGOS_CRITICOS_POR_ESTRUCTURA.completa).toHaveLength(4)
    expect(CARGOS_CRITICOS_POR_ESTRUCTURA.sin_frigorifico).toHaveLength(3)
    expect(CARGOS_CRITICOS_POR_ESTRUCTURA.sin_joperaciones).toHaveLength(3)
  })

  it('sin_frigorifico NO incluye Jefe de Frigorífico (J. Operaciones asume ese rol)', () => {
    expect(CARGOS_CRITICOS_POR_ESTRUCTURA.sin_frigorifico).not.toContain('Jefe de Frigorífico')
    expect(CARGOS_CRITICOS_POR_ESTRUCTURA.sin_frigorifico).toContain('Jefe de Operaciones')
  })

  it('sin_joperaciones NO incluye Jefe de Operaciones pero SÍ Jefe de Frigorífico', () => {
    expect(CARGOS_CRITICOS_POR_ESTRUCTURA.sin_joperaciones).not.toContain('Jefe de Operaciones')
    expect(CARGOS_CRITICOS_POR_ESTRUCTURA.sin_joperaciones).toContain('Jefe de Frigorífico')
  })
})

describe('getCargosEstructura', () => {
  it('instalación completa → 4 cargos', () => {
    expect(getCargosEstructura('Antofagasta')).toHaveLength(4)
    expect(getCargosEstructura('Miraflores')).toContain('Jefe de Frigorífico')
  })

  it('sin_frigorifico → 3 cargos, sin Jefe de Frigorífico', () => {
    const cargos = getCargosEstructura('Arica')
    expect(cargos).toHaveLength(3)
    expect(cargos).not.toContain('Jefe de Frigorífico')
    expect(cargos).toContain('Jefe Administrativo')
  })

  it('sin_joperaciones → 3 cargos: Jefe de Zona, Jefe de Frigorífico y Jefe Administrativo', () => {
    const cargos = getCargosEstructura('Hijuelas')
    expect(cargos).toHaveLength(3)
    expect(cargos).toContain('Jefe de Zona')
    expect(cargos).toContain('Jefe de Frigorífico')
    expect(cargos).toContain('Jefe Administrativo')
    expect(cargos).not.toContain('Jefe de Operaciones')
  })

  it('instalación inexistente → usa completa por defecto', () => {
    expect(getCargosEstructura('Instalación Fantasma')).toHaveLength(4)
  })

  it('las 3 instalaciones sin_joperaciones requieren Jefe de Frigorífico pero no Jefe de Operaciones', () => {
    ['Hijuelas', 'Puerto Montt', 'Punta Arenas'].forEach((nombre) => {
      const cargos = getCargosEstructura(nombre)
      expect(cargos).toHaveLength(3)
      expect(cargos).toContain('Jefe de Frigorífico')
      expect(cargos).not.toContain('Jefe de Operaciones')
    })
  })

  it('las 7 instalaciones sin_frigorifico están correctamente clasificadas', () => {
    ['Arica', 'Calama', 'Copiapó', 'San Antonio', 'Los Ángeles', 'Valdivia', 'Osorno'].forEach((nombre) => {
      expect(getCargosEstructura(nombre)).toHaveLength(3)
    })
  })
})

describe('Helpers del catálogo', () => {
  it('getCargoByNivel retorna el cargo correcto', () => {
    expect(getCargoByNivel(1).nombre).toBe('Ayudante de Despacho')
    expect(getCargoByNivel(10).nombre).toBe('Gerente Comercial')
    expect(getCargoByNivel(99)).toBeNull()
  })

  it('getCargoByNombre retorna el cargo correcto', () => {
    expect(getCargoByNombre('Jefe de Zona').nivel).toBe(6)
    expect(getCargoByNombre('Cargo Inexistente')).toBeNull()
  })

  it('getInstalacion retorna la instalación correcta', () => {
    expect(getInstalacion('Temuco').zona).toBe('Araucanía')
    expect(getInstalacion('No Existe')).toBeNull()
  })

  it('nivelPuedeVerDirectorio respeta el nivel mínimo', () => {
    expect(nivelPuedeVerDirectorio(1, 'user')).toBe(false)
    expect(nivelPuedeVerDirectorio(NIVEL_MIN_DIRECTORIO, 'user')).toBe(true)
    expect(nivelPuedeVerDirectorio(1, 'admin')).toBe(true)
  })

  it('alcanceDeNivel retorna el alcance correcto', () => {
    expect(alcanceDeNivel(1)).toBe('turno')
    expect(alcanceDeNivel(6)).toBe('instalacion')
    expect(alcanceDeNivel(10)).toBe('nacional')
    expect(alcanceDeNivel(99)).toBe('none')
  })
})
