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
      syncStatus: 'idle',    // 'idle' | 'syncing' | 'success' | 'error'
      lastSyncedAt: null,    // ISO string de la última sync exitosa
      lastSyncError: null,   // mensaje legible del último error (si syncStatus === 'error')

      // ── Formularios estáticos editados ─────────────────────────────────
      // El guardado LOCAL es siempre síncrono e infalible.
      // El cloud sync es fire-and-forget — nunca bloquea ni lanza al caller.
      saveFormEdits: (formId, formOverride) => {
        set((state) => ({
          editedForms:  { ...state.editedForms, [formId]: formOverride },
          lastSyncedAt: new Date().toISOString(),
        }))
        get()._syncToCloud().catch((e) => console.warn('[MRC Sync] Cloud sync falló (datos guardados local):', e?.message))
      },

      resetFormEdits: (formId) => {
        set((state) => {
          const { [formId]: _, ...rest } = state.editedForms
          return { editedForms: rest, lastSyncedAt: new Date().toISOString() }
        })
        get()._syncToCloud().catch((e) => console.warn('[MRC Sync] Cloud sync falló (datos guardados local):', e?.message))
      },

      getFormEdits: (formId) => get().editedForms[formId] || null,
      hasEdits: (formId) => !!get().editedForms[formId],

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
        const savedAt = new Date().toISOString()
        // Grabar lastSyncedAt ANTES del upload: protege los datos locales
        // aunque la subida a SharePoint falle. pullFromCloud compara contra
        // este timestamp y no sobrescribirá datos locales más nuevos.
        set({ syncStatus: 'syncing', lastSyncedAt: savedAt, lastSyncError: null })
        try {
          await syncFormsToSharePoint({ editedForms, customForms, savedAt })
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
        set({ syncStatus: 'syncing', lastSyncError: null })
        try {
          const data = await loadFormsFromSharePoint()
          if (data) {
            const localLastSync = get().lastSyncedAt
            const cloudSavedAt  = data.savedAt

            // Sobrescribir SOLO si:
            //   a) este dispositivo nunca ha guardado nada (primera vez), O
            //   b) cloud tiene timestamp Y ese timestamp es posterior al local
            // Si cloud no tiene timestamp (versión antigua sin savedAt) → NO sobrescribir:
            //   archivos sin savedAt son anteriores a esta lógica y pueden ser datos viejos.
            const cloudIsNewer =
              !localLastSync ||                              // a) dispositivo sin historial local
              (cloudSavedAt && cloudSavedAt > localLastSync) // b) cloud explícitamente más nuevo

            if (cloudIsNewer) {
              set({
                editedForms:   data.editedForms  || {},
                customForms:   data.customForms  || {},
                syncStatus:    'success',
                lastSyncedAt:  cloudSavedAt || new Date().toISOString(),
              })
              console.info('[MRC Sync] Store actualizado desde SharePoint ✓')
            } else {
              // Local es más nuevo — conservar local, marcar como sincronizado
              set({ syncStatus: 'success' })
              console.info('[MRC Sync] Local más reciente que cloud — conservando local')
            }
          } else {
            set({ syncStatus: 'idle' })
          }
        } catch (err) {
          set({ syncStatus: 'error', lastSyncError: err?.message || 'Error al leer desde SharePoint' })
        }
      },
    }),
    { name: 'mrc-form-editor-store' }
  )
)

export default useFormEditorStore
