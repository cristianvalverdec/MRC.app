import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import useNavigationStore from '../store/navigationStore'

export function useNavigation() {
  const location = useLocation()
  const navigate = useNavigate()
  const { pushRoute, getPreviousRoute, popRoute } = useNavigationStore()

  // Rastrear la ruta actual en el stack cada vez que cambia
  useEffect(() => {
    pushRoute(location.pathname)
  }, [location.pathname, pushRoute])

  // Función para retroceder inteligentemente
  const goBack = () => {
    const previousRoute = getPreviousRoute()
    if (previousRoute) {
      popRoute()
      navigate(previousRoute)
    } else {
      // Fallback a navegación del navegador si no hay ruta anterior guardada
      navigate(-1)
    }
  }

  return { goBack }
}
