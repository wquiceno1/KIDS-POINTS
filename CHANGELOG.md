# Changelog

Todas las modificaciones notables a este proyecto serán documentadas en este archivo.

## [1.1.0] - 2025-12-15

### ✨ Nuevas Funcionalidades
- **Flujo de Aprobación Parental**:
  - Las tareas completadas por el niño ahora entran en estado **"Pendiente"** y no suman puntos inmediatamente.
  - Nueva sección **"Padres"** protegida por PIN (Por defecto: `1234`).
  - Funcionalidad para **Aprobar** o **Rechazar** tareas individuales.
  - Botón de **"Aprobar Todas"** para agilizar la revisión.
  - Notificaciones visuales de estado de tareas.
- **Sistema de Modales Personalizado**:
  - Se reemplazaron las alertas nativas del navegador (`alert`, `prompt`) por ventanas modales integradas en el diseño.
  - Animaciones suaves de entrada y salida.
  - Mejor experiencia de usuario para ingreso de PIN y mensajes de confirmación.

### 🎨 Interfaz y UX
- **Mejoras en Navegación**:
  - Se restauró el estilo visual original de la barra inferior.
  - Integración armónica del cuarto botón "Padres".
  - Corrección de visibilidad: La vista de padres ahora se cierra correctamente al navegar a otras secciones.
- **Feedback Visual**:
  - Tarjetas de tareas pendientes con borde amarillo distintivo.
  - Mensajes claros al completar tareas o intentar acciones restringidas.

## [1.0.1] - 2025-12-15

### ⚡ Mejoras Técnicas
- **Estrategia de Cache (Service Worker)**: Cambio a "Network First". Ahora la aplicación intenta descargar siempre la versión más reciente desde el servidor/local antes de usar la copia en caché. Esto soluciona problemas donde los cambios en el código no se reflejaban inmediatamente.
- **Sistema de Migración de Estado**:
  - Se implementó una verificación de versión en `loadState()`.
  - Cuando se detecta una nueva versión en el código (ej: cambio de 1.0.0 a 1.0.1), la app actualiza automáticamente las definiciones de **tareas** y **recompensas** en el `localStorage`.
  - **Seguridad de Datos**: El saldo de puntos, el historial de transacciones y la configuración del usuario se preservan intactos durante la actualización.

## [1.0.0] - 2025-12-15

### ✨ Características Nuevas
- **PWA Completa**: Estructura base con `manifest.json` y `Service Worker` para instalación offline.
- **Persistencia**: Sistema de guardado automático en `localStorage` (sin backend).
- **Sistema de Tareas**:
  - Lista de tareas predefinidas con valores de puntos asignados.
  - Indicador visual "✅ Hecho" para tareas completadas en el día actual.
  - Bloqueo de tareas ya realizadas para evitar duplicados diarios.
- **Sistema de Recompensas**:
  - Canje de puntos por minutos de pantalla.
  - **Mejora**: Canje en bloques de **15 y 30 minutos** (anteriormente 1 a 1).
  - Validación de saldo suficiente antes de canjear.
- **Reglas de Negocio**:
  - Límite diario de 90 minutos de pantalla (30 gratis + 60 por puntos).
  - Tope máximo de saldo acumulable (180 puntos).
  - Cálculo automático de minutos usados hoy.
- **Interfaz (UI)**:
  - Diseño responsive "Mobile First".
  - Navegación por pestañas: Hoy, Canjear, Historial.
  - Header fijo con saldo y estado de tiempo de pantalla.
  - Historial de transacciones con diferenciación de colores (ganancias/gastos).

### 🛠️ Técnico
- Implementación SPA (Single Page Application) con Vanilla JS.
- Estilos CSS modernos con variables y animaciones suaves.
- Iconos SVG generados para soporte de PWA adaptable.
