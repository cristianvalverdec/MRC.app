// ── useNotifications.js ───────────────────────────────────────────────────────
// Centraliza el ciclo de polling de notificaciones y la gestión de permisos nativos.
//
// ESTRATEGIA DE POLLING (sin servidor):
//   - Carga inmediata al montar si los datos tienen más de POLL_INTERVAL de antigüedad
//   - Intervalo de 5 min mientras la app está visible
//   - Al regresar de background (visibilitychange): carga inmediata
//   - Dev mode: usa datos mock, no hace llamadas a SharePoint
//
// Cada vez que una carga detecta notificaciones nuevas no leídas, se dispara
// `mostrarNotificacionNativa()` (si el permiso está concedido), asegurando que
// el usuario reciba la alerta del SO automáticamente — no solo al abrir la app.

import { useEffect, useRef, useCallback } from 'react'
import useUserStore from '../store/userStore'
import useNotificationStore from '../store/notificationStore'

const IS_DEV_MODE =
  !import.meta.env.VITE_AZURE_CLIENT_ID ||
  import.meta.env.VITE_AZURE_CLIENT_ID === 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'

const POLL_INTERVAL = 5 * 60 * 1000   // 5 minutos

export function useNotifications() {
  const { email, instalacionMRC, mrcNivel, isAuthenticated, role } = useUserStore()
  const { cargar, cargarMock, ultimaSync } = useNotificationStore()
  const timerRef  = useRef(null)
  const seenIdsRef = useRef(null)  // null = primera carga (no dispara alertas)

  const fetchIfStale = useCallback(async () => {
    if (!isAuthenticated) return

    if (IS_DEV_MODE) {
      // En dev mode solo cargamos los mock si no hay datos ya
      const store = useNotificationStore.getState()
      if (!store.notificaciones.length) cargarMock()
      return
    }

    if (!email) return

    const ahora    = Date.now()
    const ultimaMs = ultimaSync ? new Date(ultimaSync).getTime() : 0
    if (ahora - ultimaMs < POLL_INTERVAL) return

    await cargar(email, instalacionMRC, mrcNivel, role)

    // Tras la carga: detectar arrivals nuevos y disparar notificación nativa del SO.
    try {
      const after   = useNotificationStore.getState()
      const leidas  = new Set(after.leidasIds)
      const idsNow  = new Set(after.notificaciones.map(n => n.id))

      if (seenIdsRef.current !== null) {
        // No es la primera carga — hay baseline para comparar
        const nuevas = after.notificaciones.filter(n =>
          !seenIdsRef.current.has(n.id) && !leidas.has(n.id)
        )
        for (const n of nuevas) {
          await mostrarNotificacionNativa({
            titulo:     n.titulo,
            cuerpo:     n.cuerpo,
            accionRuta: n.accionRuta,
          })
        }
      }
      seenIdsRef.current = idsNow
    } catch (err) {
      console.warn('[useNotifications] auto-trigger nativo falló:', err)
    }
  }, [email, instalacionMRC, mrcNivel, isAuthenticated, role, ultimaSync, cargar, cargarMock])

  useEffect(() => {
    if (!isAuthenticated) return

    fetchIfStale()

    timerRef.current = setInterval(fetchIfStale, POLL_INTERVAL)

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') fetchIfStale()
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      clearInterval(timerRef.current)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [isAuthenticated, fetchIfStale])
}

// ── Notificaciones nativas del OS ─────────────────────────────────────────────

/**
 * Solicita permiso para notificaciones nativas.
 * SOLO llamar cuando el usuario lo solicita explícitamente — nunca al montar.
 * Retorna: 'granted' | 'denied' | 'default' | 'unsupported'
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  return Notification.requestPermission()
}

// ── Generación del ícono 👌 como PNG data URL (cacheado) ───────────────────────
// El PWA-icon monocromizado por Android se veía como un cuadrado blanco en la barra
// de estado. Renderizar el emoji característico de MRC 👌 a PNG resuelve el problema:
//   - En el cuerpo de la notificación (icon) → se ve a color completo
//   - En el badge de la barra de estado → Android convierte a silueta monocromática
//     pero la forma del emoji (mano OK) se mantiene reconocible.
let _emojiIconCache = null
function getEmojiIconUrl() {
  if (_emojiIconCache) return _emojiIconCache
  if (typeof document === 'undefined') return null
  try {
    const SIZE = 192
    const canvas = document.createElement('canvas')
    canvas.width  = SIZE
    canvas.height = SIZE
    const ctx = canvas.getContext('2d')
    ctx.textAlign    = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `${Math.round(SIZE * 0.78)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji","Android Emoji",sans-serif`
    // Ligero offset vertical para centrado óptico (los emojis suelen rendear un poco altos)
    ctx.fillText('👌', SIZE / 2, SIZE / 2 + 8)
    _emojiIconCache = canvas.toDataURL('image/png')
    return _emojiIconCache
  } catch (err) {
    console.warn('[useNotifications] no se pudo generar ícono emoji:', err)
    return null
  }
}

/**
 * Envía una notificación nativa al OS si el permiso está concedido.
 * Con PWA instalada: aparece en el tray del sistema operativo, incluso con la app cerrada.
 * Sin PWA: aparece como notificación del navegador (Chrome/Edge la soportan).
 *
 * NO modifica la configuración del SW (registerType/prompt y el UpdateBanner siguen intactos).
 * Usa showNotification() del SW si está activo; si no, usa new Notification() como fallback.
 *
 * Campos de ícono:
 *   - `icon` se omite intencionalmente: iOS/Android usan el ícono de la PWA instalada
 *     (el thumbnail del manifest, que ya aparece a la izquierda de la notificación).
 *     Si se incluye `icon`, iOS lo renderiza como una imagen adicional a la derecha.
 *   - `badge` lleva el emoji 👌 generado vía canvas: Android lo usa como ícono
 *     monocromático en la barra de estado (reemplaza el cuadrado blanco).
 */
export async function mostrarNotificacionNativa({ titulo, cuerpo, accionRuta }) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return

  const emojiUrl = getEmojiIconUrl()
  const fallback = `${import.meta.env.BASE_URL}icons/icon-192.png`
  const badgeUrl = emojiUrl || fallback

  const options = {
    body:      cuerpo,
    // icon: omitido — el OS usa el ícono de la PWA (manifest) automáticamente
    badge:     badgeUrl,   // Android: silueta monocromática en barra de estado
    tag:       'mrc-notif',
    renotify:  false,
    data:      { accionRuta },
  }

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready
      if (reg && reg.active) {
        await reg.showNotification(titulo, options)
        return
      }
    }
  } catch {
    // fallback a Notification directa si el SW no está disponible
  }

  new Notification(titulo, options)
}
