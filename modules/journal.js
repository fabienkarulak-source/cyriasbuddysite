/**
 * JOURNAL MODULE
 */
const JournalModule = {
  KEY: 'journal',
  entries: [],
  filterTag: '',
  searchQuery: '',

  async init() {
    this.load();
    this.render();
    document.getElementById('journal-new')?.addEventListener('click', () => this.newEntry());
    
    const search = document.getElementById('journal-search');
    if (search) {
      search.addEventListener('input', Utils.debounce((e) => {
        this.searchQuery = e.target.value.toLowerCase();
        this.render();
      }, 200));
    }
  },

  load() {
    this.entries = Storage.get(this.KEY, []);
  },

  save() {
    Storage.set(this.KEY, this.entries);
  },

  render() {
    this.renderTags();
    this.renderList();
    this.renderStats();
  },

  filtered() {
    return this.entries.filter(e => {
      if (this.filterTag && (!e.tags || !e.tags.includes(this.filterTag))) return false;
      if (this.searchQuery && 
          !(e.content?.toLowerCase().includes(this.searchQuery) ||
            e.title?.toLowerCase().includes(this.searchQuery))) return false;
      return true;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  renderList() {
    const list = document.getElementById('journal-list');
    if (!list) return;

    const entries = this.filtered();
    if (entries.length === 0) {
      list.innerHTML = `
        <div class="card">
          <div class="empty-state">
            <div class="empty-state-icon">📝</div>
            <div class="empty-state-text">Aucune entrée. Cliquez sur "+ Nouvelle entrée" pour commencer.</div>
          </div>
        </div>
      `;
      return;
    }

    list.innerHTML = entries.map(e => `
      <div class="card mb-4" style="cursor:pointer;" onclick="JournalModule.editEntry('${e.id}')">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;">
          <div style="flex:1;">
            <div class="text-xs text-muted mb-2">${Utils.formatDateTime(e.date)}</div>
            ${e.title ? `<h3 style="font-size:15px;font-weight:600;margin-bottom:8px;">${Utils.escape(e.title)}</h3>` : ''}
            <div style="font-size:13px;line-height:1.6;white-space:pre-wrap;">${Utils.truncate(Utils.escape(e.content || ''), 300)}</div>
            ${e.tags && e.tags.length ? `
              <div style="margin-top:10px;display:flex;gap:4px;flex-wrap:wrap;">
                ${e.tags.map(t => `<span class="badge">#${Utils.escape(t)}</span>`).join('')}
              </div>
            ` : ''}
          </div>
          <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();JournalModule.deleteEntry('${e.id}')">🗑</button>
        </div>
      </div>
    `).join('');
  },

  renderTags() {
    const tags = {};
    this.entries.forEach(e => {
      (e.tags || []).forEach(t => { tags[t] = (tags[t] || 0) + 1; });
    });

    const tagsEl = document.getElementById('journal-tags');
    if (!tagsEl) return;

    const allTags = Object.entries(tags).sort((a, b) => b[1] - a[1]);
    tagsEl.innerHTML = `
      <div class="badge ${!this.filterTag ? 'badge-info' : ''}" style="cursor:pointer;display:block;margin-bottom:4px;" onclick="JournalModule.setTag('')">Tous</div>
      ${allTags.map(([t, count]) => `
        <div class="badge ${this.filterTag === t ? 'badge-info' : ''}" style="cursor:pointer;display:block;margin-bottom:4px;" onclick="JournalModule.setTag('${t}')">
          #${Utils.escape(t)} (${count})
        </div>
      `).join('') || '<div class="text-xs text-muted">Aucun tag</div>'}
    `;
  },

  renderStats() {
    document.getElementById('j-total').textContent = this.entries.length;
    
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const weekCount = this.entries.filter(e => new Date(e.date).getTime() > weekAgo).length;
    document.getElementById('j-week').textContent = weekCount;
  },

  setTag(tag) {
    this.filterTag = tag;
    this.render();
  },

  newEntry() {
    this.showEntryModal(null);
  },

  editEntry(id) {
    const entry = this.entries.find(e => e.id === id);
    if (entry) this.showEntryModal(entry);
  },

  showEntryModal(entry) {
    const isEdit = !!entry;
    Modal.show({
      title: isEdit ? '✏️ Modifier' : '📝 Nouvelle entrée',
      body: `
        <div class="form-group">
          <label class="label">Titre (optionnel)</label>
          <input class="input" id="je-title" value="${Utils.escape(entry?.title || '')}">
        </div>
        <div class="form-group">
          <label class="label">Contenu *</label>
          <textarea class="textarea" id="je-content" rows="8" required>${Utils.escape(entry?.content || '')}</textarea>
        </div>
        <div class="form-group">
          <label class="label">Tags (séparés par virgules)</label>
          <input class="input" id="je-tags" value="${Utils.escape((entry?.tags || []).join(', '))}" placeholder="travail, idée, bug">
        </div>
      `,
      okText: isEdit ? 'Mettre à jour' : 'Créer',
      onOk: () => {
        const content = document.getElementById('je-content').value.trim();
        if (!content) {
          Toast.error('Contenu requis');
          return false;
        }
        
        const tags = document.getElementById('je-tags').value
          .split(',').map(t => t.trim()).filter(Boolean);
        
        const newEntry = {
          id: entry?.id || Utils.id(),
          title: document.getElementById('je-title').value.trim(),
          content,
          tags,
          date: entry?.date || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        if (isEdit) {
          const idx = this.entries.findIndex(e => e.id === entry.id);
          this.entries[idx] = newEntry;
        } else {
          this.entries.push(newEntry);
        }
        
        this.save();
        this.render();
        Toast.success(isEdit ? 'Entrée mise à jour' : 'Entrée créée');
      }
    });
  },

  deleteEntry(id) {
    Modal.confirm('Supprimer cette entrée ?', () => {
      this.entries = this.entries.filter(e => e.id !== id);
      this.save();
      this.render();
      Toast.success('Entrée supprimée');
    });
  }
};

window.JournalModule = JournalModule;
