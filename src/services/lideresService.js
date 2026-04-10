// ── lideresService.js ─────────────────────────────────────────────────────────
// Gestiona dos listas SharePoint:
//   "Líderes MRC"          — asignaciones vigentes de cargo por instalación
//   "Historial Líderes MRC"— log de todos los cambios (trazabilidad)
//
// Ambas listas se crean automáticamente en la primera ejecución si no existen.
// Se usa caché en memoria para minimizar round-trips a Graph API.

import { msalInstance } from '../config/msalInstance'
import { graphScopes }  from '../config/msalConfig'

const LIST_LIDERES   = 'Líderes MRC'
const LIST_HISTORIAL = 'Historial Líderes MRC'

// Caché de IDs de lista para la sesión
let cacheListIds = {}

// ── Helpers internos ──────────────────────────────────────────────────────────

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

// Normaliza un string eliminando acentos/diacríticos para comparación robusta.
function normalizar(s) {
  return (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
}

// Devuelve el GUID de una lista, creándola si no existe.
// Busca todas las listas del sitio y filtra en cliente para evitar problemas
// con caracteres especiales (tildes, ñ) en filtros OData de Graph API.
async function resolveListId(token, listName, columnasDef = []) {
  if (cacheListIds[listName]) return cacheListIds[listName]

  const siteBase = getSiteBase()
  const headers  = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  // Obtener todas las listas del sitio y buscar por nombre normalizado
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
    // Asegurar que las columnas personalizadas existan aunque la lista haya sido
    // creada manualmente (sin columnas). SharePoint ignora silenciosamente las
    // columnas que ya existen cuando se envían con POST — si devuelve error, lo ignoramos.
    await ensureColumns(siteBase, found.id, columnasDef, headers)
    return cacheListIds[listName]
  }

  // Crear lista
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
    // accessDenied = el usuario no tiene permisos de propietario en el sitio SharePoint.
    // En ese caso mostrar un mensaje claro; el super-admin (cvalverde) puede crearla.
    if (created.error?.code === 'accessDenied') {
      throw Object.assign(
        new Error(`La lista "${listName}" no existe y debe ser creada por el administrador del sitio SharePoint (Cristian Valverde).`),
        { code: 'SP_SETUP_REQUIRED' }
      )
    }
    throw new Error(`Error creando lista "${listName}": ${JSON.stringify(created)}`)
  }
  cacheListIds[listName] = created.id
  await ensureColumns(siteBase, cacheListIds[listName], columnasDef, headers)

  return cacheListIds[listName]
}

// Crea las columnas que aún no existen en una lista.
// Los errores individuales se ignoran (columna ya existe, sin permisos de columna, etc.)
async function ensureColumns(siteBase, listId, columnasDef, headers) {
  for (const colDef of columnasDef) {
    await fetch(`${siteBase}/lists/${listId}/columns`, {
      method: 'POST',
      headers,
      body: JSON.stringify(colDef),
    }).catch(() => {})
  }
}

// Columnas para "Líderes MRC"
// NOTA: SharePoint codifica la "ó" como "_x00f3_" en el nombre interno de columnas
// creadas desde la interfaz web con tilde (ej: "Instalación" → "Instalaci_x00f3_n").
const COLS_LIDERES = [
  { name: 'Email',                text: {} },
  { name: 'CargoMRC',             text: {} },
  { name: 'NivelJerarquico',      number: {} },
  { name: 'Instalaci_x00f3_n',    text: {} },
  { name: 'TipoInstalaci_x00f3_n', text: {} },
  { name: 'RUT',                  text: {} },
  { name: 'PIN',                  text: {} },
  { name: 'Activo',               boolean: {} },
  { name: 'AsignadoPor',          text: {} },
]

// Columnas para "Historial Líderes MRC"
const COLS_HISTORIAL = [
  { name: 'Instalaci_x00f3_n',  text: {} },
  { name: 'CargoMRC',           text: {} },
  { name: 'NombreAnterior', text: {} },
  { name: 'NombreNuevo',    text: {} },
  { name: 'EmailAnterior',  text: {} },
  { name: 'EmailNuevo',     text: {} },
  { name: 'TipoCambio',     text: {} },  // 'asignacion'|'baja'|'modificacion'|'reporte'
  { name: 'CambiadoPor',    text: {} },
  { name: 'Detalle',        text: { allowMultipleLines: true } },
]

// Mapea un ítem de Graph API al objeto interno
function mapLider(item) {
  const f = item.fields || {}
  return {
    id:               item.id,
    nombre:           f.Title          || '',
    email:            (f.Email         || '').toLowerCase().trim(),
    cargoMRC:         f.CargoMRC       || '',
    nivelJerarquico:  f.NivelJerarquico != null ? Number(f.NivelJerarquico) : 0,
    instalacion:      f.Instalaci_x00f3_n     || '',
    tipoInstalacion:  f.TipoInstalaci_x00f3_n || '',
    rut:              f.RUT            || '',
    pin:              f.PIN            || '',
    activo:           f.Activo !== false,  // default true si undefined
    asignadoPor:      f.AsignadoPor    || '',
  }
}

function mapHistorial(item) {
  const f = item.fields || {}
  return {
    id:             item.id,
    instalacion:    f.Title          || '',
    cargoMRC:       f.CargoMRC       || '',
    nombreAnterior: f.NombreAnterior || '',
    nombreNuevo:    f.NombreNuevo    || '',
    emailAnterior:  f.EmailAnterior  || '',
    emailNuevo:     f.EmailNuevo     || '',
    tipoCambio:     f.TipoCambio     || '',
    cambiadoPor:    f.CambiadoPor    || '',
    detalle:        f.Detalle        || '',
    fecha:          item.createdDateTime || '',
  }
}

// ── API pública ───────────────────────────────────────────────────────────────

/**
 * Devuelve todos los líderes activos.
 * Si instalacion se pasa, filtra por instalación.
 *
 * NOTA: Los filtros OData de Graph API son inestables con columnas de nombres
 * acentuados (Instalación → Instalaci_x00f3_n) y con columnas boolean no indexadas.
 * Se trae la lista completa sin $filter y se filtra en cliente para mayor robustez.
 */
export async function getLideres(instalacion = null) {
  const token    = await getToken()
  const siteBase = getSiteBase()
  const listId   = await resolveListId(token, LIST_LIDERES, COLS_LIDERES)
  const headers  = { Authorization: `Bearer ${token}` }

  const res  = await fetch(
    `${siteBase}/lists/${listId}/items?$expand=fields&$top=999`,
    { headers }
  )
  const data = await res.json()
  if (!res.ok) throw new Error(`getLideres error ${res.status}: ${JSON.stringify(data)}`)

  return (data.value || [])
    .map(mapLider)
    .filter(l => {
      if (!l.activo) return false
      if (instalacion && normalizar(l.instalacion) !== normalizar(instalacion)) return false
      return true
    })
}

/**
 * Busca un líder por email (para bootstrap de perfil propio).
 * Devuelve null si no se encuentra.
 */
export async function getLiderByEmail(email) {
  if (!email) return null
  const todos = await getLideres()
  const em    = email.toLowerCase().trim()
  return todos.find(l => l.email === em) || null
}

/**
 * Crea un nuevo líder. Devuelve el objeto creado.
 * También registra en el historial.
 */
export async function crearLider(lider, adminEmail) {
  const token    = await getToken()
  const siteBase = getSiteBase()
  const listId   = await resolveListId(token, LIST_LIDERES, COLS_LIDERES)
  const headers  = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  const body = {
    fields: {
      Title:           lider.nombre,
      Email:           (lider.email || '').toLowerCase().trim(),
      CargoMRC:        lider.cargoMRC,
      NivelJerarquico: lider.nivelJerarquico,
      Instalaci_x00f3_n:     lider.instalacion,
      TipoInstalaci_x00f3_n: lider.tipoInstalacion,
      RUT:             lider.rut || '',
      PIN:             lider.pin || '',
      Activo:          true,
      AsignadoPor:     adminEmail,
    },
  }

  const res  = await fetch(`${siteBase}/lists/${listId}/items`, {
    method: 'POST', headers, body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(`crearLider error ${res.status}: ${JSON.stringify(data)}`)

  const nuevo = mapLider(data)

  // Registrar en historial
  await _registrarHistorial({
    instalacion:    lider.instalacion,
    cargoMRC:       lider.cargoMRC,
    nombreAnterior: '',
    nombreNuevo:    lider.nombre,
    emailAnterior:  '',
    emailNuevo:     lider.email,
    tipoCambio:     'asignacion',
    cambiadoPor:    adminEmail,
    detalle:        `Asignación inicial del cargo ${lider.cargoMRC}`,
  }, token, siteBase)

  return nuevo
}

/**
 * Actualiza un líder existente (nombre, email, cargo, etc.).
 * Registra el cambio en historial con los valores anteriores.
 */
export async function actualizarLider(id, cambios, liderAnterior, adminEmail) {
  const token    = await getToken()
  const siteBase = getSiteBase()
  const listId   = await resolveListId(token, LIST_LIDERES, COLS_LIDERES)
  const headers  = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  const fields = {}
  if (cambios.nombre        !== undefined) fields.Title           = cambios.nombre
  if (cambios.email         !== undefined) fields.Email           = (cambios.email || '').toLowerCase().trim()
  if (cambios.cargoMRC      !== undefined) fields.CargoMRC        = cambios.cargoMRC
  if (cambios.nivelJerarquico !== undefined) fields.NivelJerarquico = cambios.nivelJerarquico
  if (cambios.rut           !== undefined) fields.RUT             = cambios.rut
  if (cambios.pin           !== undefined) fields.PIN             = cambios.pin
  if (cambios.activo        !== undefined) fields.Activo          = cambios.activo

  const res = await fetch(`${siteBase}/lists/${listId}/items/${id}/fields`, {
    method: 'PATCH', headers, body: JSON.stringify(fields),
  })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(`actualizarLider error ${res.status}: ${JSON.stringify(data)}`)
  }

  // Registrar en historial
  await _registrarHistorial({
    instalacion:    liderAnterior.instalacion,
    cargoMRC:       liderAnterior.cargoMRC,
    nombreAnterior: liderAnterior.nombre,
    nombreNuevo:    cambios.nombre  ?? liderAnterior.nombre,
    emailAnterior:  liderAnterior.email,
    emailNuevo:     cambios.email   ?? liderAnterior.email,
    tipoCambio:     'modificacion',
    cambiadoPor:    adminEmail,
    detalle:        '',
  }, token, siteBase)
}

/**
 * Da de baja un líder (Activo = false). No borra el ítem para mantener historial.
 */
export async function darBajaLider(id, lider, adminEmail) {
  const token    = await getToken()
  const siteBase = getSiteBase()
  const listId   = await resolveListId(token, LIST_LIDERES, COLS_LIDERES)
  const headers  = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  const res = await fetch(`${siteBase}/lists/${listId}/items/${id}/fields`, {
    method: 'PATCH', headers,
    body: JSON.stringify({ Activo: false }),
  })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(`darBajaLider error ${res.status}: ${JSON.stringify(data)}`)
  }

  await _registrarHistorial({
    instalacion:    lider.instalacion,
    cargoMRC:       lider.cargoMRC,
    nombreAnterior: lider.nombre,
    nombreNuevo:    '',
    emailAnterior:  lider.email,
    emailNuevo:     '',
    tipoCambio:     'baja',
    cambiadoPor:    adminEmail,
    detalle:        `Cargo ${lider.cargoMRC} dado de baja`,
  }, token, siteBase)
}

/**
 * Registra un reporte de actualización enviado por un líder.
 */
export async function reportarActualizacion(reporte, reportadoPor) {
  const token    = await getToken()
  const siteBase = getSiteBase()

  await _registrarHistorial({
    instalacion:    reporte.instalacion,
    cargoMRC:       reporte.cargoAfectado || '',
    nombreAnterior: '',
    nombreNuevo:    '',
    emailAnterior:  '',
    emailNuevo:     '',
    tipoCambio:     'reporte',
    cambiadoPor:    reportadoPor,
    detalle:        `[REPORTE LÍDER] ${reporte.tipo}: ${reporte.detalle}`,
  }, token, siteBase)
}

/**
 * Devuelve el historial de cambios de una instalación (más recientes primero).
 */
export async function getHistorial(instalacion = null, limit = 20) {
  const token    = await getToken()
  const siteBase = getSiteBase()
  const listId   = await resolveListId(token, LIST_HISTORIAL, COLS_HISTORIAL)
  const headers  = {
    Authorization: `Bearer ${token}`,
    Prefer: 'HonorNonIndexedQueriesWarningMayFailRandomly',
  }

  let url = `${siteBase}/lists/${listId}/items?$expand=fields&$orderby=createdDateTime desc&$top=${limit}`
  if (instalacion) {
    url += `&$filter=${encodeURIComponent(`fields/Title eq '${instalacion.replace(/'/g, "''")}'`)}`
  }

  const res  = await fetch(url, { headers })
  const data = await res.json()
  if (!res.ok) throw new Error(`getHistorial error ${res.status}: ${JSON.stringify(data)}`)
  return (data.value || []).map(mapHistorial)
}

// ── Interno ───────────────────────────────────────────────────────────────────

async function _registrarHistorial(entrada, token, siteBase) {
  const listId  = await resolveListId(token, LIST_HISTORIAL, COLS_HISTORIAL)
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  await fetch(`${siteBase}/lists/${listId}/items`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      fields: {
        Title:               entrada.instalacion,
        Instalaci_x00f3_n:   entrada.instalacion,
        CargoMRC:       entrada.cargoMRC,
        NombreAnterior: entrada.nombreAnterior,
        NombreNuevo:    entrada.nombreNuevo,
        EmailAnterior:  entrada.emailAnterior,
        EmailNuevo:     entrada.emailNuevo,
        TipoCambio:     entrada.tipoCambio,
        CambiadoPor:    entrada.cambiadoPor,
        Detalle:        entrada.detalle,
      },
    }),
  }).catch(err => console.warn('[lideresService] historial write failed:', err))
}
