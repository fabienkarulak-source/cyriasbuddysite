/**
 * assets/js/app.js - Cœur de l'application
 */
const App = {
  config: { name: 'Cyrias Buddy', theme: 'light' },

  async init() {
    // 1. Thème
    const savedTheme = Storage.get ? Storage.get('app_theme', 'light') : 'light';
    this.setTheme(savedTheme);
    
    // 2. Synchronisation GitHub (si présente dans votre storage.js)
    if (window.Storage && Storage.initCloud) {
        await Storage.initCloud();
    }
    
    // 3. Déclaration des routes
    this.registerRoutes();
    
    // 4. Lancement du Routeur
    Router.init('#content');
    
    // 5. Activation des boutons de la Sidebar
    this.setupEvents();
  },

  registerRoutes() {
    // Fait le lien entre l'URL, le fichier dans pages/ et le fichier dans modules/
    const routes = [
      { name: 'dashboard', page: 'dashboard', module: 'DashboardModule' },
      { name: 'clients', page: 'clients', module: 'ClientsModule' },
      { name: 'craminator', page: 'craminator', module: 'CRAModule' },
      { name: 'organisator', page: 'organisator', module: 'OrganisatorModule' },
      { name: 'journal', page: 'journal', module: 'JournalModule' },
      { name: 'notifcenter', page: 'notifcenter', module: 'NotifModule' },
      { name: 'communicator', page: 'communicator', module: 'CommunicatorModule' },
      { name: 'links', page: 'links', module: 'LinksModule' },
      { name: 'direction', page: 'direction', module: 'DirectionModule' },
      { name: 'facturator', page: 'facturator', module: 'FacturatorModule' },
      { name: 'agregator', page: 'agregator', module: 'AgregatorModule' },
      { name: 'kanban', page: 'kanban', module: 'KanbanModule' },
      { name: 'snippets', page: 'snippets', module: 'SnippetsModule' },
      { name: 'sql', page: 'sql', module: 'SQLModule' },
      { name: 'loganalyzer', page: 'loganalyzer', module: 'LogAnalyzerModule' },
      { name: 'xmlviewer', page: 'xmlviewer', module: 'XMLViewerModule' },
      { name: 'bible', page: 'bible', module: 'BibleModule' },
      { name: 'analytics', page: 'analytics', module: 'AnalyticsModule' },
      { name: 'errortracker', page: 'errortracker', module: 'ErrorTrackerModule' },
      { name: 'gitcicd', page: 'gitcicd', module: 'GitCICDModule' },
      { name: 'config', page: 'config', module: 'ConfigModule' }
    ];
    routes.forEach(r => Router.register(r.name, r));
  },

  setupEvents() {
    document.getElementById('toggle-theme')?.addEventListener('click', () => {
      this.setTheme(this.config.theme === 'light' ? 'dark' : 'light');
    });

    document.getElementById('sidebar-collapse-btn')?.addEventListener('click', () => this.toggleSidebar());
    
    document.getElementById('toggle-menu')?.addEventListener('click', () => {
      const sidebar = document.getElementById('sidebar');
      if (sidebar.classList.contains('hidden')) sidebar.classList.remove('hidden');
      else sidebar.classList.add('open');
    });
  },

  toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
    const isCollapsed = sidebar.classList.toggle('collapsed');
    document.body.classList.toggle('sb-collapsed', isCollapsed);
    localStorage.setItem('cyrias_sidebar_state', isCollapsed ? 'collapsed' : 'expanded');
  },

  setTheme(theme) {
    this.config.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('cyrias_app_theme', JSON.stringify(theme));
  }
};

window.addEventListener('DOMContentLoaded', () => App.init());
window.App = App;
