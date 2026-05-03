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
│   ├── sharepointLists.js       Catálogo único de GUIDs de listas SharePoint (fuente de verdad)
│   ├── sharepointData.js        Envío de formularios a listas SharePoint + mapGenericFromOverride
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
- Los formularios creados desde el editor viven en `formEditorStore.customForms[formId]` y deben incluir `listId` (GUID de la lista SharePoint destino).
- Al cargar un formulario: primero busca override, luego cae al estático.
- **Formularios seccionados:** override guarda `{ sections: [...] }`. En `initQuestions` hay que leer `override.sections` ANTES de `staticForm.sections`.
- **Formularios wizard:** override guarda `{ questions: {...} }`.
- **Opciones select:** pueden ser strings simples (`'Arica'`) o objetos (`{ value, label }`). El editor normaliza strings → objetos al abrir; el renderer (`QuestionSelect`) normaliza en ambas direcciones.
- **Visibilidad condicional serializable:** las funciones `visibleWhen` no sobreviven JSON. El editor guarda `visibleCondition: { questionId, equals }` (o `{ all }` / `{ any }`). `FormScreen` reconstruye `visibleWhen` con `buildVisibleFn`. El campo `_staticVisibleCondition` en `sectionsState` es solo de display (F3) — nunca se persiste.
- **Template "reglas-oro":** formularios con `metadata.template === 'reglas-oro'` en `formDefinitions.js` habilitan la macro F5 "Agregar Regla de Oro" en el editor, que crea opción+sección+radio+checkbox gateados en una sola transacción.
- **Archive:** `editedForms[formId].archived === true` oculta el formulario de `ToolsMenuScreen` sin destruir el override. Reversible desde la pestaña "CONEXIÓN SP" del editor.
- **Caminata de Seguridad (`caminata-seguridad`):** formulario reconstruido en v1.9.18. 26 secciones, preguntas en expansión. Ramificación área → temática → conducta → condiciones. Mapper dinámico en `sharepointData.js`: usa pattern matching sobre sufijos de clave (`_p1`, `_desvio`, `_carta`, `_nombre`, `_rut`, `_obs`, `_p2`) — funciona automáticamente con temáticas nuevas creadas desde el Editor sin cambiar código.
- **Doble cola Caminata (v1.9.19, Option C):** al enviar con condición insegura detectada (`_p2 === 'CON_OBSERVACIONES'`), `FormScreen` encola DOS ítems independientes. El primero (`formType: 'caminata-seguridad'`) va a la lista Caminata. El segundo (`formType: 'caminata-seguridad-condicion'`) va a la lista Inspección Simple vía `mapCondicionDesdeCaminata`, con `linkedTo: firstId` para agrupación. Cada ítem tiene reintento offline independiente. El segundo item solo existe si hay condición insegura.
- **`supersededSections`:** el bloque de append en `FormScreen` verifica `!supersededSecs.has(s.id)` ANTES del fallback `|| s`. Sin esto, secciones del override antiguo (s1–s4) reaparecen como secciones independientes aunque no existan en `mergedSectionMap`.

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

### 5.6 Enriquecimiento de correos desde Gestión de Líderes

Al enviar cualquier formulario, `submitFormToSharePoint` (en `sharepointData.js`) consulta automáticamente los líderes de la instalación y popula las columnas Correo 1-8 de la lista SharePoint destino. Estas columnas activan los flujos de Power Automate que notifican a cada nivel de jefatura.

**Mapeo cargo → columna:**
- Correo 1, 2, 3 → Jefe de Despacho (hasta 3)
- Correo 4 → Jefe de Frigorífico
- Correo 5 → Jefe de Operaciones
- Correo 6 → Jefe Administrativo
- Correo 7 → Jefe de Zona
- Correo 8 → Subgerente de Zona

**Detección de instalación:** `submission.answers?.Q1 || submission.branch`. Q1 tiene prioridad porque el usuario puede verificar una sucursal distinta a la de su perfil. Para Inspección Simple (sin pregunta de instalación) se usa `submission.branch`. Caminata de Seguridad usa `d.cs_instalacion || sub.branch` (tiene su propia pregunta de instalación desde v1.9.18).

**Tolerancia a fallos:** si `getLideres()` falla (offline, sin permisos), Correo 1-8 quedan vacíos pero el envío del formulario continúa sin bloquearse.

**No requiere cambios por formulario nuevo:** el enriquecimiento ocurre después del mapper estático y aplica a todos los `formType` automáticamente.

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

→ **Fuente única de GUIDs:** `src/services/sharepointLists.js` exporta `SHAREPOINT_LISTS` (array con `key`, `label`, `guid`, `unit`). `sharepointData.js` y `SharePointConnectionsScreen` consumen este catálogo — no duplicar GUIDs en otro lado.
→ Al agregar un formulario estático nuevo: agregar entrada en `SHAREPOINT_LISTS` Y el mapper correspondiente en `sharepointData.js`.
→ Los formularios custom (creados desde el editor) declaran su `listId` al crearse — `getListConfig` tiene fallback automático vía `mapGenericFromOverride` usando los `spColumn` de cada pregunta.
→ `resolveListConfig(formType)` — función pública en `sharepointData.js` para verificar si un formulario tiene lista asignada antes de encolar el envío. `FormScreen` la llama antes de `addToPendingQueue`; si devuelve null, muestra modal bloqueante.

---

## 8. Convenciones de código

- **Imports:** React hooks primero, luego router, luego framer, luego lucide, luego componentes propios, luego stores/services.
- **Estilos:** Inline styles con objetos JS (no Tailwind classes en JSX). Tailwind solo en index.css para base/utilities.
- **Layout responsive (desktop):** Todas las pantallas deben tener su contenido principal centrado con `className="content-col"` (o `maxWidth: 'var(--content-max-w)', margin: '0 auto', width: '100%'` en estilos objeto). La clase `.content-col` está definida en `index.css` y aplica `max-width: var(--content-max-w)` (680px) + centrado automático. El `<AppHeader>` permanece siempre a ancho completo. El div raíz de pantalla (`minHeight: 100dvh, flex-column`) no se restringe — solo el div de contenido interior. Pantallas excluidas: `SplashScreen`, `SelectUnitScreen` (centrado propio), `MonitorFatigaScreen` (iframe fullscreen), `FormScreen` (wizard con controles sticky).
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
5c. **Al crear una pregunta en formularios seccionados**, `emptyQuestion` DEBE recibir `sectionId`/`sectionTitle` y asignar `_section`. La red de seguridad de `handleSave` (`groupQuestionsBySections`) recoge huérfanas y las reasigna a la primera sección con `console.warn` — es una defensa, nunca una vía permitida. Si aparece el warn en consola, arregla el flujo de creación.
5d. **Antes de persistir un override, correr `validateForm`.** Si hay errores (IDs duplicados, labels vacíos, opciones faltantes, `nextQuestion` rotos), bloquear guardado y mostrar modal con la lista. Warnings permiten "Guardar igual". Ningún bypass en producción. `validateForm` también detecta gating inconsistente (F4): si >50 % de secciones/preguntas hermanas tienen `visibleCondition`, una sin ella genera warning.
5e. **Feedback de sync cloud en dos etapas.** Toast 1 "Guardado localmente" (azul, instantáneo). Toast 2 automático al cambiar `syncStatus`: verde "Sincronizado con SharePoint" o rojo "Error al sincronizar: {detalle}" (6s). Indicador de nube en header muestra el estado real y ofrece "Reintentar" en error (llama a `retryCloudSync()`). El fire-and-forget silencioso está prohibido — produce falso positivo.
5f. **Al crear una pregunta en el editor (F1)**, `addQuestion` copia la `visibleCondition` de la sección destino a la pregunta nueva. Esto es el default seguro; el admin puede borrarla si quiere que la pregunta sea siempre visible dentro de una sección condicional.
5g. **Al crear una sección en formulario gateado (F2)**, si todas las secciones existentes tienen gating, el editor abre automáticamente el modal de visibilidad. El admin DEBE decidir — no puede saltar el paso. Esto evita que secciones nuevas sin condición "cuelen" preguntas siempre visibles.
5h. **`_staticVisibleCondition` en `sectionsState`** es un campo de display generado por `parseVisibleWhen` — NO se persiste en el override (ver `handleSaveConfirmed`). Nunca añadir `_staticVisibleCondition` a los campos que se guardan en SharePoint.
5i. **Antes de encolar un envío (`addToPendingQueue`)**, `FormScreen` verifica `resolveListConfig(formType)`. Si no hay lista asignada y no es dev mode, muestra modal bloqueante y no encola. Nunca suprimir esta verificación — reemplaza la pérdida silenciosa de datos anterior.
6. **Al agregar un formulario nuevo** en formDefinitions: agregar entrada en `sharepointLists.js` (GUID + key), mapper en `sharepointData.js`, y crear la lista en SharePoint.
7. **Al modificar el catálogo** (mrcCatalog.js): verificar que `lideresService.js` y `useBootstrap.js` siguen funcionando con los nuevos niveles.
8. **Super-admin hardcodeado:** `cvalverde@agrosuper.com` no se puede eliminar desde la UI. Es intencional.
9. **El CHANGELOG.md se actualiza automáticamente** con `deploy.sh`. No editarlo manualmente a menos que sea para corregir una entrada existente.
10. **Logos referenciados como `.png`, no `.webp`** — ver sección 9. No cambiar extensión sin verificar que el archivo existe y tiene contenido.
11. **Antes de hacer commit, ejecutar `npm test`** — los tests centinela validan automáticamente las reglas 1-10. Si un test falla, NO hacer commit.
12. **Al agregar una regla anti-regresión nueva**, agregar también un test centinela en `src/__tests__/`.
13. **Nunca leer `import.meta.env.VITE_SP_SEMANA_*` o `import.meta.env.VITE_SP_BIBLIOTECA_URL` directamente en componentes.** Usar siempre `getLink(id)` de `urlLinksService.js` para respetar los overrides configurados por el admin desde la app. Los env vars siguen funcionando como fallback — solo se omite el override si se bypasea el servicio.
14. **Nunca duplicar GUIDs de listas SharePoint.** La fuente de verdad es `src/services/sharepointLists.js`. Si se necesita un GUID en otro archivo, importar de ahí (`SHAREPOINT_LIST_BY_KEY`, `SHAREPOINT_LIST_BY_GUID`). No pegar el GUID a mano en otro módulo.
15. **Nunca crear formularios custom sin `listId`.** `NewFormModal` bloquea si no se elige lista. Si se crea un custom form programáticamente (tests, migraciones), incluir siempre el campo `listId` con el GUID correcto.
16. **`supersededSections`** — cuando una sección estática se divide o renombra, agregar su ID antiguo a `supersededSections: [...]` en la definición del formulario. `FormScreen` filtra esas secciones del override antes del merge, evitando que la versión antigua del override tape las secciones estáticas nuevas. Ejemplo: la sección `cierre` fue dividida en `retro_positiva`, `retro_correctiva` y `cierre_final` en v1.9.16.
17. **`permanentlyRemovedQuestions`** — para eliminar de forma permanente una pregunta de un formulario estático (ej. Q16), agregarla a `permanentlyRemovedQuestions: [...]` en la definición. `FormScreen` la filtra en el merge aunque la pregunta reaparezca en un override sincronizado desde la nube.
18. **`validateForm` acepta opciones como strings o como objetos `{value, label}`.** El estático puede almacenar opciones como strings simples; el editor las convierte a objetos al guardar. No asumir que todas las opciones tienen propiedad `.label` — siempre normalizar con `typeof o === 'string' ? o : (o?.label || '')` antes de validar.
19. **Al agregar una pantalla nueva al menú:** agregar su entrada en `src/config/screenRegistry.js` con el `screenKey` correcto, y envolver la ruta en `App.jsx` con `<ScreenGuard screenKey="...">`. Sin esto, la pantalla no puede ser deshabilitada desde el panel de admin.

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

## 12. Sistema de Visibilidad de Pantallas (v1.9.17)

El admin controla el acceso a cada pantalla desde el panel **Visibilidad de Pantallas** (`/admin/screen-visibility`), accesible desde la tarjeta ADMIN en ToolsMenuScreen.

### Los tres modos (valores internos en `disabledScreens`)

| Modo | Valor | Quién puede acceder |
|---|---|---|
| HABILITADA | `null` (clave ausente) | Todos |
| SOLO USUARIOS | `'users'` | Solo admins (con banner naranja de aviso) |
| TODOS | `'all'` | Nadie |

Retrocompatibilidad: valor `true` legacy (v1 binaria) se interpreta como `'all'`.

### Archivos clave
- `src/config/screenRegistry.js` — registro estático (16 screens) con `key`, `label`, `menu`
- `src/store/screenVisibilityStore.js` — Zustand + `persist` (clave localStorage: `mrc-screen-visibility`). API pública: `setScreenMode(key, mode)`, `getScreenMode(key)` → `null | 'users' | 'all'`, `isScreenDisabled(key)` (compat), `setDisabledScreens(map)` (bulk pull)
- `src/components/ui/ScreenGuard.jsx` — wrapper de rutas: `all` → bloqueo total, `users` + !admin → bloqueo, `users` + admin → banner naranja + contenido, `null` → pass-through
- `src/screens/ScreenVisibilityAdminScreen.jsx` — panel con `ModeSelector` de 3 botones por pantalla

### Comportamiento en menús
- `getScreenMode(key)` devuelve el modo activo. `disabled = mode === 'all' || (mode === 'users' && !isAdmin)`.
- MenuCard recibe `disabled` y `badge="NO DISPONIBLE"` cuando corresponde.

### Sync con SharePoint
`disabledScreens` viaja dentro de `mrc-forms-config.json` (mismo pipeline que formularios). `_syncToCloud` lo lee desde `screenVisibilityStore.getState()`. `pullFromCloud` llama a `setDisabledScreens(data.disabledScreens)`.

### Regla obligatoria
Al agregar una pantalla nueva al menú: (1) agregar entrada en `screenRegistry.js` con `key`, `label` y `menu`, (2) envolver su ruta en `App.jsx` con `<ScreenGuard screenKey="...">`. Sin esto la pantalla no es controlable desde el panel de admin.

---

## 13. Módulos pendientes / WIP

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

*Última actualización: 2026-05-03 — v1.9.26 — Navegador de semanas en DailyStatusScreenV2: flechas ← → para revisar semanas históricas, rango de fechas en header, sin auto-refresh en semanas pasadas*
