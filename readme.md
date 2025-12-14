# 🚀 Desarrollo Completo PWA - Sistema de Puntos para Niños

## 📋 1. OBJETIVO DEL PROYECTO

**PWA responsive** que funciona en PC, celular y tablet **sin backend**.  
Sistema de puntos para niño de 8 años: gana puntos por tareas → canjea por minutos de pantalla y recompensas.  
**Persistencia**: LocalStorage con un único objeto JSON de estado global.

---

## 🎯 2. REGLAS FUNCIONALES CLAVE

### 💰 Moneda y límites
1 punto = 1 minuto de pantalla extra
30 min gratis diarios (después de almorzar + deberes)
Máximo diario: 90 min total (30 gratis + 60 por puntos)
Tope saldo: 180 puntos acumulados

text

### ✅ Tareas base (configurable)
| Tarea                        | Puntos |
|------------------------------|--------|
| Organizar cuarto             | 10     |
| Bañarse + aseo completo      | 10     |
| Lavar ropa interior          | 5      |
| Cada tabla multiplicar       | 5      |
| Lavar platos propios         | 5      |
| Lavar todos los platos       | 15     |

### ⚖️ Condiciones
- **Solo puntos por iniciativa propia** (1 recordatorio máximo)
- Sin puntos si hay peleas/múltiples recordatorios
- Historial completo de ganancias/gastos

---

## 🏗️ 3. ARQUITECTURA TÉCNICA

Frontend: HTML + CSS + JS vanilla (SPA simple)
Persistencia: LocalStorage ("kid-points-app-state-v1")
PWA: manifest.json + Service Worker (cache offline)
Hosting: GitHub Pages/Netlify/Vercel

text

---

## 💾 4. MODELO DE DATOS COMPLETO

### AppState raíz (JSON único)
const STORAGE_KEY = "kid-points-app-state-v1";

const defaultState = {
version: "1.0.0",
child: { id: "main-child", name: "Nombre", age: 8 },
tasks: [
{ id: "cuarto", name: "Organizar cuarto", points: 10, category: "casa", active: true },
{ id: "banarse", name: "Bañarse + aseo", points: 10, category: "higiene", active: true },
// ... más tareas
],
rewards: [
{ id: "screen", name: "Minutos pantalla", type: "screen-time", costPoints: 1, unit: "minute" },
{ id: "comida", name: "Elegir comida", type: "experience", costPoints: 40, unit: "event" }
],
transactions: [],
settings: {
dailyFreeScreenMinutes: 30,
dailyMaxScreenMinutes: 90,
maxPointBalance: 180,
currencyName: "puntos",
locale: "es-CO",
theme: "system"
}
};

text

### Tipos principales
type TaskDefinition = {
id: string; name: string; points: number;
category: "higiene"|"estudio"|"casa"|"extra"; active: boolean;
};

type PointTransaction = {
id: string; date: string; time: string;
type: "earn"|"spend"|"adjust";
source: "task"|"reward"|"manual";
taskId?: string; rewardId?: string;
points: number; // + earn, - spend
};

text

---

## 🚀 5. PASOS DE DESARROLLO SECUENCIAL

### PASO 1: Estructura de archivos
📁 proyecto/
├── index.html
├── style.css
├── app.js
├── manifest.json
├── sw.js
├── icons/
│ ├── icon-192.png
│ └── icon-512.png

text

### PASO 2: Persistencia básica
// app.js
const STORAGE_KEY = "kid-points-app-state-v1";
let state = loadState();

function loadState() {
try {
const raw = localStorage.getItem(STORAGE_KEY);
return raw ? JSON.parse(raw) : defaultState;
} catch {
return defaultState;
}
}

function saveState() {
localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

text

### PASO 3: Funciones críticas
// Cálculos
function getBalance() {
return state.transactions.reduce((sum, tx) => sum + tx.points, 0);
}

function completeTask(taskId) {
const task = state.tasks.find(t => t.id === taskId && t.active);
if (!task) return;

const tx = {
id: crypto.randomUUID(),
date: new Date().toISOString().split('T'),
time: new Date().toTimeString().split(' '),
type: "earn", source: "task", taskId,
points: task.points
};

state.transactions.push(tx);
enforceMaxBalance();
saveState();
updateUI();
}

function getTodayScreenUsed() {
const today = new Date().toISOString().split('T');
return Math.abs(state.transactions
.filter(tx => tx.date === today && tx.source === "reward" && tx.rewardId === "screen")
.reduce((sum, tx) => sum + tx.points, 0));
}

text

### PASO 4: Vistas SPA (navegación simple)
const VIEWS = {
today: document.getElementById('today-view'),
rewards: document.getElementById('rewards-view'),
history: document.getElementById('history-view'),
config: document.getElementById('config-view')
};

function showView(viewName) {
Object.values(VIEWS).forEach(v => v.classList.add('hidden'));
VIEWS[viewName].classList.remove('hidden');
}

text

### PASO 5: PWA mínima viable

**manifest.json**
{
"name": "Sistema de Puntos",
"short_name": "Puntos",
"start_url": "/",
"display": "standalone",
"background_color": "#ffffff",
"theme_color": "#4CAF50",
"icons": [
{ "src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
{ "src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
]
}

text

**sw.js (Service Worker)**
const CACHE_NAME = 'puntos-v1';
const urlsToCache = ['/', '/style.css', '/app.js'];

self.addEventListener('install', event => {
event.waitUntil(
caches.open(CACHE_NAME)
.then(cache => cache.addAll(urlsToCache))
);
});

self.addEventListener('fetch', event => {
event.respondWith(
caches.match(event.request)
.then(response => response || fetch(event.request))
);
});

text

### PASO 6: Validaciones críticas
function canSpend(points) {
return getBalance() >= points
&& getTodayScreenUsed() + points <= state.settings.dailyMaxScreenMinutes - state.settings.dailyFreeScreenMinutes;
}

function enforceMaxBalance() {
const balance = getBalance();
if (balance > state.settings.maxPointBalance) {
// Crear transacción de ajuste automático
const excess = balance - state.settings.maxPointBalance;
state.transactions.push({
id: crypto.randomUUID(), date: new Date().toISOString().split('T'),
time: new Date().toTimeString().split(' '), type: "adjust",
source: "manual", description: Exceso eliminado: ${excess} puntos,
points: -excess
});
}
}

text

---

## 🎨 6. UI MOBILE-FIRST SUGERIDA

┌─────────────────────────┐
│ [Nombre] 💰 123 pts │ ← Header fijo
│ ⏰ Hoy: 45/90 min │
├─────────────────────────┤
│ 📱 Hoy │ ← Botones navegación
│ 🎁 Recompensas 📊 Hist.│
├─────────────────────────┤
│ ✅ Tareas del día │
│ - Organizar cuarto [✓] │
│ - Bañarse [ ] 10pts │
│ │
│ 💎 Saldo: 123 puntos │
└─────────────────────────┘

text

---

## ✅ 7. CHECKLIST DE COMPLETUD

- [ ] ✅ Estado carga/guarda correctamente
- [ ] ✅ Tareas completan → suman puntos
- [ ] ✅ Recompensas respetan límites
- [ ] ✅ Historial diario/semanal
- [ ] ✅ PWA instalable (móvil/desktop)
- [ ] ✅ Funciona 100% offline
- [ ] ✅ Responsive todos dispositivos
- [ ] ✅ Español completo (es-CO)

---

## 📦 8. DESPLIEGUE

1. Subir archivos a **GitHub Pages** / **Netlify** / **Vercel**
2. Abrir en Chrome → DevTools → Application → Install PWA
3. Probar offline desconectando internet

**¡Listo para usar en familia!** 🎉