const STORAGE_KEY = "kid-points-app-state-v1";

const defaultState = {
    version: "1.1.1",
    child: { id: "main-child", name: "Campeón", age: 8 },
    tasks: [
        { id: "cuarto", name: "Organizar cuarto", points: 10, category: "casa", active: true, repeatable: false },
        { id: "banarse", name: "Bañarse + aseo completo", points: 10, category: "higiene", active: true, repeatable: false },
        { id: "ropa-interior", name: "Lavar ropa interior", points: 10, category: "higiene", active: true, repeatable: false },
        { id: "tablas", name: "Repasar las tablas", points: 10, category: "estudio", active: true, repeatable: false },
        { id: "leer", name: "Leer 30 minutos", points: 10, category: "estudio", active: true, repeatable: false },
        { id: "platos-propios", name: "Lavar platos propios", points: 5, category: "casa", active: true, repeatable: true },
        { id: "todos-platos", name: "Lavar todos los platos", points: 15, category: "casa", active: true, repeatable: true }
    ],
    rewards: [
        { id: "screen", name: "Minutos pantalla", type: "screen-time", costPoints: 1, unit: "minute" },
        { id: "comida-chatarra", name: "Comida Chatarra", type: "experience", costPoints: 40, unit: "event" },
        { id: "helado", name: "Un Helado", type: "experience", costPoints: 50, unit: "event" }
    ],
    transactions: [],
    settings: {
        dailyFreeScreenMinutes: 30,
        dailyMaxScreenMinutes: 90,
        maxPointBalance: 180,
        currencyName: "puntos",
        locale: "es-CO",
        theme: "system",
        parentPin: "1234" // PIN por defecto
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
                
                // Actualizar tareas, recompensas y configuración nueva
                savedState.tasks = defaultState.tasks;
                savedState.rewards = defaultState.rewards;
                
                // Asegurar que exista settings.parentPin
                if (!savedState.settings.parentPin) {
                    savedState.settings.parentPin = defaultState.settings.parentPin;
                }
                
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

/* --- MODAL SYSTEM --- */
const Modal = {
    elements: {
        backdrop: document.getElementById('app-modal'),
        title: document.getElementById('modal-title'),
        message: document.getElementById('modal-message'),
        inputContainer: document.getElementById('modal-input-container'),
        input: document.getElementById('modal-input'),
        confirmBtn: document.getElementById('modal-confirm'),
        cancelBtn: document.getElementById('modal-cancel')
    },

    init() {
        // Re-bind elements in case DOM wasn't ready
        this.elements.backdrop = document.getElementById('app-modal');
        this.elements.title = document.getElementById('modal-title');
        this.elements.message = document.getElementById('modal-message');
        this.elements.inputContainer = document.getElementById('modal-input-container');
        this.elements.input = document.getElementById('modal-input');
        this.elements.confirmBtn = document.getElementById('modal-confirm');
        this.elements.cancelBtn = document.getElementById('modal-cancel');
    },

    show(options) {
        if (!this.elements.backdrop) this.init();
        
        return new Promise((resolve) => {
            const { title = "Mensaje", message, type = "alert", placeholder = "", inputType = "text" } = options;
            
            this.elements.title.textContent = title;
            this.elements.message.textContent = message;
            this.elements.backdrop.classList.remove('hidden');
            
            // Reset state
            this.elements.inputContainer.classList.add('hidden');
            this.elements.cancelBtn.classList.add('hidden');
            this.elements.input.value = '';
            this.elements.input.type = inputType; // Set input type

            const close = (value) => {
                this.elements.backdrop.classList.add('hidden');
                this.elements.confirmBtn.onclick = null;
                this.elements.cancelBtn.onclick = null;
                this.elements.input.onkeydown = null;
                resolve(value);
            };

            if (type === "prompt") {
                this.elements.inputContainer.classList.remove('hidden');
                this.elements.cancelBtn.classList.remove('hidden');
                this.elements.input.placeholder = placeholder;
                this.elements.input.enterKeyHint = 'done';
                setTimeout(() => this.elements.input.focus(), 100);
                
                this.elements.cancelBtn.onclick = () => close(null);
                this.elements.confirmBtn.onclick = () => close(this.elements.input.value);
                this.elements.input.onkeydown = (event) => {
                    if (event.key === 'Enter') {
                        event.preventDefault();
                        close(this.elements.input.value);
                    }
                };
            } else if (type === "confirm") {
                this.elements.cancelBtn.classList.remove('hidden');
                this.elements.cancelBtn.onclick = () => close(false);
                this.elements.confirmBtn.onclick = () => close(true);
            } else {
                this.elements.confirmBtn.onclick = () => close(true);
            }
        });
    },

    alert(message, title = "Aviso") {
        return this.show({ type: "alert", message, title });
    },

    prompt(message, title = "Ingreso Requerido") {
        return this.show({ type: "prompt", message, title });
    }
};

/* --- FUNCIONES CRÍTICAS (Lógica de Negocio) --- */

function getBalance() {
    // Solo contar transacciones aprobadas o sin estado (compatibilidad)
    return state.transactions.reduce((sum, tx) => {
        // Ignorar pendientes y rechazadas
        if (tx.status === 'pending' || tx.status === 'rejected') return sum;
        return sum + tx.points;
    }, 0);
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
    if (!task) return;

    // Crear transacción pendiente
    const tx = {
        id: crypto.randomUUID(),
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().split(' ')[0],
        type: "earn",
        source: "task",
        taskId: taskId,
        description: task.name,
        points: task.points,
        status: 'pending' // NUEVO: Estado pendiente por defecto
    };

    state.transactions.push(tx);
    
    // No sumamos saldo aún, pero guardamos el estado
    saveState();
    updateUI();
    
    // Feedback visual simple
    Modal.alert(`¡Tarea "${task.name}" enviada a revisión!`, "¡Excelente trabajo!");
}

function approveTask(transactionId) {
    const tx = state.transactions.find(t => t.id === transactionId);
    if (tx && tx.status === 'pending') {
        // Verificar límite de saldo antes de aprobar
        const currentBalance = getBalance();
        const maxPoints = state.settings.maxPointBalance;
        
        if (currentBalance + tx.points > maxPoints) {
            Modal.alert(`No se puede aprobar: Superaría el límite de ${maxPoints} puntos.`, "Límite Excedido");
            return;
        }

        tx.status = 'approved';
        saveState();
        updateUI();
    }
}

function rejectTask(transactionId) {
    const tx = state.transactions.find(t => t.id === transactionId);
    if (tx && tx.status === 'pending') {
        tx.status = 'rejected';
        saveState();
        updateUI();
    }
}

function approveAllTasks() {
    const pending = state.transactions.filter(t => t.status === 'pending');
    let approvedCount = 0;
    
    pending.forEach(tx => {
        const currentBalance = getBalance(); // Recalcular en cada iteración
        if (currentBalance + tx.points <= state.settings.maxPointBalance) {
            tx.status = 'approved';
            approvedCount++;
        }
    });
    
    if (approvedCount > 0) {
        saveState();
        updateUI();
        Modal.alert(`${approvedCount} tareas aprobadas correctamente.`, "Aprobación Masiva");
    } else if (pending.length > 0) {
        Modal.alert("No se pudieron aprobar tareas por límite de saldo.", "Atención");
    }
}

async function checkParentPin() {
    const pin = await Modal.show({
        type: "prompt",
        title: "Acceso Restringido",
        message: "Ingresa el PIN de padres:",
        inputType: "password"
    });
    
    if (pin === state.settings.parentPin) {
        showParentView();
    } else if (pin !== null) {
        Modal.alert("PIN incorrecto", "Error de Acceso");
    }
}

function showParentView() {
    showView('parent');
}

function renderPendingTasks() {
    const container = document.getElementById('pending-list');
    if (!container) return;
    
    const pendingTxs = state.transactions.filter(t => t.status === 'pending' && !t.isReset);
    
    if (pendingTxs.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No hay tareas pendientes de revisión 🎉</p></div>';
        return;
    }

    container.innerHTML = pendingTxs.map(tx => `
        <div class="card pending-card">
            <div class="card-info">
                <h3>${tx.description}</h3>
                <p>+${tx.points} pts • ${tx.time.substring(0,5)}</p>
            </div>
            <div class="card-actions">
                <button class="btn-action spend" style="background-color: #ff4757;" onclick="rejectTask('${tx.id}')">❌</button>
                <button class="btn-action earn" onclick="approveTask('${tx.id}')">✅</button>
            </div>
        </div>
    `).join('');
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
        Modal.alert(`No tienes suficientes puntos. Necesitas ${cost}, tienes ${currentBalance}.`, "Saldo Insuficiente");
        return;
    }

    // Validación 2: Límite diario de pantalla (solo si es recompensa de pantalla)
    if (reward.id === 'screen') {
        const usedToday = getTodayScreenUsed();
        const maxAllowed = state.settings.dailyMaxScreenMinutes - state.settings.dailyFreeScreenMinutes; // 60 min
        
        // Asumimos que cost = minutos (1 punto = 1 minuto)
        if (usedToday + cost > maxAllowed) {
            Modal.alert(`Has alcanzado el límite diario de pantalla extra (${maxAllowed} min). Llevas ${usedToday} min. Solo puedes canjear ${maxAllowed - usedToday} más.`, "Límite Diario");
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
        points: -cost,
        consumed: false // Estado inicial: pendiente de usar
    };

    state.transactions.push(tx);
    saveState();
    console.log(`Recompensa canjeada: ${description} (-${cost} pts)`);
    updateUI();
    Modal.alert("¡Premio canjeado! Revisa tu mochila para usarlo.", "¡Felicidades!");
}

function consumeReward(txId) {
    const tx = state.transactions.find(t => t.id === txId);
    if (!tx) return;

    Modal.show({
        title: "Disfrutar Premio",
        message: `¿Vas a usar "${tx.description}" ahora?`,
        type: "confirm"
    }).then(confirmed => {
        if (confirmed) {
            tx.consumed = true;
            tx.consumedDate = new Date().toISOString();
            saveState();
            updateUI();
            Modal.alert("¡Que lo disfrutes!", "Premio Usado");
        }
    });
}

/* --- INTERFAZ DE USUARIO (UI) --- */

const VIEWS = {
    today: document.getElementById('view-today'),
    rewards: document.getElementById('view-rewards'),
    history: document.getElementById('view-history'),
    parent: document.getElementById('view-parent')
};

function showView(viewName) {
    // Ocultar todas las vistas
    Object.values(VIEWS).forEach(v => {
        if(v) v.classList.add('hidden');
    });
    
    // Mostrar vista seleccionada
    if (VIEWS[viewName]) {
        VIEWS[viewName].classList.remove('hidden');
    }

    // Actualizar botones de navegación
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
        const onclickAttr = btn.getAttribute('onclick');
        
        if (onclickAttr) {
            // Coincidencia directa con el nombre de la vista
            if (onclickAttr.includes(`'${viewName}'`)) {
                btn.classList.add('active');
            }
            // Caso especial para la vista de padres (botón llama a checkParentPin)
            else if (viewName === 'parent' && onclickAttr.includes('checkParentPin')) {
                btn.classList.add('active');
            }
        }
    });

    // Renderizar contenido específico si es necesario
    if (viewName === 'history') renderHistory();
    if (viewName === 'parent') renderPendingTasks();
    if (viewName === 'rewards') renderActiveRewards();
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
    renderActiveRewards(); // Asegurar que se actualice también
    if (VIEWS.parent && !VIEWS.parent.classList.contains('hidden')) {
        renderPendingTasks();
    }
    // renderHistory se llama bajo demanda al cambiar de vista para optimizar
}

function renderActiveRewards() {
    const container = document.getElementById('active-rewards-list');
    const section = document.getElementById('active-rewards-section');
    if (!container || !section) return;

    container.innerHTML = '';
    
    // Filtrar recompensas activas (no consumidas)
    // Ordenar: primero las más antiguas para que las gaste
    const activeRewards = state.transactions.filter(tx => 
        tx.type === 'spend' && 
        tx.source === 'reward' && 
        tx.consumed !== true
    ).sort((a, b) => new Date(a.date + ' ' + a.time) - new Date(b.date + ' ' + b.time));

    if (activeRewards.length === 0) {
        section.classList.add('hidden');
        return;
    }

    section.classList.remove('hidden');

    activeRewards.forEach(tx => {
        const card = document.createElement('div');
        card.className = 'card';
        card.style.borderColor = '#2196F3'; // Azul para diferenciar
        
        card.innerHTML = `
            <div class="card-info">
                <h3 style="color: #1565C0;">${tx.description}</h3>
                <p style="font-size: 0.85em; color: #555;">Obtenido: ${tx.date}</p>
            </div>
            <button class="btn-action" style="background-color: #2196F3;" onclick="consumeReward('${tx.id}')">Usar</button>
        `;
        container.appendChild(card);
    });
}

function renderTasks() {
    const container = document.getElementById('task-list');
    container.innerHTML = '';

    const today = new Date().toISOString().split('T')[0];
    const todayTaskTxs = state.transactions.filter(tx => tx.date === today && tx.source === "task" && !tx.isReset);

    state.tasks.forEach(task => {
        if (!task.active) return;

        const taskTxs = todayTaskTxs
            .filter(tx => tx.taskId === task.id)
            .sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time));
        const latestTx = taskTxs[0];
        const isPending = latestTx?.status === 'pending';
        const isCompleted = latestTx && latestTx.status !== 'pending' && latestTx.status !== 'rejected';
        
        const card = document.createElement('div');
        card.className = `card task-card ${isCompleted ? 'completed' : ''} ${isPending ? 'pending' : ''}`;
        
        let actionButton = '';
        if (isPending) {
            actionButton = '<div class="pending-badge">⏳ Pendiente</div>';
        } else if (isCompleted) {
            actionButton = '<div class="completion-badge">✅ Aprobado</div>';
        } else {
             actionButton = `<button class="btn-action" onclick="completeTask('${task.id}')">Hecho</button>`;
        }

        card.innerHTML = `
            <div class="card-info">
                <h3>${task.name}</h3>
                <p>${task.category} • +${task.points} pts</p>
            </div>
            ${actionButton}
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

async function resetDailyTasks() {
    // Confirmación de seguridad
    const confirmed = await Modal.show({
        title: "⚠️ ¿Estás seguro?",
        message: "Esto reiniciará el estado de las tareas de hoy para que se puedan realizar nuevamente. Los puntos ganados se mantendrán.",
        type: "confirm" // Usamos el modal estándar con cancelar
    }).then(res => res === true); // Si da click en aceptar devuelve true

    // Nota: El método show actual devuelve true/false si es tipo alert/confirm implícito
    // Pero mi implementación de show devuelve true en confirmBtn y null en cancelBtn/backdrop
    // Vamos a ajustar la lógica o usar un confirm explícito si fuera necesario.
    // Revisando mi implementación de Modal.show:
    // cancelBtn.onclick => close(null)
    // confirmBtn.onclick => close(true)
    // Así que si confirmed === true, procedemos.
    
    if (!confirmed) return;

    const today = new Date().toISOString().split('T')[0];
    let count = 0;
    
    // Marcamos como reseteadas las transacciones de tareas de hoy
    state.transactions = state.transactions.map(tx => {
        if (tx.date === today && tx.source === 'task') {
            // Verificar si la tarea asociada es repetible
            const task = state.tasks.find(t => t.id === tx.taskId);
            
            // Si la tarea existe y es repetible, la reseteamos (para borrar contador)
            // Si la tarea NO es repetible, NO la reseteamos (se queda como "Hecho" permanentemente por hoy)
            if (task && task.repeatable === true) {
                count++;
                return { ...tx, isReset: true };
            }
        }
        return tx;
    });

    if (count > 0) {
        saveState();
        updateUI(); // Esto actualizará las listas pero mantendrá el saldo
        Modal.alert("Las tareas han sido habilitadas nuevamente.", "Reinicio Exitoso");
    } else {
        Modal.alert("No había tareas registradas hoy para reiniciar.", "Información");
    }
}

// Inicializar UI al cargar
document.addEventListener('DOMContentLoaded', () => {
    updateUI();
    showView('today'); // Vista por defecto
});
