// ── Servicio de Difusiones SSO ────────────────────────────────────────────
//
// submitDifusion({ instalacion, equipo, turno, fecha, participantes, files })
//   → Sube archivos al drive de SharePoint bajo /MRC-Fotos/difusiones/{YYYY-MM}/
//   → Crea ítem en la lista "Difusiones SSO MRC"
//
// Variables de entorno requeridas (producción):
//   VITE_SHAREPOINT_SITE_URL    — URL del sitio SharePoint
//   VITE_SP_DIFUSIONES_LIST_ID  — ID interno de la lista "Difusiones SSO MRC"
//
// Columnas esperadas en la lista SharePoint (nombres internos):
//   Title            — Generado automáticamente
//   Instalacion      — Texto
//   Equipo           — Texto (ej: "Sucursal - Operaciones")
//   Turno            — Texto (Mañana | Tarde | Noche | vacío)
//   FechaCharla      — Fecha (ISO)
//   NroParticipantes — Número
//   ArchivosAdjuntos — Texto multilínea (webUrls de SharePoint separadas por \n)

import { getGraphToken } from '../config/msalInstance'
import { resolveSiteId } from './sharepointSiteResolver'
import { createValidacion } from './validacionService'

const IS_DEV_MODE =
  !import.meta.env.VITE_AZURE_CLIENT_ID ||
  import.meta.env.VITE_AZURE_CLIENT_ID === 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'

// Sube un archivo al drive del sitio y devuelve su webUrl de SharePoint.
// Ruta: /MRC-Fotos/difusiones/{YYYY-MM}/{timestamp}-{safename}
// Idéntica al patrón usado en sharepointData.js (uploadPhotoToDrive).
async function uploadFileToDrive(siteId, file, yearMonth) {
  const ts       = Date.now()
  const safeName = `${ts}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
  const token    = await getGraphToken()
  const url      = `https://graph.microsoft.com/v1.0/sites/${siteId}/drive/root:/MRC-Fotos/difusiones/${yearMonth}/${safeName}:/content`
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': file.type || 'application/octet-stream',
    },
    body: file,
  })
  if (!response.ok) throw new Error(`Error al subir archivo: ${response.status}`)
  const data = await response.json()
  console.info(`[MRC Difusiones] Archivo ${safeName} subido OK →`, data.webUrl)
  return data.webUrl || null
}

async function createListItem(siteId, token, fields) {
  const listId = import.meta.env.VITE_SP_DIFUSIONES_LIST_ID
  if (!listId) throw new Error('VITE_SP_DIFUSIONES_LIST_ID no configurado')
  const response = await fetch(
    `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listId}/items`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fields }),
    }
  )
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Error al crear registro: ${response.status} — ${text}`)
  }
  return await response.json()
}

/**
 * Registra una charla de difusión SSO en SharePoint.
 *
 * @param {object} payload
 * @param {string}   payload.instalacion    Nombre de la instalación
 * @param {string}   payload.equipo         Ej: 'Sucursal - Operaciones' | 'Distribuidora - Ventas'
 * @param {string}   payload.turno          'Mañana' | 'Tarde' | 'Noche' | '' (vacío si no aplica)
 * @param {string}   payload.fecha          Fecha ISO (YYYY-MM-DD)
 * @param {string}   payload.participantes  Número de participantes
 * @param {File[]}   payload.files          Archivos de evidencia (máx. 5)
 * @param {string}   [payload.userEmail]    Email del usuario (para validación)
 */
export async function submitDifusion({ instalacion, equipo, turno, fecha, participantes, files, userEmail = '' }) {
  if (IS_DEV_MODE) {
    console.info('[MRC Difusiones] Modo dev — registro simulado', {
      instalacion, equipo, turno, fecha, participantes,
      archivos: files.map((f) => f.name),
    })
    await new Promise((r) => setTimeout(r, 1800))
    return { success: true, dev: true }
  }

  try {
    const token    = await getGraphToken()
    const siteId   = await resolveSiteId(token)
    const yearMonth = fecha.slice(0, 7)   // YYYY-MM

    // Subir archivos de evidencia al drive
    const uploadedUrls = []
    for (const file of files) {
      const webUrl = await uploadFileToDrive(siteId, file, yearMonth)
      if (webUrl) uploadedUrls.push(webUrl)
    }

    const archivosUrl = uploadedUrls.join('\n')

    // Crear ítem en lista SharePoint
    const listItem = await createListItem(siteId, token, {
      Title:            `Difusión SSO — ${instalacion} — ${equipo} — ${fecha}`,
      Instalacion:      instalacion,
      Equipo:           equipo,
      Turno:            turno || '',
      FechaCharla:      fecha,
      NroParticipantes: parseInt(participantes, 10),
      ArchivosAdjuntos: archivosUrl,
    })

    // Registro de validación pendiente (fire-and-forget)
    const nombreDoc = `Difusión SSO — ${instalacion} — ${equipo} — ${new Date(fecha).toLocaleDateString('es-CL')}`
    createValidacion({
      tipoRegistro:      'difusion',
      referenciaId:      listItem?.id || 0,
      referenciaLista:   import.meta.env.VITE_SP_DIFUSIONES_LIST_ID || '',
      nombreDocumento:   nombreDoc,
      instalacionOrigen: instalacion,
      subidoPor:         userEmail,
      archivoUrl:        archivosUrl,
    }).catch(err =>
      console.warn('[MRC Difusiones] createValidacion falló (no crítico):', err.message)
    )

    console.info('[MRC Difusiones] Charla registrada exitosamente ✓')
    return { success: true }
  } catch (err) {
    console.warn('[MRC Difusiones] Error al registrar:', err.message)
    throw err
  }
}
