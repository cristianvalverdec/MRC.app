// ── useBootstrap ──────────────────────────────────────────────────────────
// Se ejecuta una vez en App.jsx tras el loginRedirect.
// Detecta la cuenta MSAL activa, obtiene perfil + foto desde Graph API
// y los guarda en userStore.

import { useEffect, useRef } from 'react'
import { useMsal } from '@azure/msal-react'
import useUserStore from '../store/userStore'
import useFormEditorStore from '../store/formEditorStore'
import { loginRequest } from '../config/msalConfig'
import { isAdmin } from '../services/adminService'
import { getLiderByEmail } from '../services/lideresService'

const IS_DEV_MODE =
  !import.meta.env.VITE_AZURE_CLIENT_ID ||
  import.meta.env.VITE_AZURE_CLIENT_ID === 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'

const GRAPH = 'https://graph.microsoft.com/v1.0'

export function useBootstrap() {
  const { instance, accounts } = useMsal()
  const { setUser, setPhotoUrl, setMrcPerfil, isAuthenticated, photoUrl, name } = useUserStore()
  const fetching = useRef(false)

  useEffect(() => {
    if (IS_DEV_MODE) return
    if (accounts.length === 0) return
    if (isAuthenticated && name && photoUrl) return   // ya cargado, no re-fetch
    if (fetching.current) return

    fetching.current = true

    const run = async () => {
      try {
        // 1. Obtener access token silenciosamente
        const tokenResult = await instance.acquireTokenSilent({
          ...loginRequest,
          account: accounts[0],
        })
        const token = tokenResult.accessToken
        const headers = { Authorization: `Bearer ${token}` }

        // 2. Perfil básico del usuario
        const profileRes = await fetch(`${GRAPH}/me?$select=displayName,mail,userPrincipalName,jobTitle`, { headers })
        const profile = await profileRes.json()
        const userEmail = profile.mail || profile.userPrincipalName || accounts[0].username || ''

        // Verificar si el usuario es administrador de la app
        let role = 'user'
        try {
          if (await isAdmin(userEmail)) role = 'admin'
        } catch {
          // Si falla la consulta, sigue como usuario normal
        }

        setUser({
          name:     profile.displayName || accounts[0].name || '',
          email:    userEmail,
          jobTitle: profile.jobTitle || '',
          role,
          isAuthenticated: true,
        })

        // 3. Perfil MRC — busca el cargo real en la lista "Líderes MRC"
        //    independiente del cargo en Azure AD (que puede estar desactualizado)
        try {
          const liderMRC = await getLiderByEmail(userEmail)
          if (liderMRC) {
            setMrcPerfil({
              mrcNivel:      liderMRC.nivelJerarquico,
              mrcCargo:      liderMRC.cargoMRC,
              instalacionMRC: liderMRC.instalacion,
            })
          }
        } catch {
          // No bloquear el login si falla la consulta MRC
        }

        // 4. Descargar configuración de formularios — se hace aquí porque
        //    ya tenemos un token válido. App.jsx lo intenta al montar pero
        //    puede ejecutarse antes de que MSAL haya cargado las cuentas.
        useFormEditorStore.getState().pullFromCloud()

        // 5. Foto de perfil (puede no existir → 404, se ignora)
        try {
          const photoRes = await fetch(`${GRAPH}/me/photo/$value`, { headers })
          if (photoRes.ok) {
            const blob = await photoRes.blob()
            // Convertir a base64 para persistir en localStorage
            const reader = new FileReader()
            reader.onloadend = () => {
              setPhotoUrl(reader.result)   // "data:image/jpeg;base64,..."
            }
            reader.readAsDataURL(blob)
          }
        } catch {
          // Sin foto — no es un error crítico
        }
      } catch (err) {
        console.warn('[useBootstrap] Error al obtener perfil:', err)
      } finally {
        fetching.current = false
      }
    }

    run()
  }, [accounts, instance, isAuthenticated, name, photoUrl, setUser, setPhotoUrl])
}
