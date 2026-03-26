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

import { msalInstance } from '../config/msalInstance'
import { graphScopes }  from '../config/msalConfig'

export const IS_DEV_MODE =
  !import.meta.env.VITE_AZURE_CLIENT_ID ||
  import.meta.env.VITE_AZURE_CLIENT_ID === 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'

// ── GUIDs de listas ───────────────────────────────────────────────────────
const LIST_IDS = {
  reglasOroSucursales: 'd123a245-0aeb-4f51-9b20-693639c963b6',
  caminataSeguridad:   '04730b19-b235-4eef-b487-0234326fd4ac',
  inspeccionSimple:    'de766ded-0d14-4e50-8254-710c533a2106',
  reglasOroVentas:     '5edaee5a-2ee5-4fb4-a5aa-18f8068a1b25',
  difusionesSso:       '2097a931-5615-472b-afc7-b2d2fc6fe805',
  cierreCondiciones:   '00b25970-34f1-4026-9cc8-0df3f59c3383',
}

// ── Helpers Graph API ─────────────────────────────────────────────────────

async function getGraphToken() {
  const accounts = msalInstance.getAllAccounts()
  if (!accounts.length) throw new Error('Sin cuenta autenticada')
  const result = await msalInstance.acquireTokenSilent({
    ...graphScopes,
    account: accounts[0],
  })
  return result.accessToken
}

function getSiteUrl() {
  const raw = import.meta.env.VITE_SHAREPOINT_SITE_URL
  if (!raw) throw new Error('VITE_SHAREPOINT_SITE_URL no configurado')
  // Convierte https://agrosuper.sharepoint.com/sites/SSOASCOMERCIAL
  // → https://graph.microsoft.com/v1.0/sites/agrosuper.sharepoint.com:/sites/SSOASCOMERCIAL
  const url  = new URL(raw)
  const path = url.pathname.replace(/\/$/, '')   // quita trailing slash
  return `https://graph.microsoft.com/v1.0/sites/${url.hostname}:${path}`
}

function todayISO() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

// Extrae email de un valor de persona Azure AD
// (puede ser string, { email } o { mail } o { userPrincipalName })
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
  const d = sub.data || {}

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
    Title:                               d.Q12 || sub.userName || '',
    Instalaci_x00f3_n:                   d.Q1  || sub.branch   || '',
    Cargo:                               d.Q2  || '',
    Nombre:                              d.Q12 || sub.userName || '',
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
  const d = sub.data || {}

  const hasDeviation = Object.values(d).some((v) => v === 'CON_OBSERVACIONES')

  const CBQS = ['Q23','Q25','Q27','Q29','Q31','Q33','Q35','Q37','Q39','Q41','Q43','Q45']
  const conductas = CBQS.flatMap((k) => {
    const v = d[k]; if (!v) return []
    return Array.isArray(v) ? v : [String(v)]
  }).join(' | ')

  return {
    Title:                               d.Q12 || sub.userName || '',
    Instalaci_x00f3_n:                   d.Q1  || sub.branch   || '',
    Cargo:                               d.Q2  || '',
    Nombre:                              d.Q12 || sub.userName || '',
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
  const d = sub.data || {}

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
  const d = sub.data || {}

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
  const d   = sub.data || {}
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
  const d = sub.data || {}
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

// ── Router: formType → listId + mapper ───────────────────────────────────
function getListConfig(formType) {
  const MAP = {
    'pauta-verificacion-reglas-oro': { listId: LIST_IDS.reglasOroSucursales, mapFields: mapReglasOroSucursales },
    'observacion-conductual':        { listId: LIST_IDS.reglasOroVentas,     mapFields: mapReglasOroVentas     },
    'caminata-seguridad':            { listId: LIST_IDS.caminataSeguridad,   mapFields: mapCaminataSeguridad   },
    'inspeccion-simple':             { listId: LIST_IDS.inspeccionSimple,    mapFields: mapInspeccionSimple    },
    'difusiones-sso':                { listId: LIST_IDS.difusionesSso,       mapFields: mapDifusiones          },
    'cierre-condiciones':            { listId: LIST_IDS.cierreCondiciones,   mapFields: mapCierreCondiciones   },
  }
  return MAP[formType] || null
}

// ── Enviar un registro a SharePoint ──────────────────────────────────────
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

  const token  = await getGraphToken()
  const url    = `${getSiteUrl()}/lists/${config.listId}/items`
  const fields = config.mapFields(submission)

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
    throw new Error(`SharePoint POST falló: ${res.status} — ${errText}`)
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
  const results = {}

  await Promise.allSettled(
    listsToQuery.map(async ({ key, listId, branchField }) => {
      try {
        const clauses = [`fields/Created ge '${today}'`]
        if (filters.branch && filters.branch !== 'all') {
          clauses.push(`fields/${branchField} eq '${filters.branch}'`)
        }
        const filter = encodeURIComponent(clauses.join(' and '))
        const url    = `${siteUrl}/lists/${listId}/items?$filter=${filter}&$select=fields/Created&$top=500`
        const res    = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
        if (!res.ok) throw new Error(`SP GET ${res.status}`)
        const json   = await res.json()
        results[key] = (json.value || []).length
      } catch (err) {
        console.warn(`[MRC Data] KPI ${key}:`, err.message)
        results[key] = 0
      }
    })
  )

  return results
}
