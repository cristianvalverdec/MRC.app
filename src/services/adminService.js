// ── adminService.js ────────────────────────────────────────────────────────
// Gestiona la lista "Administradores MRC" en SharePoint.
// La lista se crea automáticamente la primera vez si no existe.
// El campo Title almacena el email del administrador.
//
// Super-admin permanente (hardcodeado, no puede ser removido desde la app):
//   cvalverde@agrosuper.com

import { msalInstance } from '../config/msalInstance'
import { graphScopes }  from '../config/msalConfig'

const LIST_NAME   = 'Administradores MRC'
const SUPER_ADMIN = 'cvalverde@agrosuper.com'

// Cache en memoria para evitar round-trips repetidos
let cachedListId   = null
let cachedAdmins   = null   // Set<string> de emails en minúsculas

// ── Helpers ───────────────────────────────────────────────────────────────

async function getToken() {
  const accounts = msalInstance.getAllAccounts()
  if (!accounts.length) throw new Error('Sin cuenta autenticada')
  const result = await msalInstance.acquireTokenSilent({ ...graphScopes, account: accounts[0] })
  return result.accessToken
}

function getSiteBase() {
  const raw = import.meta.env.VITE_SHAREPOINT_SITE_URL
  if (!raw) throw new Error('VITE_SHAREPOINT_SITE_URL no configurado')
  const url  = new URL(raw)
  const path = url.pathname.replace(/\/$/, '')
  return `https://graph.microsoft.com/v1.0/sites/${url.hostname}:${path}:`
}

// Obtiene o crea la lista y devuelve su GUID
async function getListId(token) {
  if (cachedListId) return cachedListId

  const siteBase = getSiteBase()
  const headers  = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  // Buscar lista por nombre
  const searchRes  = await fetch(
    `${siteBase}/lists?$filter=displayName eq '${LIST_NAME}'&$select=id`,
    { headers }
  )
  const searchData = await searchRes.json()

  if (searchData.value && searchData.value.length > 0) {
    cachedListId = searchData.value[0].id
    return cachedListId
  }

  // Crear lista si no existe (solo columna Title para email)
  const createRes = await fetch(`${siteBase}/lists`, {
    method:  'POST',
    headers,
    body: JSON.stringify({
      displayName: LIST_NAME,
      list: { template: 'genericList' },
    }),
  })
  const created = await createRes.json()
  if (!created.id) throw new Error(`Error creando lista: ${JSON.stringify(created)}`)
  cachedListId = created.id

  // Sembrar super-admin como primer ítem (solo campo Title = email)
  await fetch(`${siteBase}/lists/${cachedListId}/items`, {
    method:  'POST',
    headers,
    body: JSON.stringify({ fields: { Title: SUPER_ADMIN } }),
  })

  return cachedListId
}

// ── API pública ────────────────────────────────────────────────────────────

/**
 * Devuelve true si el email es admin (super-admin o está en la lista).
 * Cachea el resultado en memoria para la sesión.
 */
export async function isAdmin(email) {
  if (!email) return false
  const normalized = email.toLowerCase().trim()
  if (normalized === SUPER_ADMIN) return true

  // Usar cache si ya está cargado
  if (cachedAdmins) return cachedAdmins.has(normalized)

  try {
    const admins = await getAdmins()
    return admins.some(a => a.email === normalized)
  } catch {
    return false
  }
}

/**
 * Devuelve array de { id, email, nombre } con todos los admins de la lista.
 */
export async function getAdmins() {
  const token    = await getToken()
  const siteBase = getSiteBase()
  const listId   = await getListId(token)
  const headers  = { Authorization: `Bearer ${token}` }

  const res  = await fetch(
    `${siteBase}/lists/${listId}/items?$expand=fields($select=Title)&$top=100`,
    { headers }
  )
  const data = await res.json()

  if (!res.ok) throw new Error(`getAdmins error ${res.status}: ${JSON.stringify(data)}`)

  const admins = (data.value || []).map(item => ({
    id:     item.id,
    email:  (item.fields?.Title || '').toLowerCase().trim(),
    nombre: '',
  }))

  // Agregar super-admin siempre, aunque no esté en la lista
  if (!admins.some(a => a.email === SUPER_ADMIN)) {
    admins.unshift({ id: '__super__', email: SUPER_ADMIN, nombre: '' })
  }

  // Actualizar cache
  cachedAdmins = new Set(admins.map(a => a.email))

  return admins
}

/**
 * Agrega un nuevo admin. Devuelve el ítem creado.
 */
export async function addAdmin(email) {
  const normalized = email.toLowerCase().trim()
  if (normalized === SUPER_ADMIN) return   // ya existe, nada que hacer

  const token    = await getToken()
  const siteBase = getSiteBase()
  const listId   = await getListId(token)
  const headers  = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  const res  = await fetch(`${siteBase}/lists/${listId}/items`, {
    method:  'POST',
    headers,
    body: JSON.stringify({ fields: { Title: normalized } }),
  })
  const data = await res.json()

  if (!res.ok) throw new Error(`addAdmin error ${res.status}: ${JSON.stringify(data)}`)

  // Invalidar cache
  cachedAdmins = null
  return data
}

/**
 * Elimina un admin por su ID de ítem SharePoint.
 * No puede eliminar el super-admin.
 */
export async function removeAdmin(itemId, email) {
  if ((email || '').toLowerCase().trim() === SUPER_ADMIN) return  // protegido

  const token    = await getToken()
  const siteBase = getSiteBase()
  const listId   = await getListId(token)
  const headers  = { Authorization: `Bearer ${token}` }

  await fetch(`${siteBase}/lists/${listId}/items/${itemId}`, {
    method: 'DELETE',
    headers,
  })

  // Invalidar cache
  cachedAdmins = null
}

export { SUPER_ADMIN }
