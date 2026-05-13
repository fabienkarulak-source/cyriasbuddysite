/**
 * CRAMINATOR MODULE — Outil de suivi TMA & Analyse des temps
 */
const CRAModule = {
    charts: {},
    dataSources: {},
    rawData: [],

    // ⚡ Lancement automatique à l'ouverture de la page
    async init() {
        console.log("[CRAMINATOR] Initialisation...");
        
        // 1. Récupération des données locales
        this.dataSources = Storage.get('cra_data_sources') || {};
        this.rebuildRawData();

        // 2. Gestion de l'affichage
        const uploadSection = document.getElementById('upload-section');
        const dashSection = document.getElementById('dashboard-section');

        if (this.rawData.length > 0) {
            // S'il y a des données, on affiche les graphiques
            if (uploadSection) uploadSection.classList.add('is-hidden');
            if (dashSection) dashSection.classList.remove('is-hidden');
            
            // Délai pour que le DOM dessine bien les canvas
            setTimeout(() => {
                this.renderCharts();
                this.renderExplorer();
            }, 50);
        } else {
            // S'il n'y a rien, on force l'écran d'import
            if (uploadSection) uploadSection.classList.remove('is-hidden');
            if (dashSection) dashSection.classList.add('is-hidden');
        }
    },

    // ⚡ CRUCIAL: Nettoyage avant de changer de page
    destroy() {
        Object.values(this.charts).forEach(c => { if(c) c.destroy(); });
        this.charts = {};
    },

    // ==========================================
    // IMPORT ET PARSING EXCEL
    // ==========================================
    handleFiles(e) {
        const files = Array.from(e.target.files);
        if (!files.length) return;
        
        if (typeof XLSX === 'undefined') {
            alert("Erreur: La bibliothèque Excel n'est pas chargée. Vérifiez votre connexion internet.");
            return;
        }

        let processed = 0;
        let totalParsed = 0;
        
        // On affiche un retour visuel rapide si possible
        console.log(`[CRAMINATOR] Traitement de ${files.length} fichier(s)...`);

        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (evt) => {
                try {
                    const workbook = XLSX.read(new Uint8Array(evt.target.result), {type: 'array'});
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                    const json = XLSX.utils.sheet_to_json(firstSheet, { defval: "" });
                    
                    const parsed = this.parseData(json, file.name);
                    totalParsed += parsed.length;
                    
                    if (parsed.length > 0) {
                        const sourceId = 'src_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
                        this.dataSources[sourceId] = { name: file.name, data: parsed };
                    } else {
                        alert(`Aucune ligne valide trouvée dans "${file.name}".\nVérifiez que le fichier contient bien des colonnes pour le Client, le Collaborateur et le Temps passé.`);
                    }
                } catch(err) { 
                    console.error("[CRAMINATOR] Erreur Excel:", err); 
                    alert(`Impossible de lire le fichier ${file.name}. Il est peut-être corrompu.`);
                }

                processed++;
                // Quand tous les fichiers sont traités
                if (processed === files.length) {
                    if (totalParsed > 0) {
                        // Sauvegarde
                        Storage.set('cra_data_sources', this.dataSources);
                        // On relance l'interface
                        this.init();
                    }
                    e.target.value = ''; // Reset de l'input file
                }
            };
            reader.readAsArrayBuffer(file);
        });
    },

    parseData(json, sourceName) {
        const parsedData = [];
        
        json.forEach(row => {
            // Fonction de recherche de colonnes "floue" (insensible à la casse et aux espaces)
            const getVal = (possibleNames) => {
                const keys = Object.keys(row);
                for (let key of keys) {
                    const cleanKey = key.toLowerCase().trim();
                    if (possibleNames.includes(cleanKey)) return row[key];
                }
                return null;
            };

            // On cherche le temps passé
            let joursRaw = getVal(['jours', 'jour', 'temps', 'valeur', 'fractions', 'fraction', 'durée']);
            let j = parseFloat(String(joursRaw).replace(',', '.'));
            
            // On ignore les lignes vides ou avec 0 jour
            if (isNaN(j) || j <= 0) return;

            parsedData.push({
                client: String(getVal(['client', 'project', 'projet', 'affaire', 'customer']) || "N/A").trim(),
                collaborateur: String(getVal(['collaborateur', 'consultant', 'nom', 'ressource', 'utilisateur']) || "N/A").trim(),
                jours: j,
                tache: String(getVal(['tâche', 'tache', 'task', 'activité', 'libellé']) || "").trim(),
                date: String(getVal(['date', 'jour', 'date réalisation']) || "").trim(),
                _source: sourceName
            });
        });
        
        return parsedData;
    },
    
    // ==========================================
    // LOGIQUE DE DONNÉES
    // ==========================================
    rebuildRawData() {
        this.rawData = [];
        Object.values(this.dataSources).forEach(src => {
            if (src.data) this.rawData = this.rawData.concat(src.data);
        });
        window.rawData = this.rawData; // Pour que d'autres modules y aient accès si besoin
    },

    clearData() {
        if (!confirm("Effacer toutes les données CRA ?")) return;
        this.dataSources = {};
        Storage.set('cra_data_sources', this.dataSources);
        this.init(); // Relance l'interface vierge
    },

    // ==========================================
    // UI ET GRAPHIQUES
    // ==========================================
    switchTab(tab) {
        const dash = document.getElementById('dashboard-content');
        const expl = document.getElementById('explorer-content');
        const btnDash = document.getElementById('btn-tab-dashboard');
        const btnExpl = document.getElementById('btn-tab-explorer');

        if (dash) dash.classList.toggle('is-hidden', tab !== 'dashboard');
        if (expl) expl.classList.toggle('is-hidden', tab !== 'explorer');
        
        if (btnDash) btnDash.className = tab === 'dashboard' ? 'btn btn-primary' : 'btn btn-outline';
        if (btnExpl) btnExpl.className = tab === 'explorer' ? 'btn btn-primary' : 'btn btn-outline';
    },

    renderCharts() {
        if (typeof Chart === 'undefined') {
            console.error("[CRAMINATOR] Chart.js n'est pas chargé.");
            return;
        }

        // Agrégateur de sommes
        const agg = (k) => {
            const map = {};
            this.rawData.forEach(r => {
                if(!map[r[k]]) map[r[k]] = 0;
                map[r[k]] += r.jours;
            });
            return Object.entries(map)
                .map(([name, value]) => ({name, value}))
                .sort((a,b) => b.value - a.value);
        };

        const bgColors = ['#19365D', '#66BB93', '#4491B6', '#E9BD27', '#E75B3C', '#2A517A'];

        const draw = (id, data, type) => {
            const canvas = document.getElementById(id);
            if (!canvas) return;
            
            // Toujours détruire avant de dessiner (évite les conflits internes de Chart.js)
            if (this.charts[id]) this.charts[id].destroy();
            
            this.charts[id] = new Chart(canvas.getContext('2d'), {
                type: type,
                data: { 
                    labels: data.map(d=>d.name), 
                    datasets: [{ data: data.map(d=>d.value), backgroundColor: bgColors }] 
                },
                options: { 
                    responsive: true, 
                    maintainAspectRatio: false, 
                    plugins: { legend: { display: type==='doughnut', position: 'right' }} 
                }
            });
        };

        draw('clientChart', agg('client'), 'bar');
        draw('taskChart', agg('tache'), 'doughnut');
    },

    renderExplorer() {
        const tbody = document.getElementById('explorer-table-body');
        if (!tbody) return;
        
        tbody.innerHTML = this.rawData.slice(0, 150).map(d => `
            <tr style="border-bottom:1px solid var(--border-light);">
                <td style="padding:10px; font-family:monospace; font-size:11px; color:var(--ink-muted);">${d.date || 'N/A'}</td>
                <td style="padding:10px; font-weight:bold; color:var(--primary);">${d.client}</td>
                <td style="padding:10px;">${d.collaborateur}</td>
                <td style="padding:10px; font-weight:bold; color:var(--brand);">${d.jours.toFixed(2)}</td>
                <td style="padding:10px; font-size:12px;">${d.tache}</td>
            </tr>
        `).join('');
    }
};

// Exposition pour le Router
window.CRAModule = CRAModule;
