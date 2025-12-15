# 🌟 Kids Points - Sistema de Recompensas

![Versión](https://img.shields.io/badge/versión-1.1.0-brightgreen)
![Estado](https://img.shields.io/badge/estado-funcional-blue)
![PWA](https://img.shields.io/badge/PWA-Ready-orange)

Una aplicación web progresiva (PWA) diseñada para motivar a los niños a realizar sus tareas diarias mediante un sistema de gamificación simple y efectivo. Sin servidores, sin complicaciones, todo se guarda en tu dispositivo.

---

## 📱 Descripción

**Kids Points** es una herramienta digital que reemplaza las tablas de puntos en papel. Permite a los padres y niños llevar un registro transparente de:
*   **Tareas completadas:** Organizar el cuarto, tareas escolares, higiene, etc.
*   **Puntos ganados:** Cada tarea tiene un valor asignado.
*   **Recompensas:** Los puntos se canjean principalmente por tiempo de pantalla (TV, Tablet, Videojuegos) u otros premios configurables.

La aplicación está diseñada con un enfoque **Mobile First**, ideal para instalarse en el celular o tablet del niño y funcionar como una app nativa.

## ✨ Características Principales

*   **🏆 Gamificación Diaria:** Interfaz visual atractiva para marcar tareas.
*   **💾 100% Offline:** Funciona sin internet. Los datos se guardan en el almacenamiento local del dispositivo (`LocalStorage`).
*   **👨‍👩‍👧‍👦 Control Parental:**
    *   Las tareas completadas requieren **aprobación** (protegida por PIN).
    *   PIN por defecto: `1234` (Configurable en código).
*   **🎁 Canje Inteligente:**
    *   Sistema de bloques de 15 y 30 minutos para tiempo de pantalla.
    *   Límites diarios automáticos (Ej: Máximo 90 min de pantalla al día).
    *   Validación de saldo insuficiente.
*   **📊 Historial Transparente:** Registro detallado de cada punto ganado y gastado.
*   **� PWA Instalable:** Puedes "Instalar" la webapp en tu pantalla de inicio (Android/iOS) y usarla a pantalla completa.

## 🚀 Cómo Funciona

1.  **El Niño/a:**
    *   Entra a la app y ve sus tareas del día.
    *   Marca las tareas que ha realizado ("Organizar cuarto", "Bañarse").
    *   La tarea queda en estado **"En Revisión"** (borde amarillo).

2.  **El Padre/Madre:**
    *   Entra a la sección **"Padres"** (candado 🔒) e ingresa el PIN.
    *   Revisa las tareas marcadas.
    *   **Aprueba (✅)** si está bien hecha (los puntos se suman al saldo).
    *   **Rechaza (❌)** si no se cumplió correctamente.

3.  **Canje:**
    *   El niño va a la pestaña **"Premios"**.
    *   Elige su recompensa (ej: "30 min de Tablet").
    *   Si tiene saldo y no ha superado el límite diario, se descuentan los puntos y ¡a disfrutar!

## 🛠️ Tecnologías

Este proyecto está construido con tecnologías web estándar, lo que garantiza rapidez, compatibilidad y cero dependencias complejas.

*   **HTML5 Semántico**
*   **CSS3 Moderno** (Variables, Flexbox, Animaciones)
*   **JavaScript (ES6+)** Vanilla (Sin frameworks)
*   **Service Worker:** Para capacidades offline y caché.

## ⚙️ Instalación y Uso

No requieres instalar nada en un servidor.

1.  **Opción A (Local):**
    *   Descarga el código.
    *   Abre el archivo `index.html` en tu navegador.

2.  **Opción B (Hosting Estático - Recomendado):**
    *   [Abre la URL en tu celular](https://wquiceno1.github.io/KIDS-POINTS/).
    *   En el menú del navegador, selecciona **"Agregar a pantalla de inicio"** o **"Instalar App"**.

## 📝 Configuración Personalizada

Para cambiar las tareas, los valores de puntos o el PIN, edita el archivo `app.js` en la sección `defaultState`:

```javascript
const defaultState = {
    // ...
    child: { id: "main-child", name: "Campeón", age: 8 },
    tasks: [
        { id: "cuarto", name: "Organizar cuarto", points: 10 ... },
        // Agrega o quita tareas aquí
    ],
    settings: {
        maxPoints: 100,
        parentPin: "1234" // <- Tu PIN aquí
    }
};
```

*Nota: Al cambiar la versión en `app.js` (ej: de 1.1.0 a 1.1.1), el sistema actualizará automáticamente las tareas en los dispositivos donde ya se usa la app.*

---

Hecho con ❤️ para fomentar buenos hábitos.
