/**
 * ORGANISATOR MODULE - Gestion des tâches et Pomodoro
 */
const OrganisatorModule = {
    tasks: [],
    timerInterval: null,
    timeLeft: 1500, // 25 minutes
    isRunning: false,
    perfChart: null,

    async init() {
        // Chargement des données
        this.tasks = Storage.get('tasks', []);
        
        // Initialisation UI
        this.updateTimerDisplay();
        this.renderTasks();
        this.updateStats();
        
        // Délai pour laisser le DOM se charger avant d'init le graphique
        setTimeout(() => this.initChart(), 50);

        // Date par défaut dans le formulaire
        const dateIn = document.getElementById('dateInput');
        if (dateIn) dateIn.value = new Date().toISOString().split('T')[0];
    },

    // Nettoyage avant de quitter la page
    destroy() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        if (this.perfChart) this.perfChart.destroy();
        this.isRunning = false;
    },

    /* --- LOGIQUE POMODORO --- */
    setTimer(minutes) {
        this.pauseTimer();
        this.timeLeft = minutes * 60;
        this.updateTimerDisplay();
    },

    setCustomTimer() {
        const custom = parseInt(document.getElementById('customTime').value);
        if (custom > 0) this.setTimer(custom);
    },

    startTimer() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            this.updateTimerDisplay();
            if (this.timeLeft <= 0) {
                this.onTimerEnd();
            }
        }, 1000);
    },

    pauseTimer() {
        this.isRunning = false;
        clearInterval(this.timerInterval);
    },

    resetTimer() {
        this.pauseTimer();
        this.timeLeft = 1500;
        this.updateTimerDisplay();
    },

    updateTimerDisplay() {
        const display = document.getElementById('timerDisplay');
        if (!display) return;
        const m = Math.floor(this.timeLeft / 60);
        const s = this.timeLeft % 60;
        display.textContent = `${m}:${s < 10 ? '0' : ''}${s}`;
    },

    onTimerEnd() {
        this.pauseTimer();
        // Notification sonore simple (Bip)
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.5);
        
        alert("Focus terminé ! C'est l'heure de la pause.");
    },

    /* --- GESTION DES TÂCHES --- */
    addTask() {
        const text = document.getElementById('taskInput').value.trim();
        const date = document.getElementById('dateInput').value;
        const priority = document.getElementById('priorityInput').value;
        const type = document.getElementById('typeInput').value;
        const repeat = document.getElementById('repeatInput').checked;

        if (!text || !date) {
            if(window.Toast) Toast.error("Veuillez remplir le titre et la date");
            return;
        }

        this.tasks.push({
            id: Date.now(),
            text, date, priority, type, repeat,
            done: false,
            completedAt: null
        });

        this.saveAndSync();
        document.getElementById('taskInput').value = '';
        this.renderTasks();
        this.updateStats();
    },

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.done = !task.done;
            task.completedAt = task.done ? new Date().toISOString().split('T')[0] : null;
            
            // Effet visuel
            if (task.done) {
                confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
            }

            // Gestion récurrence
            if (task.done && task.repeat) {
                const nextDate = new Date(task.date);
                nextDate.setDate(nextDate.getDate() + 7);
                this.tasks.push({
                    ...task,
                    id: Date.now() + 1,
                    date: nextDate.toISOString().split('T')[0],
                    done: false,
                    completedAt: null
                });
            }

            this.saveAndSync();
            this.renderTasks();
            this.updateStats();
            this.updateChart();
        }
    },

    deleteTask(id) {
        if (!confirm("Supprimer cette tâche ?")) return;
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.saveAndSync();
        this.renderTasks();
        this.updateStats();
        this.updateChart();
    },

    saveAndSync() {
        Storage.set('tasks', this.tasks);
    },

    renderTasks() {
        const container = document.getElementById('taskList');
        if (!container) return;
        
        container.innerHTML = this.tasks.length === 0 ? 
            '<div class="text-center py-4 text-muted">Aucune tâche prévue.</div>' : '';

        // Trier : non terminées en premier
        this.tasks.sort((a,b) => a.done - b.done).forEach(task => {
            const el = document.createElement('div');
            el.className = `task-item task-${task.priority} ${task.done ? 'done' : ''}`;
            el.innerHTML = `
                <input type="checkbox" class="task-checkbox" ${task.done ? 'checked' : ''} onchange="OrganisatorModule.toggleTask(${task.id})">
                <div class="task-content">
                    <div class="task-text">${Utils.escape(task.text)}</div>
                    <div class="task-meta">
                        <span class="badge">${task.type}</span>
                        <span>📅 ${task.date}</span>
                        ${task.repeat ? '<span>🔄</span>' : ''}
                    </div>
                </div>
                <button class="btn btn-ghost btn-sm text-danger" onclick="OrganisatorModule.deleteTask(${task.id})">🗑</button>
            `;
            container.appendChild(el);
        });
    },

    updateStats() {
        const total = this.tasks.length;
        const done = this.tasks.filter(t => t.done).length;
        const percent = total > 0 ? Math.round((done / total) * 100) : 0;

        if (document.getElementById('stat-total')) document.getElementById('stat-total').textContent = total;
        if (document.getElementById('stat-done')) document.getElementById('stat-done').textContent = done;
        if (document.getElementById('stat-percent')) document.getElementById('stat-percent').textContent = percent + '%';
    },

    /* --- CHART --- */
    initChart() {
        const ctx = document.getElementById('perfChart');
        if (!ctx) return;

        this.perfChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [], // Rempli par updateChart
                datasets: [{
                    label: 'Tâches terminées',
                    data: [],
                    borderColor: '#5EB091',
                    backgroundColor: 'rgba(94, 176, 145, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
            }
        });
        this.updateChart();
    },

    updateChart() {
        if (!this.perfChart) return;
        
        const last7Days = [];
        const data = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            last7Days.push(d.toLocaleDateString('fr-FR', {day: '2-digit', month: '2-digit'}));
            data.push(this.tasks.filter(t => t.done && t.completedAt === dateStr).length);
        }

        this.perfChart.data.labels = last7Days;
        this.perfChart.data.datasets[0].data = data;
        this.perfChart.update();
    }
};

window.OrganisatorModule = OrganisatorModule;
