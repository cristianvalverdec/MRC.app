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

  it('implementa cooldown de 24 horas', () => {
    expect(accessRequestSrc).toContain('COOLDOWN_MS')
    expect(accessRequestSrc).toContain('24 * 60 * 60 * 1000')
    expect(accessRequestSrc).toContain('isRequestOnCooldown')
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
})
