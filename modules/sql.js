/**
 * SQL GENERATOR MODULE
 */
const SQLModule = {
  KEY: 'sql_history',
  history: [],
  lastGenerated: '',

  async init() {
    this.load();
    this.renderHistory();
    this.setupEvents();
    this.updateForm();
  },

  load() {
    this.history = Storage.get(this.KEY, []);
  },

  save() {
    Storage.set(this.KEY, this.history);
  },

  setupEvents() {
    document.getElementById('sql-type')?.addEventListener('change', () => this.updateForm());
    document.getElementById('sql-generate')?.addEventListener('click', () => this.generate());
    document.getElementById('sql-copy')?.addEventListener('click', () => this.copy());
    document.getElementById('sql-copy-all')?.addEventListener('click', () => this.copy());
    document.getElementById('sql-save')?.addEventListener('click', () => this.saveCurrent());
    document.getElementById('sql-clear-history')?.addEventListener('click', () => this.clearHistory());
  },

  updateForm() {
    const type = document.getElementById('sql-type')?.value || 'select';
    const valuesGroup = document.getElementById('values-group');
    const fieldsGroup = document.getElementById('fields-group');
    const whereGroup = document.getElementById('where-group');
    
    if (valuesGroup) valuesGroup.style.display = ['insert', 'update'].includes(type) ? '' : 'none';
    if (whereGroup) whereGroup.style.display = ['select', 'update', 'delete'].includes(type) ? '' : 'none';
    if (fieldsGroup) fieldsGroup.style.display = ['select', 'create'].includes(type) ? '' : 'none';
  },

  generate() {
    const type = document.getElementById('sql-type').value;
    const table = document.getElementById('sql-table').value.trim();
    const fields = document.getElementById('sql-fields').value.trim();
    const where = document.getElementById('sql-where').value.trim();
    const values = document.getElementById('sql-values').value.trim();
    const limit = document.getElementById('sql-limit').value.trim();

    if (!table) {
      Toast.error('Nom de table requis');
      return;
    }

    let sql = '';
    switch (type) {
      case 'select':
        sql = `SELECT ${fields || '*'}\nFROM ${table}`;
        if (where) sql += `\nWHERE ${where}`;
        if (limit) sql += `\nLIMIT ${limit}`;
        sql += ';';
        break;
        
      case 'insert':
        if (!values) {
          Toast.error('Valeurs requises');
          return;
        }
        const valuePairs = values.split(',').map(v => v.trim().split('='));
        const cols = valuePairs.map(p => p[0].trim()).join(', ');
        const vals = valuePairs.map(p => p[1]?.trim() || 'NULL').join(', ');
        sql = `INSERT INTO ${table} (${cols})\nVALUES (${vals});`;
        break;
        
      case 'update':
        if (!values) {
          Toast.error('Valeurs requises');
          return;
        }
        sql = `UPDATE ${table}\nSET ${values}`;
        if (where) sql += `\nWHERE ${where}`;
        sql += ';';
        break;
        
      case 'delete':
        sql = `DELETE FROM ${table}`;
        if (where) sql += `\nWHERE ${where}`;
        else if (!confirm('⚠️ DELETE sans WHERE supprimera TOUTES les lignes. Continuer ?')) return;
        sql += ';';
        break;
        
      case 'create':
        sql = `CREATE TABLE ${table} (\n  id INT PRIMARY KEY AUTO_INCREMENT`;
        if (fields) {
          sql += ',\n  ' + fields.split(',').map(f => `${f.trim()} VARCHAR(255)`).join(',\n  ');
        }
        sql += '\n);';
        break;
    }

    this.lastGenerated = sql;
    document.getElementById('sql-output').textContent = sql;
    Toast.success('SQL généré');
  },

  copy() {
    if (!this.lastGenerated) {
      Toast.warn('Générez d\'abord du SQL');
      return;
    }
    navigator.clipboard.writeText(this.lastGenerated)
      .then(() => Toast.success('Copié dans le presse-papier'))
      .catch(() => Toast.error('Échec de la copie'));
  },

  saveCurrent() {
    if (!this.lastGenerated) {
      Toast.warn('Générez d\'abord du SQL');
      return;
    }
    Modal.prompt('Nom de la requête:', '', (name) => {
      if (!name) return;
      this.history.push({
        id: Utils.id(),
        name,
        sql: this.lastGenerated,
        date: new Date().toISOString()
      });
      this.save();
      this.renderHistory();
      Toast.success('Sauvegardé');
    });
  },

  renderHistory() {
    const container = document.getElementById('sql-history');
    if (!container) return;

    if (this.history.length === 0) {
      container.innerHTML = '<div class="empty-state"><div class="empty-state-text">Aucune requête sauvegardée</div></div>';
      return;
    }

    container.innerHTML = this.history.slice().reverse().map(h => `
      <div style="padding:10px;border:1px solid var(--border);border-radius:var(--radius);margin-bottom:8px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <strong style="font-size:13px;">${Utils.escape(h.name)}</strong>
          <div style="display:flex;gap:4px;">
            <button class="btn btn-ghost btn-sm" onclick="SQLModule.useQuery('${h.id}')" title="Charger">↻</button>
            <button class="btn btn-ghost btn-sm" onclick="SQLModule.deleteQuery('${h.id}')" title="Supprimer">🗑</button>
          </div>
        </div>
        <pre style="font-family:var(--font-mono);font-size:11px;color:var(--ink-muted);background:var(--bg-subtle);padding:8px;border-radius:4px;white-space:pre-wrap;">${Utils.escape(Utils.truncate(h.sql, 150))}</pre>
        <div class="text-xs text-muted mt-2">${Utils.formatDateTime(h.date)}</div>
      </div>
    `).join('');
  },

  useQuery(id) {
    const q = this.history.find(h => h.id === id);
    if (q) {
      document.getElementById('sql-output').textContent = q.sql;
      this.lastGenerated = q.sql;
      Toast.success('Requête chargée');
    }
  },

  deleteQuery(id) {
    this.history = this.history.filter(h => h.id !== id);
    this.save();
    this.renderHistory();
  },

  clearHistory() {
    Modal.confirm('Effacer tout l\'historique ?', () => {
      this.history = [];
      this.save();
      this.renderHistory();
      Toast.success('Historique effacé');
    });
  }
};

window.SQLModule = SQLModule;
