// ── Servicio de datos SharePoint ─────────────────────────────────────────
//
// Enruta cada envío a su lista SharePoint real, preservando los flujos
// de Power Automate y la generación automática de documentos PDF.
//
// Listas y GUIDs (sitio: https://agrosuper.sharepoint.com/sites/SSOASCOMERCIAL)
//   Reglas de Oro - Sucursales    d123a245-0aeb-4f51-9b20-693639c963b6
//   Caminata de Seguridad         04730b19-b235-4eef-b487-0234326fd4ac
//   Inspección Simple             de766ded-0d14-4e50-8254-710c533a2106
//   Reglas de Oro - Ventas        5edaee5a-2ee5-4fb4-a5aa-18f8068a1b25
//   Difusiones SSO MRC            2097a931-5615-472b-afc7-b2d2fc6fe805
//   Maestro de Cierre Condiciones 00b25970-34f1-4026-9cc8-0df3f59c3383

import { getGraphToken } from '../config/msalInstance'

export const IS_DEV_MODE =
  !import.meta.env.VITE_AZURE_CLIENT_ID ||
  import.meta.env.VITE_AZURE_CLIENT_ID === 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'

// ── Overrides de conexión (panel de administrador) ───────────────────────
// El admin puede reasignar el listId de un formulario desde el panel
// de Conexiones SharePoint sin necesidad de editar el código.
// Se almacenan en localStorage bajo 'mrc-sp-connections-override'.
const SP_OVERRIDE_KEY = 'mrc-sp-connections-override'

function getConnectionOverride(formType) {
  try {
    const raw = localStorage.getItem(SP_OVERRIDE_KEY)
    if (!raw) return null
    return JSON.parse(raw)[formType]?.listId || null
  } catch { return null }
}

export function saveConnectionOverride(formType, listId) {
  try {
    const overrides = JSON.parse(localStorage.getItem(SP_OVERRIDE_KEY) || '{}')
    overrides[formType] = { listId, savedAt: new Date().toISOString() }
    localStorage.setItem(SP_OVERRIDE_KEY, JSON.stringify(overrides))
  } catch (e) { console.warn('[MRC] Error guardando override:', e) }
}

export function clearConnectionOverride(formType) {
  try {
    const overrides = JSON.parse(localStorage.getItem(SP_OVERRIDE_KEY) || '{}')
    delete overrides[formType]
    localStorage.setItem(SP_OVERRIDE_KEY, JSON.stringify(overrides))
  } catch { /* ignore */ }
}

export function getAllConnectionOverrides() {
  try { return JSON.parse(localStorage.getItem(SP_OVERRIDE_KEY) || '{}') }
  catch { return {} }
}

// ── GUIDs de listas ───────────────────────────────────────────────────────
const LIST_IDS = {
  reglasOroSucursales:        'd123a245-0aeb-4f51-9b20-693639c963b6',
  caminataSeguridad:          '04730b19-b235-4eef-b487-0234326fd4ac',
  inspeccionSimple:           'de766ded-0d14-4e50-8254-710c533a2106',
  reglasOroVentas:            '5edaee5a-2ee5-4fb4-a5aa-18f8068a1b25',
  difusionesSso:              '2097a931-5615-472b-afc7-b2d2fc6fe805',
  cierreCondiciones:          '00b25970-34f1-4026-9cc8-0df3f59c3383',
  permisoTrabajoContratista:  '', // GUID pendiente — asignar al crear la lista SharePoint
  cierreTrabajoContratista:   '', // GUID pendiente — asignar al crear la lista SharePoint
}

// ── Helpers Graph API ─────────────────────────────────────────────────────

function getSiteUrl() {
  const raw = import.meta.env.VITE_SHAREPOINT_SITE_URL
  if (!raw) throw new Error('VITE_SHAREPOINT_SITE_URL no configurado')
  // Convierte https://agrosuper.sharepoint.com/sites/SSOASCOMERCIAL
  // → https://graph.microsoft.com/v1.0/sites/agrosuper.sharepoint.com:/sites/SSOASCOMERCIAL:
  // El segundo ":" al final es obligatorio para que Graph API resuelva sub-recursos correctamente
  const url  = new URL(raw)
  const path = url.pathname.replace(/\/$/, '')   // quita trailing slash
  return `https://graph.microsoft.com/v1.0/sites/${url.hostname}:${path}:`
}

function todayISO() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

// Inicio de la semana actual (lunes 00:00) para KPIs semanales
function weekStartISO() {
  const d = new Date()
  const day = d.getDay() || 7  // domingo=0 → 7, lunes=1
  d.setDate(d.getDate() - (day - 1))
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

// Extrae email de un valor de persona Azure AD
// (puede ser string, { email } o { mail } o { userPrincipalName })
// Normaliza nombre de sucursal quitando prefijo "Sucursal " para comparar
function normBranch(v = '') {
  return v.replace(/^sucursal\s+/i, '').trim().toLowerCase()
}

function extractEmail(v) {
  if (!v) return ''
  if (typeof v === 'string') return v.includes('@') ? v : ''
  if (typeof v === 'object') return v.email || v.mail || v.userPrincipalName || ''
  return ''
}

// Semana ISO del año para un Date dado
function isoWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
}

// ── Mapeadores de campos ──────────────────────────────────────────────────
//
// Cada función recibe el objeto `submission` del formStore:
//   { formType, unitType, branch, userName, userEmail, createdAt, data:{…} }
// y devuelve el objeto `fields` listo para POST a la Graph API.

// ── 1. Reglas de Oro - Sucursales (wizard pauta-verificacion-reglas-oro) ──
function mapReglasOroSucursales(sub) {
  const d = sub.answers || sub.data || {}

  // Desviación: alguna pregunta de selección de ruta respondida CON_OBSERVACIONES
  const hasDeviation = Object.values(d).some((v) => v === 'CON_OBSERVACIONES')

  // Conductas observadas: checkboxes Q23, Q25, Q27, Q29, Q31, Q33, Q35, Q37, Q39, Q41, Q43, Q45
  const CBQS = ['Q23','Q25','Q27','Q29','Q31','Q33','Q35','Q37','Q39','Q41','Q43','Q45']
  const conductas = CBQS.flatMap((k) => {
    const v = d[k]; if (!v) return []
    return Array.isArray(v) ? v : [String(v)]
  }).join(' | ')

  return {
    // Campos estructurales
    Title:                               sub.userName || '',
    Instalaci_x00f3_n:                   d.Q1  || sub.branch   || '',
    Cargo:                               sub.userJobTitle || '',
    Nombre:                              sub.userName || '',
    _x00c1_rea:                          d.Q18 || '',
    Turno:                               d.Q19 || '',
    Regla_x0020_de_x0020_Oro:           d.Q20 || d.Q21 || '',
    Conducta_x0020_Observada:            conductas,
    '_x00bf_Existe_x0020_Desviaci_x00': hasDeviation ? 'Sí' : 'No',
    Nombre_x0020_Colaborador:            d.Q17 || '',
    Observaciones:                       d.Q47 || '',
    Equipo_x0020_de_x0020_Venta_x002:   d.Q9  || '',
    // Correos 1-6: personas Azure AD (Q3-Q8)
    Correo_x0020_1:    extractEmail(d.Q3),
    Correo_x0020_2:    extractEmail(d.Q4),
    Correo_x0020_3:    extractEmail(d.Q5),
    Correo_x0020_4:    extractEmail(d.Q6),
    Correo_x0020_5:    extractEmail(d.Q7),
    Correo_x0020_6:    extractEmail(d.Q8),
    // Correos 7-12: nombres adicionales (sin campo de correo dedicado)
    Correo_x0020_7:    d.Q10 || '',   // Jefe/Ayudante Despacho
    Correo_x0020_8:    d.Q13 || '',   // Comité Paritario
    Correo_x0020_9:    extractEmail(d.Q14), // SSO (Azure AD)
    Correo_x0020_10:   d.Q15 || '',   // ACHS
    Correo_x0020_11:   d.Q16 || '',   // Coordinador SIGAS
    Correo_x0020_12:   d.Q17 || '',   // Colaborador Sucursal
    Correo_x0020_Remitente: sub.userEmail || '',
  }
}

// ── 2. Reglas de Oro - Ventas (observacion-conductual) ───────────────────
function mapReglasOroVentas(sub) {
  const d = sub.answers || sub.data || {}

  const hasDeviation = Object.values(d).some((v) => v === 'CON_OBSERVACIONES')

  const CBQS = ['Q23','Q25','Q27','Q29','Q31','Q33','Q35','Q37','Q39','Q41','Q43','Q45']
  const conductas = CBQS.flatMap((k) => {
    const v = d[k]; if (!v) return []
    return Array.isArray(v) ? v : [String(v)]
  }).join(' | ')

  return {
    Title:                               sub.userName || '',
    Instalaci_x00f3_n:                   d.Q1  || sub.branch   || '',
    Cargo:                               sub.userJobTitle || '',
    Nombre:                              sub.userName || '',
    _x00c1_rea:                          d.Q18 || '',
    Turno:                               d.Q19 || '',
    Equipo_x0020_de_x0020_Venta:        d.Q9  || '',
    Regla_x0020_de_x0020_Oro:           d.Q20 || d.Q21 || '',
    Conducta_x0020_Observada:            conductas,
    '_x00bf_Existe_x0020_Desviaci_x00': hasDeviation ? 'Sí' : 'No',
    Nombre_x0020_Colaborador:            d.Q17 || '',
    Observaciones:                       d.Q47 || '',
    Correo_x0020_1:    extractEmail(d.Q3),
    Correo_x0020_2:    extractEmail(d.Q4),
    Correo_x0020_3:    extractEmail(d.Q5),
    Correo_x0020_4:    extractEmail(d.Q6),
    Correo_x0020_5:    extractEmail(d.Q7),
    Correo_x0020_6:    extractEmail(d.Q8),
    Correo_x0020_7:    d.Q10 || '',
    Correo_x0020_8:    d.Q13 || '',
    Correo_x0020_9:    extractEmail(d.Q14),
    Correo_x0020_10:   d.Q15 || '',
    Correo_x0020_11:   d.Q16 || '',
    Correo_x0020_12:   d.Q17 || '',
    Correo_x0020_Remitente: sub.userEmail || '',
  }
}

// ── 3. Caminata de Seguridad ──────────────────────────────────────────────
function mapCaminataSeguridad(sub) {
  const d = sub.answers || sub.data || {}

  const hayDesviacionConductual  = d.cs_3 === 'Si' || d.cs_4 === 'Si'
  const hayDesviacionCondiciones = d.cs_3 === 'Si'
  const realizoReporte           = d.cs_8 === 'Si' ? 'Sí' : 'No'

  return {
    Title:                               sub.userName || '',
    Instalaci_x00f3_n:                   sub.branch   || '',
    Nombre:                              sub.userName  || '',
    _x00c1_rea:                          d.cs_1 || '',
    Turno:                               d.cs_2 || '',
    Tem_x00e1_tica:                      d.cs_1 || '',
    '_x00bf_Existe_x0020_Desviaci_x00': hayDesviacionConductual  ? 'Sí' : 'No',
    Desviaci_x00f3_n_x0020_de_x0020_:  d.cs_7 || '',
    '_x00bf_Existe_x0020_Desviaci_x000': hayDesviacionCondiciones ? 'Sí' : 'No',
    '_x00bf_Realiz_x00f3__x0020_el_x0': realizoReporte,
    Observaciones:                       d.cs_11 || d.cs_9 || '',
    Correo_x0020_Remitente:              sub.userEmail || '',
  }
}

// ── 4. Inspección Simple ──────────────────────────────────────────────────
function mapInspeccionSimple(sub) {
  const d = sub.answers || sub.data || {}

  // Código de reporte único: IS-{3 letras sucursal}-{timestamp 6 dígitos}
  const prefix  = (sub.branch || 'XX').replace(/\s+/g, '').substring(0, 3).toUpperCase()
  const ts      = Date.now().toString().slice(-6)
  const codigo  = `IS-${prefix}-${ts}`

  return {
    Title:                               codigo,
    Instalaci_x00f3_n:                   sub.branch    || '',
    Nombre:                              sub.userName   || '',
    Categor_x00ed_a:                     d.is_1 || '',
    Lugar_x0020_Especifico:              d.is_2 || '',
    '_x00bf_Se_x0020_detecta_x0020_Co': d.is_6 === 'Si' ? 'Sí' : 'No',
    Condici_x00f3_n_x0020_Insegura:     d.is_8 || '',
    Incidentes_x0020_Posibles:           d.is_8 || '',
    Medida_x0020_de_x0020_Control:       d.is_8 || '',
    C_x00f3_digo_x0020_de_x0020_Repo:    codigo,
    Correo_x0020_Remitente:              sub.userEmail || '',
  }
}

// ── 5. Difusiones SSO MRC ─────────────────────────────────────────────────
function mapDifusiones(sub) {
  const d   = sub.answers || sub.data || {}
  const now = new Date()

  return {
    Title:                    d.ds_1 || 'Difusión SSO',
    Sucursal:                 sub.branch || '',
    Semana:                   isoWeekNumber(now),
    A_x00f1_o:               now.getFullYear(),
    _x00c1_rea:              d.ds_2 || '',
    Responsable:              sub.userName  || '',
    CargoResponsable:         sub.cargo     || '',
    FechaEjecuci_x00f3_n:    sub.createdAt || now.toISOString(),
    Observaciones:            d.ds_9 || '',
  }
}

// ── 6. Maestro de Cierre Condiciones ─────────────────────────────────────
function mapCierreCondiciones(sub) {
  const d = sub.answers || sub.data || {}
  return {
    Title:     d.codigoReporte         || '',   // ID del hallazgo a cerrar
    field_1:   sub.createdAt           || new Date().toISOString(), // Fecha de cierre
    field_3:   sub.branch              || '',   // Instalación
    field_5:   sub.userName            || '',   // Nombre responsable seguimiento
    field_6:   d.medidaImplementada    || '',   // Medida de control implementada
    field_7:   d.areaImplementacion    || '',   // Área donde se implementó
    field_17:  sub.userEmail           || '',   // Correo Responsable Medida
    field_18:  sub.userEmail           || '',   // Correo Remitente
  }
}

// ── 7. Permiso de Trabajo — Contratistas ─────────────────────────────────
function mapPermisoTrabajoContratista(sub) {
  const d = sub.answers || sub.data || {}

  const peligros = Array.isArray(d.ptc_12) ? d.ptc_12.join(' | ') : (d.ptc_12 || '')
  const epp      = Array.isArray(d.ptc_21) ? d.ptc_21.join(' | ') : (d.ptc_21 || '')

  return {
    Title:                          sub.userName || '',
    Instalaci_x00f3_n:              sub.branch   || '',
    Nombre:                         sub.userName  || '',
    Cargo:                          sub.userJobTitle || '',
    Empresa_x0020_Contratista:      d.ptc_01 || '',
    RUT_x0020_Empresa:              d.ptc_02 || '',
    Supervisor_x0020_Contratista:   d.ptc_03 || '',
    Tel_x00e9_fono_x0020_Supervisor: d.ptc_04 || '',
    Ubicaci_x00f3_n_x0020_Faena:    d.ptc_05 || '',
    Descripci_x00f3_n_x0020_Trabajo: d.ptc_06 || '',
    Fecha_x0020_Inicio:             d.ptc_07 || '',
    Fecha_x0020_T_x00e9_rmino:      d.ptc_08 || '',
    N_x00ba__x0020_Trabajadores:    d.ptc_09 || '',
    Responsable_x0020_Agrosuper:    extractEmail(d.ptc_10),
    Tipo_x0020_Trabajo:             d.ptc_11 || '',
    Peligros_x0020_Identificados:   peligros,
    Nivel_x0020_Riesgo:             d.ptc_13 || '',
    EPP_x0020_Utilizado:            epp,
    Autorizado:                     d.ptc_43 || '',
    Hora_x0020_Inicio:              d.ptc_44 || '',
    Hora_x0020_T_x00e9_rmino:       d.ptc_45 || '',
    Trabajo_x0020_Completado:       d.ptc_51 || '',
    Incidente_x0020_Reportado:      d.ptc_55 || '',
    Descripci_x00f3_n_x0020_Incidente: d.ptc_56 || '',
    Observaciones:                  d.ptc_46 || d.ptc_58 || '',
    Correo_x0020_Remitente:         sub.userEmail || '',
  }
}

// ── 8. Cierre de Trabajo — Contratistas ──────────────────────────────────
function mapCierreTrabajoContratista(sub) {
  const d = sub.answers || sub.data || {}
  return {
    Title:                          sub.userName || '',
    Instalaci_x00f3_n:              sub.branch   || '',
    Nombre:                         sub.userName  || '',
    Empresa_x0020_Contratista:      d.ctc_01 || '',
    Ubicaci_x00f3_n_x0020_Faena:    d.ctc_02 || '',
    Tipo_x0020_Trabajo:             d.ctc_03 || '',
    Responsable_x0020_Cierre:       extractEmail(d.ctc_04),
    Trabajo_x0020_Completado:       d.ctc_11 || '',
    _x00c1_rea_x0020_Restaurada:    d.ctc_12 || '',
    Aislamientos_x0020_Retirados:   d.ctc_13 || '',
    Equipamiento_x0020_Retirado:    d.ctc_14 || '',
    Personal_x0020_Retirado:        d.ctc_15 || '',
    Verificaci_x00f3_n_x0020_Ter:   d.ctc_16 || '',
    Incidente_x0020_Reportado:      d.ctc_21 || '',
    Descripci_x00f3_n_x0020_Incidente: d.ctc_22 || '',
    Observaciones:                  d.ctc_24 || '',
    Correo_x0020_Remitente:         sub.userEmail || '',
  }
}

// ── Router: formType → listId + mapper ───────────────────────────────────
function getListConfig(formType) {
  const MAP = {
    'pauta-verificacion-reglas-oro':  { listId: LIST_IDS.reglasOroSucursales,       mapFields: mapReglasOroSucursales       },
    'observacion-conductual':         { listId: LIST_IDS.reglasOroVentas,           mapFields: mapReglasOroVentas           },
    'caminata-seguridad':             { listId: LIST_IDS.caminataSeguridad,         mapFields: mapCaminataSeguridad         },
    'inspeccion-simple':              { listId: LIST_IDS.inspeccionSimple,          mapFields: mapInspeccionSimple          },
    'difusiones-sso':                 { listId: LIST_IDS.difusionesSso,             mapFields: mapDifusiones                },
    'cierre-condiciones':             { listId: LIST_IDS.cierreCondiciones,         mapFields: mapCierreCondiciones         },
    'permiso-trabajo-contratista':    { listId: LIST_IDS.permisoTrabajoContratista, mapFields: mapPermisoTrabajoContratista },
    'cierre-trabajo-contratista':     { listId: LIST_IDS.cierreTrabajoContratista,  mapFields: mapCierreTrabajoContratista  },
  }
  const base = MAP[formType]
  if (!base) return null
  // El admin puede sobreescribir el listId desde el panel de conexiones
  const overrideId = getConnectionOverride(formType)
  if (overrideId) return { ...base, listId: overrideId }
  return base
}

// ── Enviar un registro a SharePoint ──────────────────────────────────────
// Convierte base64 dataURL a Uint8Array binario
function base64ToBytes(dataUrl) {
  const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '')
  const binary  = atob(base64)
  const bytes   = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

// Sube una foto como adjunto al ítem SharePoint recién creado
async function uploadPhotoAttachment(listId, itemId, photoBase64, fileName, token) {
  const siteBase = import.meta.env.VITE_SHAREPOINT_SITE_URL
  if (!siteBase) return
  // SharePoint REST API para adjuntos de ítems de lista
  const url = `${siteBase}/_api/web/lists(guid'${listId}')/items(${itemId})/AttachmentFiles/add(FileName='${fileName}')`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization:  `Bearer ${token}`,
      'Content-Type': 'application/octet-stream',
    },
    body: base64ToBytes(photoBase64),
  })
  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    console.warn(`[MRC] Adjunto ${fileName} falló ${res.status}:`, txt)
  } else {
    console.info(`[MRC] Adjunto ${fileName} subido OK`)
  }
}

export async function submitFormToSharePoint(submission) {
  if (IS_DEV_MODE) {
    console.info('[MRC Data] Modo dev — envío simulado:', submission.formType)
    return { success: true, dev: true }
  }

  const config = getListConfig(submission.formType)
  if (!config) {
    console.warn('[MRC Data] Formulario sin lista mapeada:', submission.formType)
    return { success: false, error: 'Tipo de formulario no mapeado' }
  }

  const token   = await getGraphToken()
  const siteUrl = getSiteUrl()
  const url     = `${siteUrl}/lists/${config.listId}/items`
  const fields  = config.mapFields(submission)

  console.info('[MRC] POST →', url)
  console.info('[MRC] fields →', fields)

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization:  `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fields }),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    console.error('[MRC] SharePoint error', res.status, errText)
    if (res.status === 403 || res.status === 401) {
      const err = new Error(`Sin permiso para enviar el formulario al sitio SharePoint (${res.status}). Solicita acceso al admin MRC.`)
      err.code = 'PERMISSION_DENIED'
      err.status = res.status
      throw err
    }
    throw new Error(`SharePoint POST falló: ${res.status} — ${errText}`)
  }

  const result = await res.json().catch(() => ({}))
  console.info('[MRC] Registro creado OK →', result?.id)

  // Subir fotos adjuntas si las hay (ej. Inspección Simple)
  const photos = submission.answers?.is_photo
  if (Array.isArray(photos) && photos.length > 0 && result?.id) {
    await Promise.allSettled(
      photos.map((photoBase64, idx) =>
        uploadPhotoAttachment(
          config.listId,
          result.id,
          photoBase64,
          `foto_${idx + 1}_${Date.now()}.jpg`,
          token
        )
      )
    )
  }

  return { success: true }
}

// ── Obtener KPIs del día desde SharePoint ─────────────────────────────────
// Retorna { [formType]: number } con conteos de registros creados hoy.
// filters: { branch?: string }
export async function fetchTodayKPIs(unitType, filters = {}) {
  if (IS_DEV_MODE) return null

  const token   = await getGraphToken()
  const siteUrl = getSiteUrl()
  const today   = todayISO()

  // Listas y campo de instalación según unidad
  const LISTS_SUC = [
    { key: 'pauta-verificacion-reglas-oro', listId: LIST_IDS.reglasOroSucursales, branchField: 'Instalaci_x00f3_n' },
    { key: 'caminata-seguridad',            listId: LIST_IDS.caminataSeguridad,   branchField: 'Instalaci_x00f3_n' },
    { key: 'inspeccion-simple',             listId: LIST_IDS.inspeccionSimple,    branchField: 'Instalaci_x00f3_n' },
    { key: 'difusiones-sso',                listId: LIST_IDS.difusionesSso,       branchField: 'Sucursal'          },
  ]
  const LISTS_FDV = [
    { key: 'observacion-conductual', listId: LIST_IDS.reglasOroVentas, branchField: 'Instalaci_x00f3_n' },
    { key: 'difusiones-sso',         listId: LIST_IDS.difusionesSso,   branchField: 'Sucursal'          },
  ]

  const listsToQuery = unitType === 'fuerza-de-ventas' ? LISTS_FDV : LISTS_SUC
  const results    = {}
  const todayMs    = new Date(today).getTime()
  const headers    = { Authorization: `Bearer ${token}` }
  let   deniedCount = 0

  await Promise.allSettled(
    listsToQuery.map(async ({ key, listId, branchField }) => {
      try {
        // $expand para traer el campo de sucursal y filtrar en JS.
        // Las columnas de SP no están indexadas → no se puede usar $filter server-side.
        const url     = `${siteUrl}/lists/${listId}/items?$expand=fields($select=${branchField})&$orderby=lastModifiedDateTime desc&$top=500`
        let res = await fetch(url, { headers })
        // Fallback sin $orderby si la lista lo rechaza (ej. Pautas)
        if (!res.ok) {
          if (res.status === 403 || res.status === 401) {
            deniedCount++
            console.warn(`[MRC Data] KPI ${key}: acceso denegado (${res.status})`)
            results[key] = 0
            return
          }
          const fallback = `${siteUrl}/lists/${listId}/items?$expand=fields($select=${branchField})&$top=1000`
          res = await fetch(fallback, { headers })
        }
        if (!res.ok) {
          if (res.status === 403 || res.status === 401) {
            deniedCount++
            console.warn(`[MRC Data] KPI ${key}: acceso denegado (${res.status})`)
            results[key] = 0
            return
          }
          throw new Error(`SP GET ${res.status}`)
        }
        const json = await res.json()
        const raw  = json.value || []

        const items = raw.filter(item => {
          if (new Date(item.createdDateTime).getTime() < todayMs) return false
          if (filters.branch && filters.branch !== 'all') {
            return normBranch(item.fields?.[branchField]) === normBranch(filters.branch)
          }
          return true
        })
        results[key] = items.length
      } catch (err) {
        console.warn(`[MRC Data] KPI ${key}:`, err.message)
        results[key] = 0
      }
    })
  )

  // Si todas las listas fallaron por permisos → señalizar accessDenied
  if (deniedCount > 0 && deniedCount >= listsToQuery.length) {
    return { accessDenied: true, ...results }
  }

  return results
}

// ── Actividad reciente desde SharePoint ───────────────────────────────────
// Retorna los últimos 10 registros de hoy, de todas las listas relevantes.
// Cada ítem: { time, user, action, branch }

const ACTIVITY_LABELS = {
  'pauta-verificacion-reglas-oro': 'Envió Pauta de Verificación',
  'caminata-seguridad':            'Completó Caminata de Seguridad',
  'inspeccion-simple':             'Registró Inspección Simple',
  'difusiones-sso':                'Registró Difusión SSO',
  'observacion-conductual':        'Completó Observación Conductual',
  'inspeccion-planificada':        'Completó Inspección Planificada',
}

export async function fetchRecentActivity(unitType, filters = {}) {
  if (IS_DEV_MODE) return null

  const token   = await getGraphToken()
  const siteUrl = getSiteUrl()
  const today   = todayISO()
  const headers = { Authorization: `Bearer ${token}` }

  const LISTS_SUC = [
    { key: 'pauta-verificacion-reglas-oro', listId: LIST_IDS.reglasOroSucursales, branchField: 'Instalaci_x00f3_n', userField: 'Nombre'      },
    { key: 'caminata-seguridad',            listId: LIST_IDS.caminataSeguridad,   branchField: 'Instalaci_x00f3_n', userField: 'Nombre'      },
    { key: 'inspeccion-simple',             listId: LIST_IDS.inspeccionSimple,    branchField: 'Instalaci_x00f3_n', userField: 'Nombre'      },
    { key: 'difusiones-sso',                listId: LIST_IDS.difusionesSso,       branchField: 'Sucursal',          userField: 'Responsable' },
  ]
  const LISTS_FDV = [
    { key: 'observacion-conductual', listId: LIST_IDS.reglasOroVentas, branchField: 'Instalaci_x00f3_n', userField: 'Nombre'      },
    { key: 'difusiones-sso',         listId: LIST_IDS.difusionesSso,   branchField: 'Sucursal',          userField: 'Responsable' },
  ]

  const listsToQuery = unitType === 'fuerza-de-ventas' ? LISTS_FDV : LISTS_SUC
  const allItems  = []
  const todayMs   = new Date(today).getTime()
  let   deniedCount = 0

  await Promise.allSettled(
    listsToQuery.map(async ({ key, listId, branchField, userField }) => {
      try {
        const url  = `${siteUrl}/lists/${listId}/items?$expand=fields($select=${userField},${branchField})&$orderby=lastModifiedDateTime desc&$top=50`
        const res  = await fetch(url, { headers })
        if (!res.ok) {
          if (res.status === 403 || res.status === 401) deniedCount++
          return
        }
        const json = await res.json()
        ;(json.value || [])
          .filter(item => {
            if (new Date(item.createdDateTime).getTime() < todayMs) return false
            if (filters.branch && filters.branch !== 'all') {
              return normBranch(item.fields?.[branchField]) === normBranch(filters.branch)
            }
            return true
          })
          .forEach(item => {
            const created = new Date(item.createdDateTime)
            // Normalizar la sucursal para display (quitar prefijo "Sucursal ")
            const rawBranch = item.fields?.[branchField] || ''
            const displayBranch = rawBranch.replace(/^sucursal\s+/i, '').trim()
            allItems.push({
              created,
              time:   created.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
              user:   item.fields?.[userField] || '',
              action: ACTIVITY_LABELS[key] || 'Envió formulario',
              branch: displayBranch,
            })
          })
      } catch { /* ignorar errores por lista */ }
    })
  )

  // Si todas las listas fallaron por permisos → señalizar accessDenied
  if (deniedCount > 0 && deniedCount >= listsToQuery.length) {
    return { accessDenied: true, items: [] }
  }

  // Ordenar por más reciente y devolver top 10
  return allItems
    .sort((a, b) => b.created - a.created)
    .slice(0, 10)
    .map(({ created: _created, ...rest }) => rest)
}

// ── Detalle de registros de hoy para una tarjeta KPI ─────────────────────
// Retorna array de { user, branch, time } para la lista/formType indicado.

const DETAIL_CONFIG = {
  'pauta-verificacion-reglas-oro': { listId: LIST_IDS.reglasOroSucursales, branchField: 'Instalaci_x00f3_n', userField: 'Nombre',      turnoField: 'Turno' },
  'caminata-seguridad':            { listId: LIST_IDS.caminataSeguridad,   branchField: 'Instalaci_x00f3_n', userField: 'Nombre'      },
  'inspeccion-simple':             { listId: LIST_IDS.inspeccionSimple,    branchField: 'Instalaci_x00f3_n', userField: 'Nombre'      },
  'difusiones-sso':                { listId: LIST_IDS.difusionesSso,       branchField: 'Sucursal',          userField: 'Responsable' },
  'observacion-conductual':        { listId: LIST_IDS.reglasOroVentas,     branchField: 'Instalaci_x00f3_n', userField: 'Nombre'      },
  'inspeccion-planificada':        { listId: LIST_IDS.inspeccionSimple,    branchField: 'Instalaci_x00f3_n', userField: 'Nombre'      },
}

export async function fetchKPIDetail(formType, filters = {}) {
  if (IS_DEV_MODE) return []

  const config = DETAIL_CONFIG[formType]
  if (!config) return []

  const { listId, branchField, userField, turnoField } = config
  const token   = await getGraphToken()
  const siteUrl = getSiteUrl()
  const today   = todayISO()
  const todayMs = new Date(today).getTime()
  const headers = { Authorization: `Bearer ${token}` }

  const selectFields = [userField, branchField, turnoField].filter(Boolean).join(',')
  const url = `${siteUrl}/lists/${listId}/items?$expand=fields($select=${selectFields})&$orderby=lastModifiedDateTime desc&$top=200`
  let res = await fetch(url, { headers })
  if (!res.ok) {
    const fallback = `${siteUrl}/lists/${listId}/items?$expand=fields($select=${selectFields})&$top=500`
    res = await fetch(fallback, { headers })
  }
  if (!res.ok) return []

  const json  = await res.json()
  const items = (json.value || []).filter(item => {
    if (new Date(item.createdDateTime).getTime() < todayMs) return false
    if (filters.branch && filters.branch !== 'all') {
      return normBranch(item.fields?.[branchField]) === normBranch(filters.branch)
    }
    return true
  })

  return items.map(item => {
    const created = new Date(item.createdDateTime)
    const rawBranch = item.fields?.[branchField] || ''
    return {
      user:   item.fields?.[userField] || '—',
      branch: rawBranch.replace(/^sucursal\s+/i, '').trim() || '—',
      time:   created.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
      turno:  turnoField ? (item.fields?.[turnoField] || '') : undefined,
    }
  })
}

// ── Analytics por período desde SharePoint ────────────────────────────────
// period: 'week' | 'month' | 'year'
// Retorna {
//   summary: [{ label, value, color }],    — tarjetas superiores
//   byFormType: [{ label, count, target }] — barras por herramienta
//   prevComparison: number                 — % vs período anterior
// }

function periodRange(period) {
  const now   = new Date()
  const start = new Date()

  if (period === 'week') {
    const day = now.getDay() || 7          // lunes=1 … domingo=7
    start.setDate(now.getDate() - (day - 1))
  } else if (period === 'month') {
    start.setDate(1)
  } else {
    start.setMonth(0, 1)
  }
  start.setHours(0, 0, 0, 0)
  return { start: start.toISOString(), end: now.toISOString() }
}

function prevPeriodRange(period) {
  const now  = new Date()
  const end  = new Date()
  const start = new Date()

  if (period === 'week') {
    const day = now.getDay() || 7
    end.setDate(now.getDate() - (day - 1))   // inicio de esta semana = fin de la anterior
    start.setDate(end.getDate() - 7)
  } else if (period === 'month') {
    end.setDate(0)                            // último día del mes anterior
    start.setFullYear(end.getFullYear(), end.getMonth(), 1)
  } else {
    end.setFullYear(now.getFullYear(), 0, 1)  // 1 ene de este año = fin del año anterior
    start.setFullYear(now.getFullYear() - 1, 0, 1)
  }
  start.setHours(0, 0, 0, 0)
  end.setHours(23, 59, 59, 999)
  return { start: start.toISOString(), end: end.toISOString() }
}

async function countItemsInRange(siteUrl, listId, start, end, branchFilter, branchField, token) {
  const startMs = new Date(start).getTime()
  const endMs   = new Date(end).getTime()
  const headers = { Authorization: `Bearer ${token}` }
  const url = `${siteUrl}/lists/${listId}/items?$expand=fields($select=${branchField})&$orderby=lastModifiedDateTime desc&$top=1000`
  let res = await fetch(url, { headers })
  if (!res.ok) {
    const fallback = `${siteUrl}/lists/${listId}/items?$expand=fields($select=${branchField})&$top=1000`
    res = await fetch(fallback, { headers })
  }
  if (!res.ok) return 0
  const json = await res.json()
  return (json.value || []).filter(item => {
    const t = new Date(item.createdDateTime).getTime()
    if (t < startMs || t > endMs) return false
    if (branchFilter && branchFilter !== 'all') {
      return normBranch(item.fields?.[branchField]) === normBranch(branchFilter)
    }
    return true
  }).length
}

export async function fetchAnalytics(unitType, period = 'month', filters = {}) {
  if (IS_DEV_MODE) return null

  const token   = await getGraphToken()
  const siteUrl = getSiteUrl()

  const LISTS_SUC = [
    { key: 'pauta-verificacion-reglas-oro', listId: LIST_IDS.reglasOroSucursales, branchField: 'Instalaci_x00f3_n', label: 'Pautas Verificación', target: 15 },
    { key: 'caminata-seguridad',            listId: LIST_IDS.caminataSeguridad,   branchField: 'Instalaci_x00f3_n', label: 'Caminatas',           target: 10 },
    { key: 'inspeccion-simple',             listId: LIST_IDS.inspeccionSimple,    branchField: 'Instalaci_x00f3_n', label: 'Inspecciones',        target: 8  },
    { key: 'difusiones-sso',                listId: LIST_IDS.difusionesSso,       branchField: 'Sucursal',          label: 'Difusiones SSO',      target: 5  },
  ]
  const LISTS_FDV = [
    { key: 'observacion-conductual', listId: LIST_IDS.reglasOroVentas, branchField: 'Instalaci_x00f3_n', label: 'Obs. Conductual',  target: 12 },
    { key: 'difusiones-sso',         listId: LIST_IDS.difusionesSso,   branchField: 'Sucursal',          label: 'Difusiones SSO',   target: 5  },
  ]

  const lists = unitType === 'fuerza-de-ventas' ? LISTS_FDV : LISTS_SUC
  const { start, end }       = periodRange(period)
  const { start: ps, end: pe } = prevPeriodRange(period)
  const branch = filters.branch || 'all'

  // Consultar período actual y anterior en paralelo
  const [currentCounts, prevCounts] = await Promise.all([
    Promise.allSettled(lists.map(l => countItemsInRange(siteUrl, l.listId, start, end, branch, l.branchField, token))),
    Promise.allSettled(lists.map(l => countItemsInRange(siteUrl, l.listId, ps,   pe,  branch, l.branchField, token))),
  ])

  const byFormType = lists.map((l, i) => ({
    label:  l.label,
    count:  currentCounts[i].status === 'fulfilled' ? currentCounts[i].value : 0,
    target: l.target,
  }))

  const totalCurrent  = byFormType.reduce((s, r) => s + r.count, 0)
  const totalPrev     = prevCounts.reduce((s, r) => s + (r.status === 'fulfilled' ? r.value : 0), 0)
  const totalTarget   = byFormType.reduce((s, r) => s + r.target, 0)
  const compliance    = totalTarget > 0 ? Math.min(100, Math.round((totalCurrent / totalTarget) * 100)) : 0
  const prevComparison = totalPrev > 0 ? Math.round(((totalCurrent - totalPrev) / totalPrev) * 100) : null

  const summary = [
    { label: 'Registros totales',    value: totalCurrent,        color: '#60A5FA' },
    { label: 'Cumplimiento',         value: `${compliance}%`,    color: compliance >= 80 ? '#27AE60' : compliance >= 50 ? '#F57C20' : '#EB5757' },
    { label: 'Herramientas activas', value: byFormType.filter(r => r.count > 0).length, color: '#7B3FE4' },
    { label: 'vs período anterior',  value: prevComparison !== null ? `${prevComparison > 0 ? '+' : ''}${prevComparison}%` : 'N/D', color: prevComparison >= 0 ? '#27AE60' : '#EB5757' },
  ]

  return { summary, byFormType, totalCurrent, compliance }
}

// ── KPIs de hoy para TODAS las sucursales (DailyStatusScreenV2) ───────────
// Retorna { [branchName]: { pautas:{M,T,N,ADM}, cam:number, dif:{M,T,N,ADM} } }
// En dev mode genera datos mock deterministas por día.

const V2_BRANCHES = [
  'Arica','Iquique','Calama','Antofagasta','Copiapó','Coquimbo',
  'Hijuelas','Viña del Mar','San Antonio','Miraflores','Huechuraba',
  'Lo Espejo','Rancagua','San Felipe','Curicó','Talca','Chillán',
  'Los Ángeles','Concepción','Temuco','Valdivia','Osorno',
  'Puerto Montt','Castro','Coyhaique','Punta Arenas',
]

function v2MockSeed(seed, max) {
  const x = Math.sin(seed) * 10000
  return Math.max(0, Math.floor((x - Math.floor(x)) * (max + 1)))
}

export async function fetchTodayKPIsAllBranches() {
  if (IS_DEV_MODE) {
    const day = Math.floor(Date.now() / 86400000)
    const result = {}
    V2_BRANCHES.forEach((name, bi) => {
      const b = bi * 19 + day * 3
      result[name] = {
        pautas: { M: v2MockSeed(b+1,6), T: v2MockSeed(b+2,6), N: v2MockSeed(b+3,6), ADM: v2MockSeed(b+4,3) },
        cam:    v2MockSeed(b+5, 5),
        dif:    { M: v2MockSeed(b+6,1), T: v2MockSeed(b+7,1), N: v2MockSeed(b+8,1), ADM: v2MockSeed(b+9,1) },
      }
    })
    return result
  }

  const token        = await getGraphToken()
  const siteUrl      = getSiteUrl()
  const weekStartMs  = new Date(weekStartISO()).getTime()
  const headers      = { Authorization: `Bearer ${token}` }

  const branchLookup = {}
  V2_BRANCHES.forEach(name => { branchLookup[normBranch(name)] = name })

  const result = {}
  V2_BRANCHES.forEach(name => {
    result[name] = { pautas: { M:0, T:0, N:0, ADM:0 }, cam: 0, dif: { M:0, T:0, N:0, ADM:0 } }
  })

  const TURNO_KEY = { 'Mañana':'M', 'Tarde':'T', 'Noche':'N', 'Administración':'ADM' }
  const DIF_SHIFTS = ['M','T','N','ADM']

  let deniedCount = 0
  const TOTAL_LISTS = 3

  const fetchList = async (listId, fields, cb) => {
    try {
      const sel = fields.join(',')
      let res = await fetch(`${siteUrl}/lists/${listId}/items?$expand=fields($select=${sel})&$orderby=lastModifiedDateTime desc&$top=500`, { headers })
      if (!res.ok) {
        if (res.status === 403 || res.status === 401) { deniedCount++; return }
        res = await fetch(`${siteUrl}/lists/${listId}/items?$expand=fields($select=${sel})&$top=1000`, { headers })
      }
      if (!res.ok) {
        if (res.status === 403 || res.status === 401) { deniedCount++; return }
        return
      }
      const { value = [] } = await res.json()
      value.forEach(item => {
        if (new Date(item.createdDateTime).getTime() < weekStartMs) return
        cb(item.fields || {})
      })
    } catch (e) { console.warn('[MRC V2]', e.message) }
  }

  await Promise.allSettled([
    fetchList(LIST_IDS.reglasOroSucursales, ['Instalaci_x00f3_n','Turno'], f => {
      const b = branchLookup[normBranch(f.Instalaci_x00f3_n || '')]
      const k = TURNO_KEY[f.Turno || '']
      if (b && k) result[b].pautas[k]++
    }),
    fetchList(LIST_IDS.caminataSeguridad, ['Instalaci_x00f3_n'], f => {
      const b = branchLookup[normBranch(f.Instalaci_x00f3_n || '')]
      if (b) result[b].cam++
    }),
    fetchList(LIST_IDS.difusionesSso, ['Sucursal'], f => {
      const b = branchLookup[normBranch(f.Sucursal || '')]
      if (b) {
        const next = DIF_SHIFTS.find(k => result[b].dif[k] < 1)
        if (next) result[b].dif[next]++
      }
    }),
  ])

  if (deniedCount >= TOTAL_LISTS) return { accessDenied: true }

  return result
}
