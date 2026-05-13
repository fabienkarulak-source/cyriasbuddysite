/**
 * modules/craminator.js - Logique d'analyse Excel
 */
const CRAModule = {
    charts: {},
    rawData: [],

    init() {
        console.log("[CRAMINATOR] Affichage...");
        
        // 1. Récupération des données depuis le Storage
        const sources = Storage.get('cra_data_sources', {});
        this.rawData = [];
        Object.values(sources).forEach(src => {
            if (src.data) this.rawData = this.rawData.concat(src.data);
        });

        // 2. Gérer l'affichage des zones
        const uploadSec = document.getElementById('upload-section');
        const dashSec = document.getElementById('dashboard-section');

        if (this.rawData.length > 0) {
            // S'il y a des données -> Dashboard
            if (uploadSec) uploadSec.classList.add('hidden');
            if (dashSec) dashSec.classList.remove('hidden');
            
            // On laisse 50ms au navigateur pour afficher la div avant de dessiner
            setTimeout(() => {
                this.updateDashboard();
                this.renderExplorer();
            }, 50);
        } else {
            // Sinon -> Zone d'importation
            if (uploadSec) uploadSec.classList.remove('hidden');
            if (dashSec) dashSec.classList.add('hidden');
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
                        // Tolérance pour les noms de colonnes
                        const getVal = (names) => {
                            const key = Object.keys(row).find(k => names.includes(k.toLowerCase().trim()));
                            return key ? row[key] : null;
                        };

                        const jRaw = getVal(['jours', 'jour', 'temps', 'valeur', 'fractions', 'fraction']);
                        const j = parseFloat(String(jRaw).replace(',', '.'));

                        if (j > 0) {
                            parsed.push({
                                client: String(getVal(['client', 'project', 'projet']) || "N/A").trim(),
                                collaborateur: String(getVal(['collaborateur', 'consultant', 'nom']) || "N/A").trim(),
                                jours: j,
                                tache: String(getVal(['tâche', 'tache', 'task', 'activité']) || "").trim()
                            });
                        }
                    });

                    if (parsed.length > 0) {
                        const id = 'src_' + Date.now() + '_' + Math.random().toString(36).substr(2,5);
                        dataSources[id] = { name: file.name, data: parsed };
                    }
                } catch(err) { console.error("Erreur Excel", err); }

                processed++;
                if (processed === files.length) {
                    Storage.set('cra_data_sources', dataSources);
                    this.init(); // Recharge l'interface
                }
            };
            reader.readAsArrayBuffer(file);
        });
        e.target.value = ''; // Reset
    },

    clearData() {
        if (!confirm("Voulez-vous vraiment effacer le CRA ?")) return;
        Storage.set('cra_data_sources', {});
        this.init();
    },

    switchTab(tab) {
        document.getElementById('dashboard-content').classList.toggle('hidden', tab !== 'dashboard');
        document.getElementById('explorer-content').classList.toggle('hidden', tab !== 'explorer');
        document.getElementById('btn-tab-dashboard').className = tab === 'dashboard' ? 'btn-gradient text-xs flex items-center gap-1.5' : 'btn-ghost text-xs flex items-center gap-1.5';
        document.getElementById('btn-tab-explorer').className = tab === 'explorer' ? 'btn-gradient text-xs flex items-center gap-1.5' : 'btn-ghost text-xs flex items-center gap-1.5';
    },

    updateDashboard() {
        if (typeof Chart === 'undefined') return;

        const agg = (k) => {
            const m = {};
            this.rawData.forEach(r => { if(!m[r[k]]) m[r[k]]=0; m[r[k]]+=r.jours; });
            return Object.entries(m).map(([name, value]) => ({name, value})).sort((a,b)=>b.value-a.value);
        };

        const bgColors = ['#1B3B5C', '#5EB091', '#E9BD27', '#E75B3C', '#4491B6'];

        const draw = (id, data, type) => {
            const canvas = document.getElementById(id);
            if (!canvas) return;
            // Toujours détruire avant de reconstruire
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
        tbody.innerHTML = this.rawData.slice(0, 150).map(d => `
            <tr style="border-bottom: 1px solid var(--border-light); font-size: 12px;">
                <td style="padding:10px; font-weight:bold; color:var(--primary);">${d.client}</td>
                <td style="padding:10px;">${d.collaborateur}</td>
                <td style="padding:10px; color:var(--brand); font-weight:bold;">${d.jours.toFixed(2)}</td>
                <td style="padding:10px;">${d.tache}</td>
            </tr>
        `).join('');
    }
};

window.CRAModule = CRAModule;
