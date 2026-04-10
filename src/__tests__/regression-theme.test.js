// ── Tests centinela: Tema claro/oscuro y CSS ────────────────────────────────
// Previene regresiones en el sistema de temas:
// - No usar prefers-color-scheme (la app controla su propio tema)
// - color-scheme debe ser siempre dark (Android no inyecte estilos claros)

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const ROOT = resolve(import.meta.dirname, '../../')
const indexCSS = readFileSync(resolve(ROOT, 'src/index.css'), 'utf-8')
const indexHTML = readFileSync(resolve(ROOT, 'index.html'), 'utf-8')

describe('Tema — CSS (data-theme)', () => {
  it('no debe usar @media (prefers-color-scheme) para temas', () => {
    // La app usa data-theme en <html>, no el tema del sistema operativo
    expect(indexCSS).not.toMatch(/@media\s*\(\s*prefers-color-scheme/)
  })

  it('debe definir variables en [data-theme="light"]', () => {
    expect(indexCSS).toContain('[data-theme="light"]')
  })
})

describe('Tema — HTML meta tags', () => {
  it('meta color-scheme debe ser dark (evita barras blancas en Android)', () => {
    // color-scheme: light haría que Android inyecte estilos claros
    expect(indexHTML).not.toMatch(/color-scheme.*light/)
  })

  it('theme_color debe ser el navy base #1B2A4A', () => {
    expect(indexHTML).toContain('#1B2A4A')
  })
})
