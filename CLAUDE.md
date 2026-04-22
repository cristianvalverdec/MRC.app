# CLAUDE.md — Misión Riesgo Cero (MRC)

> Contexto completo del proyecto. Se carga automáticamente en cada conversación.
> Actualizar este archivo cada vez que se incorpore un módulo nuevo, cambie una convención o se tome una decisión arquitectónica relevante.

---

## 1. Qué es MRC

PWA de Seguridad y Salud en el Trabajo (SST) para **Agrosuper Comercial**.
Permite al equipo de prevención registrar formularios de terreno, gestionar líderes por instalación, revisar KPIs diarios y distribuir material de difusión SSO.

- **Stack:** React 19 + Vite 8 + Zustand 5 + Framer Motion + Lucide icons
- **Auth:** Azure AD vía MSAL (`@azure/msal-react` v5)
- **Backend:** Microsoft Graph API + SharePoint Online (listas + drive)
- **Hosting:** GitHub Pages (`/MRC.app/`) — preparado para Azure Static Web Apps
- **Idioma de la UI:** Español (Chile)
- **Idioma de código y comentarios:** Español para UI, inglés para nombres técnicos

---

## 2. Comandos esenciales

```bash
# Desarrollo local
npm run dev

# Compilar
npm run build          # genera dist/

# Desplegar (interactivo — pide versión y descripción)
bash deploy.sh

# Deploy manual rápido
npm run build && node node_modules/.bin/gh-pages -d dist -b gh-pages --dotfiles -m "deploy: descripción"
git push origin main
```

### ⚠️ Protocolo obligatorio de deploy

**SIEMPRE ejecutar en este orden exacto:**

1. `git add <archivos>` — solo los archivos modificados, nunca `git add -A`
2. `git commit -m "..."` — el pre-commit hook (Husky) ejecuta lint + test + build automáticamente
3. `git push origin main` — sube los cambios al repositorio
4. **Esperar** a que el commit termine antes de continuar
5. `node node_modules/.bin/gh-pages -d dist -b gh-pages --dotfiles -m "deploy: descripción"` — publica a GitHub Pages (usa el `dist/` ya compilado por el pre-commit hook)
6. Verificar en `git log origin/gh-pages --oneline -3` que el nuevo commit apareció

**NO hacer:**
- ❌ Ejecutar `npm run build` seguido de `gh-pages` simultáneamente (genera procesos duplicados)
- ❌ Lanzar `gh-pages` múltiples veces sin esperar que el anterior termine
- ❌ Lanzar `gh-pages` en background (`run_in_background: true`) — siempre en foreground
- ❌ Usar `bash deploy.sh` para deploys intermedios — reservar para releases con bump de versión

**Si gh-pages se cuelga:**
```bash
# 1. Matar todos los procesos colgados
kill $(ps aux | grep -E "gh-pages|git checkout gh-pages" | grep -v grep | awk '{print $2}')
# 2. Eliminar el caché corrompido
rm -rf node_modules/.cache/gh-pages
# 3. Reintentar (en foreground, sin background)
node node_modules/.bin/gh-pages -d dist -b gh-pages --dotfiles -m "deploy: descripción"
```

---

## 3. Variables de entorno

Archivo `.env` (nunca se commitea):

| Variable | Descripción |
|---|---|
| `VITE_AZURE_CLIENT_ID` | ID de la app registration en Azure AD |
| `VITE_AZURE_TENANT_ID` | Tenant ID de Agrosuper |
| `VITE_SHAREPOINT_SITE_URL` | URL del sitio SharePoint (`https://agrosuper.sharepoint.com/sites/SSOASCOMERCIAL`) |
| `VITE_SP_ADMINS_LIST_ID` | GUID de la lista "Administradores MRC" — la app no tiene permiso para crearla automáticamente |

Si `VITE_AZURE_CLIENT_ID` falta o es placeholder → **modo dev** con datos mock y usuario demo@agrosuper.cl (admin).

---

## 4. Arquitectura de archivos

```
src/
├── App.jsx                     Rutas + AuthHandler + layout
├── main.jsx                    Inicialización MSAL + tema antes de mount
├── index.css                   Tokens CSS, tema claro/oscuro, tipografía
│
├── config/
│   ├── msalConfig.js           Scopes, cache (localStorage), redirect URI
│   ├── msalInstance.js          Singleton MSAL (initialize() antes de render)
│   ├── routes.js                Constantes de rutas
│   ├── mrcCatalog.js            Jerarquía organizacional (10 niveles), 26 instalaciones, cargos críticos
│   └── branchTargets.js         Metas semanales de pautas por nivel de riesgo (FA)
│
├── forms/
│   └── formDefinitions.js       7 formularios (sections-based y 1 wizard)
│
├── store/
│   ├── userStore.js             Perfil, tema, cargo MRC, isAuthenticated
│   ├── formStore.js             Borradores + cola offline (pendingQueue)
│   ├── formEditorStore.js       Overrides de admin + sync cloud (fire-and-forget)
│   ├── dataStore.js             KPIs y feed de actividad (efímero, sin persist)
│   ├── goalsStore.js            Factor Accidentabilidad y metas por actividad
│   └── lideresStore.js          Directorio de líderes (sin persist, siempre fresco)
│
├── services/
│   ├── graphService.js          People picker (Graph API)
│   ├── sharepointData.js        Envío de formularios a listas SharePoint
│   ├── sharepointSync.js        Sync de config de formularios (mrc-forms-config.json)
│   ├── lideresService.js        CRUD líderes + historial + reportes
│   ├── adminService.js          Lista de administradores
│   ├── difusionesService.js     Envío de charlas SSO
│   └── urlLinksService.js       URLs configurables desde la app (override > env var > null)
│
├── hooks/
│   ├── useAuth.js               Login/logout, adquisición de token
│   ├── useBootstrap.js          Carga inicial de perfil + enriquecimiento MRC + pull config
│   ├── useNetworkStatus.js      Detección online/offline
│   └── useKPIs.js               Datos del dashboard
│
├── components/
│   ├── form/                    8 componentes de pregunta (yesno, radio, select, text, rating, checkbox, photo, people-picker)
│   ├── ui/                      UpdateBanner, InstallPrompt, NetworkStatus, LoadingSpinner, MenuCard, KPICard
│   └── layout/                  AppHeader, PageTransition
│
└── screens/                     23 pantallas (todas lazy-loaded)
```

---

## 5. Decisiones arquitectónicas (NO cambiar sin razón)

### 5.1 Autenticación
- **loginRedirect** (no popup) — necesario para PWA en Android.
- **cacheLocation: 'localStorage'** — los tokens sobreviven el cierre de la PWA. Si se cambia a sessionStorage, los usuarios perderán sesión cada vez que la cierren.
- **Scopes:** `User.Read`, `Sites.ReadWrite.All`, `Files.ReadWrite.All`, `User.ReadBasic.All`.

### 5.2 Formularios
- Las definiciones estáticas viven en `formDefinitions.js` como fuente de verdad base.
- Los overrides del admin se guardan en `formEditorStore.editedForms[formId]` (localStorage + SharePoint).
- Al cargar un formulario: primero busca override, luego cae al estático.
- **Formularios seccionados:** override guarda `{ sections: [...] }`. En `initQuestions` hay que leer `override.sections` ANTES de `staticForm.sections`.
- **Formularios wizard:** override guarda `{ questions: {...} }`.
- **Opciones select:** pueden ser strings simples (`'Arica'`) o objetos (`{ value, label }`). El editor normaliza strings → objetos al abrir; el renderer (`QuestionSelect`) normaliza en ambas direcciones.

### 5.3 Sync cloud (formEditorStore)
- **Offline-first:** el guardado local SIEMPRE es exitoso. La sync con SharePoint es fire-and-forget.
- `lastSyncedAt` se setea ANTES del upload (no después) para proteger contra pull que sobreescriba.
- `pullFromCloud` solo sobreescribe si `cloudSavedAt > localLastSync`.
- El archivo en SharePoint es `mrc-forms-config.json` en la raíz del drive del sitio.

### 5.4 Temas (claro/oscuro)
- Controlado por `data-theme` en el `<html>`, NO por `prefers-color-scheme` del sistema.
- La app es independiente del tema del sistema operativo.
- `color-scheme: dark` forzado siempre en meta y CSS para que Android no inyecte estilos claros.
- Al cambiar tema: `setTheme()` actualiza `data-theme`, `html.style.backgroundColor` y `meta[theme-color]`.
- Las CSS variables se redefinen en `[data-theme="light"]`.

### 5.5 PWA y Service Worker
- **registerType: 'prompt'** — el SW nuevo espera en estado `waiting` hasta que el usuario acepte.
- **UpdateBanner** detecta el SW waiting y ofrece botón "Actualizar".
- **skipWaiting: false** — NO se activa solo. Si se pone true, el banner nunca se muestra.
- **Poll cada 60s** para detectar nuevas versiones.
- El manifest NO tiene `edge_to_edge_enabled` (no es estándar, Chrome lo ignora).

### 5.7 URLs Configurables (urlLinksService)

El módulo `urlLinksService.js` permite que el equipo SSO actualice desde la propia app cualquier URL de SharePoint (charlas semanales, biblioteca, documentos, etc.) sin editar código ni hacer redeploy.

**Patrón de resolución (prioridad):** override en localStorage → variable de entorno `VITE_*` → `null`.

**Catálogo (`URL_LINK_CATALOG`):** array en `urlLinksService.js` que es la fuente de verdad del módulo. Cada entrada tiene `id`, `label`, `description`, `category`, `envFallback`. Agregar una entrada nueva es suficiente para que aparezca automáticamente en la pantalla de Conexiones SharePoint.

**Clave localStorage:** `mrc-url-links` (separada de `mrc-sp-connections-override` que es para GUIDs de listas).

**Para consumir un enlace configurable en cualquier componente:**
```js
import { getLink } from '../services/urlLinksService'
const url = getLink('semana-op')  // null si no configurado
```

**Para agregar un nuevo enlace gestionable desde la app:**
1. Agregar entrada a `URL_LINK_CATALOG` en `urlLinksService.js`
2. Llamar `getLink('nuevo-id')` en el componente que lo necesita
3. La tarjeta aparece sola en Conexiones SharePoint — no se toca UI

**IMPORTANTE:** nunca leer `import.meta.env.VITE_SP_SEMANA_*` o `import.meta.env.VITE_SP_BIBLIOTECA_URL` directamente en componentes. Siempre usar `getLink()` para respetar los overrides del admin.

### 5.8 Barra de navegación inferior Android
- **Limitación conocida:** las PWAs NO pueden controlar el color de la barra inferior del sistema en Android. Solo apps nativas (Play Store) tienen `navigationBarColor`.
- `theme_color` en manifest controla la barra SUPERIOR (status bar).
- La barra inferior sigue el tema del sistema operativo del dispositivo.
- Soluciones: (a) usuario activa modo oscuro del teléfono, (b) usa navegación por gestos, (c) publicar como TWA vía Bubblewrap.

---

## 6. Catálogo organizacional

→ Fuente de verdad: `src/config/mrcCatalog.js` (10 niveles, 26 instalaciones, 3 cargos críticos).
→ Tests centinela: `src/__tests__/regression-catalog.test.js` valida integridad.

---

## 7. Listas SharePoint

→ Mapeo completo en `src/services/sharepointData.js`.
→ Al agregar formulario nuevo: crear lista en SharePoint Y agregar mapeo en ese archivo.

---

## 8. Convenciones de código

- **Imports:** React hooks primero, luego router, luego framer, luego lucide, luego componentes propios, luego stores/services.
- **Estilos:** Inline styles con objetos JS (no Tailwind classes en JSX). Tailwind solo en index.css para base/utilities.
- **Stores:** Zustand con `persist` middleware donde se necesita persistencia. `partialize` para excluir funciones del localStorage.
- **Screens:** Cada pantalla es un default export, lazy-loaded en App.jsx.
- **Formularios:** Tipos de pregunta: `yesno`, `radio`, `checkbox`, `select`, `text`, `rating`, `photo`.
- **Colores:** Tokens CSS en `:root` (modo oscuro) y `[data-theme="light"]` (modo claro). Navy base: `#1B2A4A`. Naranja marca: `#F57C20`.
- **Tipografía:** Barlow (body) + Barlow Condensed (display/headers).

---

## 9. Assets estáticos (logos e imágenes)

Los logos viven en `public/` y se referencian con `${import.meta.env.BASE_URL}nombre.png`:

| Archivo | Uso | Dimensiones | Notas |
|---|---|---|---|
| `public/agrosuper-logo.png` | Logo Agrosuper blanco | 5784×1864 px | Se usa en modo oscuro Y claro (único archivo disponible) |
| `public/mrc-logo.png` | Ilustración MRC | ~5MB | `mixBlendMode: screen` sobre fondo oscuro |

**IMPORTANTE — no usar `.webp` para estos logos:**
- En un proceso anterior de optimización se intentó convertir los logos a WebP pero los archivos `.webp` quedaron como stubs de 0 bytes.
- Los archivos funcionales son únicamente los `.png`.
- Si se incorpora una versión WebP optimizada en el futuro, actualizar las referencias en: `AppHeader.jsx`, `SplashScreen.jsx`, `SelectUnitScreen.jsx`.
- **No existe** `agrosuper-logo-color` (para modo claro) — si se necesita, agregar el archivo y actualizar las pantallas.

---

## 10. Reglas para evitar regresiones

1. **Nunca cambiar `registerType` a `'autoUpdate'`** sin verificar que el UpdateBanner siga funcionando. Con autoUpdate + skipWaiting el banner no se muestra.
2. **Nunca cambiar `cacheLocation` de MSAL** de `'localStorage'` a `'sessionStorage'` — rompe la persistencia de sesión en PWA.
3. **Nunca usar `prefers-color-scheme`** en media queries CSS — la app controla su propio tema vía `data-theme`.
4. **Nunca poner `color-scheme: light`** en el meta tag o CSS del html — Android interpreta esto y puede forzar barras blancas.
5. **Al editar `initQuestions`** en FormEditorDetailScreen: siempre verificar que lee TANTO `override.questions` como `override.sections`.
5b. **`visibleWhen` no sobrevive JSON.stringify** — las funciones `visibleWhen` se pierden al persistir el override en localStorage. `FormScreen.jsx` siempre debe restaurar `visibleWhen` desde el estático al hacer merge (sección y pregunta). `FormEditorDetailScreen.jsx` siempre debe usar `stripInternal` en `handleSave` para excluir `visibleWhen`, `_section` y `_sectionTitle` del override guardado.
6. **Al agregar un formulario nuevo** en formDefinitions: agregar también su mapeo en `sharepointData.js` y crear la lista en SharePoint.
7. **Al modificar el catálogo** (mrcCatalog.js): verificar que `lideresService.js` y `useBootstrap.js` siguen funcionando con los nuevos niveles.
8. **Super-admin hardcodeado:** `cvalverde@agrosuper.com` no se puede eliminar desde la UI. Es intencional.
9. **El CHANGELOG.md se actualiza automáticamente** con `deploy.sh`. No editarlo manualmente a menos que sea para corregir una entrada existente.
10. **Logos referenciados como `.png`, no `.webp`** — ver sección 9. No cambiar extensión sin verificar que el archivo existe y tiene contenido.
11. **Antes de hacer commit, ejecutar `npm test`** — los tests centinela validan automáticamente las reglas 1-10. Si un test falla, NO hacer commit.
12. **Al agregar una regla anti-regresión nueva**, agregar también un test centinela en `src/__tests__/`.
13. **Nunca leer `import.meta.env.VITE_SP_SEMANA_*` o `import.meta.env.VITE_SP_BIBLIOTECA_URL` directamente en componentes.** Usar siempre `getLink(id)` de `urlLinksService.js` para respetar los overrides configurados por el admin desde la app. Los env vars siguen funcionando como fallback — solo se omite el override si se bypasea el servicio.

---

## 11. Tests centinela (anti-regresión)

```
src/__tests__/
├── regression-pwa.test.js      registerType, skipWaiting, logos PNG
├── regression-msal.test.js     cacheLocation, scopes MSAL
├── regression-forms.test.js    initQuestions, integridad formDefinitions
├── regression-catalog.test.js  jerarquía, instalaciones, helpers
└── regression-theme.test.js    data-theme, color-scheme, meta tags
```

- **Ejecutar:** `npm test` (Vitest)
- **Pre-commit hook (Husky):** lint → test → build. Si cualquier paso falla, el commit se rechaza.
- Cada regla de la sección 10 tiene su test correspondiente. Al crear una regla nueva, crear su test.

---

## 12. Módulos pendientes / WIP

- **Monitor de Fatiga Operacional:** ruta existe (`/unit/:unitType/monitor-fatiga`), pantalla es stub.
- **PIN de identificación:** campo preparado en SharePoint, falta integrar en formularios para cuentas grupales.
- **Inspección Planificada:** definición de formulario existe, falta integrar en dashboards y menú.
- **TWA (Play Store):** opción evaluada para control total de barra de navegación Android. Requiere cuenta Google Play Developer ($25 USD).

---

## 13. Deploy y versionado

- `package.json` tiene la versión canónica (se inyecta en build vía `__APP_VERSION__`).
- El script `deploy.sh` pide la versión nueva, actualiza `package.json`, agrega entrada al `CHANGELOG.md`, compila, despliega a gh-pages y hace push a main.
- Para deploys desde Claude Code usar:
  ```bash
  npm run build && node node_modules/.bin/gh-pages -d dist -b gh-pages --dotfiles -m "deploy: descripcion"
  git push origin main
  ```
- Siempre verificar que `dist/manifest.webmanifest` tiene `theme_color` y `background_color` correctos después del build.

---

## 14. Contactos y contexto organizacional

- **Equipo de desarrollo:** Magdalena Montenegro (coordinadora), Cristian Valverde (admin técnico).
- **Repositorio:** `cristianvalverdec/MRC.app` en GitHub.
- **Organización GitHub Pages:** `agrosuper-comercial.github.io/MRC.app/`
- **Tenant Azure AD:** Agrosuper (tenant ID en .env).
- **SharePoint:** sitio SSOASCOMERCIAL dentro del tenant Agrosuper.

---

*Última actualización: 2026-04-21 — v1.9.0 — Sistema de URLs Configurables (urlLinksService)*
