# Changelog — Misión Riesgo Cero (MRC)

Registro de todos los cambios, correcciones y nuevas funcionalidades por versión.
Formato: `[versión] — YYYY-MM-DD`

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
