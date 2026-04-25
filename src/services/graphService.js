// ── Microsoft Graph API — Servicio de búsqueda de personas ───────────────
// Usado por QuestionPeoplePicker para consultar Azure AD en producción.
// En dev mode (sin CLIENT_ID real) este módulo no hace llamadas reales.

import { getGraphToken } from '../config/msalInstance'

const IS_DEV_MODE =
  !import.meta.env.VITE_AZURE_CLIENT_ID ||
  import.meta.env.VITE_AZURE_CLIENT_ID === 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'

const GRAPH_BASE = 'https://graph.microsoft.com/v1.0'

// Token: usa getGraphToken centralizado (loginRequest incluye User.ReadBasic.All)
async function getPeopleToken() {
  try {
    return await getGraphToken()
  } catch {
    return null
  }
}

// ── Búsqueda de usuarios ──────────────────────────────────────────────────
/**
 * Busca usuarios de Azure AD por displayName.
 * Devuelve array de { id, displayName, email }
 *
 * Requiere scope: User.ReadBasic.All
 * Requiere header: ConsistencyLevel: eventual  (para $search)
 */
export async function searchUsers(query) {
  if (IS_DEV_MODE) return []
  if (!query || query.trim().length < 2) return []

  const token = await getPeopleToken()
  if (!token) return []

  const q = query.trim()
  const url =
    `${GRAPH_BASE}/users` +
    `?$search="displayName:${encodeURIComponent(q)}"` +
    `&$select=id,displayName,mail,userPrincipalName` +
    `&$top=10` +
    `&$orderby=displayName` +
    `&$filter=accountEnabled eq true`

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        ConsistencyLevel: 'eventual', // Requerido para $search en Graph
      },
    })

    if (!res.ok) {
      console.warn('[graphService] searchUsers error:', res.status, await res.text())
      return []
    }

    const data = await res.json()
    return (data.value || []).map((u) => ({
      id: u.id,
      displayName: u.displayName || u.userPrincipalName,
      email: u.mail || u.userPrincipalName || '',
    }))
  } catch (err) {
    console.warn('[graphService] fetch error:', err)
    return []
  }
}

// ── Verificar existencia de un email específico en Azure AD ──────────────
//
// Útil antes de aceptar un email manual en el listado de Permisos SP:
// previene typos como `fgaticaaa@agrosuper.com` que jamás van a recibir
// permisos. Reusa el scope User.ReadBasic.All ya consentido — NO requiere
// nuevo consent.
//
// Devuelve:
//   { exists: boolean, displayName?: string, mail?: string, error?: string }
export async function userExistsInAzureAD(email) {
  if (IS_DEV_MODE) return { exists: true, displayName: 'Usuario Demo (dev)' }

  if (!email || typeof email !== 'string') return { exists: false, error: 'Email inválido' }

  const token = await getPeopleToken()
  if (!token) return { exists: false, error: 'Sin token Graph' }

  // GET /users/{userPrincipalName} — endpoint exact-match.
  // Devuelve 404 si no existe (no error real, es la señal esperada).
  const url = `${GRAPH_BASE}/users/${encodeURIComponent(email)}` +
              `?$select=id,displayName,mail,userPrincipalName,accountEnabled`

  try {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })

    if (res.status === 404) return { exists: false }
    if (res.status === 401 || res.status === 403) {
      return { exists: false, error: `Sin permiso para verificar AD (${res.status})` }
    }
    if (!res.ok) return { exists: false, error: `Error ${res.status}` }

    const data = await res.json()
    if (data?.accountEnabled === false) {
      return { exists: false, error: 'Cuenta deshabilitada en AD' }
    }
    return {
      exists: true,
      displayName: data?.displayName || '',
      mail:        data?.mail || data?.userPrincipalName || email,
    }
  } catch (err) {
    return { exists: false, error: err?.message || 'Error de red' }
  }
}
