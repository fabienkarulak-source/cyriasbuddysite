/**
 * NOTIFICATIONS MODULE
 */
const NotifModule = {
  KEY: 'notifications',
  notifications: [],

  async init() {
    this.load();
    if (this.notifications.length === 0) {
      this.seedDemo();
    }
    this.render();
    
    document.getElementById('notif-mark-all')?.addEventListener('click', () => {
      this.notifications.forEach(n => n.read = true);
      this.save();
      this.render();
      Toast.success('Toutes marquées comme lues');
    });

    document.getElementById('notif-clear')?.addEventListener('click', () => {
      Modal.confirm('Effacer toutes les notifications ?', () => {
        this.notifications = [];
        this.save();
        this.render();
        Toast.success('Notifications effacées');
      });
    });
  },

  seedDemo() {
    this.notifications = [
      { id: Utils.id(), type: 'info', title: 'Bienvenue dans Cyrias Buddy !', message: 'Explorez les différents modules.', date: new Date().toISOString(), read: false, important: true }
    ];
    this.save();
  },

  load() {
    this.notifications = Storage.get(this.KEY, []);
  },

  save() {
    Storage.set(this.KEY, this.notifications);
  },

  render() {
    const list = document.getElementById('notif-list');
    if (!list) return;

    document.getElementById('notif-total').textContent = this.notifications.length;
    document.getElementById('notif-unread').textContent = this.notifications.filter(n => !n.read).length;
    document.getElementById('notif-important').textContent = this.notifications.filter(n => n.important).length;

    if (this.notifications.length === 0) {
      list.innerHTML = `
        <div class="card">
          <div class="empty-state">
            <div class="empty-state-icon">🔕</div>
            <div class="empty-state-text">Aucune notification</div>
          </div>
        </div>
      `;
      return;
    }

    list.innerHTML = this.notifications
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .map(n => `
        <div class="card mb-4" style="border-left:4px solid ${this._color(n.type)};${n.read ? 'opacity:0.7;' : ''}">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;">
            <div style="flex:1;">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                <span style="font-size:18px;">${this._icon(n.type)}</span>
                <strong style="font-size:14px;">${Utils.escape(n.title)}</strong>
                ${n.important ? '<span class="badge badge-danger">Important</span>' : ''}
                ${!n.read ? '<span class="badge badge-info">Nouveau</span>' : ''}
              </div>
              <div style="font-size:13px;color:var(--ink-secondary);">${Utils.escape(n.message)}</div>
              <div class="text-xs text-muted mt-2">${Utils.formatDateTime(n.date)}</div>
            </div>
            <div style="display:flex;gap:4px;">
              ${!n.read ? `<button class="btn btn-ghost btn-sm" onclick="NotifModule.markRead('${n.id}')" title="Marquer lu">✓</button>` : ''}
              <button class="btn btn-ghost btn-sm" onclick="NotifModule.delete('${n.id}')" title="Supprimer">🗑</button>
            </div>
          </div>
        </div>
      `).join('');
  },

  _icon(type) {
    return { info: 'ℹ️', success: '✅', warning: '⚠️', error: '❌' }[type] || '🔔';
  },

  _color(type) {
    return { info: 'var(--info)', success: 'var(--ok)', warning: 'var(--warn)', error: 'var(--danger)' }[type] || 'var(--brand)';
  },

  markRead(id) {
    const n = this.notifications.find(n => n.id === id);
    if (n) {
      n.read = true;
      this.save();
      this.render();
    }
  },

  delete(id) {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.save();
    this.render();
  },

  // API pour autres modules
  push(notification) {
    this.notifications.push({
      id: Utils.id(),
      type: 'info',
      read: false,
      date: new Date().toISOString(),
      ...notification
    });
    this.save();
  }
};

window.NotifModule = NotifModule;
