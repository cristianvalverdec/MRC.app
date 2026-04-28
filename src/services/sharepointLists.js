// ── Catálogo único de listas SharePoint ──────────────────────────────────
//
// Fuente de verdad para los GUIDs de listas SharePoint usadas por la app.
// Consumido por:
//   - sharepointData.js          → resolver formType → listId
//   - SharePointConnectionsScreen → render del panel de conexiones
//   - FormEditorListScreen / FormEditorDetailScreen → selector de lista
//
// Para agregar una lista nueva: añadir entrada aquí y, si requiere mapper
// específico, agregarlo en sharepointData.js. Los formularios custom pueden
// reutilizar cualquier GUID listado aquí sin requerir mapper propio
// (mapGenericFromOverride arma payload desde los spColumn declarados en el
// override de cada pregunta).

export const SHAREPOINT_LISTS = [
  {
    key: 'reglasOroSucursales',
    label: 'Reglas de Oro — Sucursales',
    guid: 'd123a245-0aeb-4f51-9b20-693639c963b6',
    defaultFormType: 'pauta-verificacion-reglas-oro',
    unit: 'Sucursales',
  },
  {
    key: 'reglasOroVentas',
    label: 'Reglas de Oro — Ventas',
    guid: '5edaee5a-2ee5-4fb4-a5aa-18f8068a1b25',
    defaultFormType: 'observacion-conductual',
    unit: 'Fuerza de Ventas',
  },
  {
    key: 'caminataSeguridad',
    label: 'Caminata de Seguridad',
    guid: '04730b19-b235-4eef-b487-0234326fd4ac',
    defaultFormType: 'caminata-seguridad',
    unit: 'Sucursales',
  },
  {
    key: 'inspeccionSimple',
    label: 'Inspección Simple',
    guid: 'de766ded-0d14-4e50-8254-710c533a2106',
    defaultFormType: 'inspeccion-simple',
    unit: 'Sucursales',
  },
  {
    key: 'difusionesSso',
    label: 'Difusiones SSO MRC',
    guid: '2097a931-5615-472b-afc7-b2d2fc6fe805',
    defaultFormType: 'difusiones-sso',
    unit: 'Ambas',
  },
  {
    key: 'cierreCondiciones',
    label: 'Maestro de Cierre Condiciones',
    guid: '00b25970-34f1-4026-9cc8-0df3f59c3383',
    defaultFormType: 'cierre-condiciones',
    unit: 'Sucursales',
  },
  {
    key: 'permisoTrabajoContratista',
    label: 'Permiso de Trabajo — Contratistas',
    guid: '',  // pendiente
    defaultFormType: 'permiso-trabajo-contratista',
    unit: 'Sucursales',
  },
  {
    key: 'cierreTrabajoContratista',
    label: 'Cierre de Trabajo — Contratistas',
    guid: '',  // pendiente
    defaultFormType: 'cierre-trabajo-contratista',
    unit: 'Sucursales',
  },
]

// Diccionario por key — para imports tipo SHAREPOINT_LIST_BY_KEY.reglasOroSucursales.guid
export const SHAREPOINT_LIST_BY_KEY = Object.fromEntries(
  SHAREPOINT_LISTS.map((l) => [l.key, l])
)

// Diccionario por GUID — para resolver "qué lista es este GUID"
export const SHAREPOINT_LIST_BY_GUID = Object.fromEntries(
  SHAREPOINT_LISTS.filter((l) => l.guid).map((l) => [l.guid.toLowerCase(), l])
)

// Resuelve un GUID a su entrada del catálogo (case-insensitive).
// Devuelve null si el GUID no es ninguno conocido (ej. lista creada ad-hoc por el admin).
export function findListByGuid(guid) {
  if (!guid) return null
  return SHAREPOINT_LIST_BY_GUID[String(guid).toLowerCase()] || null
}

// Devuelve listas filtradas por unidad (para sugerir al admin solo listas relevantes).
// unit: 'Sucursales' | 'Fuerza de Ventas' | 'Ambas'. Las marcadas 'Ambas' siempre aparecen.
export function listsForUnit(unit) {
  return SHAREPOINT_LISTS.filter((l) => l.unit === unit || l.unit === 'Ambas' || unit === 'Ambas')
}
