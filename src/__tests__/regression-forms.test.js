// ── Tests centinela: Formularios ─────────────────────────────────────────────
// Previene regresiones v1.2.6 y v1.2.7:
// - initQuestions no leía override.sections → preguntas eliminadas reaparecían
// - opciones select como strings no se normalizaban → aparecían en blanco
// Previene regresión v1.3.x:
// - visibleWhen se pierde en JSON.stringify → todas las secciones visibles al mismo tiempo

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { formDefinitions } from '../forms/formDefinitions.js'

const editorScreen = readFileSync(
  resolve(import.meta.dirname, '../screens/FormEditorDetailScreen.jsx'),
  'utf-8'
)

const formScreen = readFileSync(
  resolve(import.meta.dirname, '../screens/FormScreen.jsx'),
  'utf-8'
)

describe('FormEditorDetailScreen — initQuestions (regresión v1.2.6)', () => {
  it('debe leer override.questions para formularios wizard', () => {
    expect(editorScreen).toContain('override?.questions')
  })

  it('debe leer override.sections para formularios seccionados', () => {
    expect(editorScreen).toContain('override?.sections')
  })
})

describe('FormScreen — override autoritativo restaura visibleWhen (regresión v1.3.x + v1.9.12)', () => {
  it('el override del editor es autoritativo: usa editedOverride.sections directamente', () => {
    // El formulario mostrado usa EXACTAMENTE lo que el admin guardó (no mezcla con estático)
    expect(formScreen).toContain('editedOverride.sections.map')
  })

  it('debe restaurar visibleWhen de sección desde el estático (staticSec?.visibleWhen)', () => {
    expect(formScreen).toContain('visibleWhen: staticSec?.visibleWhen')
  })

  it('debe restaurar visibleWhen de pregunta desde el mapa estático (staticVWMap)', () => {
    expect(formScreen).toContain('visibleWhen: staticVWMap[q.id]')
  })

  it('handleSave del editor debe eliminar _section/_sectionTitle/visibleWhen del override', () => {
    expect(editorScreen).toContain('stripInternal')
    expect(editorScreen).toContain('_section, _sectionTitle, visibleWhen: _vw')
  })
})

describe('FormEditorDetailScreen — v1.9.3 fixes (pregunta nueva no se pierde)', () => {
  it('emptyQuestion acepta sectionId/sectionTitle para asignar _section al crear (regla 5c)', () => {
    // Firma extendida: emptyQuestion(id, order, sectionId, sectionTitle)
    expect(editorScreen).toMatch(/function emptyQuestion\(id, order, sectionId = null, sectionTitle = null\)/)
    expect(editorScreen).toContain('base._section = sectionId')
    expect(editorScreen).toContain('base._sectionTitle = sectionTitle')
  })

  it('newQId considera IDs del formulario estático para evitar colisiones', () => {
    expect(editorScreen).toMatch(/function newQId\(existing, staticForm\)/)
    expect(editorScreen).toContain('staticForm?.sections')
  })

  it('handleSave agrupa preguntas con red de seguridad (groupQuestionsBySections)', () => {
    expect(editorScreen).toContain('groupQuestionsBySections')
    // Huérfanas se re-asignan a la primera sección, NO se descartan
    expect(editorScreen).toContain('orphans.forEach')
  })

  it('validateForm bloquea guardado con errores (IDs duplicados, labels vacíos, refs rotas)', () => {
    expect(editorScreen).toContain('function validateForm(')
    expect(editorScreen).toContain('IDs duplicados')
    expect(editorScreen).toContain('nextQuestion')
  })

  it('dropdowns de ramificación muestran el texto de la pregunta, no solo el ID', () => {
    expect(editorScreen).toContain('formatDestinationLabel')
    expect(editorScreen).toMatch(/\$\{id\} — \$\{truncateLabel/)
  })
})

describe('FormEditorDetailScreen — override autoritativo en el editor (regresión Q16, v1.9.14)', () => {
  it('initQuestions NO mezcla estático+override: el override es la única fuente de verdad', () => {
    // Si existe override.sections, el editor debe leerlo directamente.
    // El merge "estático como base, override encima" causaba que preguntas
    // eliminadas (ej. Q16 en pauta-verificacion-reglas-oro) reaparecieran.
    expect(editorScreen).not.toMatch(/Merge: estático como base, override encima/)
    expect(editorScreen).toMatch(/Override autoritativo[\s\S]*regla v1\.9\.12/)
  })

  it('soporta gestión de secciones (crear, renombrar, reordenar, eliminar)', () => {
    expect(editorScreen).toContain('function SectionsManager(')
    expect(editorScreen).toContain('addSection')
    expect(editorScreen).toContain('renameSection')
    expect(editorScreen).toContain('moveSection')
    expect(editorScreen).toContain('deleteSection')
  })

  it('handleSaveConfirmed persiste sectionsState (no staticForm.sections)', () => {
    // Las secciones que el admin gestiona deben sobrevivir al guardado.
    expect(editorScreen).toMatch(/sections: sectionsState\.map/)
  })
})

describe('formEditorStore — sync status honesto (v1.9.3)', () => {
  const store = readFileSync(
    resolve(import.meta.dirname, '../store/formEditorStore.js'),
    'utf-8'
  )

  it('expone lastSyncError con el detalle del error', () => {
    expect(store).toContain('lastSyncError')
  })

  it('expone retryCloudSync para reintento manual desde UI', () => {
    expect(store).toContain('retryCloudSync')
  })
})

describe('sharepointSync — retry con backoff (v1.9.3)', () => {
  const sync = readFileSync(
    resolve(import.meta.dirname, '../services/sharepointSync.js'),
    'utf-8'
  )

  it('reintenta hasta 3 veces con backoff', () => {
    expect(sync).toContain('backoffs')
    expect(sync).toMatch(/\[0, 1000, 3000\]/)
  })

  it('no reintenta errores 4xx (excepto 429)', () => {
    expect(sync).toContain('status !== 429')
  })
})

describe('formDefinitions — integridad estructural', () => {
  const forms = Object.values(formDefinitions)

  it('debe tener al menos 5 formularios definidos', () => {
    expect(forms.length).toBeGreaterThanOrEqual(5)
  })

  it('cada formulario tiene id, title y (sections o questions)', () => {
    forms.forEach((form) => {
      expect(form.id).toBeTruthy()
      expect(form.title).toBeTruthy()
      const hasSections = Array.isArray(form.sections) && form.sections.length > 0
      const hasQuestions = form.questions && Object.keys(form.questions).length > 0
      expect(hasSections || hasQuestions).toBe(true)
    })
  })

  it('las opciones de tipo select son siempre arrays no vacíos', () => {
    forms.forEach((form) => {
      const questions = form.sections
        ? form.sections.flatMap((s) => s.questions || [])
        : Object.values(form.questions || {})

      questions
        .filter((q) => q.type === 'select')
        .forEach((q) => {
          expect(Array.isArray(q.options)).toBe(true)
          expect(q.options.length).toBeGreaterThan(0)
        })
    })
  })
})
