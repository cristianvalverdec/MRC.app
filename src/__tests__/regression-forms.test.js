// ── Tests centinela: Formularios ─────────────────────────────────────────────
// Previene regresiones v1.2.6 y v1.2.7:
// - initQuestions no leía override.sections → preguntas eliminadas reaparecían
// - opciones select como strings no se normalizaban → aparecían en blanco

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { formDefinitions } from '../forms/formDefinitions.js'

const editorScreen = readFileSync(
  resolve(import.meta.dirname, '../screens/FormEditorDetailScreen.jsx'),
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
