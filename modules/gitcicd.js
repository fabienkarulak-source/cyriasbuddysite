/**
 * GIT CI/CD MODULE
 */
const GitCICDModule = {
  KEY: 'gitcicd',
  entries: [],
  filter: '',

  async init() {
    this.load();
    this.render();
    document.getElementById('git-new')?.addEventListener('click', () => this.newEntry());
    document.getElementById('git-filter')?.addEventListener('change', (e) => {
      this.filter = e.target.value;
      this.render();
    });
  },

  load() { this.entries = Storage.get(this.KEY, []); },
  save() { Storage.set(this.KEY, this.entries); },

  filtered() {
    if (!this.filter) return this.entries;
    return this.entries.filter(e => e.type === this.filter);
  },

  render() {
    document.getElementById('git-commits').textContent = this.entries.filter(e => e.type === 'commit').length;
    document.getElementById('git-prs').textContent = this.entries.filter(e => e.type === 'pr').length;
    document.getElementById('git-deploys').textContent = this.entries.filter(e => e.type === 'deploy').length;
    document.getElementById('git-failed').textContent = this.entries.filter(e => e.status === 'failed').length;

    const list = document.getElementById('git-list');
    if (!list) return;

    const entries = this.filtered();
    if (entries.length === 0) {
      list.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🔀</div><div class="empty-state-text">Aucune entrée</div></div>';
      return;
    }

    list.innerHTML = entries.sort((a, b) => new Date(b.date) - new Date(a.date)).map(e => `
      <div style="padding:12px;border:1px solid var(--border);border-left:4px solid ${this._color(e.status)};border-radius:var(--radius);margin-bottom:8px;">
        <div style="display:flex;justify-content:space-between;gap:12px;">
          <div style="flex:1;">
            <div style="display:flex;gap:8px;align-items:center;margin-bottom:4px;">
              <span style="font-size:18px;">${this._icon(e.type)}</span>
              <strong style="font-size:14px;">${Utils.escape(e.title)}</strong>
              <span class="badge ${this._statusBadge(e.status)}">${e.status || 'success'}</span>
              ${e.branch ? `<span class="badge">${Utils.escape(e.branch)}</span>` : ''}
            </div>
            ${e.description ? `<div class="text-sm text-muted mb-2">${Utils.escape(e.description)}</div>` : ''}
            <div class="text-xs text-muted">
              ${e.author ? `👤 ${Utils.escape(e.author)} • ` : ''}
              ${e.hash ? `<code>${Utils.escape(e.hash.substring(0, 7))}</code> • ` : ''}
              ${Utils.formatDateTime(e.date)}
            </div>
          </div>
          <div style="display:flex;flex-direction:column;gap:4px;">
            <button class="btn btn-ghost btn-sm" onclick="GitCICDModule.edit('${e.id}')">✏️</button>
            <button class="btn btn-ghost btn-sm" onclick="GitCICDModule.delete('${e.id}')">🗑</button>
          </div>
        </div>
      </div>
    `).join('');
  },

  _icon(t) { return { commit: '💾', pr: '🔀', deploy: '🚀', build: '🔧' }[t] || '📌'; },
  _color(s) { return { success: 'var(--ok)', failed: 'var(--danger)', running: 'var(--info)', pending: 'var(--warn)' }[s] || 'var(--ink-muted)'; },
  _statusBadge(s) { return { success: 'badge-ok', failed: 'badge-danger', running: 'badge-info', pending: 'badge-warn' }[s] || ''; },

  newEntry() { this.showModal(null); },

  edit(id) {
    const e = this.entries.find(e => e.id === id);
    if (e) this.showModal(e);
  },

  showModal(entry) {
    const isEdit = !!entry;
    Modal.show({
      title: isEdit ? '✏️ Modifier' : '🔀 Nouvelle entrée',
      body: `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div class="form-group">
            <label class="label">Type</label>
            <select class="select" id="g-type">
              <option value="commit" ${entry?.type === 'commit' ? 'selected' : ''}>💾 Commit</option>
              <option value="pr" ${entry?.type === 'pr' ? 'selected' : ''}>🔀 Pull Request</option>
              <option value="deploy" ${entry?.type === 'deploy' ? 'selected' : ''}>🚀 Déploiement</option>
              <option value="build" ${entry?.type === 'build' ? 'selected' : ''}>🔧 Build</option>
            </select>
          </div>
          <div class="form-group">
            <label class="label">Statut</label>
            <select class="select" id="g-status">
              <option value="success" ${entry?.status === 'success' ? 'selected' : ''}>✅ Succès</option>
              <option value="failed" ${entry?.status === 'failed' ? 'selected' : ''}>❌ Échec</option>
              <option value="running" ${entry?.status === 'running' ? 'selected' : ''}>⏳ En cours</option>
              <option value="pending" ${entry?.status === 'pending' ? 'selected' : ''}>⏸ En attente</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="label">Titre *</label>
          <input class="input" id="g-title" value="${Utils.escape(entry?.title || '')}" required>
        </div>
        <div class="form-group">
          <label class="label">Description</label>
          <textarea class="textarea" id="g-desc" rows="3">${Utils.escape(entry?.description || '')}</textarea>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">
          <div class="form-group">
            <label class="label">Branche</label>
            <input class="input" id="g-branch" value="${Utils.escape(entry?.branch || '')}" placeholder="main">
          </div>
          <div class="form-group">
            <label class="label">Hash / N°</label>
            <input class="input" id="g-hash" value="${Utils.escape(entry?.hash || '')}">
          </div>
          <div class="form-group">
            <label class="label">Auteur</label>
            <input class="input" id="g-author" value="${Utils.escape(entry?.author || '')}">
          </div>
        </div>
      `,
      okText: isEdit ? 'Modifier' : 'Créer',
      onOk: () => {
        const title = document.getElementById('g-title').value.trim();
        if (!title) { Toast.error('Titre requis'); return false; }

        const newE = {
          id: entry?.id || Utils.id(),
          type: document.getElementById('g-type').value,
          status: document.getElementById('g-status').value,
          title,
          description: document.getElementById('g-desc').value.trim(),
          branch: document.getElementById('g-branch').value.trim(),
          hash: document.getElementById('g-hash').value.trim(),
          author: document.getElementById('g-author').value.trim(),
          date: entry?.date || new Date().toISOString()
        };

        if (isEdit) {
          const idx = this.entries.findIndex(e => e.id === entry.id);
          this.entries[idx] = newE;
        } else {
          this.entries.push(newE);
        }
        this.save();
        this.render();
        Toast.success(isEdit ? 'Modifiée' : 'Créée');
      }
    });
  },

  delete(id) {
    Modal.confirm('Supprimer cette entrée ?', () => {
      this.entries = this.entries.filter(e => e.id !== id);
      this.save();
      this.render();
      Toast.success('Supprimée');
    });
  }
};

window.GitCICDModule = GitCICDModule;
