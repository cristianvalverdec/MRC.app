# Changelog — Misión Riesgo Cero (MRC)

Registro de todos los cambios, correcciones y nuevas funcionalidades por versión.
Formato: `[versión] — YYYY-MM-DD`

---

## [Pendiente de versión] — 2026-04-22

### Correcciones — Editor de Formularios y Formulario Pauta Verificación Reglas de Oro

- **Bug: preguntas nuevas agregadas por el admin se perdían al guardar (ej. Q48).** `emptyQuestion()` en `FormEditorDetailScreen` no asignaba `_section` a la pregunta creada. Al guardar, `handleSave` agrupa las preguntas por sección filtrando `q._section === s.id`; como la pregunta nueva tenía `_section: undefined`, era excluida de todas las secciones silenciosamente (el toast de éxito aparecía igual). Al recargar el editor la pregunta había desaparecido. Se corrige asignando `_section` y `_sectionTitle` en `addQuestion()`, infiriendo la sección de la última pregunta de la lista (o la primera sección estática si la lista está vacía). Solo afecta formularios seccionados; el modo wizard queda sin cambios.

- **Bug: respuestas del área incorrecta contaminaban el registro enviado a SharePoint.** Al rellenar el formulario seleccionando primero "Área Operaciones Sucursal" (completando Q19, Q20 y secciones op1-op7) y luego cambiando Q18 a "Área Administrativa Sucursal", las respuestas ya ingresadas para Operaciones permanecían en el estado de React aunque las preguntas quedaran ocultas por `visibleWhen`. Esas respuestas se guardaban en el borrador (localStorage) y se enviaban a SharePoint junto con las respuestas de Administración, produciendo un registro mezclado. Se corrige en dos capas: (1) `handleChange` en `SectionsMode` ahora recalcula las preguntas visibles con el nuevo estado y descarta inmediatamente las respuestas de preguntas ocultas, evitando que el borrador se contamine; (2) `handleSubmit` filtra el objeto `answers` al conjunto de preguntas visibles en el momento del envío, como red de seguridad para borradores creados antes del fix.

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
