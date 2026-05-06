# Changelog — Misión Riesgo Cero (MRC)

Registro de todos los cambios, correcciones y nuevas funcionalidades por versión.
Formato: `[versión] — YYYY-MM-DD`

---

## [1.9.28] — 2026-05-06

### Actualización de la app — detección proactiva y verificación manual

#### Mejora de fiabilidad (UpdateBanner)
- **Chequeo al volver al frente:** `UpdateBanner` ahora escucha `visibilitychange` y llama a `registration.update()` cada vez que la app pasa de oculta a visible. Resuelve el caso principal del piloto: usuarios que no abrían la app durante días y no veían el banner porque el SW nuevo ya estaba en `waiting` pero nunca se detectaba al "despertar" la PWA.
- **Registro compartido del SW:** se exporta `getSharedRegistration()` desde `UpdateBanner.jsx` para que otros componentes accedan al registro sin duplicar la suscripción a `navigator.serviceWorker.ready`.

#### Nueva funcionalidad (ProfileScreen)
- **Tarjeta "Versión de la aplicación":** nueva sección en Mi Perfil con tres estados: *verificar*, *al día*, *actualización disponible*. El botón **VERIFICAR ACTUALIZACIÓN** fuerza `registration.update()` y aguarda 600ms para que el SW transite a `installed`. Si se detecta una versión nueva, la tarjeta cambia a estado azul con botón **ACTUALIZAR AHORA** que aplica `SKIP_WAITING` directamente — sin necesitar el banner flotante. Visible para todos los usuarios en producción (oculto en dev mode).

#### Archivos modificados
- `src/components/ui/UpdateBanner.jsx` — visibilitychange + export `getSharedRegistration`
- `src/screens/ProfileScreen.jsx` — componente `AppVersionCard`

---

## [1.9.27] — 2026-05-05

### Difusiones SSO — ajustes previos a producción (7 mejoras)

#### Fix crítico
- **URLs sincronizadas entre dispositivos:** las URLs de material semanal y biblioteca ahora viajan dentro de `mrc-forms-config.json` en SharePoint. `formEditorStore._syncToCloud` incluye `urlLinks: getAllLinks()` en el payload; `pullFromCloud` restaura los links via `restoreLinks(data.urlLinks)`. Cualquier dispositivo que abra la app después de que el admin configure los enlaces los recibirá automáticamente.

#### Correcciones
- **Semana completa en encabezado:** el rango de fechas ahora muestra lunes → domingo (era lunes → viernes). Corregido en `getWeekInfo()` usando `sunday = monday + 6`.
- **Fecha no futura:** el selector de fecha en el formulario de registro tiene `max={todayISO()}`. El dispositivo bloquea la selección de fechas futuras a nivel nativo.
- **Adjuntos alineados con Inspección Simple:** el servicio `difusionesService.js` usa `resolveSiteId()` y sube archivos a `/MRC-Fotos/difusiones/{YYYY-MM}/`. La `webUrl` de SharePoint se guarda en `ArchivosAdjuntos`, mismo formato que las fotos de Inspección Simple.

#### Funcionalidades nuevas
- **Instalación como selector desplegable:** reemplaza el campo de texto libre. Lista las 26 instalaciones del catálogo `INSTALACIONES_MRC` agrupadas en Sucursales y Distribuidoras.
- **Selección jerárquica de Equipo:** flujo de 3 niveles con animación:
  1. Tipo: Sucursales | Distribuidoras
  2. Área: Operaciones | Administración *(Sucursales)* — Operaciones | Administración | Ventas *(Distribuidoras)*
  3. Turno *(solo Operaciones)*: Mañana | Tarde | Noche
  Se guarda en SharePoint como `"Sucursal - Operaciones"`, `"Distribuidora - Ventas"`, etc.
- **Navegación entre semanas pasadas:** flechas ‹ › en la tarjeta de Material de Difusión para revisar material histórico (hasta 12 semanas atrás). El historial se construye automáticamente: al actualizar un enlace en Conexiones SharePoint, el valor anterior queda archivado bajo su clave de semana (`semana-op-2026-W18`).

#### Archivos modificados
- `src/screens/DifusionesSSOScreen.jsx` — reescritura completa de la pantalla
- `src/services/difusionesService.js` — resolveSiteId + ruta MRC-Fotos
- `src/services/urlLinksService.js` — `restoreLinks()`, `getWeekKey()`, `getLinkForWeekOffset()`, archivado automático en `saveLink()`
- `src/store/formEditorStore.js` — incluye `urlLinks` en sync bidireccional

---

## [1.9.26] — 2026-05-03

### Fix — Categoría 'Nuevo Reporte' en lista Inspección Simple

- `sharepointData.js` — `mapCondicionDesdeCaminata`: columna `Categor_x00ed_a` cambia de `` `Caminata — {área}` `` a `'Nuevo Reporte'`.
- `sharepointData.js` — `mapInspeccionSimple`: columna `Categor_x00ed_a` cambia de `'Inspección Simple'` a `'Nuevo Reporte'`.
- El valor `'Nuevo Reporte'` es el disparador del flujo Power Automate que genera el documento codificado y lo envía a los líderes. Aplica a todos los registros que ingresan a la lista Inspección Simple, tanto desde el formulario directo como desde condición insegura detectada en Caminata de Seguridad.
- El sistema de correos Correo 1-8 (enriquecimiento desde Gestión de Líderes) ya se aplicaba a ambos formularios vía `applyLideresEmails`. Requiere que las columnas `Correo_x0020_1` a `Correo_x0020_8` existan en las listas SharePoint correspondientes.

---

### Inspección Simple — reescritura completa del formulario

El formulario de Inspección Simple fue rediseñado desde cero para registrar directamente condiciones inseguras en instalaciones, alineando su estructura con el bloque de condición insegura de la Caminata de Seguridad.

#### Cambios funcionales

- **Sección DATOS GENERALES:**
  - `is_instalacion` — selector desplegable con las 28 instalaciones (misma lista que la Pauta de Verificación Reglas de Oro).
  - `is_condicion` — pregunta SÍ / NO "¿Identifica alguna condición insegura en las instalaciones?". Si la respuesta es **NO**, el formulario finaliza aquí.
- **Sección CONDICIÓN INSEGURA** (visible solo si respuesta = SÍ):
  - Lugar específico donde se identificó la condición.
  - Descripción detallada de la condición insegura.
  - Fotografía obligatoria (máx. 1).
  - Checkbox de incidentes posibles (14 opciones: atrapamientos, caídas, contactos eléctricos, golpes, etc.).
  - Medida de control a implementar.
  - Área responsable, nombre y correo electrónico del responsable.
  - Fecha de compromiso de ejecución.

#### Cambios técnicos

- `formDefinitions.js` — `inspeccion-simple` reescrito. `supersededSections: ['s1','s2','s3']` previene que overrides del formulario v1 contaminen la nueva estructura tras sync de nube.
- `sharepointData.js` — `mapInspeccionSimple` actualizado: usa `is_instalacion || sub.branch` para `Instalaci_x00f3_n` y mapea los nuevos campos a las mismas columnas SharePoint que `mapCondicionDesdeCaminata` (`Lugar_x0020_Especifico`, `Condici_x00f3_n_x0020_Insegura`, `Incidentes_x0020_Posibles`, `Medida_x0020_de_x0020_Control`, `_x00c1_rea_x0020_Responsable`, `Nombre_x0020_Responsable`, `Correo_x0020_Responsable`, `Fecha_x0020_Compromiso`). El código de reporte pasa de `IS-XX-` a `IS-{3 letras instalación}-`.
- `sharepointData.js` — detección de branch para enriquecimiento de líderes (Correo 1-8) ampliada: `Q1 || cs_instalacion || is_instalacion || branch`.
- Test centinela `regression-sharepoint-errors.test.js` actualizado para reflejar la nueva cadena de detección.

---

### Navegador de semanas en Estatus Diario V2

Permite al equipo de prevención revisar el estatus de semanas anteriores directamente desde la pantalla `DailyStatusScreenV2`, sin salir de la pantalla ni necesitar SharePoint.

#### Cambios funcionales

- **Barra de navegación semanal** en la vista "Todas las sucursales": flechas `←` `→` para retroceder o avanzar entre semanas. El botón `→` queda deshabilitado cuando se está en la semana actual. El badge "SEM N" y la etiqueta de fecha se actualizan en tiempo real al cambiar de semana.
- **Rango de fechas legible** en el header: cuando se visualiza una semana pasada, la fecha del encabezado muestra el rango "22 abr – 28 abr" en lugar de "Hoy".
- **Sin auto-refresh para semanas pasadas**: el intervalo de actualización automática (2 min) solo se activa cuando se está en la semana actual (`weekOffset === 0`). Semanas históricas se cargan una sola vez.
- **Generador de imagen PNG** (botón Descargar) usa el número de semana correcto en el nombre del archivo y en el título de la imagen.

#### Cambios técnicos

- `sharepointData.js` — `weekStartISO(weekOffset)` y nueva `weekEndISO(weekOffset)`: calculan el rango lunes-a-lunes de cualquier semana pasada o presente. `fetchTodayKPIsAllBranches(weekOffset)` filtra items por rango `[weekStart, weekEnd)` en lugar de solo límite inferior; el mock varía su seed por semana para simular datos históricos distintos.
- `useKPIs.js` — `useKPIsAllBranches()` gestiona estado `weekOffset` internamente y expone `goToPrevWeek`, `goToNextWeek`, `canGoNext`.
- `DailyStatusScreenV2.jsx` — `getWeekNumber(weekOffset)` y nueva `getWeekDateRange(weekOffset)` calculan número ISO y rango legible de cualquier semana relativa a hoy.

---

## [1.9.25] — 2026-05-03

### Fix — Pautas ADM: lector de KPIs ahora usa columna Área como fallback

- **Problema:** registros existentes en SharePoint con `Turno` vacío y `Área = "Área Administrativa Sucursal"` no eran contabilizados en `pautas.ADM` de `DailyStatusScreenV2`.
- **Fix:** `fetchTodayKPIsAllBranches` ahora solicita también el campo `_x00c1_rea` (Área). Cuando `Turno` está vacío, si el Área es administrativa se clasifica el registro como ADM. Aplica a todos los datos históricos existentes en SharePoint.
- La corrección v1.9.24 (mapper) sigue vigente para que nuevos envíos ya lleguen con `Turno: 'Administración'`.

---

## [1.9.24] — 2026-05-03

### Fix — Pautas área administrativa no contabilizadas en Estatus Diario

- **Bug:** el KPI `pautas.ADM` en `DailyStatusScreenV2` siempre marcaba cero aunque existieran envíos del área administrativa.
- **Causa:** al seleccionar "Área Administrativa Sucursal" en Q18, la pregunta Q19 (Turno) queda oculta → el mapper guardaba `Turno: ''` en SharePoint. El contador de KPIs busca `'Administración'` en ese campo; al llegar vacío, nunca incrementaba el acumulador ADM.
- **Fix:** en `mapReglasOroSucursales` (`sharepointData.js`), cuando Q19 está vacío y Q18 es administrativa, se persiste `Turno: 'Administración'` → el reader de KPIs lo contabiliza correctamente en `pautas.ADM`.

---

## [1.9.23] — 2026-05-02

### Caminata de Seguridad — Correcciones de CIERRE, etiquetas y colores de carta

- **Fix CIERRE de conducta:** la sección "CIERRE DE OBSERVACIÓN DE CONDUCTA" ahora aparece correctamente tras SIN OBSERVACIONES + retro positiva comunicada, y también tras CON OBSERVACIONES + retro correctiva. Cada temática tiene su propio bloque `_cierre` ubicado inmediatamente después de su sección de conducta (no al final del formulario).
- **Fix etiqueta carta de amonestación:** la pregunta "¿Amerita carta de amonestación?" ahora muestra su título correctamente (antes solo aparecían los botones sin contexto).
- **Fix colores carta:** opción NO en verde, opción SÍ en rojo.
- **Fix CIERRE con retro NO comunicada:** si se responde "NO" a *¿Se comunicó el resultado de la retroalimentación POSITIVA?*, el bloque CIERRE ya no se despliega.

### Evidencia fotográfica — Rediseño de feedback visual

- Las fotos adjuntadas ahora se muestran como previsualizaciones a ancho completo (antes eran miniaturas 88×88 px difíciles de notar en móvil).
- Badge verde "Foto adjuntada" con ícono `CheckCircle2` superpuesto sobre la imagen.
- Botón rojo X de 30 px para eliminar la foto.
- Botón "Cambiar foto" cuando se alcanzó el límite de fotos permitido.

---

## [1.9.20] — 2026-05-01

### Caminata de Seguridad — Retroalimentación positiva/correctiva + mejoras de UX

#### Conductas: flujo bifurcado según resultado de observación

Cada sección de conducta ahora distingue dos caminos tras la evaluación:

- **SIN OBSERVACIONES** → aparece bloque "RETROALIMENTACIÓN POSITIVA": radio *¿Se comunicó la retroalimentación al colaborador?* + texto *Describa la retroalimentación positiva realizada*
- **CON OBSERVACIONES** → aparece bloque "RETROALIMENTACIÓN CORRECTIVA": radio *¿Amerita carta de amonestación?* + texto *Describa la retroalimentación correctiva realizada*

En ambos casos, al finalizar la observación se muestra la sección compartida **CIERRE DE OBSERVACIÓN DE CONDUCTA** con Nombre y RUT del colaborador observado (los campos individuales de nombre/RUT por sección fueron eliminados y consolidados aquí).

#### Foto de condición insegura — ahora obligatoria y más visible

- `_cond_foto` movida a la 3ª posición de cada bloque de condiciones (antes de la pregunta de incidentes)
- Marcada como **requerida** en todas las temáticas
- Label destacado con emoji de cámara: *📷 FOTOGRAFÍA DE LA CONDICIÓN INSEGURA*
- Subtítulo de advertencia: *Evite fotografiar directamente el rostro de personal Agrosuper*

#### Selector de fecha nativo

El campo *Fecha de compromiso de ejecución* (`_cond_fecha`) ahora usa un `<input type="date">` con calendario nativo del sistema operativo (antes era un textarea libre).

#### Título en checkbox de incidentes

El bloque de checkbox de incidentes posibles ahora muestra correctamente su label como encabezado (regresión en `QuestionCheckbox` donde solo se renderizaba el `subtitle` pero no el `label`).

---

## [1.9.19] — 2026-05-01

### Caminata de Seguridad — Condición Insegura enriquecida + doble cola SharePoint

#### Bloque de condiciones rediseñado (9 campos por temática)

Cuando el usuario marca **CON OBSERVACIONES** en la fase de condiciones, ahora se despliegan 9 preguntas detalladas (antes era solo un radio "¿realizó reporte?"):
- Lugar específico donde se detectó la condición
- Descripción de la condición insegura
- Incidentes posibles (checkbox con 14 opciones estándar SSO)
- Foto adjunta (opcional)
- Medida de control a implementar
- Área responsable de la medida
- Nombre y correo del responsable
- Fecha de compromiso de ejecución

#### Doble cola SharePoint (Option C)

Al enviar un formulario de Caminata con condición insegura detectada, la app encola **dos ítems independientes**:
1. Resumen completo → lista **Caminata de Seguridad** (comportamiento existente, sin reporte obsoleto)
2. Detalle de la condición → lista **Inspección Simple** (`formType: 'caminata-seguridad-condicion'`)

Cada ítem tiene reintentos independientes offline. El segundo ítem incluye `linkedTo` para agrupación visual futura.

#### Correcciones incluidas

- **Bug secciones antiguas (mobile):** Las secciones s1–s4 del override cloud ya no aparecen acopladas al final del formulario nuevo. Causa raíz: el bloque de append en FormScreen no verificaba `supersededSecs` antes del fallback `|| s`.
- **`mapCaminataSeguridad`:** eliminada columna obsoleta "¿Realizó reporte inspección?"; el mapper ya no busca `_reporte` keys.
- **Fotos en `caminata-seguridad-condicion`:** `submitFormToSharePoint` detecta y adjunta fotos de `_cond_foto` automáticamente.

---

## [1.9.18] — 2026-05-01

### Formulario Caminata de Seguridad — Reconstrucción completa

El formulario "Caminata de Seguridad" fue reconstruido desde cero para reflejar el formulario oficial SSO Agrosuper (PDF de 33 páginas, ~109 preguntas con ramificación compleja).

#### Estructura (26 secciones, 94 preguntas)

- **Identificación:** pregunta de instalación (28 sucursales) + selección de área (5 áreas)
- **Frigorífico:** 6 temáticas → bloque conducta (radio p1 + checkbox desviaciones con severidad GRAVE + radio carta amonestación + campos nombre/RUT/observaciones) + bloque condiciones (radio p2 + radio reporte)
- **Oficinas Administrativas:** 3 temáticas → mismo patrón conducta + condiciones
- **Sala de Máquinas:** solo condiciones (10 ítems), sin temática ni verificación conductual
- **Sala de Baterías y Áreas Comunes:** conducta + condiciones sin selección de temática

#### Mapper dinámico SharePoint

`mapCaminataSeguridad()` reescrito con pattern matching sobre sufijos de clave (`_p1`, `_desvio`, `_carta`, `_nombre`, `_rut`, `_obs`, `_p2`, `_reporte`). Compatible automáticamente con temáticas nuevas agregadas desde el Editor de Formularios.

#### Compatibilidad hacia atrás

`supersededSections: ['s1','s2','s3','s4']` invalida overrides con la estructura genérica anterior.

---

## [1.9.17] — 2026-04-30

### Sistema de Visibilidad de Pantallas — 3 niveles de restricción (Control de Admin)

El administrador puede controlar el acceso a cada pantalla de la app con tres niveles de restricción, sin necesidad de modificar código ni hacer redeploy.

#### Los tres modos

| Modo | Valor interno | Comportamiento |
|---|---|---|
| **HABILITADA** | `null` | Todos los perfiles acceden normalmente |
| **SOLO USUARIOS** | `'users'` | Usuarios regulares bloqueados; administradores acceden con banner naranja de aviso |
| **TODOS** | `'all'` | Bloqueada para todos los perfiles sin excepción, incluyendo administradores |

#### Funcionalidad

- **Panel de control:** nueva tarjeta "Visibilidad de Pantallas" (badge ADMIN, icono Eye) en ToolsMenuScreen → ruta `/admin/screen-visibility`.
- **16 pantallas configurables** agrupadas en dos secciones: Menú Principal (6) y Herramientas Preventivas (10).
- **Selector segmentado de 3 botones** por pantalla: HABILITADA (verde) / SOLO USUARIOS (naranja) / TODOS (rojo).
- **Indicador de dot** por pantalla refleja el modo activo con el color correspondiente.
- **Menús:** pantallas bloqueadas aparecen grisáceas con badge "NO DISPONIBLE" (`opacity: 0.45`, `grayscale`). Admins ven el badge pero pueden hacer click si el modo es `'users'`.
- **Acceso directo por URL:** `ScreenGuard` intercepta la ruta y muestra página de bloqueo (🔒) o banner naranja según el modo y el perfil.

#### Arquitectura técnica

- **`src/config/screenRegistry.js`** — registro estático de las 16 pantallas con `key`, `label` y `menu` (`principal` / `herramientas`). Fuente de verdad.
- **`src/store/screenVisibilityStore.js`** — Zustand store con `persist` (clave localStorage: `mrc-screen-visibility`). API: `setScreenMode(key, mode)`, `getScreenMode(key)` → `null | 'users' | 'all'`, `isScreenDisabled(key)` (compat), `setDisabledScreens(map)` (bulk, usado por pullFromCloud). Retrocompatibilidad: valor `true` legacy se interpreta como `'all'`.
- **`src/components/ui/ScreenGuard.jsx`** — wrapper de rutas con lógica tres vías: `all` → bloqueo total, `users` + !isAdmin → bloqueo, `users` + isAdmin → banner naranja + contenido, `null` → pass-through.
- **`src/screens/ScreenVisibilityAdminScreen.jsx`** — panel admin con `ModeSelector` (3 botones), dot indicador por fila, sublabel descriptivo del modo activo e indicador de sync al pie.
- **Sincronización con SharePoint:** `disabledScreens` viaja dentro de `mrc-forms-config.json` (mismo pipeline y archivo que formularios). Sin archivo nuevo, sin dependencia adicional.
- **`MenuCard`:** prop `disabled` aplica opacidad 45%, filtro grayscale, icono gris `#4B5563`, badge en rojo (`rgba(239,68,68,0.15)`) y oculta el chevron.

#### Pantallas configurables

| Grupo | Keys |
|---|---|
| Menú Principal | `tools`, `status`, `analytics`, `goals`, `cphs`, `salud` |
| Herramientas Preventivas | `pauta-verificacion-reglas-oro`, `caminata-seguridad`, `inspeccion-simple`, `difusiones-sso`, `cierre-condiciones`, `monitor-fatiga`, `contratistas`, `observacion-conductual`, `inspeccion-planificada`, `lideres` |

#### Tests centinela
224 tests (0 fallos) cubren: screenRegistry keys, screenVisibilityStore API (`setScreenMode`/`getScreenMode`/3 modos/compat legacy), formEditorStore sync (`disabledScreens` en payload, `setDisabledScreens` en pull), ScreenGuard tres vías, App.jsx rutas + ScreenGuard wrappers, MenuCard prop disabled, ScreenVisibilityAdminScreen panel.

---

## [1.9.16] — 2026-04-30 (actualizado 2)

### Enriquecimiento automático de correos desde Gestión de Líderes

Al enviar cualquier formulario (Pauta de Verificación, Caminata de Seguridad, Inspección Simple, Observación Conductual, etc.), el servicio `sharepointData.js` consulta automáticamente el módulo **Gestión de Líderes** para la instalación detectada y popula las columnas de correo en SharePoint, activando los flujos de Power Automate de notificación a jefaturas.

#### Mapeo cargo → columna SharePoint

| Columna SharePoint | Cargo MRC |
|---|---|
| Correo 1, 2, 3 | Jefe de Despacho (hasta 3 por sucursal) |
| Correo 4 | Jefe de Frigorífico |
| Correo 5 | Jefe de Operaciones |
| Correo 6 | Jefe Administrativo |
| Correo 7 | Jefe de Zona |
| Correo 8 | Subgerente de Zona |

#### Implementación técnica
- **`buildLideresEmailMap(lideres)`** — agrupa los líderes por `cargoMRC` → `{ cargo: [emails] }`.
- **`fetchLideresEmailMap(branch)`** — consulta `getLideres(branch)` de forma async; si falla (offline, sin permisos), devuelve `{}` sin bloquear el envío.
- **`applyLideresEmails(fields, lideresMap)`** — escribe Correo 1-8 en el objeto `fields` del POST a SharePoint, siempre sobreescribiendo (los líderes son la fuente de verdad).
- El enriquecimiento se ejecuta en `submitFormToSharePoint` después del mapper estático y las columnas del editor, aplicando a **todos los formularios** sin modificar ningún mapper individual.

#### Fix: prioridad de instalación
La instalación se detecta como `submission.answers?.Q1 || submission.branch`. Q1 tiene prioridad porque en la Pauta de Verificación el usuario puede seleccionar una sucursal distinta a la de su perfil. Para formularios sin Q1 (Caminata, Inspección) el fallback a `submission.branch` funciona igual.

#### Tests centinela
7 tests nuevos (197 total, 0 fallos) validan el mapeo de cargos, la prioridad de detección de instalación y la integración con `submitFormToSharePoint`.

---

## [1.9.16] — 2026-04-30 (actualizado)

### Reglas de Oro 8/9/10 + reestructura de cierre + fix editor

#### Reglas de Oro N°8, N°9 y N°10 — Área Operaciones
Se agregaron las tres reglas faltantes al formulario "Pauta de Verificación de Reglas de Oro". Cada regla sigue el patrón exacto de op1–op7: sección gateada a Q20, pregunta radio SIN/CON OBSERVACIONES con `conductasList`, y pregunta checkbox de conductas desviadas visible solo al marcar CON OBSERVACIONES.

- **N°8 — Orden y Aseo:** Q54 (radio) + Q55 (checkbox, 6 conductas NORMAL)
- **N°9 — No Interactuar con Equipos en Movimiento:** Q56 (radio) + Q57 (checkbox, 2 conductas GRAVE)
- **N°10 — Informar Incidentes y Accidentes:** Q58 (radio) + Q59 (checkbox, 4 conductas GRAVE)

#### Reestructura del cierre en 3 secciones independientes
La sección monolítica `cierre` fue dividida en tres secciones con visibilidad propia, eliminando la ambigüedad de qué preguntas pertenecían a cada ruta:

| Sección | Visibilidad | Preguntas |
|---|---|---|
| `retro_positiva` — RETROALIMENTACIÓN POSITIVA | Cualquier respuesta = SIN_OBSERVACIONES | Q46 (yesno, sin N/A) + Q51 (texto) |
| `retro_correctiva` — RETROALIMENTACIÓN CORRECTIVA | Cualquier respuesta = CON_OBSERVACIONES | Q48 (yesno, sin N/A) + Q53 (texto) |
| `cierre_final` — CIERRE | Cualquier respuesta = SIN o CON | Q49 (nombre colaborador) + Q50 (RUT) |

Mecanismo `supersededSections: ['cierre']` en la definición estática para que FormScreen ignore la sección `cierre` guardada en overrides anteriores y use las tres nuevas.

#### Eliminación permanente de Q16
`permanentlyRemovedQuestions: ['Q16']` impide que la pregunta "Nombre COORDINADOR SIGAS / JEFE DE CALIDAD" reaparezca tras sync con SharePoint.

#### Fix: Q46 sin opción N/A
`disableNA: true` en Q46 (retroalimentación positiva). El componente `QuestionYesNo` ya soportaba este flag.

#### Fix: editor bloqueaba guardado con formularios sin override
`validateForm` interpretaba las opciones almacenadas como strings (formato estático) como "opción sin texto", generando errores falsos que bloqueaban el guardado al intentar asignar columnas SharePoint. Ahora normaliza strings y objetos `{value, label}` por igual.

#### Mejora interna: FormScreen hereda tipo y opciones estáticas al hacer merge
Cuando el estático tiene más opciones que el override (nuevas reglas agregadas después de guardar), las opciones estáticas ganan automáticamente sin necesidad de resetear el override.

#### Fix: columnas SharePoint vacías no recibían el valor configurado en el editor
El loop que aplica los `spColumn` del editor usaba `fields[col] !== undefined` como condición de salto. El mapper hardcodeado inicializa varios campos como cadena vacía `''` (no `undefined`), lo que impedía que las asignaciones del editor surtieran efecto para `Nombre_x0020_Colaborador`, `Conducta_x0020_Observada` y cualquier otro campo que el mapper dejara vacío. Cambiado a evaluación truthy (`fields[col]`): ahora el editor puede llenar un campo vacío, pero no sobreescribe un campo que el mapper ya completó con un valor real.

---

## [1.9.15] — 2026-04-27 (segunda entrega)

### Editor 100% fiable + asignación de listas SharePoint a formularios custom

**Problema raíz resuelto:** el editor acumulaba cinco defectos estructurales que, combinados, provocaban que preguntas nuevas (ej. Q52/Q53) aparecieran siempre en el formulario sin importar la selección del usuario, y que los formularios creados desde "NUEVO FORMULARIO" enviaran los registros a ningún lado (lista SharePoint no asignada → pérdida silenciosa de datos).

#### F1 — Herencia automática de condición de visibilidad de sección a pregunta
`emptyQuestion` ya asignaba `_section`, pero no copiaba la `visibleCondition` de la sección. Ahora `addQuestion` detecta si la sección destino tiene `visibleCondition` y la copia a la pregunta nueva. Efecto: una pregunta creada en "REGLA N°8" nace ya condicional a Q20="N°8 …" — el bug de Q52/Q53 se vuelve estructuralmente imposible.

#### F2 — Modal obligatorio al crear sección en formulario gateado
`addSection` ahora detecta si todas las secciones existentes tienen gating (`visibleCondition` de override o `visibleWhen` del estático). Si lo están, abre automáticamente el modal "VISIBILIDAD DE SECCIÓN" después de crear la nueva sección. El admin puede elegir "Visible siempre" como decisión consciente, pero no puede ignorar la pregunta.

#### F3 — Condiciones estáticas visibles en el editor
`parseVisibleWhen(fn)` parsea mediante regex las funciones `visibleWhen` del estático y las convierte a objetos `visibleCondition` serializables. `initSections` llama este parser y expone el resultado como `_staticVisibleCondition` (solo display, nunca persistido). Las secciones estáticas muestran un badge azul **[estático]** en el editor; el botón Eye refleja el estado con color diferenciado (azul = heredado, naranja = override).

#### F4 — `validateForm` detecta gating inconsistente
Nueva regla: si >50 % de las secciones de un formulario tienen gating, una sección o pregunta sin él genera un *warning* explícito antes de guardar ("Sección X aparecerá siempre — ¿es intencional?"). El admin puede "Guardar igual" como bypass consciente.

#### F5 — Macro "Agregar Regla de Oro" (template atómico)
Para formularios con `metadata.template === 'reglas-oro'`, el gestor de secciones muestra el botón "AGREGAR REGLA DE ORO (TEMPLATE)". Un modal pide número, área (OP/ADM), nombre y conductas, y crea atómicamente:
1. Opción nueva en Q20 (OP) o Q21 (ADM)
2. Sección con `visibleCondition` cableada al nuevo valor
3. Pregunta radio con misma condición y opciones SIN/CON OBSERVACIONES
4. Pregunta checkbox con `conductasList` y condición adicional para "CON OBSERVACIONES"

Todo gateado, consistente, en una sola transacción. Imposible generar piezas huérfanas.

#### Catálogo único de listas SharePoint (`sharepointLists.js`)
`src/services/sharepointLists.js` es ahora la **fuente única de verdad** para los 8 GUIDs de listas SharePoint. Elimina la triple duplicación anterior entre `LIST_IDS`, `CONNECTIONS` y `getListConfig`. Exporta `SHAREPOINT_LISTS`, `SHAREPOINT_LIST_BY_KEY`, `SHAREPOINT_LIST_BY_GUID` y helpers.

#### Formularios custom — lista SharePoint obligatoria al crear
`NewFormModal` en `FormEditorListScreen` ahora requiere elegir la lista destino antes de crear. Dropdown con las 8 listas conocidas + opción "GUID personalizado" con validación de formato. Si no se elige lista, el botón "Crear" bloquea con error visible.

#### `getListConfig` con fallback para custom forms
`getListConfig` ahora resuelve también formularios no presentes en el mapa estático: lee `customForms[formType].listId` desde el store y usa `mapGenericFromOverride` para construir el payload a partir de los `spColumn` declarados por pregunta. `resolveListConfig(formType)` es la función pública para validar externamente.

#### Panel "Conexión SharePoint" en el editor
Nueva pestaña **CONEXIÓN SP** en `FormEditorDetailScreen` con dos secciones:
- **ConexionSharePointPanel:** muestra la lista asignada actual (nombre + GUID), botón "Cambiar lista", botón "LEER COLUMNAS". Persiste vía `saveConnectionOverride` para estáticos, `updateCustomForm` para custom.
- **ArchiveFormPanel:** botón rojo "Archivar formulario" con modal de confirmación. Setea `archived: true` en `editedForms[formId]`. El formulario desaparece del menú de usuarios sin destruir el override — reversible desde el editor.

#### Filtrado de archivados en `ToolsMenuScreen`
`tools` y `customTools` excluyen formularios con `archived: true` en sus respectivos stores. Los usuarios no ven el formulario archivado; el admin sí lo ve en el editor con badge "ARCHIVADO".

#### Fail-loud en `FormScreen`
Ambos modos (WizardMode y SectionsMode) verifican `resolveListConfig(formType)` antes de `addToPendingQueue`. Si no hay lista asignada y no es dev mode, se bloquea el envío con modal visible: "SIN LISTA SHAREPOINT — contacta al administrador". Convierte la pérdida silenciosa de datos en un error visible.

#### Tests centinela
34 tests nuevos (176 total, 0 fallos) cubren F1–F5, catálogo de listas, NewFormModal, ConexionSharePointPanel, archive flag, ToolsMenuScreen y fail-loud.

---

## [1.9.15] — 2026-04-27

### Editor de formularios — visibilidad condicional configurable

**Problema resuelto:** las preguntas Q52/Q53 agregadas para una nueva regla (ej. "REGLA N°8") aparecían siempre en el formulario porque las secciones nuevas no tenían cómo configurar `visibleWhen` (las funciones JS no se serializan al guardar el override en SharePoint/localStorage).

**Solución — condición de visibilidad serializable.** El editor permite ahora declarar, tanto a nivel de sección como de pregunta, una condición del tipo `{ questionId, equals }`. Esa condición:

- Se persiste íntegra en el override (`override.sections[i].visibleCondition` o `q.visibleCondition`).
- Sobrevive a SharePoint sync, hard backup y JSON.stringify.
- Es reconstruida como una función `visibleWhen` en `FormScreen` mediante el helper `buildVisibleFn`. Soporta `equals`, `in: [...]`, y combinadores `all` / `any`.

**UI agregada:**
- En la pestaña "Secciones" del editor, cada tarjeta tiene un botón ojo (Eye). Al click abre el modal "VISIBILIDAD DE SECCIÓN" con un toggle, dropdown de pregunta controladora (filtra a tipos `select`/`radio`) y dropdown del valor esperado.
- En el panel de edición de una pregunta individual, mismo control bajo "Mostrar solo si otra pregunta tiene cierto valor".
- Una sección con condición activa muestra debajo del título: "Visible si Q20 = N°8 ...".

**Pre-condición para que aparezca la sección "REGLA N°8":** el admin debe agregar la opción "N°8 ..." al dropdown de Q20 (o crear la pregunta controladora) — eso ya era posible desde el editor de pregunta.

**Tests centinela:** se agrega test que valida la presencia de `buildVisibleFn` y `visibleCondition` en `FormScreen`.

---

## [1.9.14] — 2026-04-27

### Editor de formularios — override autoritativo en el editor + gestión de secciones

**1. Q16 ya no reaparece al reabrir el editor**

`initQuestions` mezclaba `staticForm.sections` con `override.sections` como red de seguridad. El efecto colateral: preguntas eliminadas del override (ej. Q16 en pauta-verificacion-reglas-oro) volvían a aparecer al reabrir el editor, y al siguiente guardado se reinsertaban en el override. Ahora el override es la única fuente de verdad — alineado con la regla v1.9.12 que ya regía en `FormScreen`. El estático solo se usa como semilla cuando no existe override aún.

**2. Nueva pestaña "Secciones" — CRUD completo**

Se agregó un gestor de secciones para formularios seccionados (no Wizard). Permite:
- **Agregar** una sección nueva con título editable.
- **Renombrar** inline (click EDITAR → input → Enter).
- **Reordenar** con flechas ▲▼.
- **Eliminar** con modal de confirmación que pide a qué sección reasignar las preguntas que tenía (no se descartan).

El estado `sectionsState` se persiste como `override.sections` en `mrc-forms-config.json` — sin cambios en el contrato con SharePoint. El selector de sección al crear una pregunta y el dropdown del panel de edición leen de este estado, no del estático. Esto resuelve el caso de la nueva regla de oro (Q53) que no podía asignarse a la sección correcta.

**3. Tests centinela**

- Test contra el retorno del merge "estático + override" en `initQuestions`.
- Test que valida la presencia de `SectionsManager`, `addSection`, `renameSection`, `moveSection`, `deleteSection`.
- Test que `handleSaveConfirmed` persiste `sectionsState.map(...)` y no `staticForm.sections.map(...)`.

### Estatus Diario V2 — reparación de regresión del push del 25-abr

El commit `bc72e181` reemplazó el header custom V2 por `<AppHeader rightAction={…}>`. Resultado: el contenedor de `rightAction` (44 px) recortaba SYNC + botón de descarga, y se perdía la jerarquía visual del título "Estatus diario" + badge "SEM N" + fecha que distinguía V2 del resto de pantallas.

Se restauró el header custom y se agregó un botón **ChevronLeft naranja** a la izquierda que invoca `useNavigation().goBack()`. SYNC indicator y botón de descarga vuelven a su sitio original. Layout V2 (KPIs, leyenda, tabla por sucursal) intacto.

---

## [1.9.13] — 2026-04-25

### Pregunta tipo RUT — teclado nativo y fix de cursor

**Teclado nativo del dispositivo:** La pregunta de tipo RUT reemplaza el teclado virtual personalizado por un `<input>` nativo con `inputMode="text"` y `autoCapitalize="characters"`. El sistema operativo muestra su teclado habitual; en iOS la K se capitaliza automáticamente. El formato `XX.XXX.XXX-K` se aplica en tiempo real mientras se escribe, y la validación Módulo 11 muestra borde verde/rojo con etiqueta ✓/✗ inline.

**Fix cursor al borrar/editar:** Al borrar o editar en medio del RUT, el cursor ya no saltaba al inicio. Se implementó rastreo de posición lógica: antes del re-render se cuenta cuántos dígitos reales hay a la izquierda del cursor, y con `requestAnimationFrame` se reposiciona el cursor en el mismo lugar dentro del nuevo string formateado.

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
