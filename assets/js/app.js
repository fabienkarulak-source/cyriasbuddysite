/**
 * APP.JS - Point d'entrée principal du Portail Cyrias Buddy
 * Gère l'initialisation, le routage et l'interface globale.
 */
const App = {
  config: { 
    name: 'Cyrias Buddy', 
    version: '23.0', 
    theme: 'light' 
  },

  /**
   * Dictionnaire des icônes SVG (identiques à la v23 originale)
   */
  icons: {
    home: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
    link: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
    calendar: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>',
    edit: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>',
    bell: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>',
    mail: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>',
    trendUp: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>',
    chart: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 12v5"/><path d="M11 8v9"/><path d="M15 14v3"/><path d="M19 10v7"/></svg>',
    receipt: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17.5v-11"/></svg>',
    layers: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>',
    kanban: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><line x1="7" x2="7" y1="8" y2="13"/><line x1="12" x2="12" y1="8" y2="16"/><line x1="17" x2="17" y1="8" y2="11"/></svg>',
    code: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
    database: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg>',
    filetext: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/></svg>',
    book: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>',
    pie: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12c.552 0 1.005-.449.95-.998a10 10 0 0 0-8.953-8.951c-.55-.055-.997.398-.997.95v8a1 1 0 0 0 1 1h8Z"/><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/></svg>',
    triangle: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>',
    git: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M6 21V9a9 9 0 0 0 9 9"/></svg>',
    settings: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>',
    building: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>'
  },

  /**
   * Initialisation de l'application
   */
  async init() {
    // Restaurer le thème
    const savedTheme = Storage.get('app_theme', 'light');
    this.setTheme(savedTheme);

    // Initialiser les routes
    this.registerRoutes();

    // Initialiser le Router sur la zone de contenu
    Router.init('#content');

    // Générer la sidebar dynamique (pour gérer les icônes)
    this._renderSidebar();

    // Configurer les événements globaux
    this.setupEvents();

    console.log(`${this.config.name} v${this.config.version} démarré.`);
  },

  /**
   * Enregistrement de toutes les pages disponibles
   */
  registerRoutes() {
    const routes = [
      // Section: Espace quotidien
      { name: 'dashboard', title: 'Accueil', page: 'dashboard', module: 'DashboardModule', section: 'quotidien', sectionTitle: 'Espace quotidien', icon: 'home' },
     // Dans app.js, dans registerRoutes()
{ name: 'clients', title: 'Espace Client 360', page: 'clients', module: 'ClientsModule', section: 'quotidien', icon: 'building' },
      { name: 'organisator', title: 'Organisator', page: 'organisator', module: 'OrganisatorModule', section: 'quotidien', icon: 'calendar' },
      { name: 'journal', title: 'Journal de bord', page: 'journal', module: 'JournalModule', section: 'quotidien', icon: 'edit' },
      { name: 'notifcenter', title: 'Alertes', page: 'notifcenter', module: 'NotifModule', section: 'quotidien', icon: 'bell' },
      { name: 'communicator', title: 'Communicator', page: 'communicator', module: 'CommunicatorModule', section: 'quotidien', icon: 'mail' },
      { name: 'links', title: 'Tous les liens', page: 'links', module: 'LinksModule', section: 'quotidien', icon: 'link' },

      // Section: Pilotage
      { name: 'direction', title: 'Board Direction', page: 'direction', module: 'DirectionModule', section: 'pilotage', sectionTitle: 'Pilotage', icon: 'trendUp' },
      { name: 'craminator', title: 'CRAminator', page: 'craminator', module: 'CRAModule', section: 'pilotage', icon: 'chart' },
      { name: 'facturator', title: 'Facturator', page: 'facturator', module: 'FacturatorModule', section: 'pilotage', icon: 'receipt' },
      { name: 'agregator', title: 'Stafiz Agregator', page: 'agregator', module: 'AgregatorModule', section: 'pilotage', icon: 'layers' },
      { name: 'kanban', title: 'Kanban & MEP', page: 'kanban', module: 'KanbanModule', section: 'pilotage', icon: 'kanban' },

      // Section: Outils techniques
      { name: 'snippets', title: 'Snippetator', page: 'snippets', module: 'SnippetsModule', section: 'techniques', sectionTitle: 'Outils techniques', icon: 'code' },
      { name: 'sql', title: 'SQL Generator', page: 'sql', module: 'SQLModule', section: 'techniques', icon: 'database' },
      { name: 'loganalyzer', title: 'LOG Analyzor', page: 'loganalyzer', module: 'LogAnalyzerModule', section: 'techniques', icon: 'filetext' },
      { name: 'xmlviewer', title: 'Ivalua Context', page: 'xmlviewer', module: 'XMLViewerModule', section: 'techniques', icon: 'code' },
      { name: 'bible', title: 'TMA Formator', page: 'bible', module: 'BibleModule', section: 'techniques', icon: 'book' },
      { name: 'analytics', title: 'Analytics', page: 'analytics', module: 'AnalyticsModule', section: 'techniques', icon: 'pie' },
      { name: 'errortracker', title: 'Error Tracker', page: 'errortracker', module: 'ErrorTrackerModule', section: 'techniques', icon: 'triangle' },
      { name: 'gitcicd', title: 'Git & CI/CD', page: 'gitcicd', module: 'GitCICDModule', section: 'techniques', icon: 'git' },

      // Footer / Config
      { name: 'config', title: 'Configuration', page: 'config', module: 'ConfigModule', section: 'footer', icon: 'settings' }
    ];

    routes.forEach(r => Router.register(r.name, r));
    this.allRoutes = routes; // Garder en mémoire pour le rendu sidebar
  },

  /**
   * Injection des icônes et boutons dans la sidebar HTML existante
   */
  _renderSidebar() {
    const navContainer = document.getElementById('sidebar-nav');
    if (!navContainer) return;

    // On utilise les sections définies dans les routes
    const sections = {};
    this.allRoutes.forEach(r => {
      if (r.section === 'footer') return;
      if (!sections[r.section]) {
        sections[r.section] = { title: r.sectionTitle, items: [] };
      }
      sections[r.section].items.push(r);
    });

    let html = '';
    for (const [key, section] of Object.entries(sections)) {
      html += `
        <div class="nav-section" data-section="${key}">
          <button class="nav-section-header" onclick="toggleNavSection('${key}')">
            <span class="nav-section-chevron"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg></span>
            <span class="nav-section-label">${section.title}</span>
          </button>
          <div class="nav-section-body">
            ${section.items.map(item => `
              <button class="nav-item" data-route="${item.name}" onclick="navigateTo('${item.name}')">
                <span class="nav-icon">${this.icons[item.icon] || ''}</span>
                <span>${item.title}</span>
              </button>
            `).join('')}
          </div>
        </div>
      `;
    }
    navContainer.innerHTML = html;
  },

  /**
   * Configuration des écouteurs d'événements globaux
   */
  setupEvents() {
    // Bascule de thème
    document.getElementById('toggle-theme')?.addEventListener('click', () => {
      this.setTheme(this.config.theme === 'light' ? 'dark' : 'light');
    });

    // Réduction de la sidebar
    document.getElementById('sidebar-collapse-btn')?.addEventListener('click', () => {
      this.toggleSidebar();
    });

    // Burger menu mobile
    document.getElementById('toggle-menu')?.addEventListener('click', () => {
      const sidebar = document.getElementById('sidebar');
      sidebar.classList.toggle('open');
    });

    // Raccourci Ctrl+B pour la sidebar
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        this.toggleSidebar();
      }
    });

    // Restaurer l'état de la sidebar
    const sbState = Storage.get('sidebar_state', 'expanded');
    if (sbState === 'collapsed') {
      document.getElementById('sidebar')?.classList.add('collapsed');
      document.body.classList.add('sb-collapsed');
    }
  },

  /**
   * Action de réduction/agrandissement de la sidebar
   */
  toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
    
    const isCollapsed = sidebar.classList.toggle('collapsed');
    document.body.classList.toggle('sb-collapsed', isCollapsed);
    Storage.set('sidebar_state', isCollapsed ? 'collapsed' : 'expanded');
  },

  /**
   * Application du thème UI
   */
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
  }
};

// Lancement de l'application
window.App = App;
