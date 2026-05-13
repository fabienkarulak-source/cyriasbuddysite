/**
 * ANALYTICS MODULE
 */
const AnalyticsModule = {
  charts: {},

  async init() {
    this.render();
    document.getElementById('ana-refresh')?.addEventListener('click', () => {
      this.render();
      if(window.Toast) Toast.success('Actualisé');
    });
  },

  // ⚡ Fonction indispensable pour éviter que le Router plante
  destroy() {
    Object.values(this.charts).forEach(chart => {
      if (chart) chart.destroy();
    });
    this.charts = {};
  },

  render() {
    this.renderStats();
    this.renderCharts();
    this.renderStorage();
  },

  renderStats() {
    const kanban = Storage.get('kanban', { tasks: [] });
    const tasks = kanban.tasks || [];
    const journal = Storage.get('journal', []);
    
    const now = Date.now();
    const day30 = now - 30 * 24 * 60 * 60 * 1000;

    const tasks30 = tasks.filter(t => new Date(t.createdAt).getTime() > day30);
    const done30 = tasks.filter(t => t.status === 'done' && new Date(t.updatedAt || t.createdAt).getTime() > day30);
    const journal30 = journal.filter(j => new Date(j.date).getTime() > day30);
    const velocity = Math.round(done30.length / 4.3);

    if(document.getElementById('ana-tasks-30')) document.getElementById('ana-tasks-30').textContent = tasks30.length;
    if(document.getElementById('ana-done-30')) document.getElementById('ana-done-30').textContent = done30.length;
    if(document.getElementById('ana-velocity')) document.getElementById('ana-velocity').textContent = velocity;
    if(document.getElementById('ana-journal-30')) document.getElementById('ana-journal-30').textContent = journal30.length;
  },

  renderCharts() {
    if (typeof Chart === 'undefined') return;

    const kanban = Storage.get('kanban', { tasks: [] });
    const tasks = kanban.tasks || [];
    
    const ctx1 = document.getElementById('chart-tasks');
    if (ctx1) {
      if (this.charts.tasks) this.charts.tasks.destroy();
      const counts = { todo: 0, 'in-progress': 0, review: 0, done: 0 };
      tasks.forEach(t => { counts[t.status || 'todo'] = (counts[t.status || 'todo'] || 0) + 1; });
      
      this.charts.tasks = new Chart(ctx1, {
        type: 'doughnut',
        data: {
          labels: ['À faire', 'En cours', 'En revue', 'Terminé'],
          datasets: [{ data: [counts.todo, counts['in-progress'], counts.review, counts.done], backgroundColor: ['#94A3B8', '#3B82F6', '#F59E0B', '#22C55E'] }]
        },
        options: { responsive: true, maintainAspectRatio: false }
      });
    }

    const ctx2 = document.getElementById('chart-activity');
    if (ctx2) {
      if (this.charts.activity) this.charts.activity.destroy();
      const journal = Storage.get('journal', []);
      const labels = [], dataT = [], dataJ = [];
      
      for (let i = 29; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000);
        const day = d.toISOString().split('T')[0];
        labels.push(d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }));
        dataT.push(tasks.filter(t => t.createdAt?.startsWith(day)).length);
        dataJ.push(journal.filter(j => j.date?.startsWith(day)).length);
      }
      
      this.charts.activity = new Chart(ctx2, {
        type: 'line',
        data: {
          labels,
          datasets: [
            { label: 'Tâches', data: dataT, borderColor: '#5EB091', backgroundColor: 'rgba(94,176,145,0.1)', tension: 0.3 },
            { label: 'Journal', data: dataJ, borderColor: '#1B3B5C', backgroundColor: 'rgba(27,59,92,0.1)', tension: 0.3 }
          ]
        },
        options: { responsive: true, maintainAspectRatio: false }
      });
    }
  },

  renderStorage() {
    const el = document.getElementById('ana-storage');
    if (!el) return;
    const stats = Storage.getStats();
    el.innerHTML = Object.entries(stats.modules)
      .sort((a, b) => parseFloat(b[1].size) - parseFloat(a[1].size))
      .map(([key, info]) => `<div style="display:flex;justify-content:space-between;padding:8px 12px;border-bottom:1px solid var(--divider);"><span class="text-sm">${Utils.escape(key)}</span><div style="display:flex;gap:16px;"><span class="text-sm text-muted">${info.items} items</span><strong class="text-sm">${info.size}</strong></div></div>`)
      .join('') || '<div class="empty-state"><div class="empty-state-text">Aucune donnée stockée</div></div>';
  }
};
window.AnalyticsModule = AnalyticsModule;
