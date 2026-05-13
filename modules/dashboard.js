/**
 * DASHBOARD MODULE - Accueil
 */
const DashboardModule = {
    async init() {
        this.renderBanner();
        this.renderKPIs();
        this.renderLinks();
    },

    destroy() {
        // Rien de spécial à détruire ici (pas de graphes complexes)
    },

    renderBanner() {
        const greetingEl = document.getElementById('home-greeting');
        const userEl = document.getElementById('home-username');
        const dateEl = document.getElementById('home-date');
        
        if (!greetingEl) return;

        const h = new Date().getHours();
        let greeting = 'Bonjour';
        if (h < 6) greeting = 'Bonne fin de nuit';
        else if (h >= 18) greeting = 'Bonsoir';
        greetingEl.textContent = greeting;

        const username = Storage.get('username', 'Utilisateur');
        userEl.textContent = username;

        const d = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        if (dateEl) dateEl.textContent = d.toLocaleDateString('fr-FR', options);
    },

    renderKPIs() {
        // 1. Tickets Kanban
        const tickets = Storage.get('kanban_tickets', []);
        const openTickets = tickets.filter(t => t.statut !== 'closed').length;
        const elTickets = document.getElementById('dash-tickets');
        if (elTickets) elTickets.textContent = openTickets;

        // 2. Jours CRA du mois
        const craSources = Storage.get('cra_data_sources', {});
        let joursMois = 0;
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
        Object.values(craSources).forEach(src => {
            if (src.data) {
                src.data.forEach(d => {
                    if (d.date && d.date.startsWith(currentMonth)) joursMois += parseFloat(d.jours || 0);
                });
            }
        });
        const elCra = document.getElementById('dash-cra');
        if (elCra) elCra.textContent = joursMois.toFixed(1);

        // 3. Tâches Organisator du jour
        const tasks = Storage.get('tasks', []);
        const todayStr = new Date().toISOString().split('T')[0];
        const todayTasks = tasks.filter(t => !t.done && t.date === todayStr).length;
        const elTasks = document.getElementById('dash-tasks');
        if (elTasks) elTasks.textContent = todayTasks;
    },

    renderLinks() {
        const container = document.getElementById('home-links-container');
        if (!container) return;
        
        const links = Storage.get('links', { 'Favoris': [] });
        const favoris = links['Favoris'] || [];

        if (favoris.length === 0) {
            container.innerHTML = '<div class="text-muted" style="font-size:13px;">Aucun favori. Ajoutez-en depuis la page "Tous les liens".</div>';
            return;
        }

        container.innerHTML = favoris.map(link => `
            <a href="${Utils.escape(link.url)}" target="_blank" rel="noopener noreferrer" class="link-card">
                <div style="font-weight:700; color:var(--ink); margin-bottom:2px;">${Utils.escape(link.name)}</div>
                <div style="font-size:10px; color:var(--ink-muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${Utils.escape(link.url.replace('https://',''))}</div>
            </a>
        `).join('');
    }
};

window.DashboardModule = DashboardModule;
