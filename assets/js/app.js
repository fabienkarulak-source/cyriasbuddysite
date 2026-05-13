/**
 * assets/js/app.js - Cœur du portail Cyrias Buddy
 * Gestion de la navigation, du thème et de l'interface.
 */
const App = {
    config: {
        theme: 'light',
        currentPage: 'dashboard'
    },

    /**
     * Initialisation au chargement de la page
     */
    async init() {
        console.log("🚀 Initialisation du portail...");

        // 1. Restaurer le thème (Clair / Sombre)
        const savedTheme = localStorage.getItem('cyrias_app_theme') 
            ? JSON.parse(localStorage.getItem('cyrias_app_theme')) 
            : 'light';
        this.setTheme(savedTheme);

        // 2. Restaurer l'état de la sidebar (Réduite / Étendue)
        this.restoreSidebarState();

        // 3. Initialiser la synchronisation GitHub (si configurée)
        if (window.Storage && typeof Storage.initCloud === 'function') {
            try {
                await Storage.initCloud();
            } catch (e) {
                console.warn("Connexion cloud impossible, mode local activé.");
            }
        }

        // 4. Activer les écouteurs d'événements (clics, raccourcis)
        this.setupEventListeners();

        // 5. Afficher la page par défaut (ou celle du hash URL)
        const hash = window.location.hash.replace('#/', '') || 'dashboard';
        this.navigateTo(hash);
    },

    /**
     * Navigation entre les pages (Afficher / Cacher)
     */
    navigateTo(pageId) {
        console.log(`📂 Navigation vers : ${pageId}`);

        const pages = document.querySelectorAll('.page');
        const navItems = document.querySelectorAll('.nav-item');
        let pageFound = false;

        // 1. Mise à jour visuelle du menu
        navItems.forEach(item => {
            // On cherche le bouton qui contient l'appel à cette page
            const onClickAttr = item.getAttribute('onclick') || "";
            if (onClickAttr.includes(`'${pageId}'`)) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        // 2. Gestion de l'affichage des sections
        pages.forEach(page => {
            if (page.id === `page-${pageId}`) {
                page.style.display = 'block';
                page.classList.add('active');
                pageFound = true;
            } else {
                page.style.display = 'none';
                page.classList.remove('active');
            }
        });

        // Si la page n'existe pas, on retourne à l'accueil
        if (!pageFound && pageId !== 'dashboard') {
            return this.navigateTo('dashboard');
        }

        // 3. Mise à jour de l'URL (sans recharger)
        window.location.hash = `#/${pageId}`;
        this.config.currentPage = pageId;

        // 4. Déclenchement de la logique spécifique au module
        this.initModule(pageId);
    },

    /**
     * Lance le script init() du module correspondant à la page
     */
    initModule(pageId) {
        const moduleMap = {
            'dashboard': 'DashboardModule',
            'clients': 'ClientsModule',
            'craminator': 'CRAModule',
            'organisator': 'OrganisatorModule',
            'kanban': 'KanbanModule'
            // Ajoutez ici vos autres correspondances
        };

        const moduleName = moduleMap[pageId];
        if (moduleName && window[moduleName] && typeof window[moduleName].init === 'function') {
            try {
                window[moduleName].init();
            } catch (err) {
                console.error(`Erreur d'initialisation du module ${moduleName}:`, err);
            }
        }
    },

    /**
     * Gestion des sections repliables du menu
     */
    toggleNavSection(sectionId) {
        const section = document.querySelector(`.nav-section[data-section="${sectionId}"]`);
        if (section) {
            section.classList.toggle('nav-collapsed');
            
            // Sauvegarder l'état pour le prochain chargement
            const collapsed = JSON.parse(localStorage.getItem('cyrias_nav_collapsed') || '[]');
            if (section.classList.contains('nav-collapsed')) {
                if (!collapsed.includes(sectionId)) collapsed.push(sectionId);
            } else {
                const index = collapsed.indexOf(sectionId);
                if (index > -1) collapsed.splice(index, 1);
            }
            localStorage.setItem('cyrias_nav_collapsed', JSON.stringify(collapsed));
        }
    },

    /**
     * Gestion du thème (Sombre / Clair)
     */
    setTheme(theme) {
        this.config.theme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('cyrias_app_theme', JSON.stringify(theme));

        const icon = document.getElementById('theme-icon');
        if (icon) {
            icon.innerHTML = theme === 'dark' 
                ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>'
                : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
        }
    },

    toggleTheme() {
        this.setTheme(this.config.theme === 'light' ? 'dark' : 'light');
    },

    /**
     * Gestion de la Sidebar
     */
    toggleSidebar() {
        const sidebar = document.querySelector('.sidebar');
        const isCollapsed = sidebar.classList.toggle('collapsed');
        document.body.classList.toggle('sb-collapsed', isCollapsed);
        localStorage.setItem('cyrias_sidebar_state', JSON.stringify(isCollapsed ? 'collapsed' : 'expanded'));
    },

    restoreSidebarState() {
        const state = localStorage.getItem('cyrias_sidebar_state');
        if (state === '"collapsed"') {
            document.querySelector('.sidebar')?.classList.add('collapsed');
            document.body.classList.add('sb-collapsed');
        }
    },

    /**
     * Événements globaux
     */
    setupEventListeners() {
        // Raccourci Ctrl+B pour la sidebar
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
                e.preventDefault();
                this.toggleSidebar();
            }
        });

        // Écouter les retours arrière du navigateur
        window.addEventListener('popstate', () => {
            const hash = window.location.hash.replace('#/', '') || 'dashboard';
            this.navigateTo(hash);
        });
    }
};

// Lancement automatique
window.App = App;
document.addEventListener('DOMContentLoaded', () => App.init());

/**
 * Fonctions de pont (Bridge) pour le HTML
 * Permet d'utiliser onclick="navigateTo('...') dans le menu
 */
function navigateTo(page) { App.navigateTo(page); }
function toggleNavSection(sec) { App.toggleNavSection(sec); }
function openGlobalSearch() { alert("Recherche bientôt disponible"); }
