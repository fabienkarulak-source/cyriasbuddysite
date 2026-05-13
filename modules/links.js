/**
 * LINKS MODULE - Gestionnaire de liens favoris
 */
const LinksModule = {
  KEY: 'links',
  data: { categories: [], links: [] },
  search: '',

  async init() {
    this.load();
    if (this.data.categories.length === 0) {
      this.seedDefaults();
    }
    this.render();
    this.setupEvents();
  },

  seedDefaults() {
    this.data = {
      categories: [
        { id: 'work', name: '💼 Travail', color: '#5EB091' },
        { id: 'tools', name: '🛠 Outils', color: '#3B82F6' },
        { id: 'docs', name: '📚 Documentation', color: '#F59E0B' }
      ],
      links: [
        { id: Utils.id(), title: 'GitHub', url: 'https://github.com', category: 'tools', description: 'Plateforme Git' },
        { id: Utils.id(), title: 'MDN Web Docs', url: 'https://developer.mozilla.org', category: 'docs', description: 'Documentation web' }
      ]
    };
    this.save();
  },

  load() {
    this.data = Storage.get(this.KEY, { categories: [], links: [] });
  },

  save() {
    Storage.set(this.KEY, this.data);
  },

  setupEvents() {
    document.getElementById('links-new')?.addEventListener('click', () => this.newLink());
    document.getElementById('links-export')?.addEventListener('click', () => this.export());
    
    const search = document.getElementById('links-search');
    if (search) {
      search.addEventListener('input', Utils.debounce((e) => {
        this.search = e.target.value.toLowerCase();
        this.render();
      }, 200));
    }
  },

  filteredLinks() {
    if (!this.search) return this.data.links;
    return this.data.links.filter(l => 
      l.title?.toLowerCase().includes(this.search) ||
      l.url?.toLowerCase().includes(this.search) ||
      l.description?.toLowerCase().includes(this.search)
    );
  },

  render() {
    const container = document.getElementById('links-container');
    if (!container) return;

    const links = this.filteredLinks();
    const grouped = {};
    
    this.data.categories.forEach(cat => {
      grouped[cat.id] = { cat, items: [] };
    });
    
    links.forEach(l => {
      const catId = l.category || 'uncategorized';
      if (!grouped[catId]) {
        grouped[catId] = { cat: { id: catId, name: '📌 Autre' }, items: [] };
      }
      grouped[catId].items.push(l);
    });

    container.innerHTML = Object.values(grouped)
      .filter(g => g.items.length > 0)
      .map(({ cat, items }) => `
        <div class="card mb-4">
          <div class="card-header">
            <h3 class="card-title">${Utils.escape(cat.name)} (${items.length})</h3>
            <button class="btn btn-ghost btn-sm" onclick="LinksModule.newLink('${cat.id}')">+ Ajouter</button>
          </div>
          <div class="grid grid-3">
            ${items.map(l => `
              <div style="padding:12px;border:1px solid var(--border);border-radius:var(--radius);background:var(--bg-subtle);transition:all 0.2s;" 
                   onmouseover="this.style.borderColor='var(--brand)';this.style.boxShadow='var(--shadow)'"
                   onmouseout="this.style.borderColor='var(--border)';this.style.boxShadow='none'">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
                  <a href="${Utils.escape(l.url)}" target="_blank" rel="noopener" style="flex:1;text-decoration:none;color:var(--ink);">
                    <div style="font-weight:600;font-size:13px;margin-bottom:4px;">${Utils.escape(l.title)}</div>
                    <div class="text-xs text-muted" style="word-break:break-all;">${Utils.truncate(l.url, 40)}</div>
                    ${l.description ? `<div class="text-xs text-muted mt-2">${Utils.truncate(Utils.escape(l.description), 60)}</div>` : ''}
                  </a>
                  <div style="display:flex;flex-direction:column;gap:4px;">
                    <button class="btn btn-ghost btn-sm" onclick="LinksModule.editLink('${l.id}')" title="Modifier">✏️</button>
                    <button class="btn btn-ghost btn-sm" onclick="LinksModule.deleteLink('${l.id}')" title="Supprimer">🗑</button>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('') || `
        <div class="card">
          <div class="empty-state">
            <div class="empty-state-icon">🔗</div>
            <div class="empty-state-text">Aucun lien. Cliquez sur "+ Ajouter lien" pour commencer.</div>
          </div>
        </div>
      `;
  },

  newLink(defaultCategory = null) {
    this.showLinkModal(null, defaultCategory);
  },

  editLink(id) {
    const link = this.data.links.find(l => l.id === id);
    if (link) this.showLinkModal(link);
  },

  showLinkModal(link, defaultCategory = null) {
    const isEdit = !!link;
    Modal.show({
      title: isEdit ? '✏️ Modifier le lien' : '🔗 Nouveau lien',
      body: `
        <div class="form-group">
          <label class="label">Titre *</label>
          <input class="input" id="link-title" value="${Utils.escape(link?.title || '')}" required>
        </div>
        <div class="form-group">
          <label class="label">URL *</label>
          <input class="input" id="link-url" type="url" value="${Utils.escape(link?.url || 'https://')}" required>
        </div>
        <div class="form-group">
          <label class="label">Catégorie</label>
          <select class="select" id="link-category">
            ${this.data.categories.map(c => `
              <option value="${c.id}" ${(link?.category || defaultCategory) === c.id ? 'selected' : ''}>${Utils.escape(c.name)}</option>
            `).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="label">Description</label>
          <textarea class="textarea" id="link-desc" rows="2">${Utils.escape(link?.description || '')}</textarea>
        </div>
      `,
      okText: isEdit ? 'Modifier' : 'Créer',
      onOk: () => {
        const title = document.getElementById('link-title').value.trim();
        const url = document.getElementById('link-url').value.trim();
        if (!title || !url) {
          Toast.error('Titre et URL requis');
          return false;
        }
        
        const newLink = {
          id: link?.id || Utils.id(),
          title, url,
          category: document.getElementById('link-category').value,
          description: document.getElementById('link-desc').value.trim()
        };
        
        if (isEdit) {
          const idx = this.data.links.findIndex(l => l.id === link.id);
          this.data.links[idx] = newLink;
        } else {
          this.data.links.push(newLink);
        }
        
        this.save();
        this.render();
        Toast.success(isEdit ? 'Lien modifié' : 'Lien ajouté');
      }
    });
  },

  deleteLink(id) {
    Modal.confirm('Supprimer ce lien ?', () => {
      this.data.links = this.data.links.filter(l => l.id !== id);
      this.save();
      this.render();
      Toast.success('Lien supprimé');
    });
  },

  export() {
    Utils.download(JSON.stringify(this.data, null, 2), `links_${Date.now()}.json`);
    Toast.success('Liens exportés');
  }
};

window.LinksModule = LinksModule;
