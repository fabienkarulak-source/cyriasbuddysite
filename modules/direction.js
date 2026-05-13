/**
 * DIRECTION MODULE - Board des projets
 */
const DirectionModule = {
  KEY: 'projects',
  projects: [],

  async init() {
    this.load();
    this.render();
    document.getElementById('dir-new')?.addEventListener('click', () => this.newProject());
  },

  load() { this.projects = Storage.get(this.KEY, []); },
  save() { Storage.set(this.KEY, this.projects); },

  render() {
    const list = document.getElementById('dir-list');
    if (!list) return;

    const active = this.projects.filter(p => p.status !== 'completed');
    const now = Date.now();
    const late = active.filter(p => p.deadline && new Date(p.deadline).getTime() < now);
    const totalBudget = this.projects.reduce((s, p) => s + (parseFloat(p.budget) || 0), 0);
    const avgProgress = this.projects.length > 0
      ? Math.round(this.projects.reduce((s, p) => s + (parseFloat(p.progress) || 0), 0) / this.projects.length)
      : 0;

    document.getElementById('dir-active').textContent = active.length;
    document.getElementById('dir-late').textContent = late.length;
    document.getElementById('dir-budget').textContent = totalBudget.toLocaleString('fr-FR') + ' €';
    document.getElementById('dir-progress').textContent = avgProgress + '%';

    if (this.projects.length === 0) {
      list.innerHTML = '<div class="card" style="grid-column:1/-1;"><div class="empty-state"><div class="empty-state-icon">📊</div><div class="empty-state-text">Aucun projet. Créez-en un !</div></div></div>';
      return;
    }

    list.innerHTML = this.projects.map(p => {
      const progress = parseFloat(p.progress) || 0;
      const isLate = p.deadline && new Date(p.deadline).getTime() < now && p.status !== 'completed';
      
      return `
        <div class="card">
          <div class="card-header">
            <div>
              <h3 class="card-title">${Utils.escape(p.name)}</h3>
              <div class="card-subtitle">
                <span class="badge ${this._statusBadge(p.status)}">${this._statusLabel(p.status)}</span>
                ${isLate ? '<span class="badge badge-danger">⏰ En retard</span>' : ''}
              </div>
            </div>
            <div style="display:flex;gap:4px;">
              <button class="btn btn-ghost btn-sm" onclick="DirectionModule.edit('${p.id}')">✏️</button>
              <button class="btn btn-ghost btn-sm" onclick="DirectionModule.delete('${p.id}')">🗑</button>
            </div>
          </div>
          ${p.description ? `<p class="text-sm text-muted mb-4">${Utils.escape(p.description)}</p>` : ''}
          <div style="margin-bottom:12px;">
            <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--ink-muted);margin-bottom:4px;">
              <span>Avancement</span>
              <strong>${progress}%</strong>
            </div>
            <div style="height:6px;background:var(--bg-subtle);border-radius:3px;overflow:hidden;">
              <div style="height:100%;width:${progress}%;background:var(--brand);transition:width 0.3s;"></div>
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px;">
            ${p.client ? `<div><span class="text-muted">Client:</span> <strong>${Utils.escape(p.client)}</strong></div>` : ''}
            ${p.budget ? `<div><span class="text-muted">Budget:</span> <strong>${parseFloat(p.budget).toLocaleString('fr-FR')} €</strong></div>` : ''}
            ${p.deadline ? `<div><span class="text-muted">Échéance:</span> <strong>${Utils.formatDate(p.deadline)}</strong></div>` : ''}
            ${p.team ? `<div><span class="text-muted">Équipe:</span> <strong>${Utils.escape(p.team)}</strong></div>` : ''}
          </div>
        </div>
      `;
    }).join('');
  },

  _statusBadge(s) { return { active: 'badge-info', completed: 'badge-ok', paused: 'badge-warn', cancelled: 'badge-danger' }[s] || ''; },
  _statusLabel(s) { return { active: 'Actif', completed: 'Terminé', paused: 'En pause', cancelled: 'Annulé' }[s] || s; },

  newProject() { this.showModal(null); },

  edit(id) {
    const p = this.projects.find(p => p.id === id);
    if (p) this.showModal(p);
  },

  showModal(project) {
    const isEdit = !!project;
    Modal.show({
      title: isEdit ? '✏️ Modifier projet' : '📊 Nouveau projet',
      body: `
        <div class="form-group">
          <label class="label">Nom *</label>
          <input class="input" id="p-name" value="${Utils.escape(project?.name || '')}" required>
        </div>
        <div class="form-group">
          <label class="label">Description</label>
          <textarea class="textarea" id="p-desc" rows="2">${Utils.escape(project?.description || '')}</textarea>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div class="form-group">
            <label class="label">Client</label>
            <input class="input" id="p-client" value="${Utils.escape(project?.client || '')}">
          </div>
          <div class="form-group">
            <label class="label">Équipe</label>
            <input class="input" id="p-team" value="${Utils.escape(project?.team || '')}">
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">
          <div class="form-group">
            <label class="label">Budget (€)</label>
            <input class="input" id="p-budget" type="number" value="${project?.budget || ''}">
          </div>
          <div class="form-group">
            <label class="label">Échéance</label>
            <input class="input" id="p-deadline" type="date" value="${project?.deadline || ''}">
          </div>
          <div class="form-group">
            <label class="label">Avancement (%)</label>
            <input class="input" id="p-progress" type="number" min="0" max="100" value="${project?.progress || 0}">
          </div>
        </div>
        <div class="form-group">
          <label class="label">Statut</label>
          <select class="select" id="p-status">
            <option value="active" ${project?.status === 'active' ? 'selected' : ''}>Actif</option>
            <option value="paused" ${project?.status === 'paused' ? 'selected' : ''}>En pause</option>
            <option value="completed" ${project?.status === 'completed' ? 'selected' : ''}>Terminé</option>
            <option value="cancelled" ${project?.status === 'cancelled' ? 'selected' : ''}>Annulé</option>
          </select>
        </div>
      `,
      okText: isEdit ? 'Modifier' : 'Créer',
      onOk: () => {
        const name = document.getElementById('p-name').value.trim();
        if (!name) { Toast.error('Nom requis'); return false; }
        
        const newP = {
          id: project?.id || Utils.id(),
          name,
          description: document.getElementById('p-desc').value.trim(),
          client: document.getElementById('p-client').value.trim(),
          team: document.getElementById('p-team').value.trim(),
          budget: parseFloat(document.getElementById('p-budget').value) || 0,
          deadline: document.getElementById('p-deadline').value,
          progress: parseFloat(document.getElementById('p-progress').value) || 0,
          status: document.getElementById('p-status').value
        };
        
        if (isEdit) {
          const idx = this.projects.findIndex(p => p.id === project.id);
          this.projects[idx] = newP;
        } else {
          this.projects.push(newP);
        }
        this.save();
        this.render();
        Toast.success(isEdit ? 'Modifié' : 'Créé');
      }
    });
  },

  delete(id) {
    Modal.confirm('Supprimer ce projet ?', () => {
      this.projects = this.projects.filter(p => p.id !== id);
      this.save();
      this.render();
      Toast.success('Supprimé');
    });
  }
};

window.DirectionModule = DirectionModule;
