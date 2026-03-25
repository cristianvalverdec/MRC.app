import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import LoadingSpinner from './components/ui/LoadingSpinner'
import useFormEditorStore from './store/formEditorStore'

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
        <Route path="/profile"                           element={<ProfileScreen />} />
        {/* Admin routes */}
        <Route path="/admin/fa-data"                 element={<FADataEntryScreen />} />
        <Route path="/admin/form-editor"             element={<FormEditorListScreen />} />
        <Route path="/admin/form-editor/:formId"     element={<FormEditorDetailScreen />} />
        {/* Fallback */}
        <Route path="*" element={<SplashScreen />} />
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  // Al iniciar la app: descarga la configuración más reciente de formularios
  // desde SharePoint. En dev mode esto es un no-op silencioso.
  useEffect(() => {
    useFormEditorStore.getState().pullFromCloud()
  }, [])

  return (
    <BrowserRouter>
      <Suspense fallback={<PageFallback />}>
        <AnimatedRoutes />
      </Suspense>
    </BrowserRouter>
  )
}
