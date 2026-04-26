# Changelog — Misión Riesgo Cero (MRC)

Registro de todos los cambios, correcciones y nuevas funcionalidades por versión.
Formato: `[versión] — YYYY-MM-DD`

---

## [1.9.12] — 2026-04-25

### Editor de formularios — override autoritativo + resiliencia ante pérdida de datos

**Problema resuelto:** Los cambios guardados en el editor podían perderse si el localStorage del navegador se limpiaba (reinstalación de PWA, limpieza manual de caché), dejando el formulario en su versión base de código sin los ajustes configurados.

**1. Override del editor es la fuente de verdad definitiva**

`FormScreen` ya no mezcla el override con el estático como base. Lo que el administrador guarda en el editor **es** el formulario — preguntas eliminadas se eliminan definitivamente, preguntas añadidas permanecen, labels y opciones modificadas prevalecen. El estático (`formDefinitions.js`) solo aporta las funciones `visibleWhen` (no serializables en JSON) y actúa de semilla si no existe ningún backup.

**2. Triple respaldo anti-pérdida**

Cada guardado en el editor escribe simultáneamente en tres niveles:
- **Zustand persist** (`mrc-form-editor-store`) — carga inmediata en cada apertura
- **Hard backup** (`mrc-editor-hardbackup`) — clave separada que sobrevive resets o migraciones del store de Zustand
- **SharePoint** (`mrc-forms-config.json`) — sobrevive cualquier limpieza del navegador o reinstalación

Al iniciar la app, `pullFromCloud` restaura desde hard backup si `editedForms` está vacío antes de contactar SharePoint, y aplica siempre el cloud si el store local quedó vacío (sin importar timestamps).

**3. Renumeración de preguntas al eliminar**

Al eliminar una pregunta en el editor, el campo `order` de las preguntas restantes se renormaliza automáticamente (1, 2, 3…) sin huecos en la secuencia.

**4. Formulario Reglas de Oro — base definitiva ajustada**

Las preguntas Q3, Q4, Q5, Q6, Q7, Q8, Q9, Q10, Q13, Q14, Q15, Q17 y Q47 se eliminaron permanentemente de `formDefinitions.js`. La sección DATOS GENERALES queda con Q1 (Instalación) y Q16 (Coordinador SIGAS); CIERRE queda con Q46 y Q48. Esta es la versión base que se muestra si no existe ningún override ni backup.

---

## [1.9.11] — 2026-04-25

### Editor de formularios — tres mejoras y mapeo dinámico a SharePoint

**1. Pregunta Q48 — Carta de Amonestación (gap de configuración)**

La pregunta "¿La acción insegura amerita una carta de amonestación escrita?" no existía en `formDefinitions.js`. Se agregó en la sección CIERRE del formulario `pauta-verificacion-reglas-oro` con `visibleWhen` idéntico al de Q47: aparece solo cuando alguna Regla de Oro registra `CON_OBSERVACIONES`. Usa `disableNA: true` ya que no admite respuesta neutral.

**2. Preguntas SI/NO sin opción N/A**

`QuestionYesNo` ahora soporta el campo `disableNA: true` en la definición de pregunta para mostrar solo las opciones SÍ/NO. En el editor aparece el toggle "Incluir opción N/A" (activado por defecto) al editar cualquier pregunta de tipo `yesno`.

**3. Nuevo tipo de pregunta: RUT chileno**

Nuevo componente `QuestionRut` con:
- Teclado virtual personalizado: dígitos 0–9, tecla K (azul) y ⌫ (rojo)
- Formato automático `XX.XXX.XXX-K` mientras se tipea
- Validación en tiempo real por Módulo 11 (✓ verde / ✗ rojo)
- Disponible en el editor como tipo **"RUT"**

**4. Mapeo dinámico de preguntas a columnas SharePoint**

Hasta ahora el mapeo de respuestas a columnas SP era completamente hardcodeado en los 8 mappers de `sharepointData.js`. Preguntas nuevas creadas desde el editor perdían sus respuestas silenciosamente al enviar.

- `SP_COLUMN_CATALOG` exportado con columnas conocidas de cada lista (fallback estático).
- `fetchListColumns(formType)` lee las columnas reales vía `GET /lists/{listId}/columns` (Graph API).
- Nueva sección **"Columna SharePoint"** en el editor de cada pregunta: dropdown de columnas conocidas, botón "☁ Leer desde SP" que reemplaza el catálogo con las columnas reales de la lista, e input libre para nombres personalizados.
- Al enviar, `submitFormToSharePoint` aplica automáticamente los `spColumn` guardados en los overrides sin tocar los mappers existentes.

**Fix: input de columna personalizada no aparecía**

Al seleccionar "✏ Nombre personalizado…" el campo de texto no se mostraba. El bug era que `onChange` seteaba `spColumn = ''`, haciendo `isCustom = false` de inmediato. Corregido con estado `customColMode` independiente del valor del campo.

---

## [1.9.10] — 2026-04-25

### Hallazgo crítico — el grupo MRC Members era un grupo "fantasma"

**Diagnóstico:** En pruebas con `tfigueroa@agrosuper.com` se confirmó que MRC Members fue creado en SharePoint pero **nunca recibió un permission level asignado** (Edit/Contribute/Read). Es un grupo que agrupa usuarios pero no les concede acceso real al sitio. Eso explica por qué fgaticaa y otros usuarios tenían 403 a pesar de estar listados en MRC Members. Al moverlos a "Integrantes de la SSO AS COMERCIAL" (el grupo Members nativo del sitio) recibieron acceso inmediato.

**Solución:** Cambiar el target de toda la app al grupo nativo que SÍ funciona:

- `sharepointGroupService.js`: `GROUP_NAME = 'Integrantes de la SSO AS COMERCIAL'`. Este es el grupo nativo del template SharePoint con Edit asignado por defecto.
- Toda la copy de `PermisosSharePointScreen.jsx` actualizada (13 ocurrencias) — ahora indica "Integrantes SSO AS COMERCIAL" como destino del "Copiar emails".
- Banner informativo verde explicando que estamos apuntando al grupo correcto y que MRC Members quedó deprecated en la app.

### Hotfix — flujo de consent ya no muestra el diálogo "Aprobación necesaria" repetidamente

**Diagnóstico:** Cuando v1.9.9 detectaba `consent_required` (caso Agrosuper, donde TI tiene "user consent" deshabilitado), llamaba `acquireTokenRedirect` automáticamente. En la práctica esto solo encola una solicitud en Azure Portal para que TI apruebe — y volverá a aparecer en el siguiente intento, generando frustración.

**Fix:**
- `sharepointGroupService.js`: nueva clase `ConsentRequiredError` con `code: 'CONSENT_REQUIRED'`. `getSharePointRestToken()` la lanza en lugar de redirigir.
- Nueva función exportada `requestSharePointConsentExplicit()` — el redirect solo se dispara cuando el usuario lo elige activamente.
- `PermisosSharePointScreen.jsx`: nuevo estado `verifyStatus === 'consent_pending'` con UI dedicada — banner amarillo con explicación clara de la situación, botón "Reintentar verificación" (silencioso, funciona automáticamente apenas TI apruebe), botón "Reenviar solicitud a TI" (explícito), y un texto plantilla para enviar a TI con las instrucciones técnicas exactas en Azure Portal.

**Tests:**
- Test centinela contra retorno automático al consent.
- Test centinela del nuevo target group `Integrantes de la SSO AS COMERCIAL`.
- 137/137 pasan.

### Acción requerida del usuario

1. **Desplegar v1.9.10 inmediatamente** — desbloquea la verificación apuntando al grupo correcto.
2. **Decidir qué hacer con MRC Members** en SharePoint: o (a) eliminarlo si no se usa, o (b) asignarle un permission level "Edit" para que se vuelva funcional. La app no necesita ninguna de las dos para operar.
3. **Migración de usuarios**: usuarios que están solo en MRC Members deben moverse a "Integrantes de la SSO AS COMERCIAL" (manual desde SharePoint UI o vía "Copiar emails" de la app).

---

## [1.9.9] — 2026-04-25

### Verificación real de membresía MRC Members + hardening crítico para lanzamiento nacional

**1. Hotfix: `e is not iterable` al agregar email manual**
- Causa: spread sobre `null` proveniente de `JSON.parse(localStorage)` o de un cloud JSON con `added: null` legacy. En bundle minificado el error se reportaba con variable de una letra (`"e is not iterable"`).
- Fix: nueva utility `safeArrayParse(key)` en `PermisosSharePointScreen` que valida `Array.isArray()` después del parse.
- En `loadAddedEmails`: defensa estricta — `data.added`, `data.manual`, `data.audit` se normalizan a `[]` si vienen null/undefined/objeto, y se filtran entradas inválidas.
- En `saveAddedEmails`: detecta firma legacy vs payload-objeto, convierte Set a array si llega uno por accidente.

**2. Verificación real de permisos en SharePoint (semáforo verde/rojo/gris)**
- Microsoft Graph **NO expone** miembros de SharePoint Site Groups (solo M365 Groups). MRC Members es un Site Group, así que la única vía es **SharePoint REST**.
- Nuevo servicio `sharepointGroupService.js`: token con audience SP REST (scope `https://agrosuper.sharepoint.com/AllSites.Read`) + `getMrcMembersEmails()` que retorna `Set<email>` con una sola petición.
- **CRÍTICO para no romper la conexión existente con TI**: el scope SP REST está completamente **aislado** en `sharePointRestScopes` (msalConfig.js). El `loginRequest` original (User.Read + Sites.ReadWrite.All + etc.) queda **intacto**. Solo cuando un admin presiona "Verificar permisos" por primera vez se solicita el nuevo permiso vía `acquireTokenSilent`/`acquireTokenRedirect` separado. Usuarios normales nunca tocan este flujo. Si TI prefiere pre-aprobar tenant-wide, puede hacerlo en Azure portal sin requerir cambios de código.
- Nuevo botón **"Verificar permisos en SharePoint"** en pantalla. Reconciliación automática:
  - 🟢 Verde — confirmado en grupo MRC Members.
  - 🔴 Rojo — marcado "Agregado" pero AUSENTE del grupo (alerta de inconsistencia).
  - ⚪ Gris — sin verificación todavía o no está en grupo (correcto si está como Pendiente).
- Cache compartida `mrc-sp-members-verified.json` (nuevo `spMembersVerifiedSync.js`): cualquier admin que abra la app desde otro dispositivo ve el último estado verificado sin re-consultar.

**3. Detección automática de "huérfanos"**
- Si la verificación devuelve emails que están en MRC Members pero NO en `lideres` ni `manualEntries`, se muestran al final con badge amarillo `<AlertTriangle>` y botón "Aceptar como manual".
- Detecta el caso de admins que agregan correos directamente desde SharePoint UI saltándose la app.

**4. Validación de email manual contra Azure AD**
- Antes de aceptar un email manual, llamada a Graph `GET /users/{email}` para confirmar que existe en el tenant Agrosuper. Bloquea typos como `fgaticaaa@agrosuper.com`.
- Reusa el scope `User.ReadBasic.All` ya consentido — sin nuevo permiso.
- Si el usuario no tipeó nombre, lo autocompleta con el `displayName` de AD.
- Detecta cuentas deshabilitadas y las rechaza explícitamente.

**5. Audit log compartido (200 últimas acciones, FIFO)**
- Tabla colapsable al final de la pantalla con historial: `toggle_added`, `toggle_pending`, `manual_add`, `manual_remove`, `verify_run`, `request_processed`, `orphan_accept`.
- Cada entrada con timestamp, admin, email, metadata. Crucial para compliance/auditoría en lanzamiento nacional.
- Campo `version` agregado al JSON cloud para preparar concurrencia explícita en futuras iteraciones.

**6. Refactor — centralización de `resolveSiteId`**
- Nuevo `services/sharepointSiteResolver.js` con `resolveSiteId`, `buildSiteEndpoint`, `buildDriveFileUrl`. Importado por `sharepointSync.js`, `spMembersAddedSync.js`, `spMembersVerifiedSync.js`. Antes había dos implementaciones idénticas duplicadas.

**7. Tests centinela**
- 22 tests nuevos cubriendo: defensa null/undefined, scope SP REST aislado, semáforo LED, validación AD, huérfanos, audit, parsing de LoginName, redirect (no popup) tras consent_required.
- 136/136 tests pasan.

**Pendiente para v1.9.10**
- Concurrencia: si `cloudVersion` ya cambió cuando intentamos push, hacer merge automático de `added` + `manual` en lugar de last-write-wins ciego.
- Notificación al solicitante cuando su solicitud es marcada Procesada (vía Power Automate).

---

## [1.9.8] — 2026-04-25

### Conexión SharePoint — etapa crítica para lanzamiento nacional

**1. Cooldown de solicitud: 24h → 5 min**
- `accessRequestService.js`: `COOLDOWN_MS = 5 * 60 * 1000`. Antes 24h era excesivo en período de pruebas — si una solicitud salía mal, el dispositivo quedaba bloqueado todo un día.
- Nueva función `clearAccessRequestCooldown()` para reenviar manualmente sin esperar.
- En `AccessRequestCTA`, junto al estado "Solicitud enviada (5 min)" hay un link "Reenviar ahora" que limpia el cooldown.

**2. Auto-refresh de token MSAL (caso fgaticaa)**
- Cuando un usuario es agregado al grupo MRC Members, su token cacheado conserva los claims antiguos y sigue recibiendo 403. `acquireTokenSilent` por sí solo NO refresca si el token aún no expiró.
- `getGraphToken({ forceRefresh: true })` ahora invalida el cache y solicita uno nuevo al backend Azure AD.
- Nuevo helper `forceRefreshGraphToken()` exportado desde `msalInstance.js`.
- En `AccessRequestCTA`: nuevo botón **"Reintentar conexión"** (azul, primario) que llama `forceRefreshGraphToken()` y recarga la app. Es la primera acción que un usuario debería intentar antes de solicitar acceso — útil cuando el admin ya lo agregó al grupo pero el token está desactualizado.

**3. Solicitudes pendientes visibles en la app**
- Nuevo servicio `accessRequestsListService.js`: `getPendingAccessRequests()` lee la lista `SolicitudesAccesoMRC` vía Graph; `markAccessRequestProcessed(id, { status, processedBy })` hace PATCH al item.
- En `PermisosSharePointScreen`: bloque "Solicitudes pendientes" arriba de las stats. Cada solicitud muestra nombre, email, razón, fecha, y dos botones — "Marcar procesada" (verde) y "Rechazar" (rojo).
- Al marcar como procesada: la solicitud se actualiza en SP (`Status: Procesada`, `ProcessedBy`, `ProcessedAt`) y el email se añade automáticamente al set de "agregados" + se inserta en el listado como entrada manual si no estaba.

**4. Agregar emails manuales al set MRC Members**
- Bloque "Agregar email manual" en `PermisosSharePointScreen`: input email + nombre opcional. Valida `@agrosuper.com` con regex. Bloquea duplicados con líderes registrados o manuales existentes.
- Los emails manuales se sincronizan junto al set de agregados en `mrc-sp-members-added.json` (campo `manual: [{ email, name, addedBy, addedAt }]`).
- Aparecen en el listado con badge azul `<Mail>` y botón papelera. Se incluyen en "Copiar emails" y CSV.
- Útil para invitados, áreas que no están en la lista de Líderes MRC pero necesitan acceso.

**Tests centinela nuevos**
- `accessRequestService` cooldown 5 min y `clearAccessRequestCooldown` exportado (no debe volver a 24h).
- `PermisosSharePointScreen` integra solicitudes + manualEntries con validación @agrosuper.com.
- `msalInstance` expone `forceRefresh` param y `forceRefreshGraphToken()`.
- `accessRequestsListService` apunta a `SolicitudesAccesoMRC` y filtra `Status=Pendiente`.
- 114/114 tests pasan.

**Documentación pendiente**
- Sección 10 del CLAUDE.md merece una regla nueva: "Cooldown de solicitudes nunca > 30 min en producción durante despliegue inicial".

---

## [1.9.7] — 2026-04-25

### Fix — Solicitudes de acceso anonimizadas + sync del set "agregados"

**Problema 1: solicitudes llegaban como `sin-email@agrosuper.com`**
- `AccessRequestCTA.jsx` leía `useUserStore((s) => s.profile)` pero `userStore` guarda los campos planos (`name`, `email`, `role`) — `s.profile` siempre era `undefined`.
- Resultado: el webhook de Power Automate recibía `requesterEmail: 'sin-email@agrosuper.com'` y `requesterName: 'Usuario sin nombre'`. Los admins no podían identificar al solicitante (caso fgaticaa@agrosuper.com).
- **Fix:** lee `s.name` / `s.email` / `s.role` planos. Si el email está vacío, bloquea el envío con mensaje pidiendo re-iniciar sesión. CTA muestra estado "Sin sesión válida" cuando no hay identidad.

**Problema 2: 118 emails marcados como "agregados" no se sincronizaban entre dispositivos**
- El set vivía en `localStorage['mrc-sp-members-added']` por dispositivo.
- Admin marcaba 118 desde su PC → en el celular los veía a todos pendientes.
- **Fix:** nuevo servicio `spMembersAddedSync.js` que persiste el set en `mrc-sp-members-added.json` en el drive del sitio (mismo patrón que `mrc-forms-config.json`). Push tras cada toggle, pull al cargar la pantalla. Indicador visual con estados `pulling/pushing/ok/error` y botón "Reintentar" en caso de fallo.

**Tests centinela nuevos (regression-sharepoint-errors.test.js)**
- Bloque "AccessRequestCTA — Identidad del solicitante": 3 tests que fallan si se vuelve a leer `s.profile`, si se quitan `s.name`/`s.email` planos, o si se elimina la guarda de email vacío.
- Bloque "PermisosSharePointScreen — Sync de set agregados": 3 tests que verifican import de `spMembersAddedSync`, exposición de `syncStatus` y push remoto en `toggleAdded`.
- 106/106 tests pasan.

**Pendiente para v1.9.8** (siguiente iteración solicitada)
- Mostrar lista de solicitudes pendientes (`SolicitudesAccesoMRC`) dentro de la pantalla con botón "Marcar procesada".
- Auto-recuperación de token tras 403 (`acquireTokenSilent({ forceRefresh: true })`) para resolver el caso de usuarios recién agregados al grupo MRC Members cuyo token aún tiene claims viejos.

---

## [1.9.6] — 2026-04-23

### Nueva pantalla — Estatus Diario v2 (`DailyStatusScreenV2`)

Rediseño completo del dashboard de KPIs diarios para sucursales. Reemplaza `DailyStatusScreen` con dos vistas integradas y generador de imagen PNG para WhatsApp.

**Vista "Todas las sucursales"**
- Tabla compacta de las 26 sucursales con KPIs Pautas / Caminatas / Difusiones visibles simultáneamente.
- Desglose por turno (M/T/N/A) mediante `MiniTurnoDot` (semáforo sólido/translúcido/vacío).
- KPI pills globales con `ProgressBar` animado (Framer Motion, easeOut 0.6s).
- Filtros de región scrollable: Todas / Norte / RM / Centro / Sur.
- Dot SYNC online/offline vía `useNetworkStatus`.

**Vista "Por CD"**
- Picker dropdown de las 26 sucursales con barra de color semáforo y check de seleccionado.
- Mini chips de turno (M/T/N/A) con estado ✓/~/!
- `KPITurnoCard` con desglose por turno + ProgressBar + etiqueta de estado por turno.
- Card de Caminatas con progreso diario.
- Feed de actividad del día.

**Descarga PNG (solo admin)**
- Generador Canvas 1080px con tabla completa de sucursales × 3 KPIs × 4 turnos.
- Toggle tema oscuro/claro para la imagen exportada.
- Botón visible únicamente para `role === 'admin'` (`useUserStore`).

**Infraestructura**
- Tokens CSS de turno agregados a `index.css` (`--turno-manana/tarde/noche/adm`).
- Animaciones de entrada en filas (`opacity+x`) y cards KPI (`opacity+y`) con Framer Motion.
- Transición entre vistas con `AnimatePresence` fade+slide.
- `safe-area-inset-bottom` en tab bar para soporte de notch.
- 83/83 tests centinela pasan sin cambios.

**TODOs pendientes (ver README handoff)**
- Conectar `branchTargets.js` para metas por FA por sucursal.
- Extender `useKPIs` para obtener conteos reales por turno desde SharePoint.

---

## [1.9.5] — 2026-04-23

### Fix crítico — Sincronización de rol admin y propagación de formularios

**Bug A:** Los cambios hechos por administradores en los formularios no se reflejaban en cuentas con rol `user`. Causa: `loadFormsFromSharePoint` atrapaba todos los errores (401/403/red) y retornaba `null` mudo. Cualquier falla de permisos dejaba al usuario con el formulario estático sin feedback visible.

**Bug B:** Al agregar un correo como administrador en la lista *Administradores MRC* de SharePoint, la cuenta quedaba registrada pero la app **no actualizaba el rol** en su dispositivo. Causa: el email escrito por el super-admin no siempre coincidía con el `profile.mail` que Azure AD reporta (mismatch `.com` vs `.cl`, alias o UPN distinto). `isAdmin()` comparaba con un único email y devolvía `false` silenciosamente.

### Cambios

- **`adminService.js`:**
  - `isAdmin(emails)` ahora acepta un arreglo de identidades (mail, UPN, username MSAL) y matchea insensible a mayúsculas contra cualquiera.
  - El error de SharePoint ya no se silencia — se propaga para que el caller decida (preservar rol previo en lugar de degradar).
  - Nuevo `refreshAdmins()`: vacía la caché en memoria y re-consulta la lista.

- **`sharepointSync.js`:**
  - `loadFormsFromSharePoint` clasifica `401/403` con mensaje accionable ("Pide al administrador del sitio agregar tu cuenta…"), `404` como "primera vez" (no es error), resto como error de lectura.
  - Ya no hay `try/catch` genérico que retorne `null` mudo.

- **`formEditorStore.js`:**
  - Nuevo estado independiente del pull: `pullStatus`, `lastPullAt`, `lastPullError` (regla 5e: ningún fire-and-forget silencioso, aplicada ahora también al pull).
  - Nuevo `retryPull()` para reintento manual.

- **`useBootstrap.js`:**
  - Pasa múltiples identidades a `isAdmin` (mail + UPN + username MSAL).
  - Si `isAdmin` lanza (red/permiso), **preserva el rol previo** en vez de degradar al usuario a `user` silenciosamente.

- **`App.jsx` — `ResumeHandler`:** al volver la PWA a primer plano, además de renovar token ahora llama `refreshAdmins()` → `isAdmin()` → `setRole()` y dispara `pullFromCloud()`. Esto captura el caso en que el super-admin promueve una cuenta mientras la PWA ya está abierta.

- **`ProfileScreen.jsx` — nueva tarjeta "Actualizar rol y formularios":** visible a todos los usuarios. Pulsarla fuerza re-lectura de la lista de admins + re-evaluación del rol + pull de formularios. Muestra el resultado (promovido / al día / degradado) y el error real de pull si lo hay.

### Tests

13 tests centinela nuevos en `regression-admin-sync.test.js` (83 totales, antes 70). Validan `isAdmin` tolerante, `refreshAdmins`, clasificación de errores en `loadFormsFromSharePoint`, estado `pullStatus/lastPullError`, matching multi-email en bootstrap, y re-evaluación en `ResumeHandler`.

### Guía de uso

- **Para el super-admin** al agregar a alguien: pide a la cuenta nueva pulsar **"REFRESCAR"** en Perfil. En <2 segundos su rol se actualiza. Ya no hace falta cerrar sesión.
- **Para usuarios viendo formularios desactualizados:** la misma tarjeta hace el pull. Si hay error, se muestra el mensaje real (403 → falta permiso de lectura en el sitio SharePoint).

---

## [1.9.4] — 2026-04-22

### Fix crítico — Bucles de navegación en retroceso

**Bug:** El botón de atrás en muchas pantallas creaba bucles porque usaba `navigate(-1)` que solo navega en el historial del navegador, el cual no siempre refleja la estructura intencional de la SPA.

**Solución arquitectónica:**
- **`navigationStore.js`** (nuevo): Zustand store que mantiene un stack de rutas visitadas (`navigationStack`).
- **`useNavigation.js`** (nuevo): Hook que rastrea cada navegación en el stack y proporciona `goBack()` para retroceso inteligente.
- **`NavigationTracker`** (en App.jsx): Componente que inicializa el tracking globalmente.
- **AppHeader actualizado**: Usa `goBack()` en lugar de `navigate(-1)`.

**Comportamiento:**
1. Cada navegación se agrega automáticamente al stack
2. Al retroceder, se navega explícitamente a la ruta anterior del stack
3. Fallback a `navigate(-1)` si no hay ruta anterior (último recurso)

**Probado sin regresiones:** Selector de unidad → Menús → Retroceso, y Editor de formularios (listado → detalle → retroceso). Todos los flujos funcionan sin bucles.

---

## [1.9.3] — 2026-04-22

### Fix crítico — Editor de formularios no pierde preguntas nuevas

**Bug:** al agregar una pregunta nueva a un formulario seccionado, guardar, salir y reingresar, la pregunta desaparecía silenciosamente. Causa raíz: `emptyQuestion` no asignaba `_section` y el filtro de `handleSave` descartaba cualquier pregunta sin sección coincidente.

- **`emptyQuestion`** ahora recibe `sectionId`/`sectionTitle` y los adjunta a la pregunta creada.
- **`addQuestion`** abre un selector inline de sección para formularios con >1 sección, recordando la última usada.
- **`handleSave`** incluye `groupQuestionsBySections` — red de seguridad que re-asigna huérfanas a la primera sección en vez de descartarlas (con `console.warn`).
- **`newQId`** considera los IDs del formulario estático para evitar colisiones al generar IDs nuevos.

### Nuevo — Validación pre-guardado

Antes de persistir el override, `validateForm` revisa:

- IDs duplicados
- Labels vacíos
- Opciones faltantes o sin texto en radio/checkbox/select
- `nextQuestion` / `options[].nextQuestion` apuntando a preguntas inexistentes
- Preguntas huérfanas sin `_section` (warning, no error)

Si hay errores, se bloquea el guardado y se muestra modal con la lista. Si solo hay warnings, se permite "Guardar igual".

### Mejora UX — Editor con grado profesional

- **Dropdowns de ramificación** ahora muestran `Q18 — ¿Área en la que verificará…?` en vez de solo `Q18`, con `optgroup` separando preguntas de destinos especiales (END, enrutamiento por área).
- **Confirmación al salir con cambios sin guardar:** `beforeunload` nativo + modal al pulsar "Volver".
- **Feedback honesto del sync cloud:**
  - Toast 1: "Guardado localmente — sincronizando…" (azul).
  - Toast 2 automático al terminar: "Sincronizado con SharePoint ✓" (verde) o "Error al sincronizar: {detalle}" (rojo, 6s).
  - Indicador de nube en el header: verde OK / naranja sincronizando / rojo con botón "Reintentar" que tooltipea el error.
- **`sharepointSync`** con retry tolerante: 3 intentos + backoff `[0, 1000, 3000]ms`. Errores 4xx (no-reintentables) fallan al primer intento.

### Tests

9 tests centinela nuevos en `regression-forms.test.js` (70 totales, antes 61) protegiendo `emptyQuestion` con secciones, red de seguridad de `handleSave`, `newQId` sin colisiones, `validateForm`, dropdowns con label, `lastSyncError`/`retryCloudSync`, y retry de SharePoint.

### Reglas anti-regresión

Nuevas reglas 5c, 5d, 5e en `CLAUDE.md` documentando asignación obligatoria de `_section`, validación pre-save, y los dos estados del toast de guardado.

---

## [1.9.2] — 2026-04-22

### Mejora UI — Gold standard columna centrada extendido a todas las pantallas

Completa la implementación del patrón `.content-col` en las pantallas de entrada y formularios, haciendo el estándar universal en toda la app.

- **`SplashScreen`:** ilustración y botón "INGRESAR" centrados y acotados a 680px en desktop; fondo gradient y partículas permanecen a pantalla completa.
- **`SelectUnitScreen`:** logo MRC y cards de Sucursales / Fuerza de Ventas centrados a 680px; fondo splash permanece a pantalla completa.
- **`FormScreen`:** barra de estadísticas, área de scroll del formulario y botón "Enviar registro" del footer centrados. El border-top y background del footer siguen a ancho completo para consistencia visual.
- **`FormEditorDetailScreen`:** panel de lista de preguntas y vista de flujo centrados a 680px; header de acciones (guardar/reset) y tabs permanecen a ancho completo.

---

## [1.9.1] — 2026-04-21

### Mejora UI — Columna centrada en pantallas anchas (desktop/notebook)

**Motivación:** al abrir la app maximizada en un monitor o notebook, las tarjetas de menú se estiraban al 100% del viewport, lo que resulta visualmente desequilibrado. Se adopta el patrón gold-standard de apps mobile-first en desktop: columna centrada de ancho fijo.

- **`src/index.css`:** token `--content-max-w: 680px` + clase utilitaria `.content-col` (`max-width: var(--content-max-w); margin: 0 auto; width: 100%`).
- **17 pantallas actualizadas** con `className="content-col"` o `maxWidth: var(--content-max-w)` en estilos objeto: `ToolsMenuScreen`, `UnitMenuScreen`, `AnalyticsScreen`, `CierreCondicionesScreen`, `ContratistasScreen`, `DailyStatusScreen`, `FADataEntryScreen`, `FormEditorListScreen`, `GestionCPHSScreen`, `GestionSaludScreen`, `InstalacionDetailScreen`, `LideresAdminScreen`, `LideresScreen`, `MisDocumentosScreen`, `NotificacionesAdminScreen`, `NotificationsScreen`, `ProfileScreen`, `ProgramGoalsScreen`, `ProgramaTrabajoScreen`, `SharePointConnectionsScreen`, `ValidacionAdminScreen`.
- **`AppHeader.jsx`:** campana de notificaciones pegada al avatar (`gap: 0`); título con `maxWidth: calc(100% - 196px)` para mayor holgura en viewports angostos.
- En mobile (< 680px) el comportamiento visual es idéntico al anterior.

---

## [1.9.0] — 2026-04-21

### Nueva Funcionalidad — Sistema de URLs Configurables (sin redeploy)

**Motivación:** las URLs de carpetas SharePoint (charlas semanales por área, biblioteca anual) estaban hardcodeadas en variables de entorno `VITE_SP_SEMANA_*` y `VITE_SP_BIBLIOTECA_URL`. Cambiarlas exigía editar `.env` + rebuild + redeploy: un ciclo costoso para contenido que rota semanalmente. Este módulo elimina esa dependencia y sienta la infraestructura para que cualquier enlace futuro sea autogestionado desde la propia app.

- **`src/services/urlLinksService.js` (nuevo):** servicio CRUD para gestionar overrides de URL en localStorage (`mrc-url-links`). Exporta:
  - `URL_LINK_CATALOG` — catálogo de enlaces configurables (fuente de verdad del módulo). Para agregar un enlace nuevo al sistema: basta con agregar una entrada aquí.
  - `getLink(id)` — resuelve URL con prioridad: override local → variable de entorno → `null`.
  - `getLinkSource(id)` — retorna `'override' | 'env' | 'none'` para mostrar el origen en la UI.
  - `saveLink(id, url)` / `clearLink(id)` / `getAllLinks()` — CRUD sobre localStorage.
  - Patrón defensivo con `try/catch` idéntico al de `getConnectionOverride` en `sharepointData.js`.
- **`SharePointConnectionsScreen.jsx` — sección "URLs Configurables" (nueva):** aparece entre las categorías de listas y el panel de Variables de Entorno. Muestra una tarjeta por cada entrada del catálogo con indicador de origen (verde = override local, naranja = env var, rojo = sin configurar) y panel de edición desplegable con lápiz, igual al patrón visual de los overrides de GUIDs.
- **`DifusionesSSOScreen.jsx` — desacoplado de `import.meta.env`:** los botones de Operaciones / Administración / Distribuidoras y la Biblioteca ahora leen su URL mediante `getLink()` en cada render, en lugar de consumir `import.meta.env.*` fijo en tiempo de build. El admin puede actualizar cualquier enlace semanal desde el dispositivo sin reiniciar la app.

### Arquitectura
- El sistema replica el patrón de override que ya existía para GUIDs de listas (`mrc-sp-connections-override`) pero para URLs, con su propia clave (`mrc-url-links`) para mantener separación de responsabilidades.
- **Extensibilidad:** agregar un nuevo enlace configurable (ej. "Reglamento Interno", "Manual de Contratistas") requiere solo: (1) entrada en `URL_LINK_CATALOG`, (2) `getLink('nuevo-id')` en el componente consumidor. La tarjeta en Conexiones SharePoint aparece automáticamente sin tocar UI.
- Las variables de entorno `VITE_SP_SEMANA_*` y `VITE_SP_BIBLIOTECA_URL` continúan funcionando como fallback para entornos donde ya estén configuradas, garantizando compatibilidad total con el despliegue actual.

---

## [1.8.1] — 2026-04-21

### Correcciones — Editor de Formularios (Pauta Verificación Reglas de Oro)

- **Bug crítico: `visibleWhen` se perdía al guardar overrides del editor.** Las funciones `visibleWhen` no sobreviven `JSON.stringify` (localStorage). El spread simple `{ ...staticForm, ...editedOverride }` en `FormScreen.jsx` reemplazaba las secciones sin esas funciones, haciendo que todas las secciones y preguntas fueran visibles simultáneamente. Se reemplazó por un merge profundo que restaura `visibleWhen` desde la definición estática a nivel de sección y de pregunta individual. Afectaba: ramificación Q18→Q20/Q21, lógica op1-op7 y adm1-adm5.
- **Bug: campos internos del editor se filtraban al override persistido.** `handleSave` en `FormEditorDetailScreen` guardaba `_section`, `_sectionTitle` y `visibleWhen` dentro del override (bloat innecesario). Se agrega `stripInternal` para limpiar esos campos antes de persistir.
- **Bug: Q19 "Turno observado" aparecía siempre, independiente del área seleccionada.** La pregunta carecía de `visibleWhen` y se mostraba tanto para Área Operaciones como Administración. Se agrega `visibleWhen: (a) => a.Q18 === 'Área Operaciones Sucursal'` alineándola con la lógica de Q20 y las secciones op1-op7.
- **Test centinela agregado** en `regression-forms.test.js` para prevenir regresión del merge de `visibleWhen` en `FormScreen` y del `stripInternal` en el editor.

---

## [1.8.0] — 2026-04-21

### Nuevas Funcionalidades — Sistema de Validación de Documentos
- **`validacionService.js`:** nuevo servicio CRUD contra la lista SharePoint "Validaciones MRC" (auto-provisioning de lista y 12 columnas en primera ejecución). Expone `createValidacion()`, `getValidacionesPendientes()`, `getTodasValidaciones()`, `getValidacionesUsuario()`, `aprobarValidacion()` y `rechazarValidacion()`. Las notificaciones a admin/usuario son fire-and-forget: si fallan, no bloquean el flujo principal.
- **`validacionStore.js`:** store Zustand con persistencia localStorage. Separa estado de usuario (`misValidaciones`) del estado admin (`pendientes`, `todasValidaciones`). Optimistic updates con rollback automático en caso de error de SharePoint. Mock data completo para dev mode.
- **Panel de Validación Admin (`/admin/validaciones`):** nueva pantalla exclusiva para administradores con 4 pestañas (Pendientes / Aprobados / Rechazados / Todos), KPIs de conteo por estado, polling automático cada 5 minutos con `visibilitychange`. Al aprobar: actualización optimista + notificación automática al usuario. Al rechazar: modal con motivo de rechazo obligatorio + notificación automática al usuario.
- **Mis Documentos (`/unit/:unitType/mis-documentos`):** nueva pantalla para todos los usuarios. Muestra el historial de registros enviados con su estado de validación (⏳ En revisión / ✅ Aprobado / ❌ Rechazado), motivo de rechazo cuando aplica, validador y archivos adjuntos. Caché de 5 minutos en localStorage.
- **Notificaciones para admins (`destinatarios: 'admins'`):** nuevo target de destinatarios en el sistema de notificaciones. Las notificaciones con `destinatarios === 'admins'` solo se entregan a usuarios con `role === 'admin'`. Requirió agregar el parámetro `role` a `getNotificaciones()`, `notificationStore.cargar()` y `useNotifications` hook.
- **Integración con Difusiones SSO:** `submitDifusion()` acepta `userEmail` y `userName`. Tras crear el ítem en SharePoint, crea automáticamente un registro de validación pendiente (fire-and-forget). La pantalla de éxito muestra aviso "Pendiente de validación" con instrucciones al usuario.
- **Accesos rápidos en ProfileScreen:** nuevo componente `MisDocumentosResumen` (todos los usuarios, con badge de rechazados/pendientes) y `AdminLinks` (solo admins, con badge de pendientes en Validaciones).
- **Rutas nuevas:** `/admin/validaciones` y `/unit/:unitType/mis-documentos` registradas en `routes.js` y `App.jsx` como lazy imports.

### Arquitectura
- La lista "Validaciones MRC" referencia ítems de otras listas por `ReferenciaId` (ID del ítem) y `ReferenciaLista` (GUID de la lista origen), permitiendo extender el sistema de validación a cualquier formulario en el futuro.
- El campo `Estado` de la lista de validaciones es independiente de los ítems de las listas de formularios: no modifica listas existentes para mantener compatibilidad y evitar regresiones.

---

## [1.7.2] — 2026-04-21

### Correcciones críticas del sistema de notificaciones
- **Columna "Tipo" renombrada a "TipoNotif":** SharePoint reserva el nombre `Tipo` para la columna por defecto de tipo de contenido (ContentType icon). Al intentar crear una columna con ese nombre o hacer POST con ese campo, SharePoint rechazaba silenciosamente la operación. Esto causaba que el botón "Enviar" quedara aparentemente colgado y las notificaciones nunca se crearan. Se renombró internamente a `TipoNotif` manteniendo fallback a `Tipo` en el mapper por retrocompatibilidad.
- **Errores de SharePoint ahora se muestran en la UI:** las acciones `crear` y `desactivar` del store exponen el error en `state.error` y la pantalla admin ya lo renderiza con banner rojo — antes los errores solo aparecían en la consola.
- **Mensaje de error más descriptivo** en `crearNotificacion`: muestra el detalle de SharePoint (no solo el código HTTP) para diagnosticar rápido problemas de esquema/permisos.

### Nuevas Funcionalidades
- **Notificaciones nativas automáticas en polling:** cada vez que el ciclo de polling detecta notificaciones nuevas no leídas, se dispara automáticamente `showNotification()` del service worker, mostrando la alerta en el tray del SO sin necesidad de abrir la app. Antes solo se disparaban manualmente desde el buzón.
- **Ícono de notificación con emoji 👌:** el ícono que aparecía como cuadrado blanco en la barra de estado de Android (al monocromizar el PWA icon) se reemplaza por el emoji característico de MRC, generado al vuelo vía canvas. Se usa tanto en `icon` (cuerpo de la notif) como en `badge` (barra de estado).

---

## [1.7.1] — 2026-04-21

### Correcciones
- **Header centrado:** el título de cada pantalla quedaba desplazado a la izquierda tras incorporar la campana de notificaciones. Se corrigió usando posicionamiento absoluto para el título, garantizando centrado perfecto independiente del ancho de los controles laterales.
- **Conexiones SharePoint — Notificaciones:** agregadas las dos listas del sistema de notificaciones (`Notificaciones MRC` y `Notificaciones MRC Leídas`) al panel de Conexiones SharePoint, con badge "Auto-creada" y referencia a `notificationService.js`. El contador de conexiones sube de 10 a 12.

---

## [1.7.0] — 2026-04-20

### Nuevas Funcionalidades
- **Sistema de notificaciones completo:** notificaciones in-app + nativas del SO para usuarios con y sin PWA instalada. Polling automático cada 5 minutos con SharePoint como backend.
- **Buzón de notificaciones (`/notifications`):** pantalla con tabs "Sin leer" / "Todas", marcado individual y masivo de leídas, navegación directa a la ruta de acción de cada notificación. Soporte offline con datos persistidos en localStorage.
- **Panel de administración (`/admin/notificaciones`):** formulario para crear notificaciones con targeting segmentado (todos / por instalación / por nivel jerárquico / email específico), tipo de notificación (actividad, plan de acción, difusión, sistema), fecha de expiración opcional y ruta de acción interna. Lista de todas las notificaciones con opción de desactivación (soft-delete).
- **Campana de notificaciones en AppHeader:** icono Bell con badge naranja animado mostrando el conteo de no leídas. Solo visible cuando el usuario está autenticado.
- **Notificaciones nativas del SO:** solicitud de permisos opt-in desde el buzón (solo para usuarios con PWA instalada en modo standalone). Usa `serviceWorker.ready.showNotification()` cuando el SW está activo, con fallback a `new Notification()`.
- **`notificationService.js`:** servicio de CRUD contra dos listas SharePoint nuevas (`Notificaciones MRC` y `Notificaciones MRC Leídas`). Auto-provisioning de listas y columnas en primera ejecución. Filtrado de destinatarios 100% en cliente.
- **`notificationStore.js`:** estado Zustand con persistencia localStorage para `notificaciones` y `leidasIds`. Las notificaciones del panel admin (`todasNotificaciones`) son efímeras (no persisten).
- **`useNotifications` hook:** ciclo de polling con `visibilitychange` + `setInterval`. En dev mode usa datos mock sin llamadas a SharePoint. Limpieza de recursos al desmontar (sin memory leaks).
- **Resumen de notificaciones en ProfileScreen:** widget con conteo de no leídas y acceso directo al buzón.
- **Rutas nuevas:** `/notifications` y `/admin/notificaciones` registradas en App.jsx y routes.js.
- **Tests centinela:** `regression-notifications.test.js` con 20 tests que validan autenticación segura, estructura del store, comportamiento del polling y rutas registradas.

---

## [1.6.1] — 2026-04-17

### Nuevas Funcionalidades
- **Pantalla "Permiso de Trabajo" (ContratistasScreen):** nueva pantalla de gestión de contratos activos. Muestra en tiempo real los permisos de trabajo en curso (empresa, tipo de trabajo, ubicación, hora máxima), y ofrece dos acciones: iniciar un nuevo permiso o dar cierre a un trabajo activo. Obliga a las jefaturas a ir a terreno para cerrar las faenas.
- **Formulario "Cierre de Trabajo — Contratistas":** nuevo formulario separado para el cierre formal de faenas (`cierre-trabajo-contratista`). Incluye sección de referencia al permiso original (con pre-relleno automático al venir desde la pantalla de contratistas), verificación de 6 condiciones de cierre e incidentes/observaciones.
- **Store de contratistas (`contratistasStore`):** Zustand + localStorage. Registra los permisos activos al enviar el formulario de apertura y los marca como cerrados al enviar el formulario de cierre. Persiste entre sesiones.
- **`QuestionPeoplePicker` habilitado en SectionsMode:** el tipo de pregunta `people-picker` ahora funciona en formularios tipo secciones (anteriormente solo en el wizard). Afecta a los campos de Responsable Agrosuper en los formularios de contratistas.
- **Botón "Cierre de Trabajos" con selección inteligente:** si hay un solo permiso activo, navega directamente al formulario de cierre; si hay varios, muestra un bottom-sheet para seleccionar cuál cerrar.
- **Retorno automático a ContratistasScreen:** tras enviar cualquiera de los dos formularios, el botón "Ir al menú" regresa a la pantalla de contratistas en vez de retroceder 2 niveles genéricos.
- **Mapeo SharePoint para cierre preparado:** función `mapCierreTrabajoContratista` en `sharepointData.js`. El GUID se configura desde el panel de Conexiones SharePoint cuando el equipo SSO cree la lista.
- **Ambos formularios editables:** `cierre-trabajo-contratista` agregado al `FORM_CATALOG` del Editor de Formularios.

### Correcciones
- **Opciones checkbox sin texto (Peligros identificados / EPP):** las opciones del formulario `permiso-trabajo-contratista` estaban definidas como strings simples, pero `QuestionCheckbox` requiere objetos `{value, label}`. Convertidas las 22 opciones (10 peligros + 12 EPP) al formato correcto.
- **Sección de cierre separada del formulario de apertura:** la sección 8 (Cierre de Faena) fue extraída del formulario `permiso-trabajo-contratista` y se convirtió en el formulario independiente `cierre-trabajo-contratista`, forzando el flujo de doble presencia física en terreno.

---

## [1.6.0] — 2026-04-17

### Nuevas Funcionalidades
- **Formulario "Permiso de Trabajo — Contratistas":** nuevo formulario de verificación de condiciones para inicio de faenas de empresas contratistas en instalaciones. Incluye 8 secciones y ~58 preguntas que cubren datos de la empresa, clasificación de peligros, competencias e inducción, EPP, y 4 secciones de trabajo crítico con lógica condicional (`visibleWhen`): Trabajo en Altura, Trabajo en Caliente, Trabajo Eléctrico y Espacio Confinado.
- **Disponible en menú Herramientas Preventivas (Sucursales):** el formulario aparece en `ToolsMenuScreen` para todas las instalaciones.
- **Editable desde el Editor de Formularios:** registrado en `FORM_CATALOG` de `FormEditorListScreen`.
- **Mapeo SharePoint preparado:** función `mapPermisoTrabajoContratista` en `sharepointData.js`.
- **Cumplimiento normativo:** diseño alineado con DS 44/2023, DS 594, Ley 16.744 e ISO 45001.

---

## [1.5.3] — 2026-04-12

### Configuración
- **`VITE_SP_ADMINS_LIST_ID` configurado:** GUID de la lista "Administradores MRC" creada manualmente en SharePoint (`59789384-5546-4920-8ed2-e44aaf826b9a`). La app no tiene permisos para crear listas automáticamente; al existir esta variable, `adminService.js` la usa directamente sin búsqueda ni auto-creación.

---

## [1.5.2] — 2026-04-12

### Correcciones
- **Gestión de Administradores — error real visible en UI:** los catch en `ProfileScreen` swallowaban el error original y siempre mostraban el mismo mensaje genérico. Ahora se muestra el mensaje exacto que retorna Graph API.
- **`getListId` en `adminService.js` — búsqueda más robusta:** reemplazado `$filter=displayName eq '...'` (soporte inconsistente en Graph API de SharePoint) por fetch de todas las listas con filtrado en cliente. Evita caída silenciosa al bloque de creación cuando el $filter retorna error.
- **`getListId` — verificación de respuesta:** ahora se comprueba `searchRes.ok` y `createRes.ok` antes de usar la respuesta; los errores 4xx/5xx se lanzan con el cuerpo real del error para facilitar el diagnóstico.
- **Soporte para `VITE_SP_ADMINS_LIST_ID`:** si el GUID de la lista está configurado en el entorno, se usa directamente sin búsqueda ni auto-creación (solución recomendada para producción).

---

## [1.5.1] — 2026-04-12

### Correcciones
- **HTTP 400 falso en test de mrc-forms-config.json:** la función `testDriveFile` en la pantalla de Conexiones SharePoint construía una URL que combinaba *path-based site addressing* con *path-based drive item addressing*, combinación que Graph API rechaza con 400. Ahora resuelve primero el `siteId` como GUID (igual que `sharepointSync.js`) y luego construye la URL con ese ID. La sincronización real de formularios no estaba afectada; el error era exclusivo del diagnóstico visual.

---

## [1.5.0] — 2026-04-11

### Correcciones críticas
- **Centralización de autenticación MSAL:** eliminadas 6 funciones `getGraphToken()` duplicadas en los servicios, cada una con scopes distintos al login. Ahora existe una única función en `msalInstance.js` que usa `loginRequest` (mismos scopes que el login original), permitiendo reutilizar el token cacheado sin renovación vía iframe.
- **Eliminado `acquireTokenPopup` de toda la app:** el fallback a popup en `sharepointSync.js`, `graphService.js` y `useAuth.js` causaba que en Android PWA se abriera el navegador del sistema, rompiendo la sesión y generando loops infinitos de re-autenticación. Ahora ningún servicio lanza auth interactiva.
- **Loop de sincronización en editor de formularios resuelto:** el `acquireTokenPopup` en `sharepointSync.js` triggereaba una redirección → recarga de la PWA → `pullFromCloud()` nuevamente → loop. Al eliminar el popup, el sync falla silenciosamente (datos locales seguros) sin causar re-login.

### Nuevas Funcionalidades
- **Semáforo de sesión Azure en el header:** el dot del avatar ahora indica tres estados:
  - Verde: sesión activa y conexión ok
  - Naranja: sin internet
  - Rojo pulsante: sesión Azure perdida (prioridad máxima)
- **Banner de sesión expirada:** cuando el token falla, aparece un banner rojo bajo el header con el mensaje de error y la instrucción "cierra y abre la app", animado con entrada/salida suave.
- **Detección automática al volver de background:** `ResumeHandler` escucha el evento `visibilitychange` del navegador. Cuando el usuario regresa a la app después de tenerla en segundo plano (ej: despertar el celular), intenta renovar el token silenciosamente y actualiza el semáforo de inmediato.

---

## [1.4.0] — 2026-04-10

### Nuevas Funcionalidades
- **Panel de Conexiones SharePoint (Admin):** nueva pantalla `/admin/sharepoint-connections` accesible desde el menú de Herramientas en ambas unidades (Sucursales y Fuerza de Ventas) para perfiles Administrador.
  - Inventario centralizado de las 10 conexiones SharePoint del sistema (listas con GUID, listas dinámicas y archivo de configuración JSON).
  - Verificación de conectividad en tiempo real vía Graph API en paralelo.
  - **Asignación de lista desde el panel:** el admin pega una URL de SharePoint o GUID, el sistema lo resuelve y guarda como override sin modificar código. Badge `OVERRIDE` visible; botón para revertir al GUID original.
  - Detección de ventanas duplicadas con aviso explicativo (causa del `timed_out` de MSAL).
  - Sección de Variables de Entorno con indicador visual de configuración.

### Correcciones
- **HTTP 400 en test de conexiones:** `$select=itemCount` no es campo válido en Graph API — se eliminó. Las verificaciones retornan estado correcto.
- **Error `timed_out` de MSAL:** ya no se relanza auth interactiva al recibir `timed_out`, evitando el ciclo de ventanas de login adicionales.

---

## [1.3.1] — 2026-04-10

### Mejoras
- **Estructura organizativa por instalación:** el catálogo `mrcCatalog.js` incorpora el campo `estructura` en cada instalación y un mapa `CARGOS_CRITICOS_POR_ESTRUCTURA` con tres tipos:
  - `completa` — estructura estándar: Jefe de Zona, Jefe de Operaciones, Jefe de Frigorífico, Jefe Administrativo.
  - `sin_frigorifico` — sin frigorífico propio: Jefe de Zona, Jefe de Operaciones, Jefe Administrativo. Aplica a: Arica, Calama, Copiapó, San Antonio, Los Ángeles, Valdivia, Osorno.
  - `sin_joperaciones` — estructura reducida: Jefe de Zona, Jefe Administrativo. Aplica a: Hijuelas, Puerto Montt, Punta Arenas.
  - **Jefe Administrativo es obligatorio en todas las estructuras sin excepción.**
- **Helper `getCargosEstructura(nombre)`:** devuelve la lista de cargos críticos según la estructura de la instalación. Usado en `LideresAdminScreen` y `InstalacionDetailScreen`.
- **Semáforo de cobertura actualizado:** `LideresAdminScreen` ahora evalúa vacantes respecto a los cargos requeridos por cada instalación (no un listado global). El texto de leyenda inferior refleja la variabilidad por estructura.
- **Alerta de vacantes en detalle:** `InstalacionDetailScreen` muestra correctamente los cargos vacantes según la estructura de la instalación visitada.
- **Tests centinela ampliados:** `regression-catalog.test.js` cubre estructura por instalación, `CARGOS_CRITICOS_POR_ESTRUCTURA`, helper `getCargosEstructura` con casos borde (instalación inexistente → `completa`). Total: 38 tests pasando.

---

## [1.3.0] — 2026-04-08

### Nuevas Funcionalidades
- **Módulo de Líderes MRC:** registro y directorio de jefaturas por instalación, con dos niveles de acceso.
  - **Vista Directorio (nivel ≥ 2 — Jefe de Despacho en adelante):** muestra nombre, cargo y email de los líderes de la instalación asignada. Botón mailto directo. Modal de reporte de actualización (cargo erróneo, líder nuevo, baja, observación libre) que registra en SharePoint.
  - **Vista Admin (rol administrador):** panel completo con todas las instalaciones, semáforo de cobertura de cargos críticos (verde/amarillo/rojo), búsqueda y filtro por tipo. Pantalla de detalle por instalación con alta, edición y baja de líderes. Historial de cambios colapsable con tipos de movimiento y detalle.
- **Catálogo de cargos MRC (`mrcCatalog.js`):** fuente de verdad interna para los 10 niveles jerárquicos (Ayudante de Despacho → Gerente Comercial), 26 instalaciones (21 sucursales + 5 distribuidoras) y 3 cargos críticos (Jefe de Zona, Jefe de Operaciones, Jefe de Frigorífico). Independiente de Azure AD.
- **Servicio de líderes SharePoint (`lideresService.js`):** auto-creación de listas "Líderes MRC" e "Historial Líderes MRC" al primer uso. CRUD completo con soft-delete (Activo=false), auditoría de cambios y reporte de actualizaciones desde líderes.
- **Store Zustand de líderes (`lideresStore.js`):** estado central con carga lazy por instalación o masiva, acciones de crear/actualizar/dar de baja y carga de historial.
- **Cargo MRC en perfil de usuario:** `useBootstrap` enriquece el perfil con el cargo y nivel real del colaborador desde la lista SharePoint (sobrescribe Azure AD). Se persiste en `userStore` con `mrcNivel`, `mrcCargo` e `instalacionMRC`.
- **Rutas nuevas:** `/unit/:unitType/lideres`, `/admin/lideres`, `/admin/lideres/:instalacion`.
- **Entradas en menú de herramientas:** "Líderes de Instalación" visible para nivel ≥ 2; "Gestión de Líderes" visible solo para administradores.
- **PIN de identificación:** diseñado para cuentas grupales — últimos 4 dígitos del RUT antes del guión (ej. 12.345.678-9 → PIN: 5678). Campo preparado en la lista SharePoint para implementación futura en formularios.

---

## [1.2.9] — 2026-04-04

### Corrección
- **Banner de actualización no aparecía:** el modo `autoUpdate` + `skipWaiting:true` activaba el nuevo Service Worker de inmediato sin pasar por el estado `waiting`, por lo que el `UpdateBanner` nunca se disparaba. Se cambia a `registerType:'prompt'` + `skipWaiting:false` para que el SW espere en estado `waiting` y el banner pueda detectarlo y mostrarse.
- **Imágenes WebP no cacheadas offline:** se agrega `webp` a `globPatterns` de Workbox para que las imágenes convertidas en v1.2.8 sean parte del pre-cache del Service Worker.

---

## [1.2.8] — 2026-04-04

### Optimización de rendimiento
- **Imágenes convertidas a WebP:** `mrc-logo`, `agrosuper-logo` y `agrosuper-logo-color` migrados de PNG a WebP con calidad 92%.
  - `mrc-logo`: 5.1 MB → 836 KB (−84%)
  - `agrosuper-logo-color`: 1.2 MB → 162 KB (−87%)
  - Total imágenes del bundle: de ~6.4 MB a ~1.1 MB (−83%)
- Reduce significativamente el tiempo de carga inicial en terreno (redes móviles).
- Sin impacto visual: resolución y fidelidad de color intactas.

---

## [1.2.7] — 2026-04-04

### Correcciones en Editor de Formularios
- **Bug crítico:** las opciones de tipo `select` (listas desplegables) aparecían en blanco al editar una pregunta. Causa: las opciones estaban definidas como texto simple (`'Arica'`) pero el editor esperaba objetos `{value, label}`. Se agrega normalización automática al abrir el editor.
- Afectaba: "Instalación donde se realizará la Verificación de Reglas de Oro" y todas las preguntas de tipo select con opciones de texto.

---

## [1.2.6] — 2026-04-04

### Nuevas Funcionalidades
- **Difusiones SSO:** nueva pantalla con tres secciones:
  - *Material de la Semana:* descarga de materiales por equipo (OP, ADM, DIST) con links a SharePoint.
  - *Biblioteca:* acceso directo a carpeta de materiales históricos.
  - *Registrar Charla:* formulario de trazabilidad con campos Instalación, Equipo, Turno, Fecha, N° Participantes y carga de hasta 5 archivos (foto + documentos). Crea ítem en lista SharePoint "Difusiones SSO MRC".
- **Prompt de instalación PWA:** ventana emergente de instalación de la app en Android e iOS.
  - Android: usa el evento nativo `beforeinstallprompt` con botón "Instalar app".
  - iOS: instrucciones manuales paso a paso (Compartir → Agregar a pantalla de inicio).
  - Se muestra una vez y se suprime por 14 días al cerrar.
- **Sincronización de formularios vía SharePoint:** los formularios editados desde el perfil Administrador se sincronizan con SharePoint (`mrc-forms-config.json`) y se distribuyen a todos los dispositivos al abrir la app.
  - Arquitectura offline-first: el guardado local es siempre exitoso; la sincronización en la nube es en segundo plano.
  - Protección por timestamp: la nube nunca sobreescribe datos locales más recientes.

### Correcciones
- **Bug crítico (Editor de Formularios):** las preguntas eliminadas volvían a aparecer al reabrir el formulario. Causa: `initQuestions` no leía `override.sections` — caía directo al formulario estático original. Se agrega lectura de `override.sections` antes del fallback estático.
- Logo MRC centrado en pantallas anchas (PC/tablet).
- Texto de pestañas en editor de formularios ahora siempre blanco (era invisible en modo claro).
- MSAL: tokens ahora persistidos en `localStorage` (antes en `sessionStorage`) para no perder la sesión al reabrir la PWA.

---

## [1.2.5] — 2026-03-28

### Mejoras Visuales
- SplashScreen: eliminado marco oscuro del logo MRC (usa `mixBlendMode: screen`).
- SplashScreen: logo Agrosuper con fondo oscuro en modo claro (variable CSS `--logo-pill-bg`).
- SplashScreen: partículas cambiadas a naranja Agrosuper (visible en ambos modos de color).
- SplashScreen: botón INGRESAR ahora naranja con sombra naranja.
- SelectUnitScreen: botones Sucursales y Fuerza de Ventas cambiados a naranja Agrosuper.
- UnitMenuScreen: simplificado — AppHeader usa su avatar + indicador de red nativo.

---

## [1.2.4] — 2026-03-XX

### Correcciones
- Corregida detección de actualizaciones PWA (el banner de actualización ahora aparece correctamente cuando hay una nueva versión disponible).

---

## [1.2.3] — 2026-03-XX

### Nuevas Funcionalidades
- Modo claro habilitado en SplashScreen y SelectUnitScreen.
- Indicador LED de estado de red en todas las pantallas (antes solo en menú principal).

---

## [1.2.2] — 2026-03-XX

### Correcciones
- Modo claro funcionando correctamente en toda la app.
- Restauradas credenciales Azure AD (perdidas en un merge anterior).

---

## [1.2.1] — 2026-03-XX

### Nuevas Funcionalidades
- **Banner de actualización PWA:** notificación en pantalla cuando hay una nueva versión disponible, con botón para actualizar inmediatamente.

---

## [1.2.0] — 2026-03-XX

### Nuevas Funcionalidades
- **Modo claro / oscuro:** toggle en ProfileScreen, persiste en `localStorage`.
- **Indicador de red (LED):** punto verde/rojo/amarillo en AppHeader mostrando estado de conexión en tiempo real.

---

## [1.1.0] — 2026-03-XX

### Mejoras Técnicas
- Versión y fecha de build generadas dinámicamente desde `package.json` y la fecha de compilación (variables `__APP_VERSION__` y `__BUILD_DATE__` inyectadas por Vite).
- `theme-color` de Android actualizado para barra de navegación coherente.
- Preparación para despliegue en Azure Static Web Apps.
- Headers de seguridad añadidos (`staticwebapp.config.json`).

---

## [1.0.0] — 2026-02-XX

### Lanzamiento Inicial
- PWA completa Misión Riesgo Cero para Agrosuper Comercial.
- Autenticación Azure AD (MSAL).
- Formularios: Pauta de Verificación, Reglas de Oro, Inspección Simple, Monitor de Fatiga, Cierre de Condiciones.
- Editor de Formularios para perfil Administrador.
- Módulo CPHS: Programa de Trabajo, carga de fotos/archivos.
- Módulo Gestión Salud.
- Perfil de usuario con foto desde Azure AD.
- Indicadores de turno y metas por sucursal.
- Soporte Sucursales y Fuerza de Ventas con rutas independientes.
