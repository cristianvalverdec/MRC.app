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
    cacheLocation: 'sessionStorage',
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
