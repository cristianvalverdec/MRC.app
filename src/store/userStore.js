import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useUserStore = create(
  persist(
    (set) => ({
      rut: '',
      name: '',
      email: '',
      jobTitle: '',   // cargo desde Azure AD
      photoUrl: '',   // base64 foto de perfil de Azure AD
      unit: '',       // 'sucursales' | 'fuerza-de-ventas'
      branch: '',     // nombre de la sucursal
      role: 'user',   // 'admin' | 'user'
      isAuthenticated: false,
      msalAccount: null,

      setUser: (userData) => set({ ...userData, isAuthenticated: true }),
      setUnit: (unit) => set({ unit }),
      setBranch: (branch) => set({ branch }),
      setRole: (role) => set({ role }),
      setPhotoUrl: (photoUrl) => set({ photoUrl }),
      clearUser: () => set({
        rut: '', name: '', email: '', jobTitle: '', photoUrl: '', unit: '', branch: '',
        role: 'user', isAuthenticated: false, msalAccount: null,
      }),
    }),
    {
      name: 'mrc-user-store',
      partialize: (state) => ({
        rut: state.rut,
        name: state.name,
        email: state.email,
        jobTitle: state.jobTitle,
        photoUrl: state.photoUrl,
        unit: state.unit,
        branch: state.branch,
        role: state.role,
      }),
    }
  )
)

export default useUserStore
