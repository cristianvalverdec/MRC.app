// ── Servicio de Difusiones SSO ────────────────────────────────────────────
//
// submitDifusion({ instalacion, equipo, turno, fecha, participantes, files })
//   → Sube archivos al drive de SharePoint
//   → Crea ítem en la lista "Difusiones SSO MRC"
//
// Variables de entorno requeridas (producción):
//   VITE_SHAREPOINT_SITE_URL    — URL del sitio SharePoint
//   VITE_SP_DIFUSIONES_LIST_ID  — ID interno de la lista "Difusiones SSO MRC"
//                                 (GET /v1.0/sites/{id}/lists para obtenerlo)
//
// Variables de entorno opcionales (URLs de carpetas para descarga):
//   VITE_SP_BIBLIOTECA_URL      — Carpeta biblioteca anual
//   VITE_SP_SEMANA_OP           — Carpeta semana actual · Operaciones
//   VITE_SP_SEMANA_ADM          — Carpeta semana actual · Administración
//   VITE_SP_SEMANA_DIST         — Carpeta semana actual · Distribuidoras
//
// Columnas esperadas en la lista SharePoint (nombres internos):
//   Title           — Generado automáticamente
//   Instalacion     — Texto
//   Equipo          — Texto (Operaciones | Administración | Distribuidoras)
//   Turno           — Texto (Mañana | Tarde | Noche)
//   FechaCharla     — Fecha (ISO)
//   NroParticipantes — Número
//   ArchivosAdjuntos — Texto multilínea (URLs separadas por \n)

import { msalInstance } from '../config/msalInstance'
import { graphScopes } from '../config/msalConfig'

const IS_DEV_MODE =
  !import.meta.env.VITE_AZURE_CLIENT_ID ||
  import.meta.env.VITE_AZURE_CLIENT_ID === 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'

async function getGraphToken() {
  const accounts = msalInstance.getAllAccounts()
  if (!accounts.length) throw new Error('Sin cuenta autenticada')
  const result = await msalInstance.acquireTokenSilent({
    ...graphScopes,
    account: accounts[0],
  })
  return result.accessToken
}

function getSiteBase() {
  const siteUrl = import.meta.env.VITE_SHAREPOINT_SITE_URL
  if (!siteUrl) throw new Error('VITE_SHAREPOINT_SITE_URL no configurado')
  const url = new URL(siteUrl)
  return `https://graph.microsoft.com/v1.0/sites/${url.hostname}:${url.pathname}`
}

async function uploadFileToDrive(token, file, folder) {
  const siteBase = getSiteBase()
  const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._\-]/g, '_')}`
  const endpoint = `${siteBase}/drive/root:${folder}/${safeName}:/content`
  const response = await fetch(endpoint, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': file.type || 'application/octet-stream',
    },
    body: file,
  })
  if (!response.ok) throw new Error(`Error al subir archivo: ${response.status}`)
  const data = await response.json()
  return { name: file.name, url: data.webUrl }
}

async function createListItem(token, fields) {
  const siteBase = getSiteBase()
  const listId = import.meta.env.VITE_SP_DIFUSIONES_LIST_ID
  if (!listId) throw new Error('VITE_SP_DIFUSIONES_LIST_ID no configurado')
  const response = await fetch(`${siteBase}/lists/${listId}/items`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fields }),
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Error al crear registro: ${response.status} — ${text}`)
  }
  return await response.json()
}

export async function submitDifusion({ instalacion, equipo, turno, fecha, participantes, files }) {
  if (IS_DEV_MODE) {
    console.info('[MRC Difusiones] Modo dev — registro simulado', {
      instalacion, equipo, turno, fecha, participantes,
      archivos: files.map((f) => f.name),
    })
    await new Promise((r) => setTimeout(r, 1800))
    return { success: true, dev: true }
  }

  try {
    const token = await getGraphToken()

    // Subir archivos de evidencia
    const folder = `/mrc-app/difusiones/evidencias/${fecha.slice(0, 7)}`
    const uploadedFiles = []
    for (const file of files) {
      const result = await uploadFileToDrive(token, file, folder)
      uploadedFiles.push(result)
    }

    // Crear ítem en lista SharePoint
    await createListItem(token, {
      Title: `Difusión SSO — ${instalacion} — ${equipo} — ${fecha}`,
      Instalacion: instalacion,
      Equipo: equipo,
      Turno: turno,
      FechaCharla: fecha,
      NroParticipantes: parseInt(participantes, 10),
      ArchivosAdjuntos: uploadedFiles.map((f) => f.url).join('\n'),
    })

    console.info('[MRC Difusiones] Charla registrada exitosamente ✓')
    return { success: true }
  } catch (err) {
    console.warn('[MRC Difusiones] Error al registrar:', err.message)
    throw err
  }
}
