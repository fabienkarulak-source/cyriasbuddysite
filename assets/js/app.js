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

  // ... (Garder _renderSidebar, setupEvents, toggleSidebar, setTheme, exportAll, importAll inchangés) ...
};

window.addEventListener('DOMContentLoaded', () => App.init());
window.App = App;
