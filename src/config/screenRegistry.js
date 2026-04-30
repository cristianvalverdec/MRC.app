export const SCREEN_REGISTRY = [
  // ── Menu Principal (UnitMenuScreen) ─────────────────────────────────
  { key: 'tools',     label: 'Herramientas Gestión Preventiva', menu: 'principal' },
  { key: 'status',    label: 'Estatus Diario del Programa',     menu: 'principal' },
  { key: 'analytics', label: 'Analítica del Programa',          menu: 'principal' },
  { key: 'goals',     label: 'Metas del Programa',              menu: 'principal' },
  { key: 'cphs',      label: 'Gestión de CPHS',                 menu: 'principal' },
  { key: 'salud',     label: 'Gestión Salud',                   menu: 'principal' },

  // ── Herramientas Preventivas (ToolsMenuScreen) ──────────────────────
  { key: 'pauta-verificacion-reglas-oro', label: 'Pauta de Verificación',          menu: 'herramientas' },
  { key: 'caminata-seguridad',           label: 'Caminata de Seguridad',          menu: 'herramientas' },
  { key: 'inspeccion-simple',            label: 'Inspección Simple',              menu: 'herramientas' },
  { key: 'difusiones-sso',              label: 'Difusiones SSO',                  menu: 'herramientas' },
  { key: 'cierre-condiciones',          label: 'Cierre de Condiciones',           menu: 'herramientas' },
  { key: 'monitor-fatiga',              label: 'Monitor de Fatiga Operacional',   menu: 'herramientas' },
  { key: 'contratistas',                label: 'Permiso de Trabajo',              menu: 'herramientas' },
  { key: 'observacion-conductual',      label: 'Observación Conductual',          menu: 'herramientas' },
  { key: 'inspeccion-planificada',      label: 'Inspección Planificada',          menu: 'herramientas' },
  { key: 'lideres',                     label: 'Directorio de Líderes',           menu: 'herramientas' },
]

export const SCREEN_REGISTRY_BY_KEY = Object.fromEntries(
  SCREEN_REGISTRY.map((s) => [s.key, s])
)
