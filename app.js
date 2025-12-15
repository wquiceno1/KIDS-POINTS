const STORAGE_KEY = "kid-points-app-state-v1";

const defaultState = {
    version: "1.0.1",
    child: { id: "main-child", name: "Celeste", age: 8 },
    tasks: [
        { id: "cuarto", name: "Organizar cuarto", points: 10, category: "casa", active: true },
        { id: "banarse", name: "Bañarse + aseo completo", points: 10, category: "higiene", active: true },
        { id: "ropa-interior", name: "Lavar ropa interior", points: 10, category: "higiene", active: true },
        { id: "tablas", name: "Repasar las tablas", points: 10, category: "estudio", active: true },
        { id: "tablas", name: "Leer 30 minutos", points: 10, category: "estudio", active: true },
        { id: "platos-propios", name: "Lavar platos propios", points: 5, category: "casa", active: true },
        { id: "todos-platos", name: "Lavar todos los platos", points: 15, category: "casa", active: true }
    ],
    rewards: [
        { id: "screen", name: "Minutos pantalla", type: "screen-time", costPoints: 1, unit: "minute" },
        { id: "comida", name: "Comida Chatarra", type: "experience", costPoints: 40, unit: "event" },
        { id: "comida", name: "Un Helado", type: "experience", costPoints: 50, unit: "event" }
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

let state = loadState();

function loadState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const savedState = JSON.parse(raw);
            console.log('Estado cargado desde LocalStorage');
            
            // Verificación de versión para actualizar definiciones
            if (savedState.version !== defaultState.version) {
                console.log(`Versión detectada (${savedState.version}) es antigua. Actualizando a ${defaultState.version}...`);
                
                // Actualizar tareas y recompensas (manteniendo transacciones y configuración)
                savedState.tasks = defaultState.tasks;
                savedState.rewards = defaultState.rewards;
                savedState.version = defaultState.version;
                
                // Guardar el estado actualizado inmediatamente
                localStorage.setItem(STORAGE_KEY, JSON.stringify(savedState));
                return savedState;
            }
            
            return savedState;
        }
    } catch (e) {
        console.error('Error cargando estado:', e);
    }
    console.log('Usando estado por defecto');
    return JSON.parse(JSON.stringify(defaultState)); // Deep copy to avoid reference issues
}

function saveState() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        console.log('Estado guardado');
    } catch (e) {
        console.error('Error guardando estado:', e);
    }
}

// Inicialización para pruebas
console.log('Estado actual:', state);

/* --- FUNCIONES CRÍTICAS (Lógica de Negocio) --- */

function getBalance() {
    return state.transactions.reduce((sum, tx) => sum + tx.points, 0);
}

function getTodayScreenUsed() {
    const today = new Date().toISOString().split('T')[0];
    return Math.abs(state.transactions
        .filter(tx => tx.date === today && tx.source === "reward" && tx.rewardId === "screen")
        .reduce((sum, tx) => sum + tx.points, 0));
}

function enforceMaxBalance() {
    const balance = getBalance();
    if (balance > state.settings.maxPointBalance) {
        const excess = balance - state.settings.maxPointBalance;
        const tx = {
            id: crypto.randomUUID(),
            date: new Date().toISOString().split('T')[0],
            time: new Date().toTimeString().split(' ')[0],
            type: "adjust",
            source: "manual",
            description: `Exceso eliminado: ${excess} puntos`,
            points: -excess
        };
        state.transactions.push(tx);
        console.log(`Balance excedido. Ajuste realizado: -${excess}`);
    }
}

function completeTask(taskId) {
    const task = state.tasks.find(t => t.id === taskId && t.active);
    if (!task) {
        console.error(`Tarea ${taskId} no encontrada o inactiva`);
        return;
    }

    const tx = {
        id: crypto.randomUUID(),
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().split(' ')[0],
        type: "earn",
        source: "task",
        taskId: taskId,
        description: task.name,
        points: task.points
    };

    state.transactions.push(tx);
    enforceMaxBalance(); // Verificar tope de saldo
    saveState();
    console.log(`Tarea completada: ${task.name} (+${task.points} pts)`);
    updateUI(); // Se implementará más adelante
}

function redeemReward(rewardId, amount = null) {
    const reward = state.rewards.find(r => r.id === rewardId);
    if (!reward) {
        console.error(`Recompensa ${rewardId} no encontrada`);
        return;
    }

    // Determinar el costo real
    const cost = amount ? amount : reward.costPoints;
    const description = amount ? `${reward.name} (${amount} min)` : reward.name;

    const currentBalance = getBalance();
    
    // Validación 1: Saldo suficiente
    if (currentBalance < cost) {
        alert(`No tienes suficientes puntos. Necesitas ${cost}, tienes ${currentBalance}.`);
        return;
    }

    // Validación 2: Límite diario de pantalla (solo si es recompensa de pantalla)
    if (reward.id === 'screen') {
        const usedToday = getTodayScreenUsed();
        const maxAllowed = state.settings.dailyMaxScreenMinutes - state.settings.dailyFreeScreenMinutes; // 60 min
        
        // Asumimos que cost = minutos (1 punto = 1 minuto)
        if (usedToday + cost > maxAllowed) {
            alert(`Has alcanzado el límite diario de pantalla extra (${maxAllowed} min). Llevas ${usedToday} min. Solo puedes canjear ${maxAllowed - usedToday} más.`);
            return;
        }
    }

    const tx = {
        id: crypto.randomUUID(),
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().split(' ')[0],
        type: "spend",
        source: "reward",
        rewardId: rewardId,
        description: description,
        points: -cost
    };

    state.transactions.push(tx);
    saveState();
    console.log(`Recompensa canjeada: ${description} (-${cost} pts)`);
    updateUI();
}

/* --- INTERFAZ DE USUARIO (UI) --- */

const VIEWS = {
    today: document.getElementById('view-today'),
    rewards: document.getElementById('view-rewards'),
    history: document.getElementById('view-history')
};

function showView(viewName) {
    // Ocultar todas las vistas
    Object.values(VIEWS).forEach(v => v.classList.add('hidden'));
    
    // Mostrar vista seleccionada
    VIEWS[viewName].classList.remove('hidden');

    // Actualizar botones de navegación
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('onclick').includes(viewName)) {
            btn.classList.add('active');
        }
    });

    // Renderizar contenido específico si es necesario
    if (viewName === 'history') renderHistory();
}

function updateUI() {
    const balance = getBalance();
    
    // Actualizar header
    document.getElementById('header-balance').textContent = balance;
    document.getElementById('rewards-balance').textContent = balance;
    document.getElementById('header-screen-time').textContent = getTodayScreenUsed();
    
    // Actualizar listas
    renderTasks();
    renderRewards();
    // renderHistory se llama bajo demanda al cambiar de vista para optimizar
}

function renderTasks() {
    const container = document.getElementById('task-list');
    container.innerHTML = '';

    const today = new Date().toISOString().split('T')[0];
    
    // Obtener tareas completadas hoy
    const completedTaskIds = state.transactions
        .filter(tx => tx.date === today && tx.source === "task")
        .map(tx => tx.taskId);

    state.tasks.forEach(task => {
        if (!task.active) return;

        const isCompleted = completedTaskIds.includes(task.id);
        const card = document.createElement('div');
        card.className = `card task-card ${isCompleted ? 'completed' : ''}`;
        
        card.innerHTML = `
            <div class="card-info">
                <h3>${task.name}</h3>
                <p>${task.category} • +${task.points} pts</p>
            </div>
            ${isCompleted 
                ? '<div class="completion-badge">✅ Hecho</div>' 
                : `<button class="btn-action" onclick="completeTask('${task.id}')">Hecho</button>`
            }
        `;
        container.appendChild(card);
    });
}

function renderRewards() {
    const container = document.getElementById('reward-list');
    container.innerHTML = '';
    const balance = getBalance();

    state.rewards.forEach(reward => {
        const canAfford = balance >= reward.costPoints;
        const card = document.createElement('div');
        card.className = 'card';
        
        // Si es recompensa de pantalla, mostrar opciones de bloques
        if (reward.id === 'screen') {
            card.innerHTML = `
                <div class="card-info">
                    <h3>${reward.name}</h3>
                    <p>Costo: 1 pto = 1 min</p>
                </div>
                <div style="display:flex; gap:5px;">
                    <button class="btn-action spend" 
                            onclick="redeemReward('${reward.id}', 15)"
                            ${balance < 15 ? 'disabled' : ''}>
                        15m
                    </button>
                    <button class="btn-action spend" 
                            onclick="redeemReward('${reward.id}', 30)"
                            ${balance < 30 ? 'disabled' : ''}>
                        30m
                    </button>
                </div>
            `;
        } else {
            // Recompensa estándar (comida, etc)
            card.innerHTML = `
                <div class="card-info">
                    <h3>${reward.name}</h3>
                    <p>Costo: ${reward.costPoints} pts</p>
                </div>
                <button class="btn-action spend" 
                        onclick="redeemReward('${reward.id}')"
                        ${!canAfford ? 'disabled' : ''}>
                    Canjear
                </button>
            `;
        }
        
        container.appendChild(card);
    });
}

function renderHistory() {
    const container = document.getElementById('history-list');
    container.innerHTML = '';

    // Ordenar transacciones: más recientes primero
    const sortedTx = [...state.transactions].sort((a, b) => {
        return new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time);
    });

    if (sortedTx.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#888;">No hay movimientos aún</p>';
        return;
    }

    sortedTx.forEach(tx => {
        const isPositive = tx.points > 0;
        const sign = isPositive ? '+' : '';
        const colorClass = isPositive ? 'points-plus' : 'points-minus';
        
        const item = document.createElement('div');
        item.className = `history-item ${tx.type}`;
        item.innerHTML = `
            <div class="history-details">
                <strong>${tx.description || 'Movimiento'}</strong>
                <span class="history-time">${tx.date} • ${tx.time.substring(0,5)}</span>
            </div>
            <div class="history-points ${colorClass}">
                ${sign}${tx.points} pts
            </div>
        `;
        container.appendChild(item);
    });
}

// Inicializar UI al cargar
document.addEventListener('DOMContentLoaded', () => {
    updateUI();
    showView('today'); // Vista por defecto
});


