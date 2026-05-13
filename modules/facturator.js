/**
 * FACTURATOR MODULE
 */
const FacturatorModule = {
  KEY: 'factures',
  factures: [],

  async init() {
    this.load();
    this.render();
    document.getElementById('fact-new')?.addEventListener('click', () => this.newInvoice());
  },

  load() {
    this.factures = Storage.get(this.KEY, []);
  },

  save() {
    Storage.set(this.KEY, this.factures);
  },

  render() {
    const tbody = document.getElementById('fact-tbody');
    if (!tbody) return;

    const total = this.factures.length;
    const totalAmount = this.factures.reduce((s, f) => s + (parseFloat(f.totalTTC) || 0), 0);
    const pending = this.factures.filter(f => f.status === 'pending' || f.status === 'draft').length;
    const paid = this.factures.filter(f => f.status === 'paid').length;
    
    document.getElementById('fact-total').textContent = total;
    document.getElementById('fact-amount').textContent = totalAmount.toLocaleString('fr-FR') + ' €';
    document.getElementById('fact-pending').textContent = pending;
    document.getElementById('fact-paid').textContent = paid;

    if (total === 0) {
      tbody.innerHTML = '<tr><td colspan="9"><div class="empty-state"><div class="empty-state-icon">🧾</div><div class="empty-state-text">Aucune facture</div></div></td></tr>';
      return;
    }

    tbody.innerHTML = this.factures.sort((a, b) => (b.number || '').localeCompare(a.number || '')).map(f => `
      <tr>
        <td><strong>${Utils.escape(f.number || '-')}</strong></td>
        <td>${Utils.formatDate(f.date)}</td>
        <td>${Utils.escape(f.client || '-')}</td>
        <td>${Utils.escape(Utils.truncate(f.description || '', 40))}</td>
        <td>${(parseFloat(f.amountHT) || 0).toLocaleString('fr-FR')} €</td>
        <td>${f.vatRate || 20}%</td>
        <td><strong>${(parseFloat(f.totalTTC) || 0).toLocaleString('fr-FR')} €</strong></td>
        <td><span class="badge ${this._statusClass(f.status)}">${this._statusLabel(f.status)}</span></td>
        <td>
          <button class="btn btn-ghost btn-sm" onclick="FacturatorModule.edit('${f.id}')">✏️</button>
          <button class="btn btn-ghost btn-sm" onclick="FacturatorModule.delete('${f.id}')">🗑</button>
        </td>
      </tr>
    `).join('');
  },

  _statusClass(s) {
    return { draft: '', pending: 'badge-warn', paid: 'badge-ok', cancelled: 'badge-danger' }[s] || '';
  },

  _statusLabel(s) {
    return { draft: 'Brouillon', pending: 'En attente', paid: 'Payée', cancelled: 'Annulée' }[s] || s;
  },

  newInvoice() { this.showModal(null); },

  edit(id) {
    const f = this.factures.find(f => f.id === id);
    if (f) this.showModal(f);
  },

  showModal(facture) {
    const isEdit = !!facture;
    const nextNumber = `F-${new Date().getFullYear()}-${String(this.factures.length + 1).padStart(4, '0')}`;
    
    Modal.show({
      title: isEdit ? '✏️ Modifier facture' : '🧾 Nouvelle facture',
      body: `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div class="form-group">
            <label class="label">N° facture *</label>
            <input class="input" id="f-number" value="${Utils.escape(facture?.number || nextNumber)}" required>
          </div>
          <div class="form-group">
            <label class="label">Date *</label>
            <input class="input" id="f-date" type="date" value="${facture?.date || new Date().toISOString().split('T')[0]}" required>
          </div>
        </div>
        <div class="form-group">
          <label class="label">Client *</label>
          <input class="input" id="f-client" value="${Utils.escape(facture?.client || '')}" required>
        </div>
        <div class="form-group">
          <label class="label">Description</label>
          <textarea class="textarea" id="f-desc" rows="2">${Utils.escape(facture?.description || '')}</textarea>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">
          <div class="form-group">
            <label class="label">Montant HT *</label>
            <input class="input" id="f-ht" type="number" step="0.01" value="${facture?.amountHT || ''}" required oninput="document.getElementById('f-ttc').value=(parseFloat(this.value)*(1+parseFloat(document.getElementById('f-vat').value)/100)).toFixed(2)">
          </div>
          <div class="form-group">
            <label class="label">TVA (%)</label>
            <input class="input" id="f-vat" type="number" value="${facture?.vatRate || 20}" oninput="document.getElementById('f-ttc').value=(parseFloat(document.getElementById('f-ht').value)*(1+parseFloat(this.value)/100)).toFixed(2)">
          </div>
          <div class="form-group">
            <label class="label">Total TTC</label>
            <input class="input" id="f-ttc" type="number" step="0.01" value="${facture?.totalTTC || ''}">
          </div>
        </div>
        <div class="form-group">
          <label class="label">Statut</label>
          <select class="select" id="f-status">
            <option value="draft" ${facture?.status === 'draft' ? 'selected' : ''}>Brouillon</option>
            <option value="pending" ${facture?.status === 'pending' ? 'selected' : ''}>En attente</option>
            <option value="paid" ${facture?.status === 'paid' ? 'selected' : ''}>Payée</option>
            <option value="cancelled" ${facture?.status === 'cancelled' ? 'selected' : ''}>Annulée</option>
          </select>
        </div>
      `,
      okText: isEdit ? 'Modifier' : 'Créer',
      onOk: () => {
        const client = document.getElementById('f-client').value.trim();
        const ht = parseFloat(document.getElementById('f-ht').value);
        if (!client || isNaN(ht)) { Toast.error('Client et montant HT requis'); return false; }
        
        const vat = parseFloat(document.getElementById('f-vat').value) || 20;
        const ttc = parseFloat(document.getElementById('f-ttc').value) || ht * (1 + vat / 100);
        
        const newF = {
          id: facture?.id || Utils.id(),
          number: document.getElementById('f-number').value.trim(),
          date: document.getElementById('f-date').value,
          client,
          description: document.getElementById('f-desc').value.trim(),
          amountHT: ht,
          vatRate: vat,
          totalTTC: ttc,
          status: document.getElementById('f-status').value
        };
        
        if (isEdit) {
          const idx = this.factures.findIndex(f => f.id === facture.id);
          this.factures[idx] = newF;
        } else {
          this.factures.push(newF);
        }
        this.save();
        this.render();
        Toast.success(isEdit ? 'Modifiée' : 'Créée');
      }
    });
  },

  delete(id) {
    Modal.confirm('Supprimer cette facture ?', () => {
      this.factures = this.factures.filter(f => f.id !== id);
      this.save();
      this.render();
      Toast.success('Supprimée');
    });
  }
};

window.FacturatorModule = FacturatorModule;
