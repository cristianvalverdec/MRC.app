import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { submitFormToSharePoint } from '../services/sharepointData'

const useFormStore = create(
  persist(
    (set, get) => ({
      // Formularios en curso (draft)
      drafts: {},

      // Cola de envíos pendientes (offline-first)
      pendingQueue: [],

      // Estado de la cola de sincronización
      syncStatus: 'idle', // 'idle' | 'syncing' | 'done' | 'error'

      saveDraft: (formType, data) =>
        set((state) => ({
          drafts: { ...state.drafts, [formType]: data },
        })),

      clearDraft: (formType) =>
        set((state) => {
          const { [formType]: _, ...rest } = state.drafts
          return { drafts: rest }
        }),

      addToPendingQueue: (submission) =>
        set((state) => ({
          pendingQueue: [
            ...state.pendingQueue,
            { ...submission, id: Date.now(), createdAt: new Date().toISOString(), synced: false },
          ],
        })),

      removeFromQueue: (id) =>
        set((state) => ({
          pendingQueue: state.pendingQueue.filter((item) => item.id !== id),
        })),

      getPendingCount: () =>
        get().pendingQueue.filter((item) => !item.synced).length,

      // Procesa la cola: sube cada item no-sincronizado a SharePoint
      // Llámalo en: arranque de app (tras auth), refresh manual, recuperación de red
      syncQueue: async () => {
        const { pendingQueue } = get()
        const unsynced = pendingQueue.filter((item) => !item.synced)
        if (!unsynced.length) return

        set({ syncStatus: 'syncing' })
        let errors = 0

        for (const item of unsynced) {
          try {
            await submitFormToSharePoint(item)
            // Marcar como sincronizado en lugar de eliminar (para KPI local en dev)
            set((state) => ({
              pendingQueue: state.pendingQueue.map((q) =>
                q.id === item.id ? { ...q, synced: true } : q
              ),
            }))
          } catch {
            errors++
          }
        }

        set({ syncStatus: errors > 0 ? 'error' : 'done' })
        // Limpiar items sincronizados después de 24h (no acumular indefinidamente)
        const cutoff = Date.now() - 24 * 60 * 60 * 1000
        set((state) => ({
          pendingQueue: state.pendingQueue.filter(
            (item) => !(item.synced && item.id < cutoff)
          ),
        }))
      },
    }),
    { name: 'mrc-form-store' }
  )
)

export default useFormStore
