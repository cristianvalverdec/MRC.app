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

      // ── Formularios estáticos editados ─────────────────────────────────
      saveFormEdits: (formId, formOverride) => {
        set((state) => ({
          editedForms: { ...state.editedForms, [formId]: formOverride },
        }))
        get()._syncToCloud()
      },

      resetFormEdits: (formId) => {
        set((state) => {
          const { [formId]: _, ...rest } = state.editedForms
          return { editedForms: rest }
        })
        get()._syncToCloud()
      },

      getFormEdits: (formId) => get().editedForms[formId] || null,
      hasEdits: (formId) => !!get().editedForms[formId],

      // ── Formularios custom (creados por admin) ─────────────────────────
      addCustomForm: (formDef) => {
        set((state) => ({
          customForms: { ...state.customForms, [formDef.id]: formDef },
        }))
        get()._syncToCloud()
      },

      updateCustomForm: (formId, formDef) => {
        set((state) => ({
          customForms: { ...state.customForms, [formId]: formDef },
        }))
        get()._syncToCloud()
      },

      deleteCustomForm: (formId) => {
        set((state) => {
          const { [formId]: _, ...rest } = state.customForms
          return { customForms: rest }
        })
        get()._syncToCloud()
      },

      isCustomForm: (formId) => !!get().customForms[formId],
      getCustomForm: (formId) => get().customForms[formId] || null,

      // ── Sincronización con SharePoint ──────────────────────────────────
      // Llamado automáticamente después de cada cambio (fire-and-forget)
      _syncToCloud: async () => {
        const { editedForms, customForms } = get()
        set({ syncStatus: 'syncing' })
        try {
          await syncFormsToSharePoint({ editedForms, customForms })
          set({ syncStatus: 'success', lastSyncedAt: new Date().toISOString() })
        } catch {
          set({ syncStatus: 'error' })
        }
      },

      // Descarga la versión más reciente desde SharePoint al iniciar la app.
      // En modo dev retorna null y se queda con localStorage.
      pullFromCloud: async () => {
        set({ syncStatus: 'syncing' })
        try {
          const data = await loadFormsFromSharePoint()
          if (data) {
            set({
              editedForms: data.editedForms || {},
              customForms: data.customForms || {},
              syncStatus: 'success',
              lastSyncedAt: new Date().toISOString(),
            })
          } else {
            set({ syncStatus: 'idle' })
          }
        } catch {
          set({ syncStatus: 'error' })
        }
      },
    }),
    { name: 'mrc-form-editor-store' }
  )
)

export default useFormEditorStore
