/**
 * APP.JS
 */
const App = {
  config: { theme: 'light' },

  async init() {
    const savedTheme = localStorage.getItem('cyrias_app_theme') || '"light"';
    this.setTheme(JSON.parse(savedTheme));
    
    // ⚡️ Étape cruciale : on attend que la BDD GitHub soit chargée avant d'afficher la page
    if (window.Storage && Storage.initCloud) {
        await Storage.initCloud();
    }
    
    this.registerRoutes();
    this.renderSidebar();
    
    Router.init('#content');
    this.setupEvents();
  },

  registerRoutes() {
    const routes = [
      { name: 'dashboard', page: 'dashboard', module: 'DashboardModule', section: 'quotidien', icon: '🏠', title: 'Accueil' },
      { name: 'clients', page: 'clients', module: 'ClientsModule', section: 'quotidien', icon: '🏢', title: 'Espace Client 360' },
      { name: 'craminator', page: 'craminator', module: 'CRAModule', section: 'pilotage', icon: '📊', title: 'CRAminator' },
      { name: 'facturator', page: 'facturator', module: 'FacturatorModule', section: 'pilotage', icon: '💶', title: 'Facturator' },
      { name: 'organisator', page: 'organisator', module: 'OrganisatorModule', section: 'quotidien', icon: '📅', title: 'Organisator' },
      { name: 'kanban', page: 'kanban', module: 'KanbanModule', section: 'pilotage', icon: '📋', title: 'Kanban & MEP' },
      // Ajoute tes autres modules ici
    ];
    routes.forEach(r => Router.register(r.name, r));
    this.allRoutes = routes;
  },

  renderSidebar() {
    const nav = document.getElementById('sidebar-nav');
    if (!nav) return;

    // Regrouper par section
    const sections = {};
    this.allRoutes.forEach(r => {
      if (!sections[r.section]) sections[r.section] = [];
      sections[r.section].push(r);
    });

    const labels = { 'quotidien': 'Espace Quotidien', 'pilotage': 'Pilotage', 'techniques': 'Outils Techniques' };
    const collapsedPrefs = JSON.parse(localStorage.getItem('cyrias_nav_collapsed') || '["techniques"]');

    let html = '';
    for (const [key, items] of Object.entries(sections)) {
      const isCollapsed = collapsedPrefs.includes(key) ? 'nav-collapsed' : '';
      html += `
        <div class="nav-section ${isCollapsed}" data-section="${key}">
          <button class="nav-section-header" onclick="App.toggleNavSection('${key}')">
            <span class="nav-section-chevron">▼</span>
            <span class="nav-section-label">${labels[key] || key}</span>
          </button>
          <div class="nav-section-body">
            ${items.map(i => `
              <button class="nav-item" data-route="${i.name}" onclick="Router.navigate('${i.name}')">
                <span class="nav-icon">${i.icon}</span> ${i.title}
              </button>
            `).join('')}
          </div>
        </div>`;
    }
    nav.innerHTML = html;
  },

  toggleNavSection(name) {
    const sec = document.querySelector(`.nav-section[data-section="${name}"]`);
    if (sec) {
      sec.classList.toggle('nav-collapsed');
      const collapsed = JSON.parse(localStorage.getItem('cyrias_nav_collapsed') || '["techniques"]');
      if (sec.classList.contains('nav-collapsed') && !collapsed.includes(name)) collapsed.push(name);
      else if (!sec.classList.contains('nav-collapsed') && collapsed.includes(name)) collapsed.splice(collapsed.indexOf(name), 1);
      localStorage.setItem('cyrias_nav_collapsed', JSON.stringify(collapsed));
    }
  },

  setupEvents() {
    document.getElementById('toggle-theme')?.addEventListener('click', () => {
      this.setTheme(this.config.theme === 'light' ? 'dark' : 'light');
    });

    document.getElementById('sidebar-collapse-btn')?.addEventListener('click', () => {
      const sidebar = document.getElementById('sidebar');
      const isCollapsed = sidebar.classList.toggle('collapsed');
      document.body.classList.toggle('sb-collapsed', isCollapsed);
      localStorage.setItem('cyrias_sidebar_state', isCollapsed ? 'collapsed' : 'expanded');
    });

    const sbState = localStorage.getItem('cyrias_sidebar_state');
    if (sbState === 'collapsed') {
      document.getElementById('sidebar')?.classList.add('collapsed');
      document.body.classList.add('sb-collapsed');
    }
  },

  setTheme(theme) {
    this.config.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('cyrias_app_theme', JSON.stringify(theme));
  }
};

window.addEventListener('DOMContentLoaded', () => App.init());
window.App = App;
