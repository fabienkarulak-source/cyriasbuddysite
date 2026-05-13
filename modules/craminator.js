/**
 * CRAMINATOR MODULE
 */
const CRAModule = {
  KEY: 'cra',
  cras: [],
  filterMonth: '',
  filterClient: '',

  async init() {
    this.load();
    this.render();
    this.setupEvents();
  },

  load() {
    this.cras = Storage.get(this.KEY, []);
  },

  save() {
    Storage.set(this.KEY, this.cras);
  },

  setupEvents() {
    document.getElementById('cra-new')?.addEventListener('click', () => this.newCRA());
    document.getElementById('cra-export')?.addEventListener('click', () => this.export());
    document.getElementById('cra-filter-month')?.addEventListener('change', (e) => {
      this.filterMonth = e.target.value;
      this.render();
    });
    document.getElementById('cra-filter-client')?.addEventListener('change', (e) => {
      this.filterClient = e.target.value;
      this.render();
    });
  },

  filtered() {
    return this.cras.filter(c => {
      if (this.filterMonth) {
        const month = c.date ? c.date.substring(0, 7) : '';
        if (month !== this.filterMonth) return false;
      }
      if (this.filterClient && c.client !== this.filterClient) return false;
      return true;
    });
  },

  render() {
    const tbody = document.getElementById('cra-tbody');
    if (!tbody) return;

    const filtered = this.filtered();
    
    // Update filters
    this.updateFilters();
    
    // Stats
    const thisMonth = new Date().toISOString().substring(0, 7);
    const monthly = this.cras.filter(c => c.date?.startsWith(thisMonth));
    const totalDays = filtered.reduce((s, c) => s + (parseFloat(c.days) || 0), 0);
    const totalCA = filtered.reduce((s, c) => s + ((parseFloat(c.days) || 0) * (parseFloat(c.tjm) || 0)), 0);
    const avgTJM = totalDays > 0 ? Math.round(totalCA / totalDays) : 0;
    
    document.getElementById('cra-month').textContent = monthly.length;
    document.getElementById('cra-days').textContent = totalDays;
    document.getElementById('cra-ca').textContent = totalCA.toLocaleString('fr-FR') + ' €';
    document.getElementById('cra-tjm').textContent = avgTJM.toLocaleString('fr-FR') + ' €';

    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8"><div class="empty-state"><div class="empty-state-icon">📊</div><div class="empty-state-text">Aucun CRA</div></div></td></tr>';
      return;
    }

    tbody.innerHTML = filtered.sort((a, b) => (b.date || '').localeCompare(a.date || '')).map(c => `
      <tr>
        <td>${Utils.formatDate(c.date)}</td>
        <td>${Utils.escape(c.client || '-')}</td>
        <td>${Utils.escape(c.project || '-')}</td>
        <td>${c.days || 0}</td>
        <td>${(parseFloat(c.tjm) || 0).toLocaleString('fr-FR')} €</td>
        <td><strong>${((parseFloat(c.days) || 0) * (parseFloat(c.tjm) || 0)).toLocaleString('fr-FR')} €</strong></td>
        <td><span class="badge ${this._statusClass(c.status)}">${c.status || 'draft'}</span></td>
        <td>
          <button class="btn btn-ghost btn-sm" onclick="CRAModule.edit('${c.id}')">✏️</button>
          <button class="btn btn-ghost btn-sm" onclick="CRAModule.delete('${c.id}')">🗑</button>
        </td>
      </tr>
    `).join('');
  },

  _statusClass(status) {
    return { draft: '', sent: 'badge-info', validated: 'badge-ok', paid: 'badge-ok' }[status] || '';
  },

  updateFilters() {
    const monthSelect = document.getElementById('cra-filter-month');
    const clientSelect = document.getElementById('cra-filter-client');
    if (!monthSelect || !clientSelect) return;

    const months = [...new Set(this.cras.map(c => c.date?.substring(0, 7)).filter(Boolean))].sort().reverse();
    const clients = [...new Set(this.cras.map(c => c.client).filter(Boolean))];

    const mVal = monthSelect.value;
    const cVal = clientSelect.value;
    
    monthSelect.innerHTML = '<option value="">Tous mois</option>' + months.map(m => `<option value="${m}">${m}</option>`).join('');
    clientSelect.innerHTML = '<option value="">Tous clients</option>' + clients.map(c => `<option value="${Utils.escape(c)}">${Utils.escape(c)}</option>`).join('');
    
    monthSelect.value = mVal;
    clientSelect.value = cVal;
  },

  newCRA() { this.showModal(null); },

  edit(id) {
    const c = this.cras.find(c => c.id === id);
    if (c) this.showModal(c);
  },

  showModal(cra) {
    const isEdit = !!cra;
    Modal.show({
      title: isEdit ? '✏️ Modifier CRA' : '📊 Nouveau CRA',
      body: `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div class="form-group">
            <label class="label">Date *</label>
            <input class="input" id="cra-date" type="date" value="${cra?.date || new Date().toISOString().split('T')[0]}" required>
          </div>
          <div class="form-group">
            <label class="label">Statut</label>
            <select class="select" id="cra-status">
              <option value="draft" ${cra?.status === 'draft' ? 'selected' : ''}>Brouillon</option>
              <option value="sent" ${cra?.status === 'sent' ? 'selected' : ''}>Envoyé</option>
              <option value="validated" ${cra?.status === 'validated' ? 'selected' : ''}>Validé</option>
              <option value="paid" ${cra?.status === 'paid' ? 'selected' : ''}>Payé</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="label">Client *</label>
          <input class="input" id="cra-client" value="${Utils.escape(cra?.client || '')}" required>
        </div>
        <div class="form-group">
          <label class="label">Projet</label>
          <input class="input" id="cra-project" value="${Utils.escape(cra?.project || '')}">
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div class="form-group">
            <label class="label">Jours *</label>
            <input class="input" id="cra-days" type="number" step="0.5" value="${cra?.days || ''}" required>
          </div>
          <div class="form-group">
            <label class="label">TJM (€) *</label>
            <input class="input" id="cra-tjm" type="number" value="${cra?.tjm || ''}" required>
          </div>
        </div>
        <div class="form-group">
          <label class="label">Notes</label>
          <textarea class="textarea" id="cra-notes" rows="3">${Utils.escape(cra?.notes || '')}</textarea>
        </div>
      `,
      okText: isEdit ? 'Modifier' : 'Créer',
      onOk: () => {
        const client = document.getElementById('cra-client').value.trim();
        const days = parseFloat(document.getElementById('cra-days').value);
        const tjm = parseFloat(document.getElementById('cra-tjm').value);
        if (!client || !days || !tjm) { Toast.error('Champs requis manquants'); return false; }
        
        const newCRA = {
          id: cra?.id || Utils.id(),
          date: document.getElementById('cra-date').value,
          status: document.getElementById('cra-status').value,
          client,
          project: document.getElementById('cra-project').value.trim(),
          days,
          tjm,
          notes: document.getElementById('cra-notes').value.trim()
        };
        
        if (isEdit) {
          const idx = this.cras.findIndex(c => c.id === cra.id);
          this.cras[idx] = newCRA;
        } else {
          this.cras.push(newCRA);
        }
        this.save();
        this.render();
        Toast.success(isEdit ? 'CRA modifié' : 'CRA créé');
      }
    });
  },

  delete(id) {
    Modal.confirm('Supprimer ce CRA ?', () => {
      this.cras = this.cras.filter(c => c.id !== id);
      this.save();
      this.render();
      Toast.success('Supprimé');
    });
  },

  export() {
    // Export CSV
    const rows = [['Date', 'Client', 'Projet', 'Jours', 'TJM', 'Total', 'Statut']];
    this.cras.forEach(c => {
      rows.push([
        c.date || '', c.client || '', c.project || '',
        c.days || 0, c.tjm || 0, (c.days || 0) * (c.tjm || 0),
        c.status || ''
      ]);
    });
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    Utils.download('\ufeff' + csv, `cras_${Date.now()}.csv`, 'text/csv');
    Toast.success('CRAs exportés');
  }
};

window.CRAModule = CRAModule;
