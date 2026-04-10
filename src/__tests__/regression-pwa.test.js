// ── Tests centinela: PWA y Service Worker ────────────────────────────────────
// Previene regresiones v1.2.8 y v1.2.9 — cambios en registerType/skipWaiting
// rompieron el banner de actualización y los logos dejaron de funcionar.

import { describe, it, expect } from 'vitest'
import { readFileSync, statSync } from 'fs'
import { resolve } from 'path'

const ROOT = resolve(import.meta.dirname, '../../')
const viteConfig = readFileSync(resolve(ROOT, 'vite.config.js'), 'utf-8')

describe('PWA — Service Worker config (regresión v1.2.9)', () => {
  it('registerType debe ser "prompt", no "autoUpdate"', () => {
    // autoUpdate + skipWaiting activa el SW inmediatamente → UpdateBanner nunca se muestra
    expect(viteConfig).toContain("registerType: 'prompt'")
    expect(viteConfig).not.toContain("registerType: 'autoUpdate'")
  })

  it('skipWaiting debe ser false en workbox', () => {
    // skipWaiting: true haría que el SW se active sin pasar por estado "waiting"
    expect(viteConfig).toContain('skipWaiting: false')
    expect(viteConfig).not.toMatch(/skipWaiting:\s*true/)
  })
})

describe('Logos — archivos PNG válidos (regresión v1.2.8)', () => {
  const logos = ['agrosuper-logo.png', 'mrc-logo.png']

  logos.forEach((logo) => {
    it(`public/${logo} existe y tiene contenido > 0 bytes`, () => {
      const filePath = resolve(ROOT, 'public', logo)
      const stat = statSync(filePath)
      expect(stat.size).toBeGreaterThan(0)
    })
  })

  it('las referencias en código usan .png, no .webp', () => {
    const srcFiles = ['src/components/layout/AppHeader.jsx', 'src/screens/SplashScreen.jsx', 'src/screens/SelectUnitScreen.jsx']
    srcFiles.forEach((file) => {
      const content = readFileSync(resolve(ROOT, file), 'utf-8')
      expect(content).not.toMatch(/agrosuper-logo.*\.webp/)
      expect(content).not.toMatch(/mrc-logo.*\.webp/)
    })
  })
})
