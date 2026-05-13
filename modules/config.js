/**
 * CONFIG MODULE
 */
const ConfigModule = {
  KEY: 'profile',
  profile: {},

  async init() {
    this.load();
    this.render();
    this.setupEvents();
  },

  load() {
    this.profile = Storage.get(this.KEY, {});
  },

  save() {
    Storage.set(this.KEY, this.profile);
  },

  render() {
    // Pré-remplir le profil
    document.getElementById('cfg-name').value = this.profile.name || '';
    document.getElementById('cfg-email').value = this.profile.email || '';
    document.getElementById('cfg-company').value = this.profile.company || '';
    document.getElementById('cfg-tjm').value = this.profile.tjm || '';
    document.getElementById('cfg-lang').value = Storage.get('app_language', 'fr');

    // Stats storage
    this.renderStorageStats();
    
    // Modules actifs
    const modules = Storage.keys();
    document.getElementById('cfg-modules').textContent = modules.length > 0
      ? modules.join(', ')
      : 'Aucun module avec données';
  },

  renderStorageStats() {
    const stats = Storage.getStats();
    document.getElementById('cfg-storage-stats').innerHTML = `
      <div style="padding:12px;background:var(--bg-subtle);border-radius:var(--radius);">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
          <span class="text-sm">Espace utilisé</span>
          <strong class="text-sm">${stats.total}</strong>
        </div>
        <div style="display:flex;justify-content:space-between;">
          <span class="text-sm">Modules avec données</span>
          <strong class="text-sm">${stats.moduleCount}</strong>
        </div>
      </div>
    `;
  },

  setupEvents() {
    document.getElementById('theme-light')?.addEventListener('click', () => {
      App.setTheme('light');
      Toast.success('Thème clair activé');
    });

    document.getElementById('theme-dark')?.addEventListener('click', () => {
      App.setTheme('dark');
      Toast.success('Thème sombre activé');
    });

    document.getElementById('cfg-save')?.addEventListener('click', () => {
      this.profile = {
        name: document.getElementById('cfg-name').value.trim(),
        email: document.getElementById('cfg-email').value.trim(),
        company: document.getElementById('cfg-company').value.trim(),
        tjm: parseFloat(document.getElementById('cfg-tjm').value) || 0
      };
      this.save();
      Storage.set('app_language', document.getElementById('cfg-lang').value);
      Toast.success('Profil enregistré');
    });

    document.getElementById('cfg-export')?.addEventListener('click', () => App.exportAll());
    document.getElementById('cfg-import')?.addEventListener('click', () => App.importAll());

    document.getElementById('cfg-reset')?.addEventListener('click', () => {
      Modal.confirm(
        '⚠️ ATTENTION: Cette action effacera TOUTES vos données. Continuer ?',
        () => {
          Modal.confirm(
            'Êtes-vous absolument sûr ? Cette action est IRRÉVERSIBLE.',
            () => {
              Storage.clearAll();
              Toast.success('Toutes les données ont été effacées');
              setTimeout(() => location.reload(), 1000);
            }
          );
        }
      );
    });
  }
};

window.ConfigModule = ConfigModule;
