/**
 * COMMUNICATOR MODULE - Modèles d'emails/messages
 */
const CommunicatorModule = {
  KEY: 'communicator',
  templates: [],
  search: '',

  async init() {
    this.load();
    if (this.templates.length === 0) this.seedDefaults();
    this.render();
    this.setupEvents();
  },

  seedDefaults() {
    this.templates = [
      {
        id: Utils.id(),
        category: 'Suivi',
        title: 'Relance projet',
        subject: 'Suivi du projet [NOM_PROJET]',
        body: 'Bonjour [NOM],\n\nJe me permets de revenir vers vous concernant [SUJET]. Pourriez-vous me communiquer un point de situation ?\n\nCordialement,\n[VOTRE_NOM]'
      },
      {
        id: Utils.id(),
        category: 'Demande',
        title: 'Demande d\'information',
        subject: 'Demande d\'information - [SUJET]',
        body: 'Bonjour [NOM],\n\nPourriez-vous me transmettre [INFORMATION] dans les meilleurs délais ?\n\nMerci d\'avance,\n[VOTRE_NOM]'
      }
    ];
    this.save();
  },

  load() {
    this.templates = Storage.get(this.KEY, []);
  },

  save() {
    Storage.set(this.KEY, this.templates);
  },

  setupEvents() {
    document.getElementById('com-new')?.addEventListener('click', () => this.newTemplate());
    document.getElementById('com-search')?.addEventListener('input', Utils.debounce((e) => {
      this.search = e.target.value.toLowerCase();
      this.render();
    }, 200));
  },

  filtered() {
    if (!this.search) return this.templates;
    return this.templates.filter(t =>
      t.title?.toLowerCase().includes(this.search) ||
      t.body?.toLowerCase().includes(this.search) ||
      t.category?.toLowerCase().includes(this.search)
    );
  },

  render() {
    const list = document.getElementById('com-list');
    if (!list) return;

    const templates = this.filtered();
    if (templates.length === 0) {
      list.innerHTML = '<div class="card" style="grid-column:1/-1;"><div class="empty-state"><div class="empty-state-icon">📧</div><div class="empty-state-text">Aucun modèle</div></div></div>';
      return;
    }

    list.innerHTML = templates.map(t => `
      <div class="card">
        <div class="card-header">
          <div>
            <h3 class="card-title">${Utils.escape(t.title)}</h3>
            <div class="card-subtitle">${t.category ? `<span class="badge">${Utils.escape(t.category)}</span>` : ''}</div>
          </div>
          <div style="display:flex;gap:4px;">
            <button class="btn btn-ghost btn-sm" onclick="CommunicatorModule.copy('${t.id}')" title="Copier">📋</button>
            <button class="btn btn-ghost btn-sm" onclick="CommunicatorModule.edit('${t.id}')" title="Modifier">✏️</button>
            <button class="btn btn-ghost btn-sm" onclick="CommunicatorModule.delete('${t.id}')" title="Supprimer">🗑</button>
          </div>
        </div>
        ${t.subject ? `<div class="text-sm mb-2"><strong>Sujet:</strong> ${Utils.escape(t.subject)}</div>` : ''}
        <pre style="background:var(--bg-subtle);padding:12px;border-radius:var(--radius);font-family:var(--font-ui);font-size:12px;white-space:pre-wrap;max-height:200px;overflow:auto;">${Utils.escape(t.body)}</pre>
      </div>
    `).join('');
  },

  newTemplate() {
    this.showModal(null);
  },

  edit(id) {
    const t = this.templates.find(t => t.id === id);
    if (t) this.showModal(t);
  },

  showModal(template) {
    const isEdit = !!template;
    Modal.show({
      title: isEdit ? '✏️ Modifier modèle' : '✉️ Nouveau modèle',
      body: `
        <div class="form-group">
          <label class="label">Titre *</label>
          <input class="input" id="com-title" value="${Utils.escape(template?.title || '')}" required>
        </div>
        <div class="form-group">
          <label class="label">Catégorie</label>
          <input class="input" id="com-cat" value="${Utils.escape(template?.category || '')}" placeholder="Suivi, Demande, etc.">
        </div>
        <div class="form-group">
          <label class="label">Sujet (pour email)</label>
          <input class="input" id="com-subject" value="${Utils.escape(template?.subject || '')}">
        </div>
        <div class="form-group">
          <label class="label">Corps du message *</label>
          <textarea class="textarea" id="com-body" rows="8" required>${Utils.escape(template?.body || '')}</textarea>
          <div class="text-xs text-muted mt-2">💡 Utilisez [VARIABLE] pour les valeurs à remplacer</div>
        </div>
      `,
      okText: isEdit ? 'Modifier' : 'Créer',
      onOk: () => {
        const title = document.getElementById('com-title').value.trim();
        const body = document.getElementById('com-body').value.trim();
        if (!title || !body) { Toast.error('Titre et corps requis'); return false; }
        
        const newT = {
          id: template?.id || Utils.id(),
          title,
          category: document.getElementById('com-cat').value.trim(),
          subject: document.getElementById('com-subject').value.trim(),
          body
        };
        
        if (isEdit) {
          const idx = this.templates.findIndex(t => t.id === template.id);
          this.templates[idx] = newT;
        } else {
          this.templates.push(newT);
        }
        this.save();
        this.render();
        Toast.success(isEdit ? 'Modèle modifié' : 'Modèle créé');
      }
    });
  },

  copy(id) {
    const t = this.templates.find(t => t.id === id);
    if (t) {
      const text = (t.subject ? `Sujet: ${t.subject}\n\n` : '') + t.body;
      navigator.clipboard.writeText(text)
        .then(() => Toast.success('Copié'))
        .catch(() => Toast.error('Erreur copie'));
    }
  },

  delete(id) {
    Modal.confirm('Supprimer ce modèle ?', () => {
      this.templates = this.templates.filter(t => t.id !== id);
      this.save();
      this.render();
      Toast.success('Supprimé');
    });
  }
};

window.CommunicatorModule = CommunicatorModule;
