import { create } from 'zustand'

const useDataStore = create((set) => ({
  kpiData: null,
  kpiLastUpdated: null,
  activityFeed: [],
  isLoading: false,
  error: null,

  setKpiData: (data) =>
    set({ kpiData: data, kpiLastUpdated: new Date().toISOString() }),

  setActivityFeed: (feed) => set({ activityFeed: feed }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  clearData: () => set({ kpiData: null, activityFeed: [], error: null }),
}))

export default useDataStore
