// ── Tests centinela: Manejo de errores 403 de SharePoint ─────────────────────
//
// Verifica que el sistema detecta correctamente cuando un usuario no tiene
// permisos en el sitio SSOASCOMERCIAL y lo señaliza con flags visibles en UI,
// en lugar de mostrar datos vacíos silenciosamente.

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// ── Lectura estática de archivos ─────────────────────────────────────────────

const sharepointDataSrc = readFileSync(
  resolve(import.meta.dirname, '../services/sharepointData.js'),
  'utf-8'
)

const accessRequestSrc = readFileSync(
  resolve(import.meta.dirname, '../services/accessRequestService.js'),
  'utf-8'
)

const formStoreSrc = readFileSync(
  resolve(import.meta.dirname, '../store/formStore.js'),
  'utf-8'
)

const urlLinksSrc = readFileSync(
  resolve(import.meta.dirname, '../services/urlLinksService.js'),
  'utf-8'
)

const useKPIsSrc = readFileSync(
  resolve(import.meta.dirname, '../hooks/useKPIs.js'),
  'utf-8'
)

const accessRequestCTASrc = readFileSync(
  resolve(import.meta.dirname, '../components/ui/AccessRequestCTA.jsx'),
  'utf-8'
)

const permisosScreenSrc = readFileSync(
  resolve(import.meta.dirname, '../screens/PermisosSharePointScreen.jsx'),
  'utf-8'
)

// ── 1. sharepointData: clasificación de 403 ─────────────────────────────────

describe('sharepointData — Clasificación de errores 403', () => {
  it('submitFormToSharePoint lanza error con code PERMISSION_DENIED en 403/401', () => {
    // Verifica que el error tiene code y no es genérico
    expect(sharepointDataSrc).toContain("err.code = 'PERMISSION_DENIED'")
    expect(sharepointDataSrc).toContain('PERMISSION_DENIED')
  })

  it('fetchTodayKPIs detecta cuando todas las listas retornan 403 y señaliza accessDenied', () => {
    expect(sharepointDataSrc).toContain('deniedCount')
    expect(sharepointDataSrc).toContain('accessDenied: true')
    expect(sharepointDataSrc).toContain('deniedCount >= listsToQuery.length')
  })

  it('fetchRecentActivity detecta 403 generalizado y señaliza accessDenied', () => {
    // fetchRecentActivity también tiene su propio deniedCount
    const matches = (sharepointDataSrc.match(/deniedCount/g) || []).length
    // Debe aparecer en al menos 2 funciones (fetchTodayKPIs + fetchRecentActivity + fetchTodayKPIsAllBranches)
    expect(matches).toBeGreaterThanOrEqual(3)
  })

  it('fetchTodayKPIsAllBranches también detecta 403 y señaliza accessDenied', () => {
    // La función V2 también debe tener el mismo patrón
    expect(sharepointDataSrc).toContain('TOTAL_LISTS')
    expect(sharepointDataSrc).toContain('deniedCount >= TOTAL_LISTS')
  })
})

// ── 2. useKPIs: propagación del flag ────────────────────────────────────────

describe('useKPIs — Propagación de accessDenied', () => {
  it('useKPIs retorna accessDenied en su interfaz pública', () => {
    expect(useKPIsSrc).toContain('accessDenied')
    expect(useKPIsSrc).toContain('setAccessDenied')
  })

  it('useKPIsAllBranches también expone accessDenied', () => {
    // Debe haber dos setAccessDenied (uno por hook)
    const matches = (useKPIsSrc.match(/setAccessDenied/g) || []).length
    expect(matches).toBeGreaterThanOrEqual(2)
  })

  it('useKPIs distingue accessDenied de error de red', () => {
    expect(useKPIsSrc).toContain('countsMap?.accessDenied')
    expect(useKPIsSrc).toContain('recentActivity?.accessDenied')
  })
})

// ── 3. accessRequestService: estructura del servicio ────────────────────────

describe('accessRequestService — Flujo de solicitud', () => {
  it('tiene función requestSiteAccess exportada', () => {
    expect(accessRequestSrc).toContain('export async function requestSiteAccess')
  })

  it('implementa cooldown de 5 minutos (no 24h — muy restrictivo en lanzamiento)', () => {
    expect(accessRequestSrc).toContain('COOLDOWN_MS')
    expect(accessRequestSrc).toContain('5 * 60 * 1000')
    expect(accessRequestSrc).toContain('isRequestOnCooldown')
    expect(accessRequestSrc).not.toContain('24 * 60 * 60 * 1000')
  })

  it('expone clearAccessRequestCooldown para reenvíos manuales', () => {
    expect(accessRequestSrc).toContain('export function clearAccessRequestCooldown')
  })

  it('lee la URL del webhook desde urlLinksService (no hardcodeada)', () => {
    expect(accessRequestSrc).toContain("getLink('power-automate-access-request')")
    expect(accessRequestSrc).not.toMatch(/https:\/\/prod-.*\.logic\.azure\.com/)
  })

  it('incluye deviceInfo en el payload', () => {
    expect(accessRequestSrc).toContain('deviceInfo')
    expect(accessRequestSrc).toContain('navigator.userAgent')
  })

  it('solo guarda el cooldown tras una respuesta exitosa', () => {
    // La llamada a setCooldown() debe aparecer DESPUÉS del guard "if (!res.ok) throw"
    // Usamos lastIndexOf para encontrar la LLAMADA (no la definición de la función)
    const setCooldownCallIdx = accessRequestSrc.lastIndexOf('setCooldown()')
    const throwErrIdx        = accessRequestSrc.indexOf("throw new Error(`El webhook respondió")
    expect(setCooldownCallIdx).toBeGreaterThan(throwErrIdx)
  })
})

// ── 4. urlLinksService: entrada del webhook ──────────────────────────────────

describe('urlLinksService — Entrada webhook solicitud de acceso', () => {
  it('tiene entrada power-automate-access-request en el catálogo', () => {
    expect(urlLinksSrc).toContain("'power-automate-access-request'")
    expect(urlLinksSrc).toContain('Webhook Solicitud de Acceso')
  })

  it('la entrada tiene adminOnly para ocultarla de usuarios normales', () => {
    expect(urlLinksSrc).toContain('adminOnly: true')
  })
})

// ── 5. formStore: distingue PERMISSION_DENIED en syncQueue ──────────────────

describe('formStore — Manejo de PERMISSION_DENIED en syncQueue', () => {
  it('almacena lastSubmitError con code y message', () => {
    expect(formStoreSrc).toContain('lastSubmitError')
    expect(formStoreSrc).toContain('clearSubmitError')
  })

  it('syncQueue detecta PERMISSION_DENIED y detiene el loop', () => {
    expect(formStoreSrc).toContain("err?.code === 'PERMISSION_DENIED'")
    expect(formStoreSrc).toContain('break')
  })

  it('syncStatus puede ser permission_denied', () => {
    expect(formStoreSrc).toContain("'permission_denied'")
    expect(formStoreSrc).toContain('syncStatus: permissionDenied')
  })
})

// ── 6. AccessRequestCTA: identifica al solicitante ──────────────────────────
//
// Regresión v1.9.3 → v1.9.4: el componente leía `useUserStore((s) => s.profile)`
// pero userStore guarda `name` y `email` en campos planos. Resultado: las
// solicitudes llegaban con requesterEmail='sin-email@agrosuper.com' y los
// admins no podían identificar al usuario que pedía acceso.

describe('AccessRequestCTA — Identidad del solicitante', () => {
  it('NO lee s.profile del userStore (regresión v1.9.4)', () => {
    expect(accessRequestCTASrc).not.toMatch(/useUserStore\(\s*\(s\)\s*=>\s*s\.profile\s*\)/)
    expect(accessRequestCTASrc).not.toContain('profile?.mail')
    expect(accessRequestCTASrc).not.toContain('profile?.email')
    expect(accessRequestCTASrc).not.toContain('profile?.displayName')
  })

  it('lee name y email planos del userStore', () => {
    expect(accessRequestCTASrc).toMatch(/useUserStore\(\s*\(s\)\s*=>\s*s\.name\s*\)/)
    expect(accessRequestCTASrc).toMatch(/useUserStore\(\s*\(s\)\s*=>\s*s\.email\s*\)/)
  })

  it('bloquea el envío si el email está vacío', () => {
    expect(accessRequestCTASrc).toContain('if (!email)')
    expect(accessRequestCTASrc).toMatch(/No se detect[oó]/)
  })
})

// ── 7. PermisosSharePointScreen: sync del set de agregados ──────────────────
//
// Regresión v1.9.4: el set de "marcados como agregados" vivía solo en
// localStorage por dispositivo. El admin marcaba 118 emails desde su PC y al
// abrir la app en el celular los veía a TODOS pendientes. Ahora se sincroniza
// vía mrc-sp-members-added.json en SharePoint.

describe('PermisosSharePointScreen — Sync de set agregados', () => {
  it('importa loadAddedEmails y saveAddedEmails del servicio sync', () => {
    expect(permisosScreenSrc).toContain('loadAddedEmails')
    expect(permisosScreenSrc).toContain('saveAddedEmails')
    expect(permisosScreenSrc).toContain('spMembersAddedSync')
  })

  it('expone syncStatus para feedback al admin', () => {
    expect(permisosScreenSrc).toContain('syncStatus')
    expect(permisosScreenSrc).toContain("'pushing'")
    expect(permisosScreenSrc).toContain("'error'")
  })

  it('toggleAdded llama al push remoto (no fire-and-forget silencioso)', () => {
    expect(permisosScreenSrc).toContain('pushToCloud')
  })

  it('integra solicitudes pendientes (SolicitudesAccesoMRC)', () => {
    expect(permisosScreenSrc).toContain('getPendingAccessRequests')
    expect(permisosScreenSrc).toContain('markAccessRequestProcessed')
    expect(permisosScreenSrc).toContain('processRequest')
  })

  it('permite agregar emails manuales con validación @agrosuper.com', () => {
    expect(permisosScreenSrc).toContain('handleAddManual')
    expect(permisosScreenSrc).toContain('manualEntries')
    expect(permisosScreenSrc).toMatch(/@agrosuper\\.com/)
  })
})

// ── 8. msalInstance: forceRefresh para caso fgaticaa ────────────────────────
//
// Cuando un usuario es agregado al grupo MRC Members en SharePoint, su token
// MSAL en caché conserva los claims antiguos hasta que expira el access token
// (típicamente 1h). Antes de v1.9.8 el usuario quedaba bloqueado en 403 hasta
// reinicio completo. Ahora `forceRefreshGraphToken` invalida el cache y obtiene
// uno nuevo del backend Azure AD.

describe('msalInstance — forceRefresh', () => {
  const msalInstanceSrc = readFileSync(
    resolve(import.meta.dirname, '../config/msalInstance.js'),
    'utf-8'
  )

  it('getGraphToken acepta { forceRefresh }', () => {
    expect(msalInstanceSrc).toMatch(/forceRefresh\s*=\s*false/)
    expect(msalInstanceSrc).toContain('forceRefresh,')
  })

  it('exporta forceRefreshGraphToken como atajo', () => {
    expect(msalInstanceSrc).toContain('export async function forceRefreshGraphToken')
  })
})

// ── 9. accessRequestsListService: lectura/escritura de solicitudes ──────────

describe('accessRequestsListService — Lista SolicitudesAccesoMRC', () => {
  const listServiceSrc = readFileSync(
    resolve(import.meta.dirname, '../services/accessRequestsListService.js'),
    'utf-8'
  )

  it('exporta getPendingAccessRequests y markAccessRequestProcessed', () => {
    expect(listServiceSrc).toContain('export async function getPendingAccessRequests')
    expect(listServiceSrc).toContain('export async function markAccessRequestProcessed')
  })

  it('usa la lista correcta SolicitudesAccesoMRC', () => {
    expect(listServiceSrc).toContain("LIST_NAME = 'SolicitudesAccesoMRC'")
  })

  it('filtra por Status=Pendiente por defecto', () => {
    expect(listServiceSrc).toContain("'Pendiente'")
    expect(listServiceSrc).toContain('includeProcessed')
  })
})

// ── 10. spMembersAddedSync — defensa contra "e is not iterable" ─────────────
//
// Bug v1.9.8: si JSON parse devuelve null en localStorage o el cloud JSON
// tiene `added: null` (legacy), el spread aguas abajo rompe con
// "e is not iterable" (en bundle minificado el spread sobre null se reporta
// con el nombre de variable minificado, ej. "e").

describe('spMembersAddedSync — Defensa contra null/undefined', () => {
  const syncSrc = readFileSync(
    resolve(import.meta.dirname, '../services/spMembersAddedSync.js'),
    'utf-8'
  )

  it('loadAddedEmails normaliza added/manual a array si vienen null o no-array', () => {
    expect(syncSrc).toContain('if (!Array.isArray(data.added)')
    expect(syncSrc).toContain('if (!Array.isArray(data.manual)')
    expect(syncSrc).toContain('data.added.filter')
    expect(syncSrc).toContain('data.manual.filter')
  })

  it('saveAddedEmails maneja Set/objeto/undefined sin romper', () => {
    // Defensa: Array.isArray check + spread fallback
    expect(syncSrc).toMatch(/Array\.isArray\(\w+\)/)
    expect(syncSrc).toMatch(/\[\.\.\.\w+\]/)
  })

  it('exporta AUDIT_MAX_ENTRIES y firma con payload-objeto', () => {
    expect(syncSrc).toContain('export const AUDIT_MAX_ENTRIES')
    expect(syncSrc).toContain('payload.added')
    expect(syncSrc).toContain('payload.audit')
    expect(syncSrc).toContain('payload.version')
  })

  it('importa el resolver centralizado (no duplica resolveSiteId)', () => {
    expect(syncSrc).toContain("from './sharepointSiteResolver'")
    expect(syncSrc).not.toContain('async function resolveSiteId')
  })
})

// ── 11. PermisosSharePointScreen — safeArrayParse + LED + audit ─────────────

describe('PermisosSharePointScreen — Defensa + verificación SP', () => {
  it('usa safeArrayParse en useState init para evitar null', () => {
    expect(permisosScreenSrc).toContain('function safeArrayParse')
    expect(permisosScreenSrc).toContain('Array.isArray(parsed) ? parsed : []')
    expect(permisosScreenSrc).toContain('safeArrayParse(ADDED_KEY)')
    expect(permisosScreenSrc).toContain('safeArrayParse(MANUAL_KEY)')
  })

  it('integra verificación SP REST y semáforo LED', () => {
    expect(permisosScreenSrc).toContain('getMrcMembersEmails')
    expect(permisosScreenSrc).toContain('handleVerifyMembership')
    expect(permisosScreenSrc).toContain('verifiedSet')
    expect(permisosScreenSrc).toContain('ledColor')
  })

  it('valida email manual contra Azure AD antes de aceptarlo', () => {
    expect(permisosScreenSrc).toContain('userExistsInAzureAD')
    expect(permisosScreenSrc).toContain('adCheck.exists')
  })

  it('persiste audit log con cada acción admin', () => {
    expect(permisosScreenSrc).toContain('auditLog')
    expect(permisosScreenSrc).toContain("action: 'manual_add'")
    expect(permisosScreenSrc).toContain("action: 'verify_run'")
    expect(permisosScreenSrc).toContain("action: 'orphan_accept'")
  })

  it('detecta huérfanos (en grupo SP pero no en listado app)', () => {
    expect(permisosScreenSrc).toContain('orphanEmails')
    expect(permisosScreenSrc).toContain('handleAcceptOrphan')
  })
})

// ── 12. sharepointGroupService — token SP REST aislado ──────────────────────
//
// CRÍTICO: el scope SharePoint REST NO debe estar en loginRequest (rompería
// el consentimiento ya otorgado por TI a los scopes Graph existentes). Debe
// solicitarse aparte vía acquireTokenSilent con el scope específico.

describe('sharepointGroupService — SP REST aislado', () => {
  const groupSrc = readFileSync(
    resolve(import.meta.dirname, '../services/sharepointGroupService.js'),
    'utf-8'
  )
  const msalConfigSrc = readFileSync(
    resolve(import.meta.dirname, '../config/msalConfig.js'),
    'utf-8'
  )

  it('usa scope SP REST aislado (NO está en loginRequest)', () => {
    expect(msalConfigSrc).toContain('sharePointRestScopes')
    expect(msalConfigSrc).toContain('https://agrosuper.sharepoint.com/AllSites.Read')
    // Debe estar fuera del array de scopes de loginRequest
    const loginRequestMatch = msalConfigSrc.match(/loginRequest\s*=\s*\{[^}]+\}/)
    expect(loginRequestMatch).toBeTruthy()
    expect(loginRequestMatch[0]).not.toContain('sharepoint.com/AllSites')
  })

  it('exporta getMrcMembersEmails y getSharePointRestToken', () => {
    expect(groupSrc).toContain('export async function getMrcMembersEmails')
    expect(groupSrc).toContain('export async function getSharePointRestToken')
  })

  it('apunta al grupo nativo Integrantes SSO AS COMERCIAL (no al fantasma MRC Members)', () => {
    // Decisión v1.9.10 — MRC Members fue creado sin permission level
    // asignado, así que no otorga acceso real al sitio. El grupo nativo
    // "Integrantes de la SSO AS COMERCIAL" SÍ tiene Edit asignado por
    // defecto, así que es la fuente de verdad para verificación.
    expect(groupSrc).toContain("GROUP_NAME = 'Integrantes de la SSO AS COMERCIAL'")
  })

  it('NO debe usar consent_required como condición para auto-redirect', () => {
    // Hotfix v1.9.10: en tenants con user-consent deshabilitado (Agrosuper),
    // el redirect automático solo encolaba más solicitudes. Ahora se lanza
    // ConsentRequiredError y el caller decide.
    expect(groupSrc).toContain('ConsentRequiredError')
    expect(groupSrc).toContain("code = 'CONSENT_REQUIRED'")
    // Debe existir una función explícita para el redirect, no automática
    expect(groupSrc).toContain('export async function requestSharePointConsentExplicit')
  })

  it('maneja consent_required con acquireTokenRedirect (no popup)', () => {
    expect(groupSrc).toContain('consent_required')
    expect(groupSrc).toContain('acquireTokenRedirect')
    expect(groupSrc).not.toMatch(/acquireTokenPopup/)
  })

  it('parsea LoginName con formato "i:0#.f|membership|email"', () => {
    expect(groupSrc).toContain('LoginName')
    expect(groupSrc).toContain("split('|').pop()")
  })
})

// ── 13. spMembersVerifiedSync — cache compartido de verificación ────────────

describe('spMembersVerifiedSync — Cache de verificación', () => {
  const verifiedSrc = readFileSync(
    resolve(import.meta.dirname, '../services/spMembersVerifiedSync.js'),
    'utf-8'
  )

  it('usa archivo paralelo mrc-sp-members-verified.json', () => {
    expect(verifiedSrc).toContain("FILENAME = 'mrc-sp-members-verified.json'")
  })

  it('exporta loadVerified y saveVerified', () => {
    expect(verifiedSrc).toContain('export async function loadVerified')
    expect(verifiedSrc).toContain('export async function saveVerified')
  })

  it('reusa el resolver centralizado', () => {
    expect(verifiedSrc).toContain("from './sharepointSiteResolver'")
  })
})

// ── 14. graphService — userExistsInAzureAD ──────────────────────────────────

describe('graphService — Validación email contra AD', () => {
  const graphSrc = readFileSync(
    resolve(import.meta.dirname, '../services/graphService.js'),
    'utf-8'
  )

  it('exporta userExistsInAzureAD', () => {
    expect(graphSrc).toContain('export async function userExistsInAzureAD')
  })

  it('detecta cuentas deshabilitadas', () => {
    expect(graphSrc).toContain('accountEnabled')
    expect(graphSrc).toContain("'Cuenta deshabilitada en AD'")
  })

  it('reusa scope User.ReadBasic.All ya consentido', () => {
    expect(graphSrc).toContain('getPeopleToken')
  })
})

// ── 15. sharepointSiteResolver — centralización ─────────────────────────────

describe('sharepointSiteResolver — Resolver único', () => {
  const resolverSrc = readFileSync(
    resolve(import.meta.dirname, '../services/sharepointSiteResolver.js'),
    'utf-8'
  )
  const oldSyncSrc = readFileSync(
    resolve(import.meta.dirname, '../services/sharepointSync.js'),
    'utf-8'
  )

  it('exporta resolveSiteId y buildDriveFileUrl', () => {
    expect(resolverSrc).toContain('export async function resolveSiteId')
    expect(resolverSrc).toContain('export function buildDriveFileUrl')
  })

  it('sharepointSync ya no tiene su propia implementación', () => {
    expect(oldSyncSrc).toContain("from './sharepointSiteResolver'")
    expect(oldSyncSrc).not.toContain('async function resolveSiteId')
  })
})

// ── 16. Enriquecimiento de correos desde Gestión de Líderes ─────────────────

describe('sharepointData — Enriquecimiento Correo 1-8 desde líderes', () => {
  it('importa getLideres desde lideresService', () => {
    expect(sharepointDataSrc).toContain("from './lideresService'")
    expect(sharepointDataSrc).toContain('getLideres')
  })

  it('tiene función buildLideresEmailMap', () => {
    expect(sharepointDataSrc).toContain('function buildLideresEmailMap')
    expect(sharepointDataSrc).toContain('lider.cargoMRC')
    expect(sharepointDataSrc).toContain('lider.email')
  })

  it('tiene función fetchLideresEmailMap async', () => {
    expect(sharepointDataSrc).toContain('async function fetchLideresEmailMap')
    expect(sharepointDataSrc).toContain('getLideres(branch)')
  })

  it('tiene función applyLideresEmails con el mapeo correcto de cargos a columnas', () => {
    expect(sharepointDataSrc).toContain('function applyLideresEmails')
    expect(sharepointDataSrc).toContain("lideresMap['Jefe de Despacho']")
    expect(sharepointDataSrc).toContain("lideresMap['Jefe de Frigorífico']")
    expect(sharepointDataSrc).toContain("lideresMap['Jefe de Operaciones']")
    expect(sharepointDataSrc).toContain("lideresMap['Jefe Administrativo']")
    expect(sharepointDataSrc).toContain("lideresMap['Jefe de Zona']")
    expect(sharepointDataSrc).toContain("lideresMap['Subgerente de Zona']")
  })

  it('mapea Jefes de Despacho a Correo 1-3, resto de cargos a Correo 4-8', () => {
    expect(sharepointDataSrc).toContain('Correo_x0020_1 = despacho[0]')
    expect(sharepointDataSrc).toContain('Correo_x0020_2 = despacho[1]')
    expect(sharepointDataSrc).toContain('Correo_x0020_3 = despacho[2]')
    expect(sharepointDataSrc).toContain('Correo_x0020_4 = frigorifico[0]')
    expect(sharepointDataSrc).toContain('Correo_x0020_5 = operaciones[0]')
    expect(sharepointDataSrc).toContain('Correo_x0020_6 = admin[0]')
    expect(sharepointDataSrc).toContain('Correo_x0020_7 = zona[0]')
    expect(sharepointDataSrc).toContain('Correo_x0020_8 = subgerente[0]')
  })

  it('submitFormToSharePoint llama fetchLideresEmailMap y applyLideresEmails', () => {
    expect(sharepointDataSrc).toContain('fetchLideresEmailMap(branch)')
    expect(sharepointDataSrc).toContain('applyLideresEmails(fields, lideresMap)')
  })

  it('prioriza answers.Q1 sobre submission.branch para detectar la instalación', () => {
    // Q1 (Pauta), cs_instalacion (Caminata) e is_instalacion (Inspección Simple) tienen prioridad sobre submission.branch
    expect(sharepointDataSrc).toContain('submission.answers?.Q1')
    expect(sharepointDataSrc).toContain('submission.answers?.cs_instalacion')
    expect(sharepointDataSrc).toContain('submission.answers?.is_instalacion')
    expect(sharepointDataSrc).toContain('submission.branch')
  })
})
