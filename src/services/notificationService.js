// ── notificationService.js ────────────────────────────────────────────────────
// Gestiona dos listas SharePoint:
//   "Notificaciones MRC"        — notificaciones creadas por administradores
//   "Notificaciones MRC Leídas" — registro de lecturas por usuario
//
// Ambas listas se crean automáticamente en la primera ejecución.
// Sigue el mismo patrón que lideresService.js (resolveListId + ensureColumns).

import { getGraphToken } from '../config/msalInstance'

const LIST_NOTIFS = 'Notificaciones MRC'
const LIST_LEIDAS = 'Notificaciones MRC Leídas'

let cacheListIds = {}

const getToken = getGraphToken

function getSiteBase() {
  const raw = import.meta.env.VITE_SHAREPOINT_SITE_URL
  if (!raw) throw new Error('VITE_SHAREPOINT_SITE_URL no configurado')
  const url  = new URL(raw)
  const path = url.pathname.replace(/\/$/, '')
  return `https://graph.microsoft.com/v1.0/sites/${url.hostname}:${path}:`
}

function normalizar(s) {
  return (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
}

async function resolveListId(token, listName, columnasDef = []) {
  if (cacheListIds[listName]) return cacheListIds[listName]

  const siteBase = getSiteBase()
  const headers  = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  const searchRes  = await fetch(
    `${siteBase}/lists?$select=id,displayName&$top=200`,
    { headers }
  )
  const searchData = await searchRes.json()

  const found = (searchData.value || []).find(
    l => l.displayName === listName || normalizar(l.displayName) === normalizar(listName)
  )

  if (found) {
    cacheListIds[listName] = found.id
    await ensureColumns(siteBase, found.id, columnasDef, headers)
    return cacheListIds[listName]
  }

  const createRes = await fetch(`${siteBase}/lists`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      displayName: listName,
      list: { template: 'genericList' },
    }),
  })
  const created = await createRes.json()
  if (!created.id) {
    if (created.error?.code === 'accessDenied') {
      throw Object.assign(
        new Error(`La lista "${listName}" no existe y debe ser creada por el administrador del sitio SharePoint.`),
        { code: 'SP_SETUP_REQUIRED' }
      )
    }
    throw new Error(`Error creando lista "${listName}": ${JSON.stringify(created)}`)
  }
  cacheListIds[listName] = created.id
  await ensureColumns(siteBase, cacheListIds[listName], columnasDef, headers)
  return cacheListIds[listName]
}

async function ensureColumns(siteBase, listId, columnasDef, headers) {
  for (const colDef of columnasDef) {
    await fetch(`${siteBase}/lists/${listId}/columns`, {
      method: 'POST',
      headers,
      body: JSON.stringify(colDef),
    }).catch(() => {})
  }
}

// ── Definición de columnas ────────────────────────────────────────────────────

const COLS_NOTIFS = [
  { name: 'Cuerpo',          text: { allowMultipleLines: true } },
  { name: 'Tipo',            text: {} },
  { name: 'Destinatarios',   text: {} },
  { name: 'CreadoPor',       text: {} },
  { name: 'FechaExpiracion', text: {} },
  { name: 'Activa',          boolean: {} },
  { name: 'AccionRuta',      text: {} },
]

const COLS_LEIDAS = [
  { name: 'EmailUsuario',    text: {} },
  { name: 'NotificacionId',  text: {} },
  { name: 'FechaLeida',      text: {} },
]

// ── Mappers ───────────────────────────────────────────────────────────────────

function mapNotif(item) {
  const f = item.fields || {}
  return {
    id:              item.id,
    titulo:          f.Title          || '',
    cuerpo:          f.Cuerpo         || '',
    tipo:            f.Tipo           || 'sistema',
    destinatarios:   f.Destinatarios  || 'todos',
    creadoPor:       f.CreadoPor      || '',
    fechaExpiracion: f.FechaExpiracion || null,
    activa:          f.Activa !== false,
    accionRuta:      f.AccionRuta     || '',
    creadaEn:        item.createdDateTime || '',
  }
}

function mapLeida(item) {
  const f = item.fields || {}
  return {
    id:             item.id,
    notificacionId: f.Title           || '',
    emailUsuario:   f.EmailUsuario    || '',
    fechaLeida:     f.FechaLeida      || '',
  }
}

// ── Lógica de filtrado de destinatarios ──────────────────────────────────────

/**
 * Evalúa si una notificación aplica a un usuario dado.
 *
 * Formatos del campo Destinatarios:
 *   'todos'                   — todos los usuarios autenticados
 *   'instalacion:Miraflores'  — solo usuarios de esa instalación
 *   'nivel:3'                 — usuarios con nivelJerarquico >= N
 *   'email:x@agrosuper.cl'    — usuario específico
 */
function destinatarioMatch(destinatarios, email, instalacion, nivel) {
  if (!destinatarios || destinatarios === 'todos') return true

  if (destinatarios.startsWith('instalacion:')) {
    const target = destinatarios.split(':').slice(1).join(':').trim()
    return normalizar(instalacion || '') === normalizar(target)
  }

  if (destinatarios.startsWith('nivel:')) {
    const nivelMin = parseInt(destinatarios.split(':')[1], 10)
    return (nivel || 0) >= nivelMin
  }

  if (destinatarios.startsWith('email:')) {
    const target = destinatarios.split(':').slice(1).join(':').trim().toLowerCase()
    return (email || '').toLowerCase() === target
  }

  return false
}

// ── API pública ───────────────────────────────────────────────────────────────

/**
 * Devuelve notificaciones activas y vigentes para un usuario específico.
 * El filtrado de destinatarios se hace en cliente para mayor robustez con
 * caracteres especiales en columnas de SharePoint.
 */
export async function getNotificaciones(email, instalacion, nivel) {
  const token    = await getToken()
  const siteBase = getSiteBase()
  const listId   = await resolveListId(token, LIST_NOTIFS, COLS_NOTIFS)
  const headers  = { Authorization: `Bearer ${token}` }

  const res  = await fetch(
    `${siteBase}/lists/${listId}/items?$expand=fields&$orderby=createdDateTime desc&$top=200`,
    { headers }
  )
  const data = await res.json()
  if (!res.ok) throw new Error(`getNotificaciones error ${res.status}`)

  const ahora = new Date()
  return (data.value || [])
    .map(mapNotif)
    .filter(n => {
      if (!n.activa) return false
      if (n.fechaExpiracion && new Date(n.fechaExpiracion) < ahora) return false
      return destinatarioMatch(n.destinatarios, email, instalacion, nivel)
    })
}

/**
 * Devuelve el Set de IDs de notificaciones ya leídas por este usuario.
 */
export async function getLeidasIds(email) {
  const token    = await getToken()
  const siteBase = getSiteBase()
  const listId   = await resolveListId(token, LIST_LEIDAS, COLS_LEIDAS)
  const em       = (email || '').toLowerCase().trim()
  const headers  = {
    Authorization: `Bearer ${token}`,
    Prefer: 'HonorNonIndexedQueriesWarningMayFailRandomly',
  }

  const res  = await fetch(
    `${siteBase}/lists/${listId}/items?$expand=fields&$top=1000`,
    { headers }
  )
  const data = await res.json()
  if (!res.ok) throw new Error(`getLeidasIds error ${res.status}`)

  return new Set(
    (data.value || [])
      .map(mapLeida)
      .filter(l => l.emailUsuario === em)
      .map(l => l.notificacionId)
  )
}

/**
 * Marca una notificación como leída para un usuario.
 * Es fire-and-forget: no lanza si SharePoint falla (la lectura local es la fuente de verdad inmediata).
 */
export async function marcarLeida(notificacionId, email) {
  const token    = await getToken()
  const siteBase = getSiteBase()
  const listId   = await resolveListId(token, LIST_LEIDAS, COLS_LEIDAS)
  const headers  = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
  const em       = (email || '').toLowerCase().trim()

  await fetch(`${siteBase}/lists/${listId}/items`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      fields: {
        Title:          notificacionId,
        EmailUsuario:   em,
        NotificacionId: notificacionId,
        FechaLeida:     new Date().toISOString(),
      },
    }),
  }).catch(err => console.warn('[notificationService] marcarLeida failed:', err))
}

/**
 * Marca múltiples notificaciones como leídas (para "marcar todo como leído").
 */
export async function marcarVariasLeidas(notificacionIds, email) {
  for (const id of notificacionIds) {
    await marcarLeida(id, email)
  }
}

/**
 * Crea una nueva notificación (solo para administradores).
 */
export async function crearNotificacion(notif, adminEmail) {
  const token    = await getToken()
  const siteBase = getSiteBase()
  const listId   = await resolveListId(token, LIST_NOTIFS, COLS_NOTIFS)
  const headers  = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  const res  = await fetch(`${siteBase}/lists/${listId}/items`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      fields: {
        Title:           notif.titulo,
        Cuerpo:          notif.cuerpo,
        Tipo:            notif.tipo,
        Destinatarios:   notif.destinatarios,
        CreadoPor:       adminEmail,
        FechaExpiracion: notif.fechaExpiracion || '',
        Activa:          true,
        AccionRuta:      notif.accionRuta || '',
      },
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(`crearNotificacion error ${res.status}: ${JSON.stringify(data)}`)
  return mapNotif(data)
}

/**
 * Desactiva una notificación (soft-delete). No borra el ítem para mantener historial.
 */
export async function desactivarNotificacion(id) {
  const token    = await getToken()
  const siteBase = getSiteBase()
  const listId   = await resolveListId(token, LIST_NOTIFS, COLS_NOTIFS)
  const headers  = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  const res = await fetch(`${siteBase}/lists/${listId}/items/${id}/fields`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ Activa: false }),
  })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(`desactivarNotificacion error ${res.status}: ${JSON.stringify(data)}`)
  }
}

/**
 * Devuelve todas las notificaciones (activas e inactivas) para el panel admin.
 */
export async function getTodasNotificaciones() {
  const token    = await getToken()
  const siteBase = getSiteBase()
  const listId   = await resolveListId(token, LIST_NOTIFS, COLS_NOTIFS)
  const headers  = { Authorization: `Bearer ${token}` }

  const res  = await fetch(
    `${siteBase}/lists/${listId}/items?$expand=fields&$orderby=createdDateTime desc&$top=500`,
    { headers }
  )
  const data = await res.json()
  if (!res.ok) throw new Error(`getTodasNotificaciones error ${res.status}`)
  return (data.value || []).map(mapNotif)
}
