// ── Store de edición de formularios ──────────────────────────────────────
//
// editedForms   → overrides de formularios estáticos (definidos en formDefinitions.js)
// customForms   → formularios nuevos creados por administrador (no existen en static)
//
// Al guardar (admin) → se dispara _syncToCloud() que sube a SharePoint
// Al iniciar la app  → pullFromCloud() descarga la versión más reciente
// Todos los teléfonos con la PWA instalada reciben la actualización al
// iniciar la aplicación (o cuando un formulario se abre por primera vez).

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { syncFormsToSharePoint, loadFormsFromSharePoint } from '../services/sharepointSync'
import useScreenVisibilityStore from './screenVisibilityStore'

const useFormEditorStore = create(
  persist(
    (set, get) => ({
      // ── Ediciones a formularios estáticos ──────────────────────────────
      // { [formId]: { questions: {...} } | { sections: [...] } }
      editedForms: {},

      // ── Formularios nuevos creados por el administrador ────────────────
      // { [formId]: fullFormDefinition }
      customForms: {},

      // ── Estado de sincronización ───────────────────────────────────────
      syncStatus: 'idle',    // 'idle' | 'syncing' | 'success' | 'error'  (push)
      lastSyncedAt: null,    // ISO string de la última sync exitosa (push)
      lastSyncError: null,   // mensaje legible del último error push (si syncStatus === 'error')

      // ── Estado del pull (descarga) — independiente del push ────────────
      // El pull afecta a todos los usuarios (no solo admin), por eso rastreamos
      // su estado separado para que la UI pueda mostrar error sin confundir
      // con el guardado. Regla 5e CLAUDE.md: ningún fire-and-forget silencioso.
      pullStatus: 'idle',    // 'idle' | 'pulling' | 'success' | 'error'
      lastPullAt: null,      // ISO string del último pull exitoso
      lastPullError: null,   // mensaje legible del último error de pull

      // ── Formularios estáticos editados ─────────────────────────────────
      // El guardado LOCAL es siempre síncrono e infalible.
      // El cloud sync es fire-and-forget — nunca bloquea ni lanza al caller.
      saveFormEdits: (formId, formOverride) => {
        set((state) => ({
          editedForms:  { ...state.editedForms, [formId]: formOverride },
          lastSyncedAt: new Date().toISOString(),
        }))
        // Hard backup: copia en clave separada de Zustand persist.
        // Sobrevive un reset/migración del store sin perder las ediciones del admin.
        try {
          const hb = JSON.parse(localStorage.getItem('mrc-editor-hardbackup') || '{}')
          hb[formId] = { ...formOverride, _backupAt: new Date().toISOString() }
          localStorage.setItem('mrc-editor-hardbackup', JSON.stringify(hb))
        } catch { /* ignore */ }
        get()._syncToCloud().catch((e) => console.warn('[MRC Sync] Cloud sync falló (datos guardados local):', e?.message))
      },

      resetFormEdits: (formId) => {
        set((state) => {
          const { [formId]: _, ...rest } = state.editedForms
          return { editedForms: rest, lastSyncedAt: new Date().toISOString() }
        })
        // Limpiar también del hard backup para que no restaure al estado reseteado
        try {
          const hb = JSON.parse(localStorage.getItem('mrc-editor-hardbackup') || '{}')
          delete hb[formId]
          localStorage.setItem('mrc-editor-hardbackup', JSON.stringify(hb))
        } catch { /* ignore */ }
        get()._syncToCloud().catch((e) => console.warn('[MRC Sync] Cloud sync falló (datos guardados local):', e?.message))
      },

      getFormEdits: (formId) => get().editedForms[formId] || null,
      hasEdits: (formId) => !!get().editedForms[formId],

      // ── Archivo de formularios ─────────────────────────────────────────
      // Setea archived:true en el override del formulario. ToolsMenuScreen
      // filtra por este flag para ocultarlo a usuarios finales sin destruir
      // el override (puede revertirse desde el editor).
      archiveForm: (formId) => {
        const current = get().editedForms[formId] || {}
        get().saveFormEdits(formId, { ...current, archived: true })
      },
      unarchiveForm: (formId) => {
        const current = get().editedForms[formId] || {}
        const { archived: _a, ...rest } = current
        get().saveFormEdits(formId, rest)
      },
      isArchived: (formId) => {
        const ef = get().editedForms[formId]
        const cf = get().customForms[formId]
        return ef?.archived === true || cf?.archived === true
      },

      archiveCustomForm: (formId) => {
        const current = get().customForms[formId]
        if (!current) return
        get().updateCustomForm(formId, { ...current, archived: true })
      },
      unarchiveCustomForm: (formId) => {
        const current = get().customForms[formId]
        if (!current) return
        const { archived: _a, ...rest } = current
        get().updateCustomForm(formId, rest)
      },

      // ── Formularios custom (creados por admin) ─────────────────────────
      addCustomForm: (formDef) => {
        set((state) => ({
          customForms:  { ...state.customForms, [formDef.id]: formDef },
          lastSyncedAt: new Date().toISOString(),
        }))
        get()._syncToCloud().catch((e) => console.warn('[MRC Sync] Cloud sync falló (datos guardados local):', e?.message))
      },

      updateCustomForm: (formId, formDef) => {
        set((state) => ({
          customForms:  { ...state.customForms, [formId]: formDef },
          lastSyncedAt: new Date().toISOString(),
        }))
        get()._syncToCloud().catch((e) => console.warn('[MRC Sync] Cloud sync falló (datos guardados local):', e?.message))
      },

      deleteCustomForm: (formId) => {
        set((state) => {
          const { [formId]: _, ...rest } = state.customForms
          return { customForms: rest, lastSyncedAt: new Date().toISOString() }
        })
        get()._syncToCloud().catch((e) => console.warn('[MRC Sync] Cloud sync falló (datos guardados local):', e?.message))
      },

      isCustomForm: (formId) => !!get().customForms[formId],
      getCustomForm: (formId) => get().customForms[formId] || null,

      // ── Sincronización con SharePoint ──────────────────────────────────
      _syncToCloud: async () => {
        const { editedForms, customForms } = get()
        const disabledScreens = useScreenVisibilityStore.getState().disabledScreens
        const savedAt = new Date().toISOString()
        // Grabar lastSyncedAt ANTES del upload: protege los datos locales
        // aunque la subida a SharePoint falle. pullFromCloud compara contra
        // este timestamp y no sobrescribirá datos locales más nuevos.
        set({ syncStatus: 'syncing', lastSyncedAt: savedAt, lastSyncError: null })
        try {
          await syncFormsToSharePoint({ editedForms, customForms, disabledScreens, savedAt })
          set({ syncStatus: 'success', lastSyncError: null })
        } catch (err) {
          const message = err?.message || 'Error desconocido al sincronizar'
          set({ syncStatus: 'error', lastSyncError: message })
          throw err
        }
      },

      // Reintenta el sync manualmente (invocable desde UI después de un error)
      retryCloudSync: () => {
        return get()._syncToCloud().catch((e) => {
          console.warn('[MRC Sync] Retry manual falló:', e?.message)
        })
      },

      // Descarga la versión más reciente desde SharePoint.
      // IMPORTANTE: solo sobrescribe si la versión cloud es más nueva que la local.
      // Esto protege cambios locales no sincronizados de ser borrados por datos obsoletos.
      pullFromCloud: async () => {
        set({ pullStatus: 'pulling', lastPullError: null })

        // Si editedForms está vacío (localStorage limpiado o store recién inicializado),
        // intentar restaurar desde el hard backup local antes de contactar SharePoint.
        if (Object.keys(get().editedForms || {}).length === 0) {
          try {
            const hb = JSON.parse(localStorage.getItem('mrc-editor-hardbackup') || '{}')
            const forms = Object.fromEntries(
              Object.entries(hb).map(([id, v]) => {
                const { _backupAt: _ba, ...form } = v
                return [id, form]
              })
            )
            if (Object.keys(forms).length > 0) {
              set({ editedForms: forms })
              console.info('[MRC Sync] Formularios restaurados desde hard backup local ✓')
            }
          } catch { /* ignore */ }
        }

        try {
          const data = await loadFormsFromSharePoint()
          const nowIso = new Date().toISOString()
          if (data) {
            const localLastSync = get().lastSyncedAt
            const cloudSavedAt  = data.savedAt

            // Sobrescribir SOLO si:
            //   a) este dispositivo nunca ha guardado nada (primera vez), O
            //   b) el store local está vacío aunque tenga historial (posible reset de Zustand), O
            //   c) cloud tiene timestamp Y ese timestamp es posterior al local
            // Si cloud no tiene timestamp → NO sobrescribir (podría ser datos viejos).
            const cloudIsNewer =
              !localLastSync ||                                          // a) sin historial local
              Object.keys(get().editedForms || {}).length === 0 ||      // b) store vacío
              (cloudSavedAt && cloudSavedAt > localLastSync)            // c) cloud más nuevo

            if (cloudIsNewer) {
              set({
                editedForms:   data.editedForms  || {},
                customForms:   data.customForms  || {},
                pullStatus:    'success',
                lastPullAt:    nowIso,
                lastPullError: null,
                lastSyncedAt:  cloudSavedAt || nowIso,
              })
              if (data.disabledScreens) {
                useScreenVisibilityStore.getState().setDisabledScreens(data.disabledScreens)
              }
              console.info('[MRC Sync] Store actualizado desde SharePoint ✓')
            } else {
              set({ pullStatus: 'success', lastPullAt: nowIso, lastPullError: null })
              console.info('[MRC Sync] Local más reciente que cloud — conservando local')
            }
          } else {
            // 404: la config no existe aún en SharePoint. No es error.
            set({ pullStatus: 'success', lastPullAt: nowIso, lastPullError: null })
          }
        } catch (err) {
          const message = err?.message || 'Error al leer desde SharePoint'
          console.warn('[MRC Sync] Pull falló:', message)
          set({ pullStatus: 'error', lastPullError: message })
        }
      },

      // Reintento manual del pull — llamable desde UI cuando lastPullError ≠ null
      retryPull: () => get().pullFromCloud(),
    }),
    { name: 'mrc-form-editor-store' }
  )
)

export default useFormEditorStore
