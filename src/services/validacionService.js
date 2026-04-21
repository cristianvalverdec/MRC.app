// ── validacionService.js ──────────────────────────────────────────────────────
// Gestiona la lista "Validaciones MRC" en SharePoint.
//
// Flujo principal:
//   1. Usuario sube un registro (p. ej. difusión SSO)
//   2. createValidacion() crea entrada con Estado:'pendiente' + notifica a admins
//   3. Admin aprueba/rechaza desde /admin/validaciones
//   4. aprobarValidacion() / rechazarValidacion() actualizan el estado + notifican al usuario
//
// La lista se crea automáticamente en la primera ejecución.
// Sigue el patrón de notificationService.js (resolveListId, ensureColumns, mappers).
//
// Columnas SharePoint:
//   Title, TipoRegistro, ReferenciaId, ReferenciaLista, NombreDocumento,
//   InstalacionOrigen, SubidoPor, FechaSubida, Estado, ValidadoPor,
//   FechaValidacion, Observaciones, ArchivoUrl

import { getGraphToken } from '../config/msalInstance'
import { crearNotificacion } from './notificationService'

const LIST_VALIDACIONES = 'Validaciones MRC'

let cacheListId = null

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

// ── Definición de columnas ────────────────────────────────────────────────────
const COLS_VALIDACIONES = [
  { name: 'TipoRegistro',     text: {} },
  { name: 'ReferenciaId',     number: {} },
  { name: 'ReferenciaLista',  text: {} },
  { name: 'NombreDocumento',  text: {} },
  { name: 'InstalacionOrigen', text: {} },
  { name: 'SubidoPor',        text: {} },
  { name: 'FechaSubida',      text: {} },
  // NOTA: 'Estado' no colisiona con columnas reservadas de SharePoint (al contrario de 'Tipo').
  { name: 'Estado',           text: {} },
  { name: 'ValidadoPor',      text: {} },
  { name: 'FechaValidacion',  text: {} },
  { name: 'Observaciones',    text: { allowMultipleLines: true } },
  { name: 'ArchivoUrl',       text: { allowMultipleLines: true } },
]

async function ensureColumns(siteBase, listId, headers) {
  for (const colDef of COLS_VALIDACIONES) {
    await fetch(`${siteBase}/lists/${listId}/columns`, {
      method: 'POST',
      headers,
      body: JSON.stringify(colDef),
    }).catch(() => {}) // Silencioso — si ya existe la columna, SP devuelve 400 (esperado)
  }
}

async function resolveListId(token) {
  if (cacheListId) return cacheListId

  const siteBase = getSiteBase()
  const headers  = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  // Buscar lista existente
  const searchRes  = await fetch(`${siteBase}/lists?$select=id,displayName&$top=200`, { headers })
  const searchData = await searchRes.json()

  const found = (searchData.value || []).find(
    l => l.displayName === LIST_VALIDACIONES || normalizar(l.displayName) === normalizar(LIST_VALIDACIONES)
  )

  if (found) {
    cacheListId = found.id
    await ensureColumns(siteBase, cacheListId, headers)
    return cacheListId
  }

  // Crear lista si no existe
  const createRes = await fetch(`${siteBase}/lists`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      displayName: LIST_VALIDACIONES,
      list: { template: 'genericList' },
    }),
  })
  const created = await createRes.json()

  if (!created.id) {
    if (created.error?.code === 'accessDenied') {
      throw Object.assign(
        new Error(`La lista "${LIST_VALIDACIONES}" no existe y debe ser creada por el administrador del sitio SharePoint.`),
        { code: 'SP_SETUP_REQUIRED' }
      )
    }
    throw new Error(`Error creando lista "${LIST_VALIDACIONES}": ${JSON.stringify(created)}`)
  }

  cacheListId = created.id
  await ensureColumns(siteBase, cacheListId, headers)
  return cacheListId
}

// ── Mapper ────────────────────────────────────────────────────────────────────

function mapValidacion(item) {
  const f = item.fields || {}
  return {
    id:               item.id,
    tipoRegistro:     f.TipoRegistro      || 'difusion',
    referenciaId:     f.ReferenciaId      || null,
    referenciaLista:  f.ReferenciaLista   || '',
    nombreDocumento:  f.NombreDocumento   || f.Title || '',
    instalacionOrigen: f.InstalacionOrigen || '',
    subidoPor:        f.SubidoPor         || '',
    fechaSubida:      f.FechaSubida       || item.createdDateTime || '',
    estado:           f.Estado            || 'pendiente',
    validadoPor:      f.ValidadoPor       || '',
    fechaValidacion:  f.FechaValidacion   || '',
    observaciones:    f.Observaciones     || '',
    archivoUrl:       f.ArchivoUrl        || '',
    creadoEn:         item.createdDateTime || '',
  }
}

// ── API pública ───────────────────────────────────────────────────────────────

/**
 * Crea un registro de validación en estado 'pendiente'.
 * Luego dispara una notificación a todos los administradores (fire-and-forget).
 *
 * @param {object} payload
 * @param {string} payload.tipoRegistro   'difusion' | 'formulario' | 'documento'
 * @param {number} [payload.referenciaId] ID del ítem en la lista origen
 * @param {string} [payload.referenciaLista] GUID de la lista origen
 * @param {string} payload.nombreDocumento  Nombre descriptivo
 * @param {string} payload.instalacionOrigen Branch del usuario
 * @param {string} payload.subidoPor        Email del usuario
 * @param {string} [payload.archivoUrl]     URL(s) del archivo en Drive
 * @param {string} [payload.adminEmail]     Email del admin que ejecuta (para logs)
 */
export async function createValidacion({
  tipoRegistro,
  referenciaId,
  referenciaLista,
  nombreDocumento,
  instalacionOrigen,
  subidoPor,
  archivoUrl = '',
  adminEmail = 'sistema@mrc.app',
}) {
  const token    = await getGraphToken()
  const siteBase = getSiteBase()
  const listId   = await resolveListId(token)
  const headers  = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
  const ahora    = new Date().toISOString()

  const res = await fetch(`${siteBase}/lists/${listId}/items`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      fields: {
        Title:             `${tipoRegistro} — ${instalacionOrigen} — ${ahora.slice(0, 10)}`,
        TipoRegistro:      tipoRegistro,
        ReferenciaId:      referenciaId || 0,
        ReferenciaLista:   referenciaLista || '',
        NombreDocumento:   nombreDocumento,
        InstalacionOrigen: instalacionOrigen,
        SubidoPor:         subidoPor,
        FechaSubida:       ahora,
        Estado:            'pendiente',
        ValidadoPor:       '',
        FechaValidacion:   '',
        Observaciones:     '',
        ArchivoUrl:        archivoUrl,
      },
    }),
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(`Error creando validación (HTTP ${res.status}): ${data?.error?.message || JSON.stringify(data)}`)
  }

  const validacion = mapValidacion(data)

  // Notificar a admins — fire-and-forget. Si falla, el registro ya fue creado correctamente.
  crearNotificacion({
    titulo:          `📋 Nuevo registro pendiente de validación`,
    cuerpo:          `${nombreDocumento} fue enviado por ${subidoPor} desde ${instalacionOrigen}. Requiere revisión en el panel de validaciones.`,
    tipo:            'difusion',
    destinatarios:   'admins',
    accionRuta:      '/admin/validaciones',
    fechaExpiracion: null,
  }, adminEmail).catch(err =>
    console.warn('[validacionService] notificación a admins falló (no crítico):', err.message)
  )

  return validacion
}

/**
 * Devuelve todos los registros con Estado:'pendiente'.
 * Usado por el panel admin para la pestaña de revisión.
 */
export async function getValidacionesPendientes() {
  const token    = await getGraphToken()
  const siteBase = getSiteBase()
  const listId   = await resolveListId(token)
  const headers  = { Authorization: `Bearer ${token}` }

  const res  = await fetch(
    `${siteBase}/lists/${listId}/items?$expand=fields&$orderby=createdDateTime desc&$top=500`,
    { headers }
  )
  const data = await res.json()
  if (!res.ok) throw new Error(`getValidacionesPendientes error ${res.status}`)

  return (data.value || []).map(mapValidacion).filter(v => v.estado === 'pendiente')
}

/**
 * Devuelve todos los registros (activos e históricos) para el panel admin.
 */
export async function getTodasValidaciones() {
  const token    = await getGraphToken()
  const siteBase = getSiteBase()
  const listId   = await resolveListId(token)
  const headers  = { Authorization: `Bearer ${token}` }

  const res  = await fetch(
    `${siteBase}/lists/${listId}/items?$expand=fields&$orderby=createdDateTime desc&$top=500`,
    { headers }
  )
  const data = await res.json()
  if (!res.ok) throw new Error(`getTodasValidaciones error ${res.status}`)

  return (data.value || []).map(mapValidacion)
}

/**
 * Devuelve los registros de validación de un usuario específico.
 * El filtrado se realiza en cliente (columnas sin índice en SP).
 */
export async function getValidacionesUsuario(email) {
  const token    = await getGraphToken()
  const siteBase = getSiteBase()
  const listId   = await resolveListId(token)
  const headers  = { Authorization: `Bearer ${token}` }

  const res  = await fetch(
    `${siteBase}/lists/${listId}/items?$expand=fields&$orderby=createdDateTime desc&$top=500`,
    { headers }
  )
  const data = await res.json()
  if (!res.ok) throw new Error(`getValidacionesUsuario error ${res.status}`)

  const em = (email || '').toLowerCase().trim()
  return (data.value || [])
    .map(mapValidacion)
    .filter(v => (v.subidoPor || '').toLowerCase() === em)
}

/**
 * Aprueba un registro.
 * Actualiza Estado:'aprobado' en SharePoint y notifica al usuario (fire-and-forget).
 *
 * @param {string} id             ID del ítem de validación en SharePoint
 * @param {string} adminEmail     Email del admin que aprueba
 * @param {string} [observaciones] Comentario opcional de aprobación
 * @param {string} [subidoPor]    Email del usuario que subió el registro (para notificar)
 * @param {string} [nombreDocumento] Nombre del documento (para el mensaje de notificación)
 */
export async function aprobarValidacion(id, adminEmail, observaciones = '', subidoPor, nombreDocumento) {
  const token    = await getGraphToken()
  const siteBase = getSiteBase()
  const listId   = await resolveListId(token)
  const headers  = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
  const ahora    = new Date().toISOString()

  const res = await fetch(`${siteBase}/lists/${listId}/items/${id}/fields`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      Estado:          'aprobado',
      ValidadoPor:     adminEmail,
      FechaValidacion: ahora,
      Observaciones:   observaciones,
    }),
  })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(`aprobarValidacion error ${res.status}: ${JSON.stringify(data)}`)
  }

  // Notificar al usuario de la aprobación (fire-and-forget)
  if (subidoPor) {
    crearNotificacion({
      titulo:          `✅ Registro aprobado`,
      cuerpo:          `Tu registro "${nombreDocumento || 'Difusión SSO'}" fue revisado y aprobado. Ya está validado oficialmente.`,
      tipo:            'difusion',
      destinatarios:   `email:${subidoPor}`,
      accionRuta:      '/mis-documentos',
      fechaExpiracion: null,
    }, adminEmail).catch(err =>
      console.warn('[validacionService] notificación aprobación falló (no crítico):', err.message)
    )
  }
}

/**
 * Rechaza un registro.
 * El motivo de rechazo (observaciones) es obligatorio.
 * Actualiza Estado:'rechazado' en SharePoint y notifica al usuario (fire-and-forget).
 *
 * @param {string} id             ID del ítem de validación en SharePoint
 * @param {string} adminEmail     Email del admin que rechaza
 * @param {string} observaciones  Motivo de rechazo (requerido)
 * @param {string} [subidoPor]    Email del usuario que subió el registro
 * @param {string} [nombreDocumento] Nombre del documento
 */
export async function rechazarValidacion(id, adminEmail, observaciones, subidoPor, nombreDocumento) {
  const token    = await getGraphToken()
  const siteBase = getSiteBase()
  const listId   = await resolveListId(token)
  const headers  = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
  const ahora    = new Date().toISOString()

  const res = await fetch(`${siteBase}/lists/${listId}/items/${id}/fields`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      Estado:          'rechazado',
      ValidadoPor:     adminEmail,
      FechaValidacion: ahora,
      Observaciones:   observaciones,
    }),
  })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(`rechazarValidacion error ${res.status}: ${JSON.stringify(data)}`)
  }

  // Notificar al usuario del rechazo (fire-and-forget)
  if (subidoPor) {
    crearNotificacion({
      titulo:          `❌ Registro rechazado — requiere corrección`,
      cuerpo:          `Tu registro "${nombreDocumento || 'Difusión SSO'}" fue rechazado. Motivo: ${observaciones}`,
      tipo:            'difusion',
      destinatarios:   `email:${subidoPor}`,
      accionRuta:      '/mis-documentos',
      fechaExpiracion: null,
    }, adminEmail).catch(err =>
      console.warn('[validacionService] notificación rechazo falló (no crítico):', err.message)
    )
  }
}
