import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useUserStore = create(
  persist(
    (set) => ({
      rut: '',
      name: '',
      email: '',
      jobTitle: '',       // cargo desde Azure AD (puede estar desactualizado)
      photoUrl: '',       // base64 foto de perfil de Azure AD
      unit: '',           // 'sucursales' | 'fuerza-de-ventas'
      branch: '',         // nombre de la sucursal (seleccionado por usuario)
      role: 'user',       // 'admin' | 'user'
      isAuthenticated: false,
      msalAccount: null,
      theme: 'dark',      // 'dark' | 'light'

      // ── Perfil MRC (fuente de verdad interna, independiente de Azure AD) ──
      mrcNivel: 0,        // nivel jerárquico MRC (0 = sin asignación, 1-10)
      mrcCargo: '',       // nombre del cargo en el sistema MRC
      instalacionMRC: '', // instalación asignada en el sistema MRC

      setUser: (userData) => set({ ...userData, isAuthenticated: true }),
      setUnit: (unit) => set({ unit }),
      setBranch: (branch) => set({ branch }),
      setRole: (role) => set({ role }),
      setPhotoUrl: (photoUrl) => set({ photoUrl }),
      setMrcPerfil: ({ mrcNivel, mrcCargo, instalacionMRC }) =>
        set({ mrcNivel, mrcCargo, instalacionMRC }),
      setTheme: (theme) => {
        set({ theme })
        document.documentElement.setAttribute('data-theme', theme)
        // Actualiza barra de URL (navegador) y barra inferior (PWA) en Android
        const navColor = theme === 'light' ? '#F0F3F9' : '#1B2A4A'
        document.documentElement.style.backgroundColor = navColor
        document.querySelector('meta[name="theme-color"]')?.setAttribute('content', navColor)
        // color-scheme siempre 'dark' — la app controla sus colores via data-theme,
        // no queremos que el sistema Android inyecte estilos claros en controles nativos
        // ni que fuerce la barra de navegación inferior a blanco.
      },
      clearUser: () => set({
        rut: '', name: '', email: '', jobTitle: '', photoUrl: '', unit: '', branch: '',
        role: 'user', isAuthenticated: false, msalAccount: null,
        mrcNivel: 0, mrcCargo: '', instalacionMRC: '',
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
        theme: state.theme,
        mrcNivel: state.mrcNivel,
        mrcCargo: state.mrcCargo,
        instalacionMRC: state.instalacionMRC,
      }),
    }
  )
)

export default useUserStore
