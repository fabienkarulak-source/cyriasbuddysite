/**
 * modules/craminator.js - Logique du CRA
 */
const CRAModule = {
    charts: {},
    rawData: [],

    init() {
        console.log("[CRAMINATOR] Démarrage...");
        // Récupération des données depuis le Storage (qui s'est synchronisé avec GitHub)
        const sources = Storage.get('cra_data_sources', {});
        
        this.rawData = [];
        Object.values(sources).forEach(src => {
            if (src.data) this.rawData = this.rawData.concat(src.data);
        });

        // Gestion de l'affichage
        if (this.rawData.length > 0) {
            document.getElementById('upload-section').classList.add('hidden');
            document.getElementById('dashboard-section').classList.remove('hidden');
            this.updateDashboard();
        } else {
            document.getElementById('upload-section').classList.remove('hidden');
            document.getElementById('dashboard-section').classList.add('hidden');
        }
    },

    handleFiles(e) {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        let processed = 0;
        const dataSources = Storage.get('cra_data_sources', {});

        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (evt) => {
                try {
                    const workbook = XLSX.read(new Uint8Array(evt.target.result), {type: 'array'});
                    const json = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: "" });
                    
                    const parsed = [];
                    json.forEach(row => {
                        const j = parseFloat(row['Jours'] || row['Fractions'] || 0);
                        if (j > 0) parsed.push({
                            client: String(row['Client'] || row['Project'] || "N/A").trim(),
                            collaborateur: String(row['Collaborateur'] || "N/A").trim(),
                            jours: j,
                            tache: String(row['Tâche'] || row['Task'] || "").trim()
                        });
                    });

                    if (parsed.length > 0) {
                        const id = 'src_' + Date.now();
                        dataSources[id] = { name: file.name, data: parsed };
                    }
                } catch(err) { console.error("Erreur Excel", err); }

                processed++;
                if (processed === files.length) {
                    Storage.set('cra_data_sources', dataSources);
                    this.init(); // Relancer l'affichage
                }
            };
            reader.readAsArrayBuffer(file);
        });
        e.target.value = '';
    },

    clearData() {
        if (!confirm("Effacer le CRA ?")) return;
        Storage.set('cra_data_sources', {});
        this.init();
    },

    switchTab(tab) {
        document.getElementById('dashboard-content').classList.toggle('hidden', tab !== 'dashboard');
        document.getElementById('explorer-content').classList.toggle('hidden', tab !== 'explorer');
        document.getElementById('btn-tab-dashboard').className = tab === 'dashboard' ? 'btn-gradient text-xs flex items-center gap-1.5' : 'btn-ghost text-xs flex items-center gap-1.5';
        document.getElementById('btn-tab-explorer').className = tab === 'explorer' ? 'btn-gradient text-xs flex items-center gap-1.5' : 'btn-ghost text-xs flex items-center gap-1.5';
        
        if (tab === 'explorer') this.renderExplorer();
    },

    updateDashboard() {
        if (this.rawData.length === 0 || typeof Chart === 'undefined') return;

        const agg = (k) => {
            const m = {};
            this.rawData.forEach(r => { if(!m[r[k]]) m[r[k]]=0; m[r[k]]+=r.jours; });
            return Object.entries(m).map(([name, value]) => ({name, value})).sort((a,b)=>b.value-a.value);
        };

        const bgColors = ['#1B3B5C', '#5EB091', '#E9BD27', '#E75B3C'];

        const draw = (id, data, type) => {
            const canvas = document.getElementById(id);
            if (!canvas) return;
            if (this.charts[id]) this.charts[id].destroy();
            this.charts[id] = new Chart(canvas.getContext('2d'), {
                type: type,
                data: { labels: data.map(d=>d.name), datasets: [{ data: data.map(d=>d.value), backgroundColor: bgColors }] },
                options: { responsive: true, maintainAspectRatio: false }
            });
        };

        draw('clientChart', agg('client'), 'bar');
        draw('taskChart', agg('tache'), 'doughnut');
    },

    renderExplorer() {
        const tbody = document.getElementById('explorer-table-body');
        if (!tbody) return;
        tbody.innerHTML = this.rawData.slice(0, 100).map(d => `
            <tr style="border-bottom: 1px solid var(--border-light);">
                <td style="padding:10px; font-weight:bold;">${d.client}</td>
                <td style="padding:10px;">${d.collaborateur}</td>
                <td style="padding:10px; color:var(--brand); font-weight:bold;">${d.jours.toFixed(2)}</td>
                <td style="padding:10px; font-size:12px;">${d.tache}</td>
            </tr>
        `).join('');
    }
};

window.CRAModule = CRAModule;
