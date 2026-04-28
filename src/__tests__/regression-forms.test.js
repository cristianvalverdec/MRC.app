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
    expect(formScreen).toContain('staticSec?.visibleWhen')
  })

  it('debe restaurar visibleWhen de pregunta desde el mapa estático (staticVWMap)', () => {
    expect(formScreen).toContain('staticVWMap[q.id]')
  })

  it('reconstruye visibleWhen desde visibleCondition serializable (secciones nuevas creadas en el editor)', () => {
    // Para secciones/preguntas creadas en el editor (sin función visibleWhen estática)
    // FormScreen debe construir la función a partir de un objeto serializable.
    expect(formScreen).toContain('buildVisibleFn')
    expect(formScreen).toContain('visibleCondition')
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

describe('pauta-verificacion-reglas-oro — CIERRE genérico (v1.9.15b)', () => {
  const form = formDefinitions['pauta-verificacion-reglas-oro']
  const cierre = form?.sections?.find((s) => s.id === 'cierre')
  const Q46 = cierre?.questions?.find((q) => q.id === 'Q46')
  const Q48 = cierre?.questions?.find((q) => q.id === 'Q48')

  it('la sección CIERRE usa Object.values() para detectar SIN/CON — no lista fija de IDs', () => {
    // Verifica que respuestas de CUALQUIER pregunta con valor SIN_OBSERVACIONES activen CIERRE
    const answerConId = { Q999: 'SIN_OBSERVACIONES' } // ID inventado, no está en la lista estática
    expect(cierre?.visibleWhen?.(answerConId)).toBe(true)
    const answerConObs = { Q888: 'CON_OBSERVACIONES' }
    expect(cierre?.visibleWhen?.(answerConObs)).toBe(true)
    const answerVacio = { Q22: null }
    expect(cierre?.visibleWhen?.(answerVacio)).toBe(false)
  })

  it('Q46 es visible con cualquier pregunta = SIN_OBSERVACIONES', () => {
    expect(Q46?.visibleWhen?.({ QX: 'SIN_OBSERVACIONES' })).toBe(true)
    expect(Q46?.visibleWhen?.({ QX: 'CON_OBSERVACIONES' })).toBe(false)
  })

  it('Q48 es visible con cualquier pregunta = CON_OBSERVACIONES', () => {
    expect(Q48?.visibleWhen?.({ QX: 'CON_OBSERVACIONES' })).toBe(true)
    expect(Q48?.visibleWhen?.({ QX: 'SIN_OBSERVACIONES' })).toBe(false)
  })

  it('preguntas de cierre NUNCA usan lista hardcodeada de IDs', () => {
    // Centinela: si alguien revierte al patrón viejo, este test falla
    const src = readFileSync(
      resolve(import.meta.dirname, '../forms/formDefinitions.js'), 'utf-8'
    )
    // El patrón viejo era: rqs.some(q => a[q] === ...)
    expect(src).not.toMatch(/rqs\.some\(q => a\[q\] === 'SIN_OBSERVACIONES'\)/)
    expect(src).not.toMatch(/rqs\.some\(q => a\[q\] === 'CON_OBSERVACIONES'\)/)
    // El patrón nuevo debe estar presente
    expect(src).toContain("Object.values(a).some(v => v === 'SIN_OBSERVACIONES'")
    expect(src).toContain("Object.values(a).some(v => v === 'CON_OBSERVACIONES'")
  })
})

// ── Tests v1.9.15 — Editor 100% fiable + SP list assignment ─────────────────

describe('sharepointLists — catálogo compartido (v1.9.15)', () => {
  const listsFile = readFileSync(
    resolve(import.meta.dirname, '../services/sharepointLists.js'),
    'utf-8'
  )
  const sharepointData = readFileSync(
    resolve(import.meta.dirname, '../services/sharepointData.js'),
    'utf-8'
  )

  it('exporta SHAREPOINT_LISTS como array (fuente única de GUIDs)', () => {
    expect(listsFile).toContain('export const SHAREPOINT_LISTS')
    expect(listsFile).toMatch(/\[[\s\S]*\]/)
  })

  it('cada entrada tiene key, label y guid', () => {
    // Verificar presencia de los campos clave en el archivo fuente
    expect(listsFile).toContain('key:')
    expect(listsFile).toContain('label:')
    expect(listsFile).toContain('guid:')
  })

  it('sharepointData consume SHAREPOINT_LIST_BY_KEY en lugar de GUIDs hardcodeados', () => {
    expect(sharepointData).toContain('SHAREPOINT_LIST_BY_KEY')
  })

  it('exporta resolveListConfig para validación externa (FormScreen)', () => {
    expect(sharepointData).toContain('export function resolveListConfig')
  })

  it('mapGenericFromOverride usa spColumn declarado por pregunta', () => {
    expect(sharepointData).toContain('mapGenericFromOverride')
    expect(sharepointData).toContain('spColumn')
  })

  it('getListConfig lanza error con código NO_LIST_CONFIGURED si no hay lista', () => {
    expect(sharepointData).toContain('NO_LIST_CONFIGURED')
  })
})

describe('FormEditorListScreen — NewFormModal requiere lista (v1.9.15)', () => {
  const listScreen = readFileSync(
    resolve(import.meta.dirname, '../screens/FormEditorListScreen.jsx'),
    'utf-8'
  )

  it('importa SHAREPOINT_LISTS para el dropdown', () => {
    expect(listScreen).toContain('SHAREPOINT_LISTS')
  })

  it('handleCreate bloquea si no hay listId', () => {
    expect(listScreen).toContain('listId')
    // El modal debe mostrar error si falta la lista
    expect(listScreen).toContain('Lista SharePoint')
  })

  it('el formDef resultante incluye listId', () => {
    // listId puede ser shorthand (listId,) o propiedad explícita (listId: ...)
    expect(listScreen).toMatch(/listId[,:]/)
  })
})

describe('FormEditorDetailScreen — Conexión SharePoint + Archive (v1.9.15)', () => {
  it('tiene sección ConexionSharePointPanel', () => {
    expect(editorScreen).toContain('ConexionSharePointPanel')
  })

  it('tiene sección ArchiveFormPanel con botón de archivar', () => {
    expect(editorScreen).toContain('ArchiveFormPanel')
    expect(editorScreen).toContain('Archivar formulario')
  })

  it('pestaña "conexion" está en el array de tabs', () => {
    expect(editorScreen).toContain("'conexion'")
  })
})

describe('formEditorStore — archive helpers (v1.9.15)', () => {
  const store = readFileSync(
    resolve(import.meta.dirname, '../store/formEditorStore.js'),
    'utf-8'
  )

  it('archiveForm setea archived:true en editedForms', () => {
    expect(store).toContain('archiveForm')
    expect(store).toContain('archived: true')
  })

  it('unarchiveForm elimina el flag archived', () => {
    expect(store).toContain('unarchiveForm')
    expect(store).toMatch(/archived: _a[\s\S]*\.\.\.rest/)
  })

  it('isArchived consulta editedForms y customForms', () => {
    expect(store).toContain('isArchived')
    expect(store).toContain('cf?.archived')
  })
})

describe('ToolsMenuScreen — filtrado de formularios archivados (v1.9.15)', () => {
  const toolsScreen = readFileSync(
    resolve(import.meta.dirname, '../screens/ToolsMenuScreen.jsx'),
    'utf-8'
  )

  it('excluye formularios estáticos con archived:true del menú', () => {
    expect(toolsScreen).toContain('editedForms[t.formType]?.archived')
  })

  it('excluye custom forms con archived:true del menú', () => {
    expect(toolsScreen).toContain('if (f.archived) return false')
  })
})

describe('FormEditorDetailScreen — F1 herencia visibleCondition (v1.9.15)', () => {
  it('addQuestion copia visibleCondition de la sección destino a la pregunta nueva', () => {
    expect(editorScreen).toContain('targetSection?.visibleCondition')
    expect(editorScreen).toContain('newQ.visibleCondition = { ...targetSection.visibleCondition }')
  })
})

describe('FormEditorDetailScreen — F2 modal obligatorio en addSection (v1.9.15)', () => {
  it('allSectionsGated detecta gating en secciones estáticas y de override', () => {
    expect(editorScreen).toContain('allSectionsGated')
    expect(editorScreen).toContain('staticSec?.visibleWhen')
  })

  it('addSection abre modal de visibilidad si todas las hermanas están gateadas', () => {
    expect(editorScreen).toContain('shouldForceModal')
    expect(editorScreen).toContain('setPendingVisibilityFor')
  })

  it('SectionVisibilityModal acepta prop forced para mostrar aviso obligatorio', () => {
    expect(editorScreen).toContain('forced = false')
    expect(editorScreen).toContain('pendingVisibilityFor === conditionFor.id')
  })
})

describe('FormEditorDetailScreen — F3 parseVisibleWhen (v1.9.15)', () => {
  it('parseVisibleWhen está definida como función helper', () => {
    expect(editorScreen).toContain('function parseVisibleWhen(fn)')
  })

  it('initSections usa parseVisibleWhen para condiciones estáticas (_staticVisibleCondition)', () => {
    expect(editorScreen).toContain('_staticVisibleCondition')
    expect(editorScreen).toContain('parseVisibleWhen(visWhenFn)')
  })

  it('handleSaveConfirmed no persiste _staticVisibleCondition (es solo display)', () => {
    // La serialización de sections en handleSaveConfirmed usa solo id/title/visibleCondition
    expect(editorScreen).toMatch(/sections: sectionsState\.map\(\(s\) => \({/)
    // No persiste _staticVisibleCondition
    expect(editorScreen).not.toContain('_staticVisibleCondition: s._staticVisibleCondition')
  })

  it('renderConditionLabel soporta { questionId }, { all }, { any } y { _complex }', () => {
    expect(editorScreen).toContain('function renderConditionLabel(vc)')
    expect(editorScreen).toContain('vc.questionId')
    expect(editorScreen).toContain('vc.all')
    expect(editorScreen).toContain('vc.any')
    expect(editorScreen).toContain('_complex')
  })
})

describe('FormEditorDetailScreen — F4 gating inconsistente (v1.9.15)', () => {
  it('validateForm detecta secciones sin gating cuando >50% hermanas lo tienen', () => {
    expect(editorScreen).toContain('F4 — gating inconsistente')
    expect(editorScreen).toContain('gatedSections')
  })

  it('validateForm acepta originalStatic para comparar visibleWhen estáticos', () => {
    expect(editorScreen).toMatch(/function validateForm\(questions, staticForm, isWizard, originalStatic/)
    expect(editorScreen).toContain('originalStatic')
  })
})

describe('FormEditorDetailScreen — F5 macro Regla de Oro (v1.9.15)', () => {
  it('isReglasOroTemplate detecta metadata.template === reglas-oro', () => {
    expect(editorScreen).toContain("metadata?.template === 'reglas-oro'")
  })

  it('addReglaOroMacro crea atómicamente: opción Q20/Q21 + sección + radio + checkbox', () => {
    expect(editorScreen).toContain('addReglaOroMacro')
    expect(editorScreen).toContain('controllerId')
    expect(editorScreen).toContain('newOption')
    // Crea sección con visibleCondition referenciando el controlador
    expect(editorScreen).toContain('questionId: controllerId, equals: newOption')
    // Crea preguntas radio y checkbox
    expect(editorScreen).toContain("type: 'radio'")
    expect(editorScreen).toContain("type: 'checkbox'")
  })

  it('SectionsManager muestra botón AGREGAR REGLA DE ORO cuando isReglasOroTemplate', () => {
    expect(editorScreen).toContain('AGREGAR REGLA DE ORO (TEMPLATE)')
    expect(editorScreen).toContain('onOpenAddRegla')
  })

  it('pauta-verificacion-reglas-oro tiene metadata.template = reglas-oro', () => {
    const form = formDefinitions['pauta-verificacion-reglas-oro']
    expect(form).toBeDefined()
    expect(form.metadata?.template).toBe('reglas-oro')
  })
})

describe('FormScreen — fail-loud sin lista SharePoint (v1.9.15)', () => {
  it('importa resolveListConfig de sharepointData', () => {
    expect(formScreen).toContain('resolveListConfig')
  })

  it('handleSubmit verifica resolveListConfig antes de encolar', () => {
    expect(formScreen).toContain('resolveListConfig(formType)')
    expect(formScreen).toContain('setNoListError(true)')
  })

  it('muestra modal SIN LISTA SHAREPOINT si no hay config', () => {
    expect(formScreen).toContain('SIN LISTA SHAREPOINT')
    expect(formScreen).toContain('noListError')
  })
})

describe('FormScreen — herencia automática en CIERRE (preguntas huérfanas heredan de Q46) (v1.9.15b)', () => {
  it('tiene caso especial para sección CIERRE', () => {
    expect(formScreen).toContain("if (overrideSec.id === 'cierre')")
  })

  it('busca Q46 para obtener su visibleWhen (SIN_OBSERVACIONES)', () => {
    expect(formScreen).toContain("q46 = overrideSec.questions?.find((q) => q.id === 'Q46')")
    expect(formScreen).toContain('q46VisWhen')
  })

  it('preguntas en CIERRE sin visibleWhen (excepto Q46/Q48) heredan visibleWhen de Q46', () => {
    // Si una pregunta como Q51 está en CIERRE, no tiene staticVWMap, no tiene visibleCondition,
    // y no es Q46 o Q48 → heredar de Q46 (SIN_OBSERVACIONES)
    expect(formScreen).toContain('if (!visWhen && !staticVWMap[q.id]')
    expect(formScreen).toContain('visWhen = q46VisWhen')
  })

  it('Q46 y Q48 mantienen su visibleWhen propio (no heredan)', () => {
    // Q46 y Q48 tienen visibleWhen en el estático, así que staticVWMap tiene valores para ellas
    expect(formScreen).toContain("q.id !== 'Q46' && q.id !== 'Q48'")
  })

  it('la sección CIERRE en formDefinitions tiene SOLO Q46 y Q48 con visibleWhen propio', () => {
    const form = formDefinitions['pauta-verificacion-reglas-oro']
    const cierre = form.sections.find((s) => s.id === 'cierre')
    expect(cierre).toBeDefined()
    const qs = cierre.questions
    expect(qs).toHaveLength(2)
    expect(qs.every((q) => typeof q.visibleWhen === 'function')).toBe(true)
    // Q46 → SIN_OBSERVACIONES, Q48 → CON_OBSERVACIONES
    expect(qs.map((q) => q.id)).toEqual(expect.arrayContaining(['Q46', 'Q48']))
  })

  it('otras secciones gateadas aún descartan huérfanas sin visibleCondition (allStaticGated)', () => {
    // Para secciones que no sean CIERRE pero sean totalmente gateadas: seguir filtrando
    expect(formScreen).toContain('allStaticGated')
    expect(formScreen).toContain('if (allStaticGated) return false')
  })
})

describe('FormEditorDetailScreen + FormScreen — Q51 en CIERRE hereda de Q46 (v1.9.15b)', () => {
  it('FormScreen tiene caso especial para sección CIERRE', () => {
    expect(formScreen).toContain("if (overrideSec.id === 'cierre')")
  })

  it('FormScreen obtiene visibleWhen de Q46 para heredarla a preguntas sin condición', () => {
    expect(formScreen).toContain('q46VisWhen')
    expect(formScreen).toContain("q46 = overrideSec.questions?.find((q) => q.id === 'Q46')")
  })

  it('preguntas como Q51 (sin visibleWhen, no estáticas) heredan visibleWhen de Q46', () => {
    // Q51 "describir retroalimentación positiva" automáticamente es visible cuando SIN_OBSERVACIONES
    expect(formScreen).toContain('if (!visWhen && !staticVWMap[q.id]')
    expect(formScreen).toContain('visWhen = q46VisWhen')
  })

  it('Q46 y Q48 nunca heredan (mantienen su visibleWhen estático)', () => {
    expect(formScreen).toContain("q.id !== 'Q46' && q.id !== 'Q48'")
  })
})
