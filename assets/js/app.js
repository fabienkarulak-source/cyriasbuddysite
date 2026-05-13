/**
 * assets/js/app.js - Initialisation et Configuration globale
 */
const App = {
  config: { name: 'Cyrias Buddy', theme: 'light' },

  async init() {
    // Restaurer les préférences utilisateur
    const savedTheme = localStorage.getItem('cyrias_app_theme') ? JSON.parse(localStorage.getItem('cyrias_app_theme')) : 'light';
    this.setTheme(savedTheme);

    // Initialiser le système de stockage Cloud (GitHub) si configuré
    if (window.Storage && typeof Storage.initCloud === 'function') {
      await Storage.initCloud();
    }

    // Enregistrer toutes les pages du portail
    this.registerRoutes();

    // Lancer le routeur
    Router.init('#content');

    // Configurer les écouteurs d'événements (Sidebar, Thème)
    this.setupEvents();
  },

  registerRoutes() {
    const routes = [
      // === ESPACE QUOTIDIEN ===
      { name: 'dashboard',    title: 'Accueil',            page: 'dashboard',    module: 'DashboardModule' },
      { name: 'clients',      title: 'Espace Client 360',  page: 'clients',      module: 'ClientsModule' },
      { name: 'organisator',  title: 'Organisator',        page: 'organisator',  module: 'OrganisatorModule' },
      { name: 'journal',      title: 'Journal de bord',    page: 'journal',      module: 'JournalModule' },
      { name: 'notifcenter',  title: 'Alertes',            page: 'notifcenter',  module: 'NotifModule' },
      { name: 'communicator', title: 'Communicator',       page: 'communicator', module: 'CommunicatorModule' },
      { name: 'links',        title: 'Tous les liens',     page: 'links',        module: 'LinksModule' },

      // === PILOTAGE ===
      { name: 'direction',    title: 'Board Direction',    page: 'direction',    module: 'DirectionModule' },
      { name: 'craminator',   title: 'CRAminator',         page: 'craminator',   module: 'CRAModule' },
      { name: 'facturator',   title: 'Facturator',         page: 'facturator',   module: 'FacturatorModule' },
      { name: 'agregator',    title: 'Stafiz Agregator',   page: 'agregator',    module: 'AgregatorModule' },
      { name: 'kanban',       title: 'Kanban & MEP',       page: 'kanban',       module: 'KanbanModule' },

      // === OUTILS TECHNIQUES ===
      { name: 'snippets',     title: 'Snippetator',        page: 'snippets',     module: 'SnippetsModule' },
      { name: 'sql',          title: 'SQL Generator',      page: 'sql',          module: 'SQLModule' },
      { name: 'loganalyzer',  title: 'LOG Analyzor',       page: 'loganalyzer',  module: 'LogAnalyzerModule' },
      { name: 'xmlviewer',    title: 'Ivalua Context',     page: 'xmlviewer',    module: 'XMLViewerModule' },
      { name: 'bible',        title: 'TMA Formator',       page: 'bible',        module: 'BibleModule' },
      { name: 'analytics',    title: 'Analytics',          page: 'analytics',    module: 'AnalyticsModule' },
      { name: 'errortracker', title: 'Error Tracker',      page: 'errortracker',  module: 'ErrorTrackerModule' },
      { name: 'gitcicd',      title: 'Git & CI/CD',        page: 'gitcicd',      module: 'GitCICDModule' },

      // === FOOTER ===
      { name: 'config',       title: 'Configuration',      page: 'config',       module: 'ConfigModule' }
    ];

    routes.forEach(r => Router.register(r.name, r));
  },

  setupEvents() {
    // Bouton de thème
    document.getElementById('toggle-theme')?.addEventListener('click', () => {
      this.setTheme(this.config.theme === 'light' ? 'dark' : 'light');
    });

    // Bouton de réduction sidebar
    document.getElementById('sidebar-collapse-btn')?.addEventListener('click', () => {
      this.toggleSidebar();
    });

    // Sidebar burger (Mobile)
    document.getElementById('toggle-menu')?.addEventListener('click', () => {
      document.getElementById('sidebar')?.classList.toggle('open');
    });

    // Raccourci Ctrl+B
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        this.toggleSidebar();
      }
    });

    // Restaurer l'état réduit de la sidebar
    const sbState = localStorage.getItem('cyrias_sidebar_state');
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
    localStorage.setItem('cyrias_sidebar_state', isCollapsed ? 'collapsed' : 'expanded');
  },

  setTheme(theme) {
    this.config.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('cyrias_app_theme', JSON.stringify(theme));
    
    // Mise à jour de l'icône
    const icon = document.getElementById('theme-icon');
    if (icon) {
      icon.innerHTML = theme === 'light' 
        ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>'
        : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>';
    }
  }
};

// Lancement automatique
window.addEventListener('DOMContentLoaded', () => App.init());
window.App = App;
