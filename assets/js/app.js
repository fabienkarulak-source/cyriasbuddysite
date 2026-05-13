/**
 * APP.JS - Initialisation principale
 */
const App = {
  config: { name: 'Cyrias Buddy', version: '23.0', theme: 'light' },

  icons: { /* Laissez vos SVG actuels ici */ },

  init() {
    const savedTheme = Storage.get('app_theme', 'light');
    this.setTheme(savedTheme);
    
    this.registerRoutes();
    Router.init('#content');
    this.setupEvents();
  },

  registerRoutes() {
    const routes = [
      { name: 'dashboard', title: 'Accueil', page: 'dashboard', module: 'DashboardModule', section: 'quotidien', icon: 'home' },
      { name: 'agregator', title: 'Stafiz Agregator', page: 'agregator', module: 'AgregatorModule', section: 'pilotage', icon: 'layers' },
      { name: 'bible', title: 'TMA Formator', page: 'bible', module: 'BibleModule', section: 'techniques', icon: 'book' },
      { name: 'communicator', title: 'Communicator', page: 'communicator', module: 'CommunicatorModule', section: 'quotidien', icon: 'mail' },
      { name: 'analytics', title: 'Analytics', page: 'analytics', module: 'AnalyticsModule', section: 'techniques', icon: 'pie' }
      // ... Ajoutez le reste de vos routes
    ];
    routes.forEach(r => Router.register(r.name, r));
  },

  setupEvents() {
    document.getElementById('toggle-theme')?.addEventListener('click', () => {
      this.setTheme(this.config.theme === 'light' ? 'dark' : 'light');
    });

    document.getElementById('sidebar-collapse-btn')?.addEventListener('click', () => this.toggleSidebar());
    document.getElementById('toggle-menu')?.addEventListener('click', () => {
      const sidebar = document.querySelector('.sidebar');
      if (sidebar.classList.contains('hidden')) sidebar.classList.remove('hidden');
      else sidebar.classList.add('open');
    });

    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        this.toggleSidebar();
      }
    });

    const sbState = Storage.get('sidebar_state', 'full');
    if (sbState === 'collapsed') {
      document.querySelector('.sidebar')?.classList.add('collapsed');
      document.body.classList.add('sb-collapsed');
    }
  },

  toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;
    const isCollapsed = sidebar.classList.toggle('collapsed');
    document.body.classList.toggle('sb-collapsed', isCollapsed);
    Storage.set('sidebar_state', isCollapsed ? 'collapsed' : 'full');
  },

  setTheme(theme) {
    this.config.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    Storage.set('app_theme', theme);
  }
};

window.addEventListener('DOMContentLoaded', () => App.init());
window.App = App;
