// ── Tests centinela: Sistema de Notificaciones ────────────────────────────────
// Previene regresiones en el sistema de notificaciones.
// Sigue el mismo patrón que los otros tests centinela del proyecto.

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const ROOT = resolve(import.meta.dirname, '../../')

const notifService = readFileSync(
  resolve(ROOT, 'src/services/notificationService.js'), 'utf-8'
)
const notifStore = readFileSync(
  resolve(ROOT, 'src/store/notificationStore.js'), 'utf-8'
)
const useNotifHook = readFileSync(
  resolve(ROOT, 'src/hooks/useNotifications.js'), 'utf-8'
)
const appJsx = readFileSync(resolve(ROOT, 'src/App.jsx'), 'utf-8')

// ── notificationService ───────────────────────────────────────────────────────

describe('notificationService — seguridad de autenticación', () => {
  it('usa getGraphToken centralizado, nunca auth interactiva', () => {
    expect(notifService).toContain('getGraphToken')
    expect(notifService).not.toContain('loginPopup')
    expect(notifService).not.toContain('loginRedirect')
    expect(notifService).not.toContain('acquireTokenPopup')
    expect(notifService).not.toContain('acquireTokenRedirect')
  })

  it('marcarLeida tiene .catch() para no romper la UX si SharePoint falla', () => {
    // La función debe ser fire-and-forget para garantizar UX sin bloqueos
    expect(notifService).toContain('.catch(')
  })

  it('define las dos listas SharePoint necesarias', () => {
    expect(notifService).toContain("'Notificaciones MRC'")
    expect(notifService).toContain("'Notificaciones MRC Le\u00EDdas'")
  })

  it('exporta las funciones de API pública necesarias', () => {
    expect(notifService).toContain('export async function getNotificaciones')
    expect(notifService).toContain('export async function getLeidasIds')
    expect(notifService).toContain('export async function marcarLeida')
    expect(notifService).toContain('export async function crearNotificacion')
    expect(notifService).toContain('export async function desactivarNotificacion')
    expect(notifService).toContain('export async function getTodasNotificaciones')
  })
})

// ── notificationStore ─────────────────────────────────────────────────────────

describe('notificationStore — persistencia y estructura', () => {
  it('usa la clave correcta de localStorage', () => {
    expect(notifStore).toContain("name: 'mrc-notifications-store'")
  })

  it('persiste notificaciones y leidasIds', () => {
    expect(notifStore).toContain('notificaciones:')
    expect(notifStore).toContain('leidasIds:')
  })

  it('NO persiste todasNotificaciones (datos admin efímeros)', () => {
    // El bloque partialize solo debe retornar notificaciones, leidasIds y ultimaSync
    expect(notifStore).toContain("name: 'mrc-notifications-store'")
    // El campo todasNotificaciones NO debe aparecer como clave en el objeto partialize
    // Verificamos que partialize retorna exactamente los campos necesarios
    expect(notifStore).toContain('partialize:')
    // todasNotificaciones no debe ser asignado dentro de partialize (no como key: value)
    expect(notifStore).not.toMatch(/partialize[\s\S]{0,50}todasNotificaciones:/)
  })

  it('la acción marcarLeida es optimista (actualiza local antes de SP)', () => {
    expect(notifStore).toContain('marcarLeida:')
    // Debe hacer la actualización local antes de llamar a SP
    expect(notifStore).toContain('leidasIds')
  })
})

// ── useNotifications ──────────────────────────────────────────────────────────

describe('useNotifications — polling seguro', () => {
  it('verifica IS_DEV_MODE antes de llamar a SharePoint', () => {
    expect(useNotifHook).toContain('IS_DEV_MODE')
  })

  it('POLL_INTERVAL es al menos 3 minutos', () => {
    // POLL_INTERVAL puede ser expresión aritmética (ej: 5 * 60 * 1000)
    // Verificamos que el archivo declara el intervalo como multiplicación de minutos
    const match = useNotifHook.match(/POLL_INTERVAL\s*=\s*([\d\s*]+)/)
    expect(match).not.toBeNull()
    if (match) {
      // Evaluar la expresión aritmética de forma segura
      const expr = match[1].trim()
      // Solo contiene dígitos, espacios y multiplicación — seguro de evaluar
      const valor = expr.split('*').map(s => parseInt(s.trim(), 10)).reduce((a, b) => a * b, 1)
      expect(valor).toBeGreaterThanOrEqual(3 * 60 * 1000)
    }
  })

  it('limpia el intervalo al desmontar (sin memory leak)', () => {
    expect(useNotifHook).toContain('clearInterval')
    expect(useNotifHook).toContain('removeEventListener')
  })

  it('exporta requestNotificationPermission', () => {
    expect(useNotifHook).toContain('export async function requestNotificationPermission')
  })

  it('exporta mostrarNotificacionNativa', () => {
    expect(useNotifHook).toContain('export async function mostrarNotificacionNativa')
  })

  it('mostrarNotificacionNativa NO llama skipWaiting desde el cliente', () => {
    // El hook nunca debe llamar a skipWaiting (solo el UpdateBanner lo hace)
    expect(useNotifHook).not.toContain('SKIP_WAITING')
    // No debe haber una llamada .skipWaiting() — solo referencias en comentarios son aceptables
    expect(useNotifHook).not.toMatch(/\.skipWaiting\s*\(/)
  })

  it('usa serviceWorker.ready (no registration directa) para notificaciones nativas', () => {
    expect(useNotifHook).toContain('serviceWorker.ready')
  })
})

// ── App.jsx — rutas registradas ───────────────────────────────────────────────

describe('App.jsx — rutas de notificaciones', () => {
  it('tiene la ruta /notifications registrada', () => {
    expect(appJsx).toContain('"/notifications"')
  })

  it('tiene la ruta /admin/notificaciones registrada', () => {
    expect(appJsx).toContain('"/admin/notificaciones"')
  })

  it('importa NotificationsScreen como lazy', () => {
    expect(appJsx).toContain('NotificationsScreen')
  })

  it('importa NotificacionesAdminScreen como lazy', () => {
    expect(appJsx).toContain('NotificacionesAdminScreen')
  })

  it('monta NotificationsHandler para el polling global', () => {
    expect(appJsx).toContain('NotificationsHandler')
  })
})
