/**
 * assets/js/app.js - Navigation et UI globale
 */
const App = {
    init() {
        this.setupEvents();
        // Lancer sur la page d'accueil au démarrage
        this.navigateTo('dashboard');
    },

    setupEvents() {
        document.getElementById('toggle-theme')?.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme') || 'light';
            const next = current === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem('cyrias_app_theme', JSON.stringify(next));
        });

        // Gestion de l'état de la sidebar
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
        // 1. Mettre à jour la couleur du bouton actif dans le menu
        document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
        const activeBtn = document.querySelector(`.nav-item[onclick*="${page}"]`);
        if (activeBtn) activeBtn.classList.add('active');

        // 2. Afficher la bonne page et cacher les autres (Proprement)
        document.querySelectorAll('.page').forEach(p => {
            if (p.id === 'page-' + page) {
                p.classList.add('active');
                p.style.display = 'block'; // On s'assure qu'elle est visible
                
                // Nettoyage des vieux styles "hack" s'ils sont restés bloqués
                p.style.opacity = '1';
                p.style.position = 'relative';
                p.style.left = '0';
                p.style.height = 'auto';
            } else {
                p.classList.remove('active');
                p.style.display = 'none'; // On cache les autres
            }
        });

        // 3. Relancer la logique du module concerné
        if (page === 'craminator' && window.CRAModule) {
            CRAModule.init(); // Redessine les graphiques correctement
        }
    }
};

window.App = App;
window.addEventListener('DOMContentLoaded', () => App.init());
