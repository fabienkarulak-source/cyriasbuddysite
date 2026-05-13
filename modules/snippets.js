/**
 * SNIPPETS MODULE
 */
const SnippetsModule = {
  KEY: 'snippets',
  snippets: [],
  search: '',
  langFilter: '',

  async init() {
    this.load();
    this.render();
    this.setupEvents();
  },

  load() {
    this.snippets = Storage.get(this.KEY, []);
  },

  save() {
    Storage.set(this.KEY, this.snippets);
  },

  setupEvents() {
    document.getElementById('snip-new')?.addEventListener('click', () => this.newSnippet());
    
    document.getElementById('snip-search')?.addEventListener('input', Utils.debounce((e) => {
      this.search = e.target.value.toLowerCase();
      this.render();
    }, 200));

    document.getElementById('snip-lang-filter')?.addEventListener('change', (e) => {
      this.langFilter = e.target.value;
      this.render();
    });
  },

  filtered() {
    return this.snippets.filter(s => {
      if (this.langFilter && s.language !== this.langFilter) return false;
      if (this.search && 
          !(s.title?.toLowerCase().includes(this.search) ||
            s.code?.toLowerCase().includes(this.search))) return false;
      return true;
    });
  },

  render() {
    const list = document.getElementById('snip-list');
    if (!list) return;

    const snippets = this.filtered();
    if (snippets.length === 0) {
      list.innerHTML = `
        <div class="card" style="grid-column:1/-1;">
          <div class="empty-state">
            <div class="empty-state-icon">📝</div>
            <div class="empty-state-text">Aucun snippet. Créez-en un !</div>
          </div>
        </div>
      `;
      return;
    }

    list.innerHTML = snippets.map(s => `
      <div class="card">
        <div class="card-header">
          <div>
            <h3 class="card-title">${Utils.escape(s.title)}</h3>
            <div class="card-subtitle">
              <span class="badge">${Utils.escape(s.language || 'text')}</span>
              ${s.tags ? s.tags.map(t => `<span class="badge">${Utils.escape(t)}</span>`).join('') : ''}
            </div>
          </div>
          <div style="display:flex;gap:4px;">
            <button class="btn btn-ghost btn-sm" onclick="SnippetsModule.copy('${s.id}')" title="Copier">📋</button>
            <button class="btn btn-ghost btn-sm" onclick="SnippetsModule.edit('${s.id}')" title="Modifier">✏️</button>
            <button class="btn btn-ghost btn-sm" onclick="SnippetsModule.delete('${s.id}')" title="Supprimer">🗑</button>
          </div>
        </div>
        <pre style="background:var(--bg-subtle);padding:12px;border-radius:var(--radius);font-family:var(--font-mono);font-size:12px;overflow:auto;max-height:200px;line-height:1.5;">${Utils.escape(s.code)}</pre>
        ${s.description ? `<div class="text-xs text-muted mt-2">${Utils.escape(s.description)}</div>` : ''}
      </div>
    `).join('');
  },

  newSnippet() {
    this.showModal(null);
  },

  edit(id) {
    const s = this.snippets.find(s => s.id === id);
    if (s) this.showModal(s);
  },

  showModal(snippet) {
    const isEdit = !!snippet;
    Modal.show({
      title: isEdit ? '✏️ Modifier' : '💻 Nouveau snippet',
      body: `
        <div class="form-group">
          <label class="label">Titre *</label>
          <input class="input" id="sn-title" value="${Utils.escape(snippet?.title || '')}" required>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div class="form-group">
            <label class="label">Langage</label>
            <select class="select" id="sn-lang">
              <option value="javascript" ${snippet?.language === 'javascript' ? 'selected' : ''}>JavaScript</option>
              <option value="python" ${snippet?.language === 'python' ? 'selected' : ''}>Python</option>
              <option value="sql" ${snippet?.language === 'sql' ? 'selected' : ''}>SQL</option>
              <option value="html" ${snippet?.language === 'html' ? 'selected' : ''}>HTML</option>
              <option value="css" ${snippet?.language === 'css' ? 'selected' : ''}>CSS</option>
              <option value="bash" ${snippet?.language === 'bash' ? 'selected' : ''}>Bash</option>
              <option value="other" ${snippet?.language === 'other' ? 'selected' : ''}>Autre</option>
            </select>
          </div>
          <div class="form-group">
            <label class="label">Tags (virgules)</label>
            <input class="input" id="sn-tags" value="${Utils.escape((snippet?.tags || []).join(', '))}">
          </div>
        </div>
        <div class="form-group">
          <label class="label">Code *</label>
          <textarea class="textarea" id="sn-code" rows="10" style="font-family:var(--font-mono);font-size:12px;" required>${Utils.escape(snippet?.code || '')}</textarea>
        </div>
        <div class="form-group">
          <label class="label">Description</label>
          <textarea class="textarea" id="sn-desc" rows="2">${Utils.escape(snippet?.description || '')}</textarea>
        </div>
      `,
      okText: isEdit ? 'Modifier' : 'Créer',
      onOk: () => {
        const title = document.getElementById('sn-title').value.trim();
        const code = document.getElementById('sn-code').value;
        if (!title || !code) {
          Toast.error('Titre et code requis');
          return false;
        }
        
        const newSnippet = {
          id: snippet?.id || Utils.id(),
          title,
          code,
          language: document.getElementById('sn-lang').value,
          tags: document.getElementById('sn-tags').value.split(',').map(t => t.trim()).filter(Boolean),
          description: document.getElementById('sn-desc').value.trim(),
          createdAt: snippet?.createdAt || new Date().toISOString()
        };

        if (isEdit) {
          const idx = this.snippets.findIndex(s => s.id === snippet.id);
          this.snippets[idx] = newSnippet;
        } else {
          this.snippets.push(newSnippet);
        }
        
        this.save();
        this.render();
        Toast.success(isEdit ? 'Snippet modifié' : 'Snippet créé');
      }
    });
  },

  copy(id) {
    const s = this.snippets.find(s => s.id === id);
    if (s) {
      navigator.clipboard.writeText(s.code)
        .then(() => Toast.success('Code copié'))
        .catch(() => Toast.error('Échec copie'));
    }
  },

  delete(id) {
    Modal.confirm('Supprimer ce snippet ?', () => {
      this.snippets = this.snippets.filter(s => s.id !== id);
      this.save();
      this.render();
      Toast.success('Supprimé');
    });
  }
};

window.SnippetsModule = SnippetsModule;
