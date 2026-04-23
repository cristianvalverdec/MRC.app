import { lazy, Suspense, useEffect, Component } from 'react'
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useMsal, useIsAuthenticated } from '@azure/msal-react'
import { InteractionStatus } from '@azure/msal-browser'
import LoadingSpinner from './components/ui/LoadingSpinner'
import UpdateBanner from './components/ui/UpdateBanner'
import InstallPrompt from './components/ui/InstallPrompt'
import useFormEditorStore from './store/formEditorStore'
import useUserStore from './store/userStore'
import { getGraphToken } from './config/msalInstance'
import { useBootstrap } from './hooks/useBootstrap'
import { useNotifications } from './hooks/useNotifications'
import { useNavigation } from './hooks/useNavigation'

// ── Lazy-loaded screens (performance: code splitting per route) ───────
const SplashScreen          = lazy(() => import('./screens/SplashScreen'))
const SelectUnitScreen      = lazy(() => import('./screens/SelectUnitScreen'))
const UnitMenuScreen        = lazy(() => import('./screens/UnitMenuScreen'))
const ToolsMenuScreen       = lazy(() => import('./screens/ToolsMenuScreen'))
const FormScreen            = lazy(() => import('./screens/FormScreen'))
const DailyStatusScreen     = lazy(() => import('./screens/DailyStatusScreen'))
const AnalyticsScreen       = lazy(() => import('./screens/AnalyticsScreen'))
const FormEditorListScreen  = lazy(() => import('./screens/FormEditorListScreen'))
const FormEditorDetailScreen = lazy(() => import('./screens/FormEditorDetailScreen'))
const ProgramGoalsScreen    = lazy(() => import('./screens/ProgramGoalsScreen'))
const ProfileScreen              = lazy(() => import('./screens/ProfileScreen'))
const FADataEntryScreen          = lazy(() => import('./screens/FADataEntryScreen'))
const CierreCondicionesScreen    = lazy(() => import('./screens/CierreCondicionesScreen'))
const GestionCPHSScreen          = lazy(() => import('./screens/GestionCPHSScreen'))
const GestionSaludScreen         = lazy(() => import('./screens/GestionSaludScreen'))
const ProgramaTrabajoScreen      = lazy(() => import('./screens/ProgramaTrabajoScreen'))
const DifusionesSSOScreen        = lazy(() => import('./screens/DifusionesSSOScreen'))
const MonitorFatigaScreen         = lazy(() => import('./screens/MonitorFatigaScreen'))
const LideresScreen               = lazy(() => import('./screens/LideresScreen'))
const LideresAdminScreen          = lazy(() => import('./screens/LideresAdminScreen'))
const InstalacionDetailScreen     = lazy(() => import('./screens/InstalacionDetailScreen'))
const SharePointConnectionsScreen = lazy(() => import('./screens/SharePointConnectionsScreen'))
const ContratistasScreen           = lazy(() => import('./screens/ContratistasScreen'))
const NotificationsScreen          = lazy(() => import('./screens/NotificationsScreen'))
const NotificacionesAdminScreen    = lazy(() => import('./screens/NotificacionesAdminScreen'))
const ValidacionAdminScreen        = lazy(() => import('./screens/ValidacionAdminScreen'))
const MisDocumentosScreen          = lazy(() => import('./screens/MisDocumentosScreen'))

// ── Error Boundary — evita blank screen total ante cualquier error de render ──
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  componentDidCatch(error, info) {
    console.error('[MRC] Error en render:', error, info?.componentStack)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100dvh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: '#1B2A4A', padding: '24px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 44, marginBottom: 16 }}>⚠️</div>
          <div style={{ color: '#fff', fontFamily: 'sans-serif', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
            Error al cargar la pantalla
          </div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'sans-serif', fontSize: 13, marginBottom: 28, maxWidth: 320 }}>
            {this.state.error?.message || 'Error desconocido'}
          </div>
          <button
            onClick={() => { this.setState({ hasError: false, error: null }); window.history.back() }}
            style={{
              background: '#F57C20', color: '#fff', border: 'none',
              borderRadius: 10, padding: '14px 28px',
              fontFamily: 'sans-serif', fontSize: 15, fontWeight: 700, cursor: 'pointer',
            }}
          >
            ← Volver
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

function PageFallback() {
  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--color-navy)',
    }}>
      <LoadingSpinner size={36} label="Cargando..." />
    </div>
  )
}

function AnimatedRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/"                          element={<SplashScreen />} />
        <Route path="/select-unit"               element={<SelectUnitScreen />} />
        <Route path="/unit/:unitType"            element={<UnitMenuScreen />} />
        <Route path="/unit/:unitType/tools"      element={<ToolsMenuScreen />} />
        <Route path="/unit/:unitType/status"     element={<DailyStatusScreen />} />
        <Route path="/unit/:unitType/analytics"  element={<AnalyticsScreen />} />
        <Route path="/form/:formType"                element={<FormScreen />} />
        <Route path="/unit/:unitType/goals"              element={<ProgramGoalsScreen />} />
        <Route path="/unit/:unitType/cierre-condiciones" element={<CierreCondicionesScreen />} />
        <Route path="/unit/:unitType/cphs"                       element={<GestionCPHSScreen />} />
        <Route path="/unit/:unitType/cphs/programa-trabajo"    element={<ProgramaTrabajoScreen />} />
        <Route path="/unit/:unitType/salud"             element={<GestionSaludScreen />} />
        <Route path="/unit/:unitType/difusiones-sso"  element={<DifusionesSSOScreen />} />
        <Route path="/unit/:unitType/monitor-fatiga"  element={<MonitorFatigaScreen />} />
        <Route path="/unit/:unitType/contratistas"   element={<ContratistasScreen />} />
        <Route path="/profile"                           element={<ProfileScreen />} />
        {/* Directorio de líderes (lectura) */}
        <Route path="/unit/:unitType/lideres"        element={<LideresScreen />} />
        {/* Admin routes */}
        <Route path="/admin/fa-data"                 element={<FADataEntryScreen />} />
        <Route path="/admin/form-editor"             element={<FormEditorListScreen />} />
        <Route path="/admin/form-editor/:formId"     element={<FormEditorDetailScreen />} />
        <Route path="/admin/lideres"                 element={<LideresAdminScreen />} />
        <Route path="/admin/lideres/:instalacion"    element={<InstalacionDetailScreen />} />
        <Route path="/admin/sharepoint-connections" element={<SharePointConnectionsScreen />} />
        <Route path="/admin/notificaciones"         element={<NotificacionesAdminScreen />} />
        <Route path="/admin/validaciones"           element={<ValidacionAdminScreen />} />
        {/* Buzón de notificaciones del usuario */}
        <Route path="/notifications"               element={<NotificationsScreen />} />
        {/* Historial de documentos enviados por el usuario */}
        <Route path="/unit/:unitType/mis-documentos" element={<MisDocumentosScreen />} />
        {/* Fallback */}
        <Route path="*" element={<SplashScreen />} />
      </Routes>
    </AnimatePresence>
  )
}

// Maneja el retorno del redirect de Microsoft y sincroniza el usuario en el store
function AuthHandler() {
  const { accounts, inProgress } = useMsal()
  const isAuthenticated = useIsAuthenticated()
  const setUser = useUserStore((s) => s.setUser)
  const navigate = useNavigate()

  useEffect(() => {
    if (inProgress !== InteractionStatus.None) return
    if (isAuthenticated && accounts.length > 0) {
      const account = accounts[0]
      setUser({
        name: account.name || account.username,
        email: account.username,
        msalAccount: account,
        isAuthenticated: true,
      })
      // Si estamos en la raíz (splash), redirigir al selector de unidad
      if (window.location.pathname === '/' || window.location.pathname === '/MRC.app/' || window.location.pathname === '/MRC.app') {
        navigate('/select-unit')
      }
    }
  }, [isAuthenticated, accounts, inProgress, setUser, navigate])

  return null
}

const IS_DEV_MODE =
  !import.meta.env.VITE_AZURE_CLIENT_ID ||
  import.meta.env.VITE_AZURE_CLIENT_ID === 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'

function BootstrapHandler() {
  useBootstrap()
  return null
}

function NotificationsHandler() {
  useNotifications()
  return null
}

function NavigationTracker() {
  useNavigation()
  return null
}

// Detecta cuando el usuario vuelve a la app después de tenerla en background.
// Al regresar, intenta renovar el token silenciosamente para actualizar el semáforo.
// Si el token sigue vigente → dot verde. Si expiró → dot rojo + banner.
function ResumeHandler() {
  const isAuthenticated = useUserStore((s) => s.isAuthenticated)

  useEffect(() => {
    if (!isAuthenticated) return

    const handleVisibility = async () => {
      if (document.visibilityState !== 'visible') return
      try {
        await getGraphToken()
        // setTokenOk() ya lo llama getGraphToken() internamente al tener éxito
      } catch {
        // setTokenError() ya lo llama getGraphToken() internamente al fallar
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [isAuthenticated])

  return null
}

export default function App() {
  // Al iniciar la app: descarga la configuración más reciente de formularios
  // desde SharePoint. En dev mode esto es un no-op silencioso.
  useEffect(() => {
    useFormEditorStore.getState().pullFromCloud()
  }, [])

  return (
    <BrowserRouter basename="/MRC.app">
      {/* Banner de actualización — flota sobre toda la app */}
      <UpdateBanner />
      {/* Prompt de instalación PWA */}
      <InstallPrompt />
      <Suspense fallback={<PageFallback />}>
        {!IS_DEV_MODE && <AuthHandler />}
        {!IS_DEV_MODE && <BootstrapHandler />}
        {!IS_DEV_MODE && <ResumeHandler />}
        <NotificationsHandler />
        <NavigationTracker />
        <ErrorBoundary>
          <AnimatedRoutes />
        </ErrorBoundary>
      </Suspense>
    </BrowserRouter>
  )
}
