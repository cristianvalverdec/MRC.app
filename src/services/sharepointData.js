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
import { SHAREPOINT_LIST_BY_KEY } from './sharepointLists'
import { getLideres } from './lideresService'

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
// Fuente de verdad: src/services/sharepointLists.js (SHAREPOINT_LISTS)
// Aquí solo se mapean por conveniencia para los mappers existentes.
const LIST_IDS = Object.fromEntries(
  Object.entries(SHAREPOINT_LIST_BY_KEY).map(([k, v]) => [k, v.guid])
)

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

  // Conductas observadas: checkboxes op1–op10 (Q23,Q25,...,Q45 + Q55,Q57,Q59)
  const CBQS = ['Q23','Q25','Q27','Q29','Q31','Q33','Q35','Q37','Q39','Q41','Q43','Q45','Q55','Q57','Q59']
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
    Nombre_x0020_Colaborador:            d.Q49 || d.Q17 || '',
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

  const area     = d.cs_area    || ''
  const temaFri  = d.cs_fri_tema || ''
  const temaOfi  = d.cs_ofi_tema || ''
  // Para áreas sin selección de temática (Sala de Máquinas, Baterías, Comunes) el área es la temática
  const tematica = temaFri || temaOfi || area

  // Pattern matching dinámico: funciona con cualquier área/temática, incluyendo
  // nuevas que se agreguen desde el Editor de Formularios
  const keys      = Object.keys(d).filter(k =>
    k.startsWith('cs_') &&
    !['cs_instalacion','cs_area','cs_fri_tema','cs_ofi_tema'].includes(k)
  )
  const keyP1      = keys.find(k => k.endsWith('_p1'))
  const keyDesvio  = keys.find(k => k.endsWith('_desvio'))
  const keyCarta   = keys.find(k => k.endsWith('_carta'))
  const keyNombre  = keys.find(k => k.endsWith('_nombre'))
  const keyRut     = keys.find(k => k.endsWith('_rut'))
  const keyObs     = keys.find(k => k.endsWith('_obs'))
  const keyP2      = keys.find(k => k.endsWith('_p2'))

  const hayDesvioConducta    = keyP1 ? d[keyP1] === 'CON_OBSERVACIONES' : false
  const hayDesvioCondiciones = keyP2 ? d[keyP2] === 'CON_OBSERVACIONES' : false

  const desvioRaw   = keyDesvio ? d[keyDesvio] : null
  const conductaObs = desvioRaw
    ? (Array.isArray(desvioRaw) ? desvioRaw : [String(desvioRaw)]).filter(Boolean).join(' | ')
    : ''

  return {
    Title:                                sub.userName || '',
    Instalaci_x00f3_n:                    d.cs_instalacion || sub.branch || '',
    Nombre:                               sub.userName  || '',
    _x00c1_rea:                           area,
    Tem_x00e1_tica:                       tematica,
    '_x00bf_Existe_x0020_Desviaci_x00':   hayDesvioConducta    ? 'Sí' : 'No',
    Conducta_x0020_Observada:             conductaObs,
    Carta_x0020_Amonestaci_x00f3_n:       keyCarta  ? (d[keyCarta]  === 'SI' ? 'Sí' : 'No') : '',
    Nombre_x0020_Colaborador:             keyNombre ? d[keyNombre] || '' : '',
    RUT_x0020_Colaborador:                keyRut    ? d[keyRut]    || '' : '',
    '_x00bf_Existe_x0020_Desviaci_x000':  hayDesvioCondiciones ? 'Sí' : 'No',
    Observaciones:                         keyObs ? d[keyObs] || '' : '',
    Correo_x0020_Remitente:               sub.userEmail || '',
  }
}

// ── 3b. Condición Insegura desde Caminata de Seguridad ────────────────────
// Segundo ítem de cola (Option C): deposita el detalle de la condición
// detectada en la lista Inspección Simple. Solo se encola cuando el
// formulario tiene al menos un _p2 === 'CON_OBSERVACIONES'.
function mapCondicionDesdeCaminata(sub) {
  const d = sub.answers || sub.data || {}

  const prefix = (d.cs_instalacion || sub.branch || 'XX').replace(/\s+/g, '').substring(0, 3).toUpperCase()
  const ts     = Date.now().toString().slice(-6)
  const codigo = `CS-${prefix}-${ts}`

  const keys = Object.keys(d).filter(k => k.startsWith('cs_'))
  const keyCondLugar      = keys.find(k => k.endsWith('_cond_lugar'))
  const keyCondDesc       = keys.find(k => k.endsWith('_cond_desc'))
  const keyCondIncidentes = keys.find(k => k.endsWith('_cond_incidentes'))
  const keyCondMedida     = keys.find(k => k.endsWith('_cond_medida'))
  const keyCondAreaResp   = keys.find(k => k.endsWith('_cond_area_resp'))
  const keyCondNombreResp = keys.find(k => k.endsWith('_cond_nombre_resp'))
  const keyCondCorreoResp = keys.find(k => k.endsWith('_cond_correo_resp'))
  const keyCondFecha      = keys.find(k => k.endsWith('_cond_fecha'))

  const incidentesRaw = keyCondIncidentes ? d[keyCondIncidentes] : null
  const incidentesStr = incidentesRaw
    ? (Array.isArray(incidentesRaw) ? incidentesRaw : [String(incidentesRaw)]).filter(Boolean).join(' | ')
    : ''

  return {
    Title:                               codigo,
    Instalaci_x00f3_n:                   d.cs_instalacion || sub.branch || '',
    Nombre:                              sub.userName   || '',
    Categor_x00ed_a:                     `Caminata — ${d.cs_area || ''}`,
    Lugar_x0020_Especifico:              keyCondLugar      ? d[keyCondLugar]      || '' : '',
    Condici_x00f3_n_x0020_Insegura:      keyCondDesc       ? d[keyCondDesc]       || '' : '',
    Incidentes_x0020_Posibles:           incidentesStr,
    Medida_x0020_de_x0020_Control:       keyCondMedida     ? d[keyCondMedida]     || '' : '',
    _x00c1_rea_x0020_Responsable:        keyCondAreaResp   ? d[keyCondAreaResp]   || '' : '',
    Nombre_x0020_Responsable:            keyCondNombreResp ? d[keyCondNombreResp] || '' : '',
    Correo_x0020_Responsable:            keyCondCorreoResp ? d[keyCondCorreoResp] || '' : '',
    Fecha_x0020_Compromiso:              keyCondFecha      ? d[keyCondFecha]      || '' : '',
    C_x00f3_digo_x0020_de_x0020_Repo:    codigo,
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

// ── Mapper genérico para formularios custom o estáticos sin mapper ───────
//
// Construye el payload `fields` exclusivamente a partir de los `spColumn`
// declarados por el admin en el override de cada pregunta. Si una pregunta
// no tiene spColumn asignado, se omite (no falla). Es lo que permite a los
// formularios custom (creados por el admin) escribir a una lista existente
// sin requerir un mapper hardcodeado.
function mapGenericFromOverride(sub) {
  const fields = {
    Title: sub.userName || sub.userEmail || 'Registro MRC',
  }
  // Las columnas se aplican en submitFormToSharePoint vía readEditorSpColumns.
  // Aquí solo armamos un esqueleto mínimo con identidad del usuario.
  if (sub.userName)  fields.Nombre = sub.userName
  if (sub.userEmail) fields.Correo_x0020_Remitente = sub.userEmail
  if (sub.branch)    fields.Instalaci_x00f3_n = sub.branch
  return fields
}

// Lee el listId asignado a un customForm (creado vía NUEVO FORMULARIO en el editor).
function getCustomFormListId(formType) {
  try {
    const raw = localStorage.getItem('mrc-form-editor-store')
    if (!raw) return null
    const state = JSON.parse(raw)?.state
    return state?.customForms?.[formType]?.listId || null
  } catch { return null }
}

// ── Router: formType → listId + mapper ───────────────────────────────────
function getListConfig(formType) {
  const MAP = {
    'pauta-verificacion-reglas-oro':  { listId: LIST_IDS.reglasOroSucursales,       mapFields: mapReglasOroSucursales       },
    'observacion-conductual':         { listId: LIST_IDS.reglasOroVentas,           mapFields: mapReglasOroVentas           },
    'caminata-seguridad':             { listId: LIST_IDS.caminataSeguridad,         mapFields: mapCaminataSeguridad         },
    'caminata-seguridad-condicion':   { listId: LIST_IDS.inspeccionSimple,          mapFields: mapCondicionDesdeCaminata    },
    'inspeccion-simple':              { listId: LIST_IDS.inspeccionSimple,          mapFields: mapInspeccionSimple          },
    'difusiones-sso':                 { listId: LIST_IDS.difusionesSso,             mapFields: mapDifusiones                },
    'cierre-condiciones':             { listId: LIST_IDS.cierreCondiciones,         mapFields: mapCierreCondiciones         },
    'permiso-trabajo-contratista':    { listId: LIST_IDS.permisoTrabajoContratista, mapFields: mapPermisoTrabajoContratista },
    'cierre-trabajo-contratista':     { listId: LIST_IDS.cierreTrabajoContratista,  mapFields: mapCierreTrabajoContratista  },
  }
  const overrideId = getConnectionOverride(formType)
  const base = MAP[formType]

  if (base) {
    // Estático conocido: respeta override de listId si existe
    return overrideId ? { ...base, listId: overrideId } : base
  }

  // Sin mapper estático → puede ser customForm o estático con override de listId.
  // Resolver listId desde override (panel de conexiones) o desde customForms.
  const customListId = overrideId || getCustomFormListId(formType)
  if (!customListId) return null
  return { listId: customListId, mapFields: mapGenericFromOverride }
}

// Pública: el editor / FormScreen pueden chequear si un formType tiene destino
// configurado antes de permitir envío. Devuelve { listId } o null.
export function resolveListConfig(formType) {
  const cfg = getListConfig(formType)
  if (!cfg || !cfg.listId) return null
  return { listId: cfg.listId }
}

// ── Catálogo de columnas SP conocidas por formulario ─────────────────────
// Permite al editor de formularios mostrar un dropdown con las columnas
// disponibles en cada lista. Solo incluye columnas "libres" (no mapeadas
// automáticamente por los mappers estáticos) más las más útiles para
// preguntas personalizadas. El admin puede escribir nombres propios.
export const SP_COLUMN_CATALOG = {
  'pauta-verificacion-reglas-oro': [
    { internal: 'Observaciones',                       label: 'Observaciones' },
    { internal: 'Nombre_x0020_Colaborador',            label: 'Nombre Colaborador' },
    { internal: '_x00c1_rea',                          label: 'Área' },
    { internal: 'Turno',                               label: 'Turno' },
    { internal: 'Regla_x0020_de_x0020_Oro',            label: 'Regla de Oro' },
    { internal: 'Conducta_x0020_Observada',            label: 'Conducta Observada' },
    { internal: 'Equipo_x0020_de_x0020_Venta_x002',    label: 'Equipo de Venta' },
    { internal: 'Correo_x0020_Remitente',              label: 'Correo Remitente' },
    { internal: 'Instalaci_x00f3_n',                   label: 'Instalación' },
    { internal: 'Nombre',                              label: 'Nombre (responsable)' },
    { internal: 'Cargo',                               label: 'Cargo' },
  ],
  'observacion-conductual': [
    { internal: 'Observaciones',                       label: 'Observaciones' },
    { internal: 'Nombre_x0020_Colaborador',            label: 'Nombre Colaborador' },
    { internal: '_x00c1_rea',                          label: 'Área' },
    { internal: 'Turno',                               label: 'Turno' },
    { internal: 'Regla_x0020_de_x0020_Oro',            label: 'Regla de Oro' },
    { internal: 'Equipo_x0020_de_x0020_Venta',         label: 'Equipo de Venta' },
    { internal: 'Instalaci_x00f3_n',                   label: 'Instalación' },
    { internal: 'Nombre',                              label: 'Nombre (responsable)' },
    { internal: 'Cargo',                               label: 'Cargo' },
    { internal: 'Correo_x0020_Remitente',              label: 'Correo Remitente' },
  ],
  'caminata-seguridad': [
    { internal: 'Instalaci_x00f3_n',                         label: 'Instalación' },
    { internal: '_x00c1_rea',                                 label: 'Área' },
    { internal: 'Tem_x00e1_tica',                             label: 'Temática' },
    { internal: "'x00bf_Existe_x0020_Desviaci_x00'",          label: '¿Desviación de conducta?' },
    { internal: 'Conducta_x0020_Observada',                   label: 'Conducta Observada' },
    { internal: 'Carta_x0020_Amonestaci_x00f3_n',             label: 'Carta de Amonestación' },
    { internal: 'Nombre_x0020_Colaborador',                   label: 'Nombre Colaborador' },
    { internal: 'RUT_x0020_Colaborador',                      label: 'RUT Colaborador' },
    { internal: "'x00bf_Existe_x0020_Desviaci_x000'",         label: '¿Desviación de condiciones?' },
    { internal: 'Observaciones',                              label: 'Observaciones' },
    { internal: 'Nombre',                                     label: 'Nombre (responsable)' },
    { internal: 'Correo_x0020_Remitente',                     label: 'Correo Remitente' },
  ],
  'inspeccion-simple': [
    { internal: 'Categor_x00ed_a',                     label: 'Categoría' },
    { internal: 'Lugar_x0020_Especifico',              label: 'Lugar específico' },
    { internal: 'Condici_x00f3_n_x0020_Insegura',      label: 'Condición insegura' },
    { internal: 'Medida_x0020_de_x0020_Control',       label: 'Medida de control' },
    { internal: 'Observaciones',                       label: 'Observaciones' },
    { internal: 'Instalaci_x00f3_n',                   label: 'Instalación' },
    { internal: 'Nombre',                              label: 'Nombre (responsable)' },
    { internal: 'Correo_x0020_Remitente',              label: 'Correo Remitente' },
  ],
  'difusiones-sso': [
    { internal: 'Sucursal',                            label: 'Sucursal' },
    { internal: '_x00c1_rea',                          label: 'Área' },
    { internal: 'Responsable',                         label: 'Responsable' },
    { internal: 'CargoResponsable',                    label: 'Cargo Responsable' },
    { internal: 'Observaciones',                       label: 'Observaciones' },
  ],
  'permiso-trabajo-contratista': [
    { internal: 'Empresa_x0020_Contratista',           label: 'Empresa Contratista' },
    { internal: 'RUT_x0020_Empresa',                   label: 'RUT Empresa' },
    { internal: 'Supervisor_x0020_Contratista',        label: 'Supervisor Contratista' },
    { internal: 'Tel_x00e9_fono_x0020_Supervisor',     label: 'Teléfono Supervisor' },
    { internal: 'Ubicaci_x00f3_n_x0020_Faena',         label: 'Ubicación Faena' },
    { internal: 'Descripci_x00f3_n_x0020_Trabajo',     label: 'Descripción Trabajo' },
    { internal: 'Fecha_x0020_Inicio',                  label: 'Fecha Inicio' },
    { internal: 'Fecha_x0020_T_x00e9_rmino',           label: 'Fecha Término' },
    { internal: 'N_x00ba__x0020_Trabajadores',         label: 'N° Trabajadores' },
    { internal: 'Tipo_x0020_Trabajo',                  label: 'Tipo de Trabajo' },
    { internal: 'Peligros_x0020_Identificados',        label: 'Peligros Identificados' },
    { internal: 'Nivel_x0020_Riesgo',                  label: 'Nivel de Riesgo' },
    { internal: 'EPP_x0020_Utilizado',                 label: 'EPP Utilizado' },
    { internal: 'Observaciones',                       label: 'Observaciones' },
    { internal: 'Instalaci_x00f3_n',                   label: 'Instalación' },
    { internal: 'Correo_x0020_Remitente',              label: 'Correo Remitente' },
  ],
  'cierre-trabajo-contratista': [
    { internal: 'Empresa_x0020_Contratista',           label: 'Empresa Contratista' },
    { internal: 'Ubicaci_x00f3_n_x0020_Faena',         label: 'Ubicación Faena' },
    { internal: 'Tipo_x0020_Trabajo',                  label: 'Tipo de Trabajo' },
    { internal: 'Observaciones',                       label: 'Observaciones' },
    { internal: 'Instalaci_x00f3_n',                   label: 'Instalación' },
    { internal: 'Correo_x0020_Remitente',              label: 'Correo Remitente' },
  ],
}

// Lee los spColumn asignados desde el editor de formularios (localStorage).
// Devuelve { questionId: 'NombreColumnaInterna', ... }
function readEditorSpColumns(formId) {
  try {
    const raw = localStorage.getItem('mrc-form-editor-store')
    if (!raw) return {}
    const state    = JSON.parse(raw)?.state
    const override = state?.editedForms?.[formId]
    if (!override) return {}
    const questions = override.sections
      ? override.sections.flatMap((s) => s.questions || [])
      : Object.values(override.questions || {})
    return Object.fromEntries(
      questions.filter((q) => q.id && q.spColumn).map((q) => [q.id, q.spColumn])
    )
  } catch { return {} }
}

// ── Enriquecimiento con correos de líderes ────────────────────────────────
//
// Mapeo de cargo MRC → columna(s) SharePoint según estructura definida con
// el equipo SSO Comercial. Aplica a todos los formularios que comparten
// esta estructura de columnas (Reglas de Oro, Caminata, Inspección, etc.).
//
// Correo 1-3: Jefe de Despacho (hasta 3 personas por turno)
// Correo 4:   Jefe de Frigorífico
// Correo 5:   Jefe de Operaciones
// Correo 6:   Jefe Administrativo
// Correo 7:   Jefe de Zona
// Correo 8:   Subgerente de Zona

function buildLideresEmailMap(lideres) {
  const map = {}
  for (const lider of lideres) {
    if (!lider.email) continue
    if (!map[lider.cargoMRC]) map[lider.cargoMRC] = []
    map[lider.cargoMRC].push(lider.email)
  }
  return map
}

async function fetchLideresEmailMap(branch) {
  if (!branch) return {}
  try {
    const lideres = await getLideres(branch)
    return buildLideresEmailMap(lideres)
  } catch (err) {
    console.warn('[MRC] fetchLideresEmailMap falló para', branch, ':', err.message)
    return {}
  }
}

function applyLideresEmails(fields, lideresMap) {
  const despacho    = lideresMap['Jefe de Despacho']    || []
  const frigorifico = lideresMap['Jefe de Frigorífico']  || []
  const operaciones = lideresMap['Jefe de Operaciones']  || []
  const admin       = lideresMap['Jefe Administrativo']  || []
  const zona        = lideresMap['Jefe de Zona']         || []
  const subgerente  = lideresMap['Subgerente de Zona']   || []

  fields.Correo_x0020_1 = despacho[0]    || ''
  fields.Correo_x0020_2 = despacho[1]    || ''
  fields.Correo_x0020_3 = despacho[2]    || ''
  fields.Correo_x0020_4 = frigorifico[0] || ''
  fields.Correo_x0020_5 = operaciones[0] || ''
  fields.Correo_x0020_6 = admin[0]       || ''
  fields.Correo_x0020_7 = zona[0]        || ''
  fields.Correo_x0020_8 = subgerente[0]  || ''
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
  if (!config || !config.listId) {
    // Fail-loud: antes era console.warn silencioso → respuestas perdidas en silencio.
    // Ahora lanza para que la cola pendiente reintente y el usuario sea notificado.
    const err = new Error(
      `El formulario "${submission.formType}" no tiene lista SharePoint asignada. ` +
      `El admin debe configurarla desde el editor (sección "Conexión SharePoint").`
    )
    err.code = 'NO_LIST_CONFIGURED'
    throw err
  }

  const token   = await getGraphToken()
  const siteUrl = getSiteUrl()
  const url     = `${siteUrl}/lists/${config.listId}/items`
  const fields  = config.mapFields(submission)

  // Columnas asignadas dinámicamente desde el editor de formularios
  const editorCols = readEditorSpColumns(submission.formType)
  for (const [qId, col] of Object.entries(editorCols)) {
    if (!col || fields[col]) continue   // vacío o ya mapeado estáticamente con valor
    const val = submission.answers?.[qId]
    if (val === undefined || val === null) continue
    fields[col] = Array.isArray(val) ? val.join(' | ') : String(val)
  }

  // Enriquecer Correo 1-8 con emails de líderes de la instalación.
  // La instalación se lee desde la respuesta Q1 (selector de instalación)
  // o desde el branch almacenado en el submission. Los líderes provienen
  // del módulo "Gestión de Líderes" y son la fuente de verdad para el
  // enrutamiento de notificaciones vía Power Automate.
  const branch = submission.answers?.Q1 || submission.branch || ''
  const lideresMap = await fetchLideresEmailMap(branch)
  applyLideresEmails(fields, lideresMap)

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

  // Subir fotos adjuntas si las hay (Inspección Simple o condición desde Caminata)
  let photos = submission.answers?.is_photo
  if (!photos?.length) {
    const condFotoKey = Object.keys(submission.answers || {}).find(k => k.endsWith('_cond_foto'))
    if (condFotoKey) photos = submission.answers[condFotoKey]
  }
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

// ── Leer columnas reales de una lista SharePoint ──────────────────────────
// Llama a Graph API GET /lists/{listId}/columns y devuelve
// [{ internal: string, label: string }] filtrado de columnas ocultas/sistema.
// Retorna null si el listId está vacío, en modo dev o hay error de red.
export async function fetchListColumns(formType) {
  if (IS_DEV_MODE) return null
  const config = getListConfig(formType)
  if (!config?.listId) return null

  try {
    const token   = await getGraphToken()
    const siteUrl = getSiteUrl()
    const res = await fetch(`${siteUrl}/lists/${config.listId}/columns`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return null
    const data = await res.json()
    const SYSTEM_COLS = new Set([
      'ContentType','Attachments','Edit','DocIcon','LinkTitle','LinkTitleNoMenu',
      '_HasCopyDestinations','_CopySource','owshiddenversion','WorkflowVersion',
      '_UIVersion','_UIVersionString','ParentLeafName','ParentVersionString',
      '_CheckinComment','LinkCheckedOutTitle','_IsCurrentVersion',
      'ItemChildCount','FolderChildCount','AppAuthor','AppEditor',
      'SMTotalSize','SMTotalFileStreamSize','SMTotalFileCount',
    ])
    return (data.value || [])
      .filter((col) => !col.hidden && !SYSTEM_COLS.has(col.name))
      .map((col) => ({ internal: col.name, label: col.displayName || col.name }))
      .sort((a, b) => a.label.localeCompare(b.label))
  } catch { return null }
}
