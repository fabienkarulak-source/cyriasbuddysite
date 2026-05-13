/**
 * CLIENTS MODULE (360) - Suivi Hebdo isolé
 */
const ClientsModule = {
    currentClient: null,
    notes: [],

    async init() {
        this.notes = Storage.get('suivi_notes', []);
        this.renderList();
    },

    destroy() { 
        this.currentClient = null; 
    },

    renderList() {
        const list = document.getElementById('client-360-list');
        if (!list) return;

        const craData = Storage.get('cra_data_sources', {});
        let clients = new Set();
        Object.values(craData).forEach(src => { 
            if(src.data) src.data.forEach(d => clients.add(d.client)); 
        });
        
        // Donnée de démo si vide
        if (clients.size === 0) clients.add("Client de Démo");

        const search = document.getElementById('search-client-360')?.value.toLowerCase() || '';

        list.innerHTML = Array.from(clients).sort()
            .filter(c => !search || c.toLowerCase().includes(search))
            .map(c => `
                <button onclick="ClientsModule.selectClient('${c.replace(/'/g, "\\'")}')" 
                        class="btn ${this.currentClient === c ? 'btn-primary' : 'btn-ghost'} w-full" style="justify-content: flex-start; margin-bottom: 4px;">
                    ${Utils.escape(c)}
                </button>
            `).join('');
    },

    selectClient(client) {
        this.currentClient = client;
        this.renderList();
        document.getElementById('client-360-placeholder').classList.add('is-hidden');
        document.getElementById('client-360-content').classList.remove('is-hidden');
        this.renderNotes();
    },

    switchSubTab(tab) {
        document.getElementById('subtab-suivi').classList.toggle('is-hidden', tab !== 'suivi');
        document.getElementById('subtab-stats').classList.toggle('is-hidden', tab !== 'stats');
        
        document.getElementById('tab-btn-suivi').className = tab === 'suivi' ? 'btn btn-ghost active' : 'btn btn-ghost';
        document.getElementById('tab-btn-suivi').style.borderBottom = tab === 'suivi' ? '2px solid var(--brand)' : 'none';
        
        document.getElementById('tab-btn-stats').className = tab === 'stats' ? 'btn btn-ghost active' : 'btn btn-ghost';
        document.getElementById('tab-btn-stats').style.borderBottom = tab === 'stats' ? '2px solid var(--brand)' : 'none';
    },

    addNote() {
        const sujets = document.getElementById('suivi-sujets').value.trim();
        const attention = document.getElementById('suivi-attention').value.trim();
        
        if (!sujets && !attention) {
            if (window.Toast) Toast.warn("Veuillez saisir un contenu");
            return;
        }

        const newNote = {
            id: Utils.id(),
            client: this.currentClient,
            date: new Date().toISOString(),
            sujets,
            attention,
            author: Storage.get('username', 'Utilisateur')
        };

        this.notes.unshift(newNote);
        Storage.set('suivi_notes', this.notes);
        
        document.getElementById('suivi-sujets').value = ''; 
        document.getElementById('suivi-attention').value = '';
        
        this.renderNotes();
    },

    renderNotes() {
        const container = document.getElementById('suivi-history-list');
        if (!container) return;

        const clientNotes = this.notes.filter(n => n.client === this.currentClient);

        if (clientNotes.length === 0) {
            container.innerHTML = '<div class="text-muted text-center py-4 text-sm">Aucune note enregistrée.</div>';
            return;
        }

        container.innerHTML = clientNotes.map(n => `
            <div class="card p-3 mb-2" style="border-left: 4px solid var(--brand);">
                <div class="flex justify-between items-center mb-2">
                    <span class="text-xs font-bold text-muted">${Utils.formatDateTime(n.date)}</span>
                    <button class="btn btn-ghost btn-sm text-danger" onclick="ClientsModule.deleteNote('${n.id}')">🗑</button>
                </div>
                ${n.sujets ? `<div class="text-sm mb-2" style="white-space:pre-wrap;">${Utils.escape(n.sujets)}</div>` : ''}
                ${n.attention ? `<div class="badge badge-warn w-full mt-2" style="white-space:pre-wrap; text-align:left; display:block; padding:8px;">⚠️ ${Utils.escape(n.attention)}</div>` : ''}
            </div>
        `).join('');
    },

    deleteNote(id) {
        if (!confirm("Supprimer cette note ?")) return;
        this.notes = this.notes.filter(n => n.id !== id);
        Storage.set('suivi_notes', this.notes);
        this.renderNotes();
    }
};

window.ClientsModule = ClientsModule;
