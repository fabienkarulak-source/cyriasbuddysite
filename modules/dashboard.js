/**
 * DASHBOARD MODULE
 */
const DashboardModule = {
  KEY: 'dashboard',
  
  async init() {
    this.refresh();
    
    document.getElementById('dash-refresh')?.addEventListener('click', () => {
      this.refresh();
      Toast.success('Dashboard actualisé');
    });

    // Date
    const dateEl = document.getElementById('welcome-date');
    if (dateEl) {
      dateEl.textContent = new Date().toLocaleDateString('fr-FR', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
      });
    }
  },

  refresh() {
    // Stats Kanban
    const kanban = Storage.get('kanban', { tasks: [] });
    const tasks = kanban.tasks || [];
    const activeTasks = tasks.filter(t => t.status !== 'done').length;
    document.getElementById('stat-active-tasks').textContent = activeTasks;
    document.getElementById('stat-tasks-trend').textContent = `${tasks.length} au total`;

    // Stats Timer
    const sessions = Storage.get('timer_sessions', []);
    const totalSec = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    document.getElementById('stat-time').textContent = `${h}h${String(m).padStart(2, '0')}`;

    // Stats Errors
    const errors = Storage.get('errors', []);
    const unresolved = errors.filter(e => !e.resolved).length;
    document.getElementById('stat-errors').textContent = unresolved;

    // Stats Journal
    const journal = Storage.get('journal', []);
    document.getElementById('stat-journal').textContent = journal.length;

    // Tâches récentes
    const recentTasksEl = document.getElementById('recent-tasks');
    if (recentTasksEl) {
      const recent = tasks.slice(-5).reverse();
      if (recent.length === 0) {
        recentTasksEl.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">📭</div>
            <div class="empty-state-text">Aucune tâche pour le moment</div>
          </div>
        `;
      } else {
        recentTasksEl.innerHTML = recent.map(t => `
          <div style="padding:10px 12px;border-radius:6px;background:var(--bg-subtle);margin-bottom:6px;display:flex;justify-content:space-between;align-items:center;">
            <div style="flex:1;min-width:0;">
              <div style="font-size:13px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${Utils.escape(t.title)}</div>
              <div class="text-xs text-muted mt-2">${Utils.formatDate(t.createdAt)}</div>
            </div>
            <span class="badge ${this._statusBadge(t.status)}">${t.status || 'todo'}</span>
          </div>
        `).join('');
      }
    }

    // Journal récent
    const journalEl = document.getElementById('recent-journal');
    if (journalEl) {
      const recent = journal.slice(-5).reverse();
      if (recent.length === 0) {
        journalEl.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">📝</div>
            <div class="empty-state-text">Aucune entrée dans le journal</div>
          </div>
        `;
      } else {
        journalEl.innerHTML = recent.map(j => `
          <div style="padding:10px 12px;border-radius:6px;background:var(--bg-subtle);margin-bottom:6px;border-left:3px solid var(--brand);">
            <div style="font-size:13px;font-weight:500;">${Utils.truncate(Utils.escape(j.content || j.title || ''), 80)}</div>
            <div class="text-xs text-muted mt-2">${Utils.formatDateTime(j.date || j.createdAt)}</div>
          </div>
        `).join('');
      }
    }

    // Stockage
    const stats = Storage.getStats();
    const storageEl = document.getElementById('storage-info');
    if (storageEl) {
      storageEl.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <span>Espace utilisé</span>
          <strong>${stats.total}</strong>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span>Modules actifs</span>
          <strong>${stats.moduleCount}</strong>
        </div>
      `;
    }
  },

  _statusBadge(status) {
    const map = {
      'done': 'badge-ok',
      'in-progress': 'badge-info',
      'review': 'badge-warn',
      'todo': ''
    };
    return map[status] || '';
  }
};

window.DashboardModule = DashboardModule;
