export const ROUTES = {
  SPLASH: '/',
  SELECT_UNIT: '/select-unit',
  UNIT_MENU: '/unit/:unitType',
  TOOLS_MENU: '/unit/:unitType/tools',
  DAILY_STATUS: '/unit/:unitType/status',
  ANALYTICS: '/unit/:unitType/analytics',
  FORM: '/form/:formType',
}

export const unitTypes = {
  SUCURSALES: 'sucursales',
  FUERZA_VENTAS: 'fuerza-de-ventas',
}

export const unitLabels = {
  sucursales: 'Sucursales',
  'fuerza-de-ventas': 'Fuerza de Ventas',
}
