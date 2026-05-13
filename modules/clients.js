/**
 * CLIENTS MODULE (360) - Isolation du Suivi Hebdo
 */
const ClientsModule = {
    currentClient: null,
    notes: [],

    async init() {
        this.loadNotes();
        this.renderList();
    },

    loadNotes() {
        this.notes = Storage.get('suivi_notes', []);
    },

    renderList() {
        const list = document.getElementById('client-360-list');
        if (!list) return;

        // Récupère les clients depuis les données CRA si disponibles
        const rawData = Storage.get('cra_data_sources', {});
        let clients = new Set();
        Object.values(rawData).forEach(src => src.data.forEach(d => clients.add(d.client)));
        
        const sortedClients = Array.from(clients).sort();
        const search = document.getElementById('search-client-360')?.value.toLowerCase();

        list.innerHTML = sortedClients
            .filter(c => !search || c.toLowerCase().includes(search))
            .map(c => `
                <button onclick="ClientsModule.selectClient('${c.replace(/'/g, "\\'")}')" 
                        class="nav-item ${this.currentClient === c ? 'active' : ''}">
                    <span>${Utils.escape(c)}</span>
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

    addNote() {
        const sujets = document.getElementById('suivi-sujets').value.trim();
        const attention = document.getElementById('suivi-attention').value.trim();

        if (!sujets && !attention) {
            Toast.error("La note est vide");
            return;
        }

        const newNote = {
            id: Utils.id(),
            client: this.currentClient,
            date: new Date().toISOString(),
            sujets,
            attention,
            author: Storage.get('username', 'Consultant')
        };

        this.notes.unshift(newNote);
        Storage.set('suivi_notes', this.notes);
        
        // Reset champs
        document.getElementById('suivi-sujets').value = '';
        document.getElementById('suivi-attention').value = '';
        
        this.renderNotes();
        Toast.success("Note ajoutée");
    },

    renderNotes() {
        const container = document.getElementById('suivi-history-list');
        if (!container) return;

        const clientNotes = this.notes.filter(n => n.client === this.currentClient);

        if (clientNotes.length === 0) {
            container.innerHTML = '<div class="text-muted text-center py-4">Aucune note pour ce client.</div>';
            return;
        }

        container.innerHTML = clientNotes.map(n => `
            <div class="card p-3" style="border-left: 4px solid var(--brand);">
                <div class="flex justify-between items-center mb-2">
                    <span class="text-xs font-bold">${Utils.formatDateTime(n.date)}</span>
                    <button class="btn btn-ghost btn-sm" onclick="ClientsModule.deleteNote('${n.id}')">🗑</button>
                </div>
                <div class="text-sm mb-2"><strong>Sujets :</strong> ${Utils.escape(n.sujets)}</div>
                ${n.attention ? `<div class="badge badge-warn w-full">⚠️ ${Utils.escape(n.attention)}</div>` : ''}
            </div>
        `).join('');
    },

    deleteNote(id) {
        if (!confirm("Supprimer cette note ?")) return;
        this.notes = this.notes.filter(n => n.id !== id);
        Storage.set('suivi_notes', this.notes);
        this.renderNotes();
    },

    switchSubTab(tab) {
        document.getElementById('subtab-suivi').classList.toggle('is-hidden', tab !== 'suivi');
        document.getElementById('subtab-stats').classList.toggle('is-hidden', tab !== 'stats');
    },

    destroy() {
        this.currentClient = null;
    }
};

window.ClientsModule = ClientsModule;
