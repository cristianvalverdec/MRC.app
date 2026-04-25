// ── Consulta del grupo SharePoint MRC Members ────────────────────────────
//
// Microsoft Graph NO expone los miembros de los SharePoint Site Groups
// (solo de M365 Groups). Como "MRC Members" es un Site Group del sitio
// SSOASCOMERCIAL, la única opción robusta es la SharePoint REST API.
//
// Endpoint:
//   GET {site}/_api/web/sitegroups/getbyname('MRC Members')/users
//
// Audience del token: SharePoint, no Graph. Por eso requiere un scope
// distinto (sharePointRestScopes.scopes) y NO se reusa el token Graph
// del flujo principal — son tokens con audience diferente.
//
// Consentimiento incremental:
//   - Usuarios normales NUNCA invocan este servicio → no ven el consent.
//   - Cuando un admin presiona "Verificar permisos en SharePoint" por
//     primera vez, MSAL falla con `consent_required` → caemos a
//     `acquireTokenRedirect` que pide el permiso UNA VEZ.
//   - La conexión Graph ya consentida por TI queda 100% intacta.

import { msalInstance } from '../config/msalInstance'
import { sharePointRestScopes } from '../config/msalConfig'

const IS_DEV_MODE =
  !import.meta.env.VITE_AZURE_CLIENT_ID ||
  import.meta.env.VITE_AZURE_CLIENT_ID === 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'

const GROUP_NAME = 'MRC Members'

function getSiteRootUrl() {
  const raw = import.meta.env.VITE_SHAREPOINT_SITE_URL
  if (!raw) throw new Error('VITE_SHAREPOINT_SITE_URL no configurado')
  return raw.replace(/\/$/, '')
}

// Adquiere un token con audience SharePoint. Si el usuario no ha
// consentido aún, dispara redirect (UNA VEZ).
export async function getSharePointRestToken({ allowInteraction = true } = {}) {
  const accounts = msalInstance.getAllAccounts()
  if (!accounts.length) throw new Error('Sin sesión activa')

  try {
    const result = await msalInstance.acquireTokenSilent({
      scopes:  sharePointRestScopes.scopes,
      account: accounts[0],
    })
    return result.accessToken
  } catch (err) {
    const code = err?.errorCode || ''
    const isInteractionNeeded =
      code === 'consent_required' ||
      code === 'interaction_required' ||
      err?.name === 'InteractionRequiredAuthError'
    if (isInteractionNeeded && allowInteraction) {
      // Redirect — el admin volverá a la pantalla con el token concedido.
      // NO usamos popup porque rompe la sesión PWA en Android.
      await msalInstance.acquireTokenRedirect({
        scopes:  sharePointRestScopes.scopes,
        account: accounts[0],
      })
      // acquireTokenRedirect no resuelve (la página recarga), pero por
      // las dudas devolvemos null para que el caller no continúe.
      return null
    }
    throw err
  }
}

// Devuelve los emails de los miembros actuales del grupo MRC Members.
// Una sola petición — el grupo completo en una respuesta. Soporta hasta
// 500 usuarios (configurable con $top si crece más).
//
// Retorna: { emails: Set<string>, fetchedAt: ISO string, total: number }
//
// Errores:
//   - 'consent_required' → captado y manejado en getSharePointRestToken
//   - 404 → el grupo no existe (config inválida)
//   - 401/403 → el admin no tiene permiso de leer el grupo
export async function getMrcMembersEmails() {
  if (IS_DEV_MODE) {
    return {
      emails: new Set([
        'demo@agrosuper.cl',
        'cvalverde@agrosuper.com',
        'aabarca@agrosuper.com',
      ]),
      fetchedAt: new Date().toISOString(),
      total: 3,
    }
  }

  const token = await getSharePointRestToken()
  if (!token) {
    // El flujo se desvió a redirect — la página se va a recargar
    return null
  }

  const siteUrl = getSiteRootUrl()
  const url = `${siteUrl}/_api/web/sitegroups/getbyname('${encodeURIComponent(GROUP_NAME)}')/users` +
              `?$select=Id,Email,Title,LoginName&$top=500`

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept:        'application/json;odata=nometadata',
    },
  })

  if (res.status === 404) {
    throw new Error(`El grupo "${GROUP_NAME}" no existe en el sitio. Verifica con TI.`)
  }
  if (res.status === 401 || res.status === 403) {
    throw new Error(`Sin permiso para leer el grupo (${res.status}). Tu cuenta debe ser Owner del sitio o tener AllSites.Read.`)
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`SP REST ${res.status}: ${body.slice(0, 120)}`)
  }

  const data  = await res.json()
  const items = Array.isArray(data?.value) ? data.value : []
  const emails = new Set()

  for (const u of items) {
    // LoginName típico Azure AD: "i:0#.f|membership|email@agrosuper.com"
    // En cuentas de invitado puede venir distinto, así que probamos ambos.
    const fromEmail = u?.Email && typeof u.Email === 'string' ? u.Email.toLowerCase() : null
    const fromLogin = u?.LoginName && typeof u.LoginName === 'string'
      ? u.LoginName.split('|').pop()?.toLowerCase()
      : null
    if (fromEmail && fromEmail.includes('@')) emails.add(fromEmail)
    else if (fromLogin && fromLogin.includes('@')) emails.add(fromLogin)
  }

  return {
    emails,
    fetchedAt: new Date().toISOString(),
    total: emails.size,
  }
}
