/**
 * MODULE CRAMINATOR - Version Complète (5 Graphiques)
 */
const CRAModule = {
    charts: {},
    rawData: [],
    // Simulation de TJM par défaut (à configurer dans la page config plus tard)
    defaultTJM: 600, 

    init() {
        console.log("📊 CRAModule Full Init");
        const sources = Storage.get('cra_data_sources', {});
        this.rawData = [];
        Object.values(sources).forEach(src => {
            if (src.data) this.rawData = this.rawData.concat(src.data);
        });

        const uploadSec = document.getElementById('upload-section');
        const dashSec = document.getElementById('dashboard-section');

        if (this.rawData.length > 0) {
            if (uploadSec) uploadSec.style.display = 'none';
            if (dashSec) dashSec.style.display = 'block';
            // On attend que le DOM soit rendu pour dessiner
            setTimeout(() => this.updateDashboard(), 100);
        } else {
            if (uploadSec) uploadSec.style.display = 'block';
            if (dashSec) dashSec.style.display = 'none';
        }
    },

    handleFiles(event) {
        const files = Array.from(event.target.files);
        if (!files.length) return;

        const dataSources = Storage.get('cra_data_sources', {});
        let processed = 0;

        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (evt) => {
                try {
                    const workbook = XLSX.read(new Uint8Array(evt.target.result), {type: 'array'});
                    const json = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: "" });
                    
                    const parsed = [];
                    json.forEach(row => {
                        const getVal = (names) => {
                            const key = Object.keys(row).find(k => names.includes(k.toLowerCase().trim()));
                            return key ? row[key] : null;
                        };

                        const jRaw = getVal(['jours', 'jour', 'temps', 'valeur', 'fractions', 'fraction']);
                        const j = parseFloat(String(jRaw).replace(',', '.'));

                        if (j > 0) {
                            // Extraction de la date pour le graphique temporel
                            let rawDate = getVal(['date', 'jour', 'période']);
                            let dateObj = this.parseExcelDate(rawDate);

                            parsed.push({
                                client: String(getVal(['client', 'project', 'projet']) || "N/A").trim(),
                                collaborateur: String(getVal(['collaborateur', 'consultant', 'nom']) || "N/A").trim(),
                                jours: j,
                                tache: String(getVal(['tâche', 'tache', 'task', 'activité']) || "Autre").trim(),
                                date: dateObj ? dateObj.toISOString().split('T')[0] : null,
                                moisStr: dateObj ? `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}` : "Inconnu"
                            });
                        }
                    });

                    if (parsed.length > 0) {
                        dataSources['src_' + Date.now()] = { name: file.name, data: parsed };
                    }
                } catch(err) { console.error("Erreur Excel", err); }

                processed++;
                if (processed === files.length) {
                    Storage.set('cra_data_sources', dataSources);
                    this.init();
                }
            };
            reader.readAsArrayBuffer(file);
        });
        event.target.value = '';
    },

    // Utilitaire pour lire les dates Excel (numériques ou string)
    parseExcelDate(val) {
        if (!val) return null;
        if (typeof val === 'number') return new Date((val - 25569) * 86400 * 1000);
        if (typeof val === 'string') {
            const parts = val.split(/[-/]/);
            if (parts.length === 3) return new Date(parts[2], parts[1]-1, parts[0]);
        }
        return null;
    },

    updateDashboard() {
        if (typeof Chart === 'undefined') return;

        const colors = ['#1B3B5C', '#5EB091', '#E9BD27', '#E75B3C', '#4491B6', '#94A3B8'];

        // 1. Agrégations simples
        const sumBy = (key) => {
            const m = {};
            this.rawData.forEach(r => { if(!m[r[key]]) m[r[key]]=0; m[r[key]]+=r.jours; });
            return Object.entries(m).map(([name, value]) => ({name, value})).sort((a,b)=>b.value-a.value);
        };

        const draw = (id, data, type, options = {}) => {
            const canvas = document.getElementById(id);
            if (!canvas) return;
            if (this.charts[id]) this.charts[id].destroy();
            this.charts[id] = new Chart(canvas.getContext('2d'), {
                type: type,
                data: { 
                    labels: data.map(d=>d.name), 
                    datasets: [{ data: data.map(d=>d.value), backgroundColor: colors, borderRadius: 5 }] 
                },
                options: { responsive: true, maintainAspectRatio: false, ...options }
            });
        };

        draw('collabChart', sumBy('collaborateur'), 'bar');
        draw('clientChart', sumBy('client'), 'bar');
        draw('taskChart', sumBy('tache'), 'doughnut');

        // 2. Graphique Temporel (Évolution)
        const timeData = {};
        this.rawData.forEach(r => {
            if(r.moisStr === "Inconnu") return;
            if(!timeData[r.moisStr]) timeData[r.moisStr] = 0;
            timeData[r.moisStr] += r.jours;
        });
        const sortedTime = Object.entries(timeData).sort().map(([name, value]) => ({name, value}));
        draw('timeChart', sortedTime, 'line', { tension: 0.4, fill: true, backgroundColor: 'rgba(94, 176, 145, 0.1)' });

        // 3. Graphique CA (Chiffre d'affaires estimé)
        // On récupère les TJM personnalisés s'ils existent, sinon defaultTJM
        const tjmSettings = Storage.get('cra_tjm', {});
        const caData = {};
        this.rawData.forEach(r => {
            const tjm = tjmSettings[r.client] || this.defaultTJM;
            if(!caData[r.client]) caData[r.client] = 0;
            caData[r.client] += r.jours * tjm;
        });
        const sortedCA = Object.entries(caData).map(([name, value]) => ({name, value})).sort((a,b)=>b.value-a.value);
        draw('caChart', sortedCA, 'bar', { indexAxis: 'y' });
    },

    clearData() {
        if (confirm("Effacer toutes les données ?")) {
            Storage.set('cra_data_sources', {});
            this.init();
        }
    },

    switchTab(tab) {
        document.getElementById('dashboard-content').style.display = tab === 'dashboard' ? 'flex' : 'none';
        document.getElementById('explorer-content').style.display = tab === 'explorer' ? 'block' : 'none';
        if(tab === 'explorer') this.renderExplorer();
    },

    renderExplorer() {
        const tbody = document.getElementById('explorer-table-body');
        if (!tbody) return;
        tbody.innerHTML = this.rawData.slice(0, 100).map(d => `
            <tr style="border-bottom: 1px solid var(--border);">
                <td style="padding:8px;">${d.client}</td>
                <td style="padding:8px;">${d.collaborateur}</td>
                <td style="padding:8px; font-weight:bold; color:var(--brand);">${d.jours.toFixed(2)}</td>
                <td style="padding:8px; font-size:11px;">${d.tache}</td>
            </tr>
        `).join('');
    }
};

window.CRAModule = CRAModule;
