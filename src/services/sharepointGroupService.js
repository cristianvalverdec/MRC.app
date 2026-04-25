// ── Consulta del grupo SharePoint con permisos reales sobre el sitio ────
//
// IMPORTANTE — historia v1.9.10:
// Originalmente apuntábamos a "MRC Members", pero descubrimos en pruebas
// con tfigueroa@agrosuper.com que ese grupo fue creado SIN permission
// level asignado (Edit/Contribute/Read) sobre el sitio SSOASCOMERCIAL.
// Es un grupo "fantasma": agrupa usuarios pero no les concede acceso real.
//
// El grupo nativo "Integrantes de la SSO AS COMERCIAL" SÍ tiene Edit
// asignado por defecto (el grupo Members del template del sitio). Mover
// un usuario a ese grupo le da acceso inmediato, sin fricción.
//
// Mientras TI no asigne un permission level a MRC Members o lo elimine,
// la fuente de verdad para "tiene acceso al sitio" es el grupo nativo.
//
// Microsoft Graph NO expone los miembros de los SharePoint Site Groups
// (solo de M365 Groups), así que la única opción robusta es SP REST.
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

// Apuntamos al grupo nativo que SÍ otorga permisos. Si TI eventualmente
// arregla MRC Members (asignándole un permission level) podemos volver
// a apuntar acá; por ahora este es el grupo funcional.
const GROUP_NAME = 'Integrantes de la SSO AS COMERCIAL'

function getSiteRootUrl() {
  const raw = import.meta.env.VITE_SHAREPOINT_SITE_URL
  if (!raw) throw new Error('VITE_SHAREPOINT_SITE_URL no configurado')
  return raw.replace(/\/$/, '')
}

// Error tipado para consent pendiente — el caller decide qué UI mostrar.
export class ConsentRequiredError extends Error {
  constructor(message = 'Permiso AllSites.Read pendiente de aprobación TI') {
    super(message)
    this.code = 'CONSENT_REQUIRED'
    this.name = 'ConsentRequiredError'
  }
}

// Adquiere un token con audience SharePoint en modo SILENCIOSO.
// IMPORTANTE: NO dispara redirect automáticamente. Si el tenant requiere
// admin consent (caso Agrosuper), un redirect solo encola otra solicitud
// y muestra al usuario el diálogo "Aprobación necesaria" repetidamente.
//
// El caller debe:
//   - Capturar `ConsentRequiredError` y mostrar UI explicativa.
//   - Solo llamar `requestSharePointConsentExplicit()` si el usuario decide
//     activamente solicitar aprobación (botón claramente etiquetado).
export async function getSharePointRestToken() {
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
    if (isInteractionNeeded) {
      throw new ConsentRequiredError(
        'TI Agrosuper debe aprobar el permiso "AllSites.Read" para esta app. ' +
        'Tu solicitud quedó en cola en Azure Portal — la verificación funcionará ' +
        'automáticamente apenas TI apruebe (sin recargar la app).'
      )
    }
    throw err
  }
}

// Dispara el flujo de solicitud de consent (redirect a Microsoft).
// Solo invocar si el usuario lo eligió activamente en la UI.
// Recordar que en tenants con "user consent" deshabilitado, esto solo
// encola una solicitud al admin global — no concede el permiso.
export async function requestSharePointConsentExplicit() {
  const accounts = msalInstance.getAllAccounts()
  if (!accounts.length) throw new Error('Sin sesión activa')
  await msalInstance.acquireTokenRedirect({
    scopes:  sharePointRestScopes.scopes,
    account: accounts[0],
  })
}

// Devuelve los emails de los miembros actuales del grupo SP del sitio.
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

  // Puede lanzar ConsentRequiredError — el caller la captura y muestra UI.
  const token = await getSharePointRestToken()
  if (!token) return null

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
