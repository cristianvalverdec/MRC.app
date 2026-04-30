// ── Tests centinela: Sistema de Visibilidad de Pantallas ─────────────────────
// Previene regresiones en el sistema de habilitación/deshabilitación de pantallas
// introducido en v1.9.17.

import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

const ROOT = resolve(import.meta.dirname, '../../')
const SRC  = resolve(ROOT, 'src')

const read = (relPath) => readFileSync(resolve(SRC, relPath), 'utf-8')
const exists = (relPath) => existsSync(resolve(SRC, relPath))

describe('screenRegistry — integridad del catálogo', () => {
  it('el archivo screenRegistry.js existe', () => {
    expect(exists('config/screenRegistry.js')).toBe(true)
  })

  it('exporta SCREEN_REGISTRY y SCREEN_REGISTRY_BY_KEY', () => {
    const src = read('config/screenRegistry.js')
    expect(src).toContain('export const SCREEN_REGISTRY')
    expect(src).toContain('export const SCREEN_REGISTRY_BY_KEY')
  })

  it('contiene todos los keys del menú principal', () => {
    const src = read('config/screenRegistry.js')
    const principalKeys = ['tools', 'status', 'analytics', 'goals', 'cphs', 'salud']
    for (const key of principalKeys) {
      expect(src).toContain(`'${key}'`)
    }
  })

  it('contiene todos los keys de herramientas preventivas', () => {
    const src = read('config/screenRegistry.js')
    const toolKeys = [
      'pauta-verificacion-reglas-oro',
      'caminata-seguridad',
      'inspeccion-simple',
      'difusiones-sso',
      'cierre-condiciones',
      'monitor-fatiga',
      'contratistas',
      'observacion-conductual',
      'inspeccion-planificada',
      'lideres',
    ]
    for (const key of toolKeys) {
      expect(src).toContain(`'${key}'`)
    }
  })
})

describe('screenVisibilityStore — contrato de la interfaz', () => {
  it('el archivo screenVisibilityStore.js existe', () => {
    expect(exists('store/screenVisibilityStore.js')).toBe(true)
  })

  it('exporta toggleScreen, isScreenDisabled y setDisabledScreens', () => {
    const src = read('store/screenVisibilityStore.js')
    expect(src).toContain('toggleScreen')
    expect(src).toContain('isScreenDisabled')
    expect(src).toContain('setDisabledScreens')
  })

  it('usa clave localStorage mrc-screen-visibility', () => {
    const src = read('store/screenVisibilityStore.js')
    expect(src).toContain("'mrc-screen-visibility'")
  })
})

describe('formEditorStore — sync incluye disabledScreens', () => {
  it('_syncToCloud incluye disabledScreens en el payload', () => {
    const src = read('store/formEditorStore.js')
    expect(src).toContain('disabledScreens')
    expect(src).toContain('syncFormsToSharePoint')
  })

  it('pullFromCloud actualiza screenVisibilityStore', () => {
    const src = read('store/formEditorStore.js')
    expect(src).toContain('setDisabledScreens')
  })

  it('importa useScreenVisibilityStore', () => {
    const src = read('store/formEditorStore.js')
    expect(src).toContain("import useScreenVisibilityStore from './screenVisibilityStore'")
  })
})

describe('ScreenGuard — componente de protección de rutas', () => {
  it('el archivo ScreenGuard.jsx existe', () => {
    expect(exists('components/ui/ScreenGuard.jsx')).toBe(true)
  })

  it('renderiza NotAvailableScreen cuando la pantalla está deshabilitada', () => {
    const src = read('components/ui/ScreenGuard.jsx')
    expect(src).toContain('NotAvailableScreen')
    expect(src).toContain('Pantalla no disponible')
  })

  it('renderiza AdminDisabledBanner cuando el admin accede a pantalla deshabilitada', () => {
    const src = read('components/ui/ScreenGuard.jsx')
    expect(src).toContain('AdminDisabledBanner')
    expect(src).toContain('deshabilitada')
  })
})

describe('App.jsx — rutas protegidas con ScreenGuard', () => {
  it('importa ScreenGuard', () => {
    const src = read('App.jsx')
    expect(src).toContain("import ScreenGuard from './components/ui/ScreenGuard'")
  })

  it('tiene ruta /admin/screen-visibility', () => {
    const src = read('App.jsx')
    expect(src).toContain('/admin/screen-visibility')
    expect(src).toContain('ScreenVisibilityAdminScreen')
  })

  it('wrappea rutas críticas con ScreenGuard', () => {
    const src = read('App.jsx')
    const guardedKeys = ['status', 'analytics', 'goals', 'cphs', 'salud', 'monitor-fatiga']
    for (const key of guardedKeys) {
      expect(src).toContain(`screenKey="${key}"`)
    }
  })
})

describe('MenuCard — prop disabled', () => {
  it('acepta y aplica la prop disabled', () => {
    const src = read('components/ui/MenuCard.jsx')
    expect(src).toContain('disabled')
    expect(src).toContain('opacity')
    expect(src).toContain('grayscale')
  })

  it('muestra badge en rojo cuando disabled', () => {
    const src = read('components/ui/MenuCard.jsx')
    expect(src).toContain('rgba(239,68,68')
  })

  it('oculta el chevron cuando disabled', () => {
    const src = read('components/ui/MenuCard.jsx')
    expect(src).toContain('!disabled')
    expect(src).toContain('ChevronRight')
  })
})

describe('ScreenVisibilityAdminScreen — panel de administración', () => {
  it('el archivo existe', () => {
    expect(exists('screens/ScreenVisibilityAdminScreen.jsx')).toBe(true)
  })

  it('usa SCREEN_REGISTRY para listar pantallas', () => {
    const src = read('screens/ScreenVisibilityAdminScreen.jsx')
    expect(src).toContain('SCREEN_REGISTRY')
  })

  it('tiene componente Toggle', () => {
    const src = read('screens/ScreenVisibilityAdminScreen.jsx')
    expect(src).toContain('Toggle')
  })

  it('tiene indicador de sync', () => {
    const src = read('screens/ScreenVisibilityAdminScreen.jsx')
    expect(src).toContain('SyncIndicator')
    expect(src).toContain('syncStatus')
  })
})
