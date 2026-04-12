# Changelog — Misión Riesgo Cero (MRC)

Registro de todos los cambios, correcciones y nuevas funcionalidades por versión.
Formato: `[versión] — YYYY-MM-DD`

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
