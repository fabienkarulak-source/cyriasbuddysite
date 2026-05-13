/**
 * BIBLE MODULE - Base de connaissances
 */
const BibleModule = {
  KEY: 'bible',
  articles: [],
  search: '',
  filterCat: '',

  async init() {
    this.load();
    this.render();
    document.getElementById('bible-new')?.addEventListener('click', () => this.newArticle());
    document.getElementById('bible-search')?.addEventListener('input', Utils.debounce((e) => {
      this.search = e.target.value.toLowerCase();
      this.render();
    }, 200));
  },

  load() { this.articles = Storage.get(this.KEY, []); },
  save() { Storage.set(this.KEY, this.articles); },

  filtered() {
    return this.articles.filter(a => {
      if (this.filterCat && a.category !== this.filterCat) return false;
      if (this.search && !(
        a.title?.toLowerCase().includes(this.search) ||
        a.content?.toLowerCase().includes(this.search)
      )) return false;
      return true;
    });
  },

  render() {
    const cats = {};
    this.articles.forEach(a => { 
      const c = a.category || 'Sans catégorie';
      cats[c] = (cats[c] || 0) + 1;
    });

    const catsEl = document.getElementById('bible-cats');
    if (catsEl) {
      catsEl.innerHTML = `
        <div class="badge ${!this.filterCat ? 'badge-info' : ''}" style="cursor:pointer;display:block;margin-bottom:4px;" onclick="BibleModule.setCat('')">Tous (${this.articles.length})</div>
        ${Object.entries(cats).map(([c, n]) => `
          <div class="badge ${this.filterCat === c ? 'badge-info' : ''}" style="cursor:pointer;display:block;margin-bottom:4px;" onclick="BibleModule.setCat('${Utils.escape(c)}')">
            ${Utils.escape(c)} (${n})
          </div>
        `).join('') || '<div class="text-xs text-muted">Aucune</div>'}
      `;
    }

    const content = document.getElementById('bible-content');
    if (!content) return;

    const articles = this.filtered();
    if (articles.length === 0) {
      content.innerHTML = '<div class="card"><div class="empty-state"><div class="empty-state-icon">📖</div><div class="empty-state-text">Aucun article. Créez-en un !</div></div></div>';
      return;
    }

    content.innerHTML = articles.map(a => `
      <div class="card mb-4">
        <div class="card-header">
          <div>
            <h3 class="card-title">${Utils.escape(a.title)}</h3>
            <div class="card-subtitle">
              ${a.category ? `<span class="badge">${Utils.escape(a.category)}</span>` : ''}
              <span class="text-xs text-muted" style="margin-left:8px;">${Utils.formatDate(a.updatedAt || a.createdAt)}</span>
            </div>
          </div>
          <div style="display:flex;gap:4px;">
            <button class="btn btn-ghost btn-sm" onclick="BibleModule.edit('${a.id}')">✏️</button>
            <button class="btn btn-ghost btn-sm" onclick="BibleModule.delete('${a.id}')">🗑</button>
          </div>
        </div>
        <div style="white-space:pre-wrap;font-size:13px;line-height:1.6;">${Utils.escape(a.content)}</div>
        ${a.tags?.length ? `<div style="margin-top:12px;display:flex;gap:4px;flex-wrap:wrap;">${a.tags.map(t => `<span class="badge">#${Utils.escape(t)}</span>`).join('')}</div>` : ''}
      </div>
    `).join('');
  },

  setCat(cat) { this.filterCat = cat; this.render(); },

  newArticle() { this.showModal(null); },

  edit(id) {
    const a = this.articles.find(a => a.id === id);
    if (a) this.showModal(a);
  },

  showModal(article) {
    const isEdit = !!article;
    Modal.show({
      title: isEdit ? '✏️ Modifier article' : '📖 Nouvel article',
      body: `
        <div class="form-group">
          <label class="label">Titre *</label>
          <input class="input" id="b-title" value="${Utils.escape(article?.title || '')}" required>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div class="form-group">
            <label class="label">Catégorie</label>
            <input class="input" id="b-cat" value="${Utils.escape(article?.category || '')}" placeholder="Procédure, FAQ, etc.">
          </div>
          <div class="form-group">
            <label class="label">Tags (virgules)</label>
            <input class="input" id="b-tags" value="${Utils.escape((article?.tags || []).join(', '))}">
          </div>
        </div>
        <div class="form-group">
          <label class="label">Contenu *</label>
          <textarea class="textarea" id="b-content" rows="12" required>${Utils.escape(article?.content || '')}</textarea>
        </div>
      `,
      okText: isEdit ? 'Modifier' : 'Créer',
      onOk: () => {
        const title = document.getElementById('b-title').value.trim();
        const content = document.getElementById('b-content').value.trim();
        if (!title || !content) { Toast.error('Titre et contenu requis'); return false; }

        const newA = {
          id: article?.id || Utils.id(),
          title,
          content,
          category: document.getElementById('b-cat').value.trim(),
          tags: document.getElementById('b-tags').value.split(',').map(t => t.trim()).filter(Boolean),
          createdAt: article?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        if (isEdit) {
          const idx = this.articles.findIndex(a => a.id === article.id);
          this.articles[idx] = newA;
        } else {
          this.articles.push(newA);
        }
        this.save();
        this.render();
        Toast.success(isEdit ? 'Modifié' : 'Créé');
      }
    });
  },

  delete(id) {
    Modal.confirm('Supprimer cet article ?', () => {
      this.articles = this.articles.filter(a => a.id !== id);
      this.save();
      this.render();
      Toast.success('Supprimé');
    });
  }
};

window.BibleModule = BibleModule;
