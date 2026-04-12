// ── adminService.js ────────────────────────────────────────────────────────
// Gestiona la lista "Administradores MRC" en SharePoint.
// La lista se crea automáticamente la primera vez si no existe.
// El campo Title almacena el email del administrador.
//
// Super-admin permanente (hardcodeado, no puede ser removido desde la app):
//   cvalverde@agrosuper.com

import { getGraphToken } from '../config/msalInstance'

const LIST_NAME   = 'Administradores MRC'
const SUPER_ADMIN = 'cvalverde@agrosuper.com'

// Cache en memoria para evitar round-trips repetidos
let cachedListId   = null
let cachedAdmins   = null   // Set<string> de emails en minúsculas

// ── Helpers ───────────────────────────────────────────────────────────────

// Token: usa getGraphToken centralizado de msalInstance.js
const getToken = getGraphToken

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

  // Si el GUID está configurado en el entorno, usarlo directamente
  const envListId = import.meta.env.VITE_SP_ADMINS_LIST_ID
  if (envListId) {
    cachedListId = envListId
    return cachedListId
  }

  const siteBase = getSiteBase()
  const headers  = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  // Buscar lista en cliente (más robusto que $filter en Graph API de SharePoint)
  const searchRes = await fetch(
    `${siteBase}/lists?$select=id,displayName&$top=200`,
    { headers }
  )
  if (!searchRes.ok) {
    const errBody = await searchRes.text().catch(() => '')
    throw new Error(`No se pudo acceder a SharePoint (${searchRes.status}): ${errBody.slice(0, 120)}`)
  }
  const searchData = await searchRes.json()
  const found = (searchData.value || []).find(
    l => l.displayName?.toLowerCase() === LIST_NAME.toLowerCase()
  )
  if (found) {
    cachedListId = found.id
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
  if (!createRes.ok) {
    const errBody = await createRes.text().catch(() => '')
    throw new Error(`No se pudo crear la lista "${LIST_NAME}" (${createRes.status}): ${errBody.slice(0, 120)}`)
  }
  const created = await createRes.json()
  if (!created.id) throw new Error(`Respuesta inesperada al crear lista: ${JSON.stringify(created).slice(0, 150)}`)
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
