// ── Tests centinela: rol admin + sync de formularios (v1.9.5) ──────────────
// Previene regresiones reportadas por el super-admin:
//   Bug A: cambios en formularios hechos por admin no se propagan a no-admins.
//   Bug B: emails recién agregados a la lista "Administradores MRC" no
//          actualizan su rol en la app (mismatch entre el email escrito y el
//          mail/UPN que Azure AD reporta para esa cuenta).

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const adminServiceSrc = readFileSync(
  resolve(import.meta.dirname, '../services/adminService.js'),
  'utf-8'
)

const sharepointSyncSrc = readFileSync(
  resolve(import.meta.dirname, '../services/sharepointSync.js'),
  'utf-8'
)

const formEditorStoreSrc = readFileSync(
  resolve(import.meta.dirname, '../store/formEditorStore.js'),
  'utf-8'
)

const useBootstrapSrc = readFileSync(
  resolve(import.meta.dirname, '../hooks/useBootstrap.js'),
  'utf-8'
)

const appSrc = readFileSync(
  resolve(import.meta.dirname, '../App.jsx'),
  'utf-8'
)

describe('adminService — isAdmin tolerante (bug B)', () => {
  it('isAdmin acepta un arreglo de emails y normaliza a minúsculas', () => {
    expect(adminServiceSrc).toMatch(/Array\.isArray\(emails\)/)
    expect(adminServiceSrc).toMatch(/toLowerCase\(\)/)
  })

  it('exporta refreshAdmins() para forzar re-consulta de la lista', () => {
    expect(adminServiceSrc).toMatch(/export async function refreshAdmins/)
    expect(adminServiceSrc).toMatch(/cachedAdmins = null/)
  })

  it('no silencia errores de SharePoint en isAdmin (deja propagar)', () => {
    // La versión anterior envolvía todo en try/catch y retornaba false en error.
    // Ahora el error se propaga para que el caller decida (preservar rol previo
    // en lugar de degradar silenciosamente).
    const isAdminBlock = adminServiceSrc.match(/export async function isAdmin[\s\S]*?^}/m)?.[0] || ''
    expect(isAdminBlock).not.toMatch(/catch\s*\{\s*return false\s*\}/)
  })
})

describe('sharepointSync — loadFormsFromSharePoint clasifica errores (bug A)', () => {
  it('distingue 401/403 (permisos) del resto de errores con mensaje accionable', () => {
    expect(sharepointSyncSrc).toMatch(/401|403/)
    expect(sharepointSyncSrc).toMatch(/Sin permiso para leer la configuración/)
  })

  it('404 devuelve null (primera vez, no es error)', () => {
    expect(sharepointSyncSrc).toMatch(/response\.status === 404/)
    expect(sharepointSyncSrc).toMatch(/primera vez/)
  })

  it('ya no atrapa todos los errores silenciosamente (fire-and-forget prohibido)', () => {
    const loadBlock = sharepointSyncSrc.match(/export async function loadFormsFromSharePoint[\s\S]*?^}/m)?.[0] || ''
    // No debe haber un try/catch final que retorne null genérico
    expect(loadBlock).not.toMatch(/catch\s*\([^)]*\)\s*\{[^}]*return null/)
  })
})

describe('formEditorStore — pullStatus independiente del push (regla 5e)', () => {
  it('expone pullStatus, lastPullAt y lastPullError en el estado', () => {
    expect(formEditorStoreSrc).toMatch(/pullStatus:\s*'idle'/)
    expect(formEditorStoreSrc).toMatch(/lastPullAt:\s*null/)
    expect(formEditorStoreSrc).toMatch(/lastPullError:\s*null/)
  })

  it('pullFromCloud setea pullStatus error y guarda lastPullError cuando falla', () => {
    const pullBlock = formEditorStoreSrc.match(/pullFromCloud:\s*async[\s\S]*?^\s{6}\}/m)?.[0] || ''
    expect(pullBlock).toMatch(/pullStatus:\s*'error'/)
    expect(pullBlock).toMatch(/lastPullError/)
  })

  it('expone retryPull para reintento manual desde UI', () => {
    expect(formEditorStoreSrc).toMatch(/retryPull:/)
  })
})

describe('useBootstrap — matching de rol tolerante y preservación de rol previo', () => {
  it('pasa múltiples identidades (mail, UPN, username) a isAdmin', () => {
    expect(useBootstrapSrc).toMatch(/profile\.userPrincipalName/)
    expect(useBootstrapSrc).toMatch(/accounts\[0\]\?\.username/)
    expect(useBootstrapSrc).toMatch(/isAdmin\(identities\)/)
  })

  it('preserva el rol previo si isAdmin lanza (no degrada silenciosamente a user)', () => {
    expect(useBootstrapSrc).toMatch(/previousRole/)
    expect(useBootstrapSrc).toMatch(/preservando rol previo/)
  })
})

describe('App.jsx — ResumeHandler re-evalúa rol al volver del background', () => {
  it('importa refreshAdmins e isAdmin', () => {
    expect(appSrc).toMatch(/import\s*\{\s*isAdmin,\s*refreshAdmins\s*\}\s*from\s*'\.\/services\/adminService'/)
  })

  it('al volver visible la pestaña, llama refreshAdmins + isAdmin + pullFromCloud', () => {
    const resumeBlock = appSrc.match(/function ResumeHandler[\s\S]*?return null\s*\n\}/m)?.[0] || ''
    expect(resumeBlock).toMatch(/refreshAdmins/)
    expect(resumeBlock).toMatch(/isAdmin/)
    expect(resumeBlock).toMatch(/pullFromCloud/)
  })
})
