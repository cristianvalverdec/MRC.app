// ── Tests centinela: Autenticación MSAL ──────────────────────────────────────
// Previene regresión v1.2.6 — cambiar cacheLocation a sessionStorage
// causaba que los usuarios perdieran la sesión al cerrar la PWA.

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const msalConfig = readFileSync(
  resolve(import.meta.dirname, '../config/msalConfig.js'),
  'utf-8'
)

describe('MSAL — Configuración de autenticación', () => {
  it('cacheLocation debe ser localStorage, no sessionStorage', () => {
    // sessionStorage se borra al cerrar la PWA → re-login forzoso
    expect(msalConfig).toContain("cacheLocation: 'localStorage'")
    expect(msalConfig).not.toContain("cacheLocation: 'sessionStorage'")
  })

  it('debe tener los scopes mínimos requeridos', () => {
    expect(msalConfig).toContain('User.Read')
    expect(msalConfig).toContain('Sites.ReadWrite.All')
    expect(msalConfig).toContain('Files.ReadWrite.All')
    expect(msalConfig).toContain('User.ReadBasic.All')
  })
})
