/**
 * MODULE CRAMINATOR - Analyse d'exports Excel
 */
const CRAModule = {
    charts: {},
    rawData: [],

    // Appelée par le menu quand on clique sur "CRAminator"
    init() {
        console.log("📊 CRAModule init()");
        
        // 1. Récupération des données locales (si elles existent déjà)
        const sources = Storage.get('cra_data_sources', {});
        this.rawData = [];
        Object.values(sources).forEach(src => {
            if (src.data) this.rawData = this.rawData.concat(src.data);
        });

        // 2. Gestion de l'affichage
        const uploadSec = document.getElementById('upload-section');
        const dashSec = document.getElementById('dashboard-section');

        if (this.rawData.length > 0) {
            // On a des données : on cache l'upload et on affiche le dashboard
            if (uploadSec) uploadSec.style.display = 'none';
            if (dashSec) dashSec.style.display = 'block';
            
            // On dessine les graphiques
            this.updateDashboard();
        } else {
            // Aucune donnée : on affiche l'upload
            if (uploadSec) uploadSec.style.display = 'block';
            if (dashSec) dashSec.style.display = 'none';
        }
    },

    // Déclenchée quand on choisit un fichier Excel
    handleFiles(event) {
        const files = Array.from(event.target.files);
        if (!files.length) return;

        if (typeof XLSX === 'undefined') {
            alert("La librairie Excel n'est pas chargée !");
            return;
        }

        console.log(`Lecture de ${files.length} fichier(s)...`);
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
                        // Cherche les colonnes intelligemment
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
                        const id = 'src_' + Date.now();
                        dataSources[id] = { name: file.name, data: parsed };
                    } else {
                        alert(`Le fichier ${file.name} semble vide ou invalide (colonnes non reconnues).`);
                    }
                } catch(err) { 
                    console.error("Erreur de lecture Excel", err); 
                }

                processed++;
                if (processed === files.length) {
                    // Sauvegarde et rechargement de l'interface
                    Storage.set('cra_data_sources', dataSources);
                    this.init();
                }
            };
            reader.readAsArrayBuffer(file);
        });
        
        // Reset de l'input pour pouvoir re-sélectionner le même fichier si besoin
        event.target.value = '';
    },

    clearData() {
        if (!confirm("Voulez-vous effacer toutes les données du CRAminator ?")) return;
        Storage.set('cra_data_sources', {});
        this.init();
    },

    switchTab(tab) {
        const dashContent = document.getElementById('dashboard-content');
        const explContent = document.getElementById('explorer-content');
        const btnDash = document.getElementById('btn-tab-dashboard');
        const btnExpl = document.getElementById('btn-tab-explorer');

        if (tab === 'dashboard') {
            dashContent.style.display = 'grid';
            explContent.style.display = 'none';
            btnDash.style.background = 'var(--brand)';
            btnDash.style.color = 'white';
            btnDash.style.border = 'none';
            btnExpl.style.background = 'transparent';
            btnExpl.style.color = 'var(--ink)';
            btnExpl.style.border = '1px solid var(--border)';
        } else {
            dashContent.style.display = 'none';
            explContent.style.display = 'block';
            btnExpl.style.background = 'var(--brand)';
            btnExpl.style.color = 'white';
            btnExpl.style.border = 'none';
            btnDash.style.background = 'transparent';
            btnDash.style.color = 'var(--ink)';
            btnDash.style.border = '1px solid var(--border)';
            this.renderExplorer();
        }
    },

    updateDashboard() {
        if (typeof Chart === 'undefined') return;

        // Fonction d'agrégation (Somme des jours)
        const agg = (k) => {
            const m = {};
            this.rawData.forEach(r => { if(!m[r[k]]) m[r[k]]=0; m[r[k]]+=r.jours; });
            return Object.entries(m).map(([name, value]) => ({name, value})).sort((a,b)=>b.value-a.value);
        };

        const bgColors = ['#1B3B5C', '#5EB091', '#E9BD27', '#E75B3C', '#4491B6'];

        const draw = (id, data, type) => {
            const canvas = document.getElementById(id);
            if (!canvas) return;
            
            // Destruction de l'ancien graphe pour éviter le bug Chart.js
            if (this.charts[id]) this.charts[id].destroy();
            
            this.charts[id] = new Chart(canvas.getContext('2d'), {
                type: type,
                data: { 
                    labels: data.map(d=>d.name), 
                    datasets: [{ data: data.map(d=>d.value), backgroundColor: bgColors }] 
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        };

        draw('clientChart', agg('client'), 'bar');
        draw('taskChart', agg('tache'), 'doughnut');
    },

    renderExplorer() {
        const tbody = document.getElementById('explorer-table-body');
        if (!tbody) return;
        
        tbody.innerHTML = this.rawData.slice(0, 200).map(d => `
            <tr style="border-bottom: 1px solid var(--border);">
                <td style="padding:10px; font-weight:600; color:var(--primary);">${d.client}</td>
                <td style="padding:10px;">${d.collaborateur}</td>
                <td style="padding:10px; font-weight:bold; color:var(--brand);">${d.jours.toFixed(2)}</td>
                <td style="padding:10px;">${d.tache}</td>
            </tr>
        `).join('');
    }
};

window.CRAModule = CRAModule;
