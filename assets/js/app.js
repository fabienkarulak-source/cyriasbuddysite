/**
 * assets/js/app.js - Navigation et UI globale
 */
const App = {
    init() {
        this.setupEvents();
        // Lancer sur la page d'accueil
        this.navigateTo('dashboard');
        
        // Initialiser les modules métiers
        if (window.CRAModule) CRAModule.init();
    },

    setupEvents() {
        document.getElementById('toggle-theme')?.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme') || 'light';
            const next = current === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem('cyrias_app_theme', JSON.stringify(next));
        });

        // Gestion de l'état réduit/étendu de la sidebar
        const sbState = localStorage.getItem('cyrias_sidebar_state');
        if (sbState === '"collapsed"') {
            document.querySelector('.sidebar').classList.add('collapsed');
            document.body.classList.add('sb-collapsed');
        }
    },

    toggleSidebar() {
        const sidebar = document.querySelector('.sidebar');
        const isCollapsed = sidebar.classList.toggle('collapsed');
        document.body.classList.toggle('sb-collapsed', isCollapsed);
        localStorage.setItem('cyrias_sidebar_state', JSON.stringify(isCollapsed ? 'collapsed' : 'expanded'));
    },

    toggleNavSection(section) {
        const sec = document.querySelector(`.nav-section[data-section="${section}"]`);
        if (sec) sec.classList.toggle('nav-collapsed');
    },

    navigateTo(page) {
        // 1. Mettre à jour le bouton actif dans le menu
        document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
        const activeBtn = document.querySelector(`.nav-item[onclick*="${page}"]`);
        if (activeBtn) activeBtn.classList.add('active');

        // 2. Afficher la bonne page HTML (La magie de la v23 originale)
        document.querySelectorAll('.page').forEach(p => {
            if (p.id === 'page-' + page) {
                p.classList.add('active');
                
                // Hack spécifique au CRAminator pour que les graphes s'affichent correctement
                if (p.id === 'page-craminator') {
                    p.style.position = 'relative';
                    p.style.left = '0';
                    p.style.height = 'auto';
                    p.style.opacity = '1';
                    p.style.pointerEvents = 'auto';
                } else {
                    p.style.display = 'block';
                }
            } else {
                if (p.id === 'page-craminator') {
                    p.style.position = 'absolute';
                    p.style.left = '-99999px';
                    p.style.height = '0';
                    p.style.opacity = '0';
                    p.style.pointerEvents = 'none';
                } else {
                    p.style.display = 'none';
                    p.classList.remove('active');
                }
            }
        });
    }
};

window.App = App;
window.addEventListener('DOMContentLoaded', () => App.init());
