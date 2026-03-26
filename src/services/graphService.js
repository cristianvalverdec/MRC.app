// ── Microsoft Graph API — Servicio de búsqueda de personas ───────────────
// Usado por QuestionPeoplePicker para consultar Azure AD en producción.
// En dev mode (sin CLIENT_ID real) este módulo no hace llamadas reales.

import { msal } from '../config/msalInstance'
import { peopleSearchScopes } from '../config/msalConfig'

const IS_DEV_MODE =
  !import.meta.env.VITE_AZURE_CLIENT_ID ||
  import.meta.env.VITE_AZURE_CLIENT_ID === 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'

const GRAPH_BASE = 'https://graph.microsoft.com/v1.0'

// ── Token helper ──────────────────────────────────────────────────────────
async function getPeopleToken() {
  const accounts = msal.instance.getAllAccounts()
  if (!accounts.length) return null

  try {
    const result = await msal.instance.acquireTokenSilent({
      ...peopleSearchScopes,
      account: accounts[0],
    })
    return result.accessToken
  } catch {
    // Silent failed → intentar con popup (solo como último recurso)
    try {
      const result = await msal.instance.acquireTokenPopup(peopleSearchScopes)
      return result.accessToken
    } catch (err) {
      console.warn('[graphService] No se pudo obtener token para búsqueda de personas:', err)
      return null
    }
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
