export const ROUTES = {
  SPLASH: '/',
  SELECT_UNIT: '/select-unit',
  UNIT_MENU: '/unit/:unitType',
  TOOLS_MENU: '/unit/:unitType/tools',
  DAILY_STATUS: '/unit/:unitType/status',
  ANALYTICS: '/unit/:unitType/analytics',
  FORM: '/form/:formType',
  // Directorio de líderes (lectura — nivel ≥ 2)
  LIDERES: '/unit/:unitType/lideres',
  // Admin — gestión de instalaciones y líderes
  ADMIN_LIDERES: '/admin/lideres',
  ADMIN_INSTALACION: '/admin/lideres/:instalacion',
  // Admin — panel de conexiones SharePoint
  ADMIN_CONNECTIONS: '/admin/sharepoint-connections',
  // Gestión de Permisos de Trabajo — Contratistas
  CONTRATISTAS: '/unit/:unitType/contratistas',
  // Buzón de notificaciones del usuario
  NOTIFICATIONS: '/notifications',
  // Admin — gestión de notificaciones
  ADMIN_NOTIFICACIONES: '/admin/notificaciones',
  // Admin — panel de validación de documentos y registros
  ADMIN_VALIDACIONES: '/admin/validaciones',
  // Usuario — historial de documentos enviados con estado de validación
  MIS_DOCUMENTOS: '/unit/:unitType/mis-documentos',
}

export const unitTypes = {
  SUCURSALES: 'sucursales',
  FUERZA_VENTAS: 'fuerza-de-ventas',
}

export const unitLabels = {
  sucursales: 'Sucursales',
  'fuerza-de-ventas': 'Fuerza de Ventas',
}
