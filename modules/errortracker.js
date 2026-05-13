/**
 * ERROR TRACKER MODULE
 */
const ErrorTrackerModule = {
  KEY: 'errors',
  errors: [],
  filter: '',

  async init() {
    this.load();
    this.render();
    document.getElementById('err-new')?.addEventListener('click', () => this.newError());
    document.getElementById('err-filter')?.addEventListener('change', (e) => {
      this.filter = e.target.value;
      this.render();
    });
  },

  load() { this.errors = Storage.get(this.KEY, []); },
  save() { Storage.set(this.KEY, this.errors); },

  filtered() {
    return this.errors.filter(e => {
      if (this.filter === 'open') return !e.resolved;
      if (this.filter === 'resolved') return e.resolved;
      if (this.filter === 'critical') return e.severity === 'critical';
      return true;
    });
  },

  render() {
    const total = this.errors.length;
    const critical = this.errors.filter(e => e.severity === 'critical').length;
    const open = this.errors.filter(e => !e.resolved).length;
    const fixed = this.errors.filter(e => e.resolved).length;
    
    document.getElementById('err-total').textContent = total;
    document.getElementById('err-critical').textContent = critical;
    document.getElementById('err-open').textContent = open;
    document.getElementById('err-fixed').textContent = fixed;

    const list = document.getElementById('err-list');
    if (!list) return;

    const errors = this.filtered();
    if (errors.length === 0) {
      list.innerHTML = '<div class="empty-state"><div class="empty-state-icon">✅</div><div class="empty-state-text">Aucune erreur</div></div>';
      return;
    }

    list.innerHTML = errors.sort((a, b) => new Date(b.date) - new Date(a.date)).map(e => `
      <div style="padding:12px;border:1px solid var(--border);border-left:4px solid ${this._color(e.severity)};border-radius:var(--radius);margin-bottom:8px;${e.resolved ? 'opacity:0.6;' : ''}">
        <div style="display:flex;justify-content:space-between;gap:8px;">
          <div style="flex:1;">
            <div style="display:flex;gap:8px;align-items:center;margin-bottom:4px;">
              <strong style="font-size:14px;${e.resolved ? 'text-decoration:line-through;' : ''}">${Utils.escape(e.title)}</strong>
              <span class="badge ${this._badge(e.severity)}">${e.severity || 'medium'}</span>
              ${e.resolved ? '<span class="badge badge-ok">✓ Résolue</span>' : ''}
            </div>
            ${e.message ? `<div class="text-sm text-muted mb-2" style="font-family:var(--font-mono);background:var(--bg-subtle);padding:4px 8px;border-radius:4px;">${Utils.escape(Utils.truncate(e.message, 200))}</div>` : ''}
            ${e.stackTrace ? `<details><summary class="text-xs text-muted" style="cursor:pointer;">Voir la stack trace</summary><pre style="background:var(--bg-subtle);padding:8px;font-size:10px;margin-top:4px;border-radius:4px;overflow:auto;">${Utils.escape(e.stackTrace)}</pre></details>` : ''}
            <div class="text-xs text-muted mt-2">
              ${e.source ? `📍 ${Utils.escape(e.source)} • ` : ''}
              ${Utils.formatDateTime(e.date)}
            </div>
          </div>
          <div style="display:flex;flex-direction:column;gap:4px;">
            ${!e.resolved ? `<button class="btn btn-ghost btn-sm" onclick="ErrorTrackerModule.resolve('${e.id}')" title="Résoudre">✓</button>` : ''}
            <button class="btn btn-ghost btn-sm" onclick="ErrorTrackerModule.edit('${e.id}')">✏️</button>
            <button class="btn btn-ghost btn-sm" onclick="ErrorTrackerModule.delete('${e.id}')">🗑</button>
          </div>
        </div>
      </div>
    `).join('');
  },

  _color(s) {
    return { critical: 'var(--danger)', high: 'var(--danger)', medium: 'var(--warn)', low: 'var(--info)' }[s] || 'var(--ink-muted)';
  },

  _badge(s) {
    return { critical: 'badge-danger', high: 'badge-danger', medium: 'badge-warn', low: 'badge-info' }[s] || '';
  },

  newError() { this.showModal(null); },

  edit(id) {
    const e = this.errors.find(e => e.id === id);
    if (e) this.showModal(e);
  },

  showModal(error) {
    const isEdit = !!error;
    Modal.show({
      title: isEdit ? '✏️ Modifier' : '⚠️ Signaler une erreur',
      body: `
        <div class="form-group">
          <label class="label">Titre *</label>
          <input class="input" id="e-title" value="${Utils.escape(error?.title || '')}" required>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div class="form-group">
            <label class="label">Sévérité</label>
            <select class="select" id="e-severity">
              <option value="low" ${error?.severity === 'low' ? 'selected' : ''}>🟢 Faible</option>
              <option value="medium" ${(error?.severity === 'medium' || !error) ? 'selected' : ''}>🟡 Moyenne</option>
              <option value="high" ${error?.severity === 'high' ? 'selected' : ''}>🟠 Haute</option>
              <option value="critical" ${error?.severity === 'critical' ? 'selected' : ''}>🔴 Critique</option>
            </select>
          </div>
          <div class="form-group">
            <label class="label">Source</label>
            <input class="input" id="e-source" value="${Utils.escape(error?.source || '')}" placeholder="Module / Fichier">
          </div>
        </div>
        <div class="form-group">
          <label class="label">Message</label>
          <textarea class="textarea" id="e-message" rows="3">${Utils.escape(error?.message || '')}</textarea>
        </div>
        <div class="form-group">
          <label class="label">Stack trace (optionnel)</label>
          <textarea class="textarea" id="e-stack" rows="4" style="font-family:var(--font-mono);font-size:11px;">${Utils.escape(error?.stackTrace || '')}</textarea>
        </div>
      `,
      okText: isEdit ? 'Modifier' : 'Créer',
      onOk: () => {
        const title = document.getElementById('e-title').value.trim();
        if (!title) { Toast.error('Titre requis'); return false; }

        const newE = {
          id: error?.id || Utils.id(),
          title,
          severity: document.getElementById('e-severity').value,
          source: document.getElementById('e-source').value.trim(),
          message: document.getElementById('e-message').value.trim(),
          stackTrace: document.getElementById('e-stack').value.trim(),
          resolved: error?.resolved || false,
          date: error?.date || new Date().toISOString()
        };

        if (isEdit) {
          const idx = this.errors.findIndex(e => e.id === error.id);
          this.errors[idx] = newE;
        } else {
          this.errors.push(newE);
        }
        this.save();
        this.render();
        Toast.success(isEdit ? 'Modifiée' : 'Erreur enregistrée');
      }
    });
  },

  resolve(id) {
    const e = this.errors.find(e => e.id === id);
    if (e) {
      e.resolved = true;
      e.resolvedAt = new Date().toISOString();
      this.save();
      this.render();
      Toast.success('Erreur résolue');
    }
  },

  delete(id) {
    Modal.confirm('Supprimer cette erreur ?', () => {
      this.errors = this.errors.filter(e => e.id !== id);
      this.save();
      this.render();
      Toast.success('Supprimée');
    });
  }
};

window.ErrorTrackerModule = ErrorTrackerModule;
