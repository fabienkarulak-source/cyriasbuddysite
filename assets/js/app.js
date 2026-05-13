/**
 * APP.JS - Initialisation avec sidebar collapsible
 */
const App = {
  config: { name: 'Cyrias Buddy', version: '23.0', theme: 'light' },

  icons: { /* ... Gardez votre dictionnaire this.icons de votre fichier d'origine ... */ },

  async init() {
    const savedTheme = Storage.get('app_theme', 'light');
    this.setTheme(savedTheme);
    
    // ⚡ 1. Synchronisation GitHub avant de démarrer le routeur
    await Storage.initCloud();
    
    // 2. Démarrage de l'interface
    this.registerRoutes();
    Router.init('#content');
    this.setupEvents();
  },

  registerRoutes() {
    const routes = [
      { name: 'dashboard', title: 'Accueil', page: 'dashboard', module: 'DashboardModule', section: 'quotidien', sectionTitle: 'Espace quotidien', icon: 'home' },
      { name: 'links', title: 'Tous les liens', page: 'links', module: 'LinksModule', section: 'quotidien', icon: 'link' },
      { name: 'organisator', title: 'Organisator', page: 'organisator', module: 'OrganisatorModule', section: 'quotidien', icon: 'calendar' },
      { name: 'journal', title: 'Journal de bord', page: 'journal', module: 'JournalModule', section: 'quotidien', icon: 'edit' },
      { name: 'notifcenter', title: 'Alertes', page: 'notifcenter', module: 'NotifModule', section: 'quotidien', icon: 'bell' },
      { name: 'communicator', title: 'Communicator', page: 'communicator', module: 'CommunicatorModule', section: 'quotidien', icon: 'mail' },
      { name: 'direction', title: 'Board Direction', page: 'direction', module: 'DirectionModule', section: 'pilotage', sectionTitle: 'Pilotage', icon: 'trendUp' },
      { name: 'craminator', title: 'CRAminator', page: 'craminator', module: 'CRAModule', section: 'pilotage', icon: 'chart' },
      { name: 'facturator', title: 'Facturator', page: 'facturator', module: 'FacturatorModule', section: 'pilotage', icon: 'receipt' },
      { name: 'agregator', title: 'Stafiz Agregator', page: 'agregator', module: 'AgregatorModule', section: 'pilotage', icon: 'layers' },
      { name: 'kanban', title: 'Kanban & MEP', page: 'kanban', module: 'KanbanModule', section: 'pilotage', icon: 'kanban' },
      { name: 'snippets', title: 'Snippetator', page: 'snippets', module: 'SnippetsModule', section: 'techniques', sectionTitle: 'Outils techniques', icon: 'code' },
      { name: 'sql', title: 'SQL Generator', page: 'sql', module: 'SQLModule', section: 'techniques', icon: 'database' },
      { name: 'loganalyzer', title: 'LOG Analyzor', page: 'loganalyzer', module: 'LogAnalyzerModule', section: 'techniques', icon: 'filetext' },
      { name: 'xmlviewer', title: 'Ivalua Context', page: 'xmlviewer', module: 'XMLViewerModule', section: 'techniques', icon: 'code' },
      { name: 'bible', title: 'TMA Formator', page: 'bible', module: 'BibleModule', section: 'techniques', icon: 'book' },
      { name: 'analytics', title: 'Analytics', page: 'analytics', module: 'AnalyticsModule', section: 'techniques', icon: 'pie' },
      { name: 'errortracker', title: 'Error Tracker', page: 'errortracker', module: 'ErrorTrackerModule', section: 'techniques', icon: 'triangle' },
      { name: 'gitcicd', title: 'Git & CI/CD', page: 'gitcicd', module: 'GitCICDModule', section: 'techniques', icon: 'git' },
      { name: 'config', title: 'Configuration', page: 'config', module: 'ConfigModule', section: 'footer', icon: 'settings' }
    ];
    routes.forEach(r => Router.register(r.name, r));
  },

   init() {
    const savedTheme = Storage.get('app_theme', 'light');
    this.setTheme(savedTheme);
    this.registerRoutes();
    Router.init('#content');
    this.setupEvents();
  },

  registerRoutes() {
    const routes = [
      // Espace quotidien
      { name: 'dashboard', title: 'Accueil', page: 'dashboard', module: 'DashboardModule', section: 'quotidien', sectionTitle: 'Espace quotidien', icon: 'home' },
      { name: 'links', title: 'Tous les liens', page: 'links', module: 'LinksModule', section: 'quotidien', icon: 'link' },
      { name: 'organisator', title: 'Organisator', page: 'organisator', module: 'OrganisatorModule', section: 'quotidien', icon: 'calendar' },
      { name: 'journal', title: 'Journal de bord', page: 'journal', module: 'JournalModule', section: 'quotidien', icon: 'edit' },
      { name: 'notifcenter', title: 'Alertes', page: 'notifcenter', module: 'NotifModule', section: 'quotidien', icon: 'bell' },
      { name: 'communicator', title: 'Communicator', page: 'communicator', module: 'CommunicatorModule', section: 'quotidien', icon: 'mail' },

      // Pilotage
      { name: 'direction', title: 'Board Direction', page: 'direction', module: 'DirectionModule', section: 'pilotage', sectionTitle: 'Pilotage', icon: 'trendUp' },
      { name: 'craminator', title: 'CRAminator', page: 'craminator', module: 'CRAModule', section: 'pilotage', icon: 'chart' },
      { name: 'facturator', title: 'Facturator', page: 'facturator', module: 'FacturatorModule', section: 'pilotage', icon: 'receipt' },
      { name: 'agregator', title: 'Stafiz Agregator', page: 'agregator', module: 'AgregatorModule', section: 'pilotage', icon: 'layers' },
      { name: 'kanban', title: 'Kanban & MEP', page: 'kanban', module: 'KanbanModule', section: 'pilotage', icon: 'kanban' },

      // Outils techniques
      { name: 'snippets', title: 'Snippetator', page: 'snippets', module: 'SnippetsModule', section: 'techniques', sectionTitle: 'Outils techniques', icon: 'code' },
      { name: 'sql', title: 'SQL Generator', page: 'sql', module: 'SQLModule', section: 'techniques', icon: 'database' },
      { name: 'loganalyzer', title: 'LOG Analyzor', page: 'loganalyzer', module: 'LogAnalyzerModule', section: 'techniques', icon: 'filetext' },
      { name: 'xmlviewer', title: 'Ivalua Context', page: 'xmlviewer', module: 'XMLViewerModule', section: 'techniques', icon: 'code' },
      { name: 'bible', title: 'TMA Formator', page: 'bible', module: 'BibleModule', section: 'techniques', icon: 'book' },
      { name: 'analytics', title: 'Analytics', page: 'analytics', module: 'AnalyticsModule', section: 'techniques', icon: 'pie' },
      { name: 'errortracker', title: 'Error Tracker', page: 'errortracker', module: 'ErrorTrackerModule', section: 'techniques', icon: 'triangle' },
      { name: 'gitcicd', title: 'Git & CI/CD', page: 'gitcicd', module: 'GitCICDModule', section: 'techniques', icon: 'git' },

      // Footer
      { name: 'config', title: 'Configuration', page: 'config', module: 'ConfigModule', section: 'footer', icon: 'settings' }
    ];

    routes.forEach(r => Router.register(r.name, r));
    // Sidebar is in the HTML already (original v23)
  },

  _renderSidebar(routes) {
    const nav = document.getElementById('sidebar-nav');
    if (!nav) return;

    const sections = {};
    routes.forEach(r => {
      if (r.section === 'footer') return;
      if (!sections[r.section]) {
        sections[r.section] = { title: r.sectionTitle || r.section, items: [] };
      }
      sections[r.section].items.push(r);
    });

    let html = '';
    for (const [key, sec] of Object.entries(sections)) {
      html += `<div class="nav-section" data-section="${key}">
        <div class="nav-section-title">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          ${sec.title}
        </div>
        ${sec.items.map(r => `
          <button class="nav-item" data-route="${r.name}" data-tooltip="${r.title}" onclick="Router.navigate('${r.name}')">
            <span class="nav-icon">${this.icons[r.icon] || ''}</span>
            <span>${r.title}</span>
          </button>
        `).join('')}
      </div>`;
    }

    nav.innerHTML = html;

    // Config button is in the HTML footer, just wire its click
    document.getElementById('nav-config')?.addEventListener('click', () => Router.navigate('config'));
  },

  setupEvents() {
    // Thème
    document.getElementById('toggle-theme')?.addEventListener('click', () => {
      this.setTheme(this.config.theme === 'light' ? 'dark' : 'light');
    });

    // Sidebar collapse
    document.getElementById('sidebar-collapse-btn')?.addEventListener('click', () => {
      this.toggleSidebar();
    });

    // Sidebar burger
    document.getElementById('toggle-menu')?.addEventListener('click', () => {
      const sidebar = document.getElementById('sidebar');
      if (sidebar.classList.contains('hidden')) {
        sidebar.classList.remove('hidden');
      } else {
        sidebar.classList.add('open');
      }
    });

    // Export/Import
    document.getElementById('btn-export')?.addEventListener('click', () => this.exportAll());
    document.getElementById('btn-import')?.addEventListener('click', () => this.importAll());

    // Ctrl+B = toggle sidebar
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        this.toggleSidebar();
      }
    });

    // Restaurer état sidebar
    const sbState = Storage.get('sidebar_state', 'full');
    if (sbState === 'collapsed') {
      document.getElementById('sidebar')?.classList.add('collapsed');
      document.body.classList.add('sb-collapsed');
    }
  },

  toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
    
    const isCollapsed = sidebar.classList.toggle('collapsed');
    document.body.classList.toggle('sb-collapsed', isCollapsed);
    Storage.set('sidebar_state', isCollapsed ? 'collapsed' : 'full');
  },

  setTheme(theme) {
    this.config.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    Storage.set('app_theme', theme);
    
    const icon = document.getElementById('theme-icon');
    if (icon) {
      icon.innerHTML = theme === 'light'
        ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>'
        : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>';
    }
  },

  async exportAll() {
    const data = Storage.exportAll();
    Utils.download(JSON.stringify(data, null, 2), `cyrias_backup_${new Date().toISOString().split('T')[0]}.json`);
    Toast.success('Données exportées');
  },

  async importAll() {
    try {
      const content = await Utils.importFile('.json');
      const data = JSON.parse(content);
      Modal.confirm(
        `Importer ${Object.keys(data.data || {}).length} modules ? Les données existantes seront remplacées.`,
        () => {
          if (Storage.importAll(data)) {
            Toast.success('Données importées. Rechargement…');
            setTimeout(() => location.reload(), 1000);
          } else {
            Toast.error('Échec de l\'import');
          }
        }
      );
    } catch (e) {
      Toast.error('Erreur: ' + e.message);
    }
  }
};



window.addEventListener('DOMContentLoaded', () => App.init());
window.App = App;
