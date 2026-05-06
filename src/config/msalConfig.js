// ── Modo mantenimiento ────────────────────────────────────────────────────
// Cuando es true, bloquea toda autenticación Azure AD y muestra pantalla
// de mantenimiento. Cambiar a false para rehabilitar el acceso.
export const MAINTENANCE_MODE = true

export const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID || 'YOUR_CLIENT_ID',
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID || 'YOUR_TENANT_ID'}`,
    // Producción: origin + base path para coincidir con Azure AD (/MRC.app/)
    // Desarrollo: origin + "/" para coincidir con localhost registrado
    redirectUri: import.meta.env.PROD
      ? window.location.origin + import.meta.env.BASE_URL
      : window.location.origin + '/',
  },
  cache: {
    // localStorage persiste el token al cerrar/reabrir la PWA
    // sessionStorage se borraría en cada sesión nueva forzando re-login
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: false,
  },
}

export const graphScopes = {
  scopes: ['User.Read', 'Sites.ReadWrite.All', 'Files.ReadWrite.All'],
}

// Scopes específicos para búsqueda de personas en Azure AD (People Picker)
export const peopleSearchScopes = {
  scopes: ['User.ReadBasic.All'],
}

export const loginRequest = {
  scopes: ['User.Read', 'User.ReadBasic.All', 'Sites.ReadWrite.All', 'Files.ReadWrite.All'],
}

// ── Scope para SharePoint REST API (audience distinto a Graph) ─────────────
//
// IMPORTANTE: este scope NO está en `loginRequest`. Se solicita aparte vía
// `acquireTokenSilent({ scopes: sharePointRestScopes.scopes })` solo cuando
// la app necesita consultar el grupo MRC Members directamente en SP REST
// (Graph no expone miembros de SharePoint Site Groups, solo de M365 Groups).
//
// Mantenerlo aislado es CRÍTICO para no romper el consentimiento ya
// otorgado por TI a los scopes Graph existentes. La primera vez que un
// admin presione "Verificar permisos en SharePoint" Azure AD pedirá
// consentimiento incremental UNA SOLA VEZ. Usuarios normales nunca verán
// este flujo porque jamás se acquire este token desde su sesión.
//
// Si TI prefiere pre-aprobar el scope tenant-wide para evitar consentimiento
// individual, puede hacerlo en el portal Azure AD → App registrations →
// API permissions → "Add SharePoint AllSites.Read (delegated)" + "Grant admin consent".
export const sharePointRestScopes = {
  scopes: ['https://agrosuper.sharepoint.com/AllSites.Read'],
}
