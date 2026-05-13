/**
 * AGREGATOR MODULE
 */
const AgregatorModule = {
  KEY: 'agregator',
  data: { sources: [], lastSync: null },

  async init() {
    this.load();
    this.render();
    document.getElementById('agr-new')?.addEventListener('click', () => this.newSource());
    document.getElementById('agr-import')?.addEventListener('click', () => this.importData());
  },

  load() { this.data = Storage.get(this.KEY, { sources: [], lastSync: null }); },
  save() { Storage.set(this.KEY, this.data); },

  render() {
    const list = document.getElementById('agr-list');
    if (!list) return;

    const totalRecords = this.data.sources.reduce((s, src) => s + (src.records?.length || 0), 0);
    document.getElementById('agr-sources').textContent = this.data.sources.length;
    document.getElementById('agr-records').textContent = totalRecords;
    document.getElementById('agr-last').textContent = this.data.lastSync ? Utils.formatDateTime(this.data.lastSync) : '—';

    if (this.data.sources.length === 0) {
      list.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📚</div><div class="empty-state-text">Aucune source. Ajoutez-en une !</div></div>';
      return;
    }

    list.innerHTML = this.data.sources.map(s => `
      <div style="padding:12px;border:1px solid var(--border);border-radius:var(--radius);margin-bottom:8px;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div style="flex:1;">
            <div style="font-weight:600;font-size:14px;">${Utils.escape(s.name)}</div>
            <div class="text-xs text-muted mt-2">
              <span class="badge">${Utils.escape(s.type)}</span>
              ${s.url ? `<span style="margin-left:8px;">${Utils.truncate(Utils.escape(s.url), 50)}</span>` : ''}
              <span style="margin-left:8px;">${s.records?.length || 0} enregistrements</span>
            </div>
          </div>
          <div style="display:flex;gap:4px;">
            <button class="btn btn-ghost btn-sm" onclick="AgregatorModule.viewData('${s.id}')" title="Voir">👁</button>
            <button class="btn btn-ghost btn-sm" onclick="AgregatorModule.edit('${s.id}')" title="Modifier">✏️</button>
            <button class="btn btn-ghost btn-sm" onclick="AgregatorModule.delete('${s.id}')" title="Supprimer">🗑</button>
          </div>
        </div>
      </div>
    `).join('');
  },

  newSource() { this.showModal(null); },

  edit(id) {
    const s = this.data.sources.find(s => s.id === id);
    if (s) this.showModal(s);
  },

  showModal(source) {
    const isEdit = !!source;
    Modal.show({
      title: isEdit ? '✏️ Modifier source' : '📚 Nouvelle source',
      body: `
        <div class="form-group">
          <label class="label">Nom *</label>
          <input class="input" id="a-name" value="${Utils.escape(source?.name || '')}" required>
        </div>
        <div class="form-group">
          <label class="label">Type</label>
          <select class="select" id="a-type">
            <option value="api" ${source?.type === 'api' ? 'selected' : ''}>API</option>
            <option value="csv" ${source?.type === 'csv' ? 'selected' : ''}>CSV</option>
            <option value="json" ${source?.type === 'json' ? 'selected' : ''}>JSON</option>
            <option value="database" ${source?.type === 'database' ? 'selected' : ''}>Base de données</option>
            <option value="manual" ${source?.type === 'manual' ? 'selected' : ''}>Manuel</option>
          </select>
        </div>
        <div class="form-group">
          <label class="label">URL / Connexion</label>
          <input class="input" id="a-url" value="${Utils.escape(source?.url || '')}">
        </div>
        <div class="form-group">
          <label class="label">Description</label>
          <textarea class="textarea" id="a-desc" rows="2">${Utils.escape(source?.description || '')}</textarea>
        </div>
      `,
      okText: isEdit ? 'Modifier' : 'Créer',
      onOk: () => {
        const name = document.getElementById('a-name').value.trim();
        if (!name) { Toast.error('Nom requis'); return false; }
        
        const newS = {
          id: source?.id || Utils.id(),
          name,
          type: document.getElementById('a-type').value,
          url: document.getElementById('a-url').value.trim(),
          description: document.getElementById('a-desc').value.trim(),
          records: source?.records || [],
          createdAt: source?.createdAt || new Date().toISOString()
        };
        
        if (isEdit) {
          const idx = this.data.sources.findIndex(s => s.id === source.id);
          this.data.sources[idx] = newS;
        } else {
          this.data.sources.push(newS);
        }
        this.save();
        this.render();
        Toast.success(isEdit ? 'Modifié' : 'Créé');
      }
    });
  },

  viewData(id) {
    const s = this.data.sources.find(s => s.id === id);
    if (!s) return;
    
    Modal.show({
      title: `📊 ${s.name}`,
      body: `
        <div class="mb-4">
          <div class="text-xs text-muted">Type: <strong>${s.type}</strong></div>
          ${s.url ? `<div class="text-xs text-muted">URL: <strong>${Utils.escape(s.url)}</strong></div>` : ''}
          <div class="text-xs text-muted">Enregistrements: <strong>${s.records?.length || 0}</strong></div>
        </div>
        ${s.records && s.records.length > 0 ? `
          <pre style="background:var(--bg-subtle);padding:12px;border-radius:var(--radius);max-height:300px;overflow:auto;font-family:var(--font-mono);font-size:11px;">${Utils.escape(JSON.stringify(s.records.slice(0, 10), null, 2))}</pre>
          ${s.records.length > 10 ? `<div class="text-xs text-muted mt-2">... et ${s.records.length - 10} autres</div>` : ''}
        ` : '<div class="empty-state"><div class="empty-state-text">Aucune donnée</div></div>'}
      `,
      cancelText: false,
      okText: 'Fermer'
    });
  },

  async importData() {
    try {
      const content = await Utils.importFile('.json,.csv');
      // Tentative de parse JSON, sinon CSV
      let records = [];
      try {
        records = JSON.parse(content);
        if (!Array.isArray(records)) records = [records];
      } catch {
        // Parse CSV simple
        const lines = content.split('\n').filter(l => l.trim());
        if (lines.length < 2) throw new Error('CSV vide');
        const headers = lines[0].split(',').map(h => h.trim());
        records = lines.slice(1).map(line => {
          const values = line.split(',');
          const obj = {};
          headers.forEach((h, i) => { obj[h] = values[i]?.trim() || ''; });
          return obj;
        });
      }
      
      Modal.prompt(`Nom de la source (${records.length} enregistrements):`, '', (name) => {
        if (!name) return;
        this.data.sources.push({
          id: Utils.id(),
          name,
          type: 'manual',
          records,
          createdAt: new Date().toISOString()
        });
        this.data.lastSync = new Date().toISOString();
        this.save();
        this.render();
        Toast.success(`${records.length} enregistrements importés`);
      });
    } catch (e) {
      Toast.error('Erreur: ' + e.message);
    }
  },

  delete(id) {
    Modal.confirm('Supprimer cette source ?', () => {
      this.data.sources = this.data.sources.filter(s => s.id !== id);
      this.save();
      this.render();
      Toast.success('Supprimée');
    });
  }
};

window.AgregatorModule = AgregatorModule;
