/**
 * ORGANISATOR MODULE
 */
const OrganisatorModule = {
  KEY: 'organisator',
  tasks: [],

  async init() {
    this.load();
    this.render();
    document.getElementById('org-new')?.addEventListener('click', () => this.newTask());
  },

  load() {
    this.tasks = Storage.get(this.KEY, []);
  },

  save() {
    Storage.set(this.KEY, this.tasks);
  },

  render() {
    const board = document.getElementById('org-board');
    if (!board) return;

    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    
    const sections = {
      today: { title: '🎯 Aujourd\'hui', items: [] },
      tomorrow: { title: '➡️ Demain', items: [] },
      later: { title: '📅 Plus tard', items: [] }
    };

    this.tasks.forEach(t => {
      if (t.done) return;
      const d = t.dueDate;
      if (!d || d === today) sections.today.items.push(t);
      else if (d === tomorrow) sections.tomorrow.items.push(t);
      else sections.later.items.push(t);
    });

    const done = this.tasks.filter(t => t.done);

    board.innerHTML = Object.values(sections).map(s => `
      <div class="card">
        <h3 class="card-title mb-4">${s.title} (${s.items.length})</h3>
        ${s.items.length === 0 ? `
          <div class="empty-state">
            <div class="empty-state-text">Aucune tâche</div>
          </div>
        ` : s.items.map(t => this.renderTask(t)).join('')}
      </div>
    `).join('') + `
      <div class="card" style="grid-column:1/-1;">
        <h3 class="card-title mb-4">✅ Terminées (${done.length})</h3>
        ${done.slice(-5).map(t => this.renderTask(t)).join('')}
      </div>
    `;
  },

  renderTask(t) {
    return `
      <div style="padding:10px;border:1px solid var(--border);border-radius:var(--radius);margin-bottom:8px;background:${t.done ? 'var(--bg-subtle)' : 'var(--surface)'};">
        <div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start;">
          <label style="display:flex;gap:8px;cursor:pointer;flex:1;">
            <input type="checkbox" ${t.done ? 'checked' : ''} onchange="OrganisatorModule.toggle('${t.id}')">
            <div style="flex:1;">
              <div style="font-size:13px;font-weight:500;${t.done ? 'text-decoration:line-through;color:var(--ink-muted);' : ''}">${Utils.escape(t.title)}</div>
              ${t.dueDate ? `<div class="text-xs text-muted mt-2">📅 ${Utils.formatDate(t.dueDate)}</div>` : ''}
              ${t.notes ? `<div class="text-xs text-muted mt-2">${Utils.truncate(Utils.escape(t.notes), 50)}</div>` : ''}
            </div>
          </label>
          <button class="btn btn-ghost btn-sm" onclick="OrganisatorModule.delete('${t.id}')">🗑</button>
        </div>
      </div>
    `;
  },

  newTask() {
    Modal.show({
      title: '📅 Nouvelle tâche',
      body: `
        <div class="form-group">
          <label class="label">Titre *</label>
          <input class="input" id="org-title" required>
        </div>
        <div class="form-group">
          <label class="label">Échéance</label>
          <input class="input" id="org-due" type="date">
        </div>
        <div class="form-group">
          <label class="label">Notes</label>
          <textarea class="textarea" id="org-notes" rows="3"></textarea>
        </div>
      `,
      onOk: () => {
        const title = document.getElementById('org-title').value.trim();
        if (!title) { Toast.error('Titre requis'); return false; }
        
        this.tasks.push({
          id: Utils.id(),
          title,
          dueDate: document.getElementById('org-due').value,
          notes: document.getElementById('org-notes').value.trim(),
          done: false,
          createdAt: new Date().toISOString()
        });
        this.save();
        this.render();
        Toast.success('Tâche ajoutée');
      }
    });
  },

  toggle(id) {
    const t = this.tasks.find(t => t.id === id);
    if (t) {
      t.done = !t.done;
      this.save();
      this.render();
    }
  },

  delete(id) {
    Modal.confirm('Supprimer cette tâche ?', () => {
      this.tasks = this.tasks.filter(t => t.id !== id);
      this.save();
      this.render();
    });
  }
};

window.OrganisatorModule = OrganisatorModule;
