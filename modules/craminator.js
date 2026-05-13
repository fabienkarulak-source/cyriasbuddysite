/**
 * CRAMINATOR MODULE - Analyse Excel & Graphiques (Modulaire)
 */
const CRAModule = {
  charts: {},
  ts: {}, // Instances TomSelect
  
  dataSources: {},
  rawData: [],
  filteredData: [],
  clientTjm: {},

  // Lancement automatique par le routeur
  async init() {
    console.log("Initialisation CRAminator");

    // 1. Récupération des données locales (via notre Storage)
    this.dataSources = Storage.get('cra_data_sources', {});
    this.clientTjm = Storage.get('cra_tjm', {});
    this.rebuildRawData();

    // 2. Gestion de l'affichage
    if (this.rawData.length > 0) {
      document.getElementById('upload-section').classList.add('hidden');
      document.getElementById('source-manager').classList.remove('hidden');
      document.getElementById('dashboard-section').classList.remove('hidden');
      
      this.initTomSelects();
      this.populateFilters();
      this.updateDashboard();
      this.renderSourceChips();
    } else {
      document.getElementById('upload-section').classList.remove('hidden');
      document.getElementById('source-manager').classList.add('hidden');
      document.getElementById('dashboard-section').classList.add('hidden');
    }

    // 3. Raccrocher les événements Drag & Drop
    const dropZone = document.getElementById('drop-zone');
    if (dropZone) {
      dropZone.ondragover = (e) => { e.preventDefault(); dropZone.style.borderColor = 'var(--brand)'; };
      dropZone.ondragleave = () => { dropZone.style.borderColor = 'var(--border)'; };
      dropZone.ondrop = (e) => {
        e.preventDefault(); 
        dropZone.style.borderColor = 'var(--border)';
        if (e.dataTransfer.files.length) this.handleFiles({ target: { files: e.dataTransfer.files } });
      };
    }
  },

  // ⚡️ CRUCIAL : Destructeur appelé par le routeur avant de changer de vue
  destroy() {
    // Destruction des graphes pour libérer le canvas
    Object.values(this.charts).forEach(chart => {
      if (chart) chart.destroy();
    });
    this.charts = {};

    // Destruction des filtres TomSelect
    Object.values(this.ts).forEach(select => {
      if (select) select.destroy();
    });
    this.ts = {};
  },

  // ==========================================
  // GESTION DES FICHIERS (XLSX)
  // ==========================================
  handleFiles(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    
    // Vérification de la libairie
    if (typeof XLSX === 'undefined') {
      alert("La bibliothèque Excel n'est pas chargée. Vérifiez votre connexion internet.");
      return;
    }

    const progressContainer = document.getElementById('upload-progress-container');
    const progressBar = document.getElementById('upload-progress-bar');
    const progressText = document.getElementById('upload-progress-text');
    
    progressContainer.classList.remove('hidden');
    
    let processedCount = 0;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const workbook = XLSX.read(new Uint8Array(evt.target.result), { type: 'array' });
          const json = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: "" });
          
          const parsed = this.parseExcelData(json, file.name);
          
          if (parsed.length > 0) {
            const sourceId = 'src_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
            this.dataSources[sourceId] = { name: file.name.replace(/\.[^/.]+$/, ""), data: parsed };
          }
        } catch(err) {
          console.error("Erreur de lecture du fichier Excel", err);
        }

        processedCount++;
        const pct = Math.round((processedCount / files.length) * 100);
        progressBar.style.width = pct + '%';
        progressText.innerText = pct + '%';

        if (processedCount === files.length) {
          setTimeout(() => {
            progressContainer.classList.add('hidden');
            // Sauvegarde globale
            Storage.set('cra_data_sources', this.dataSources);
            this.rebuildRawData();
            // Relancer l'affichage
            this.init();
          }, 500);
        }
      };
      reader.readAsArrayBuffer(file);
    });
    
    // Reset l'input file pour permettre un re-téléchargement du même fichier
    e.target.value = '';
  },

  parseExcelData(json, sourceName) {
    const parsedData = [];
    json.forEach(row => {
      // Nettoyage intelligent des noms de colonnes
      const getVal = (names) => {
        const key = Object.keys(row).find(k => names.includes(k.toLowerCase().trim()));
        return key ? row[key] : null;
      };

      const j1 = parseFloat(getVal(['fractions', 'fraction']) || 0);
      const j2 = parseFloat(getVal(['jours', 'jour', 'temps', 'valeur']) || 0);
      const j = j1 > 0 ? j1 : j2;

      if (j <= 0) return;

      // Traitement date robuste
      let annee = "N/A", mois = "N/A", sortDate = "0000-00", jsDate = null;
      let rawDate = getVal(['date', 'jour']);
      if (rawDate instanceof Date) jsDate = rawDate;
      else if (typeof rawDate === 'number') jsDate = new Date((rawDate - 25569) * 86400000); // Excel to JS
      else if (typeof rawDate === 'string') {
        if (rawDate.includes('/')) {
            const p = rawDate.split('/');
            jsDate = new Date(p[2], p[1]-1, p[0]);
        } else jsDate = new Date(rawDate);
      }

      if (jsDate && !isNaN(jsDate.getTime())) {
          annee = String(jsDate.getFullYear());
          mois = `${String(jsDate.getMonth() + 1).padStart(2, '0')}/${annee}`;
          sortDate = `${annee}-${String(jsDate.getMonth() + 1).padStart(2, '0')}`;
      }

      parsedData.push({
        equipe: String(getVal(['equipe', 'team', 'équipe']) || "N/A").trim(),
        client: String(getVal(['client', 'project', 'projet']) || "N/A").trim(),
        mission: String(getVal(['mission', 'enveloppe', 'lot']) || "N/A").trim(),
        collaborateur: String(getVal(['collaborateur', 'consultant', 'nom']) || "N/A").trim(),
        tache: String(getVal(['tâche', 'tache', 'task', 'activité']) || "").trim(),
        commentaire: String(getVal(['commentaire', 'commentaires', 'description']) || "").trim(),
        jours: j,
        annee, moisAnnee: mois, sortDate,
        rawDateObj: jsDate ? jsDate.getTime() : null,
        _source: sourceName
      });
    });
    return parsedData;
  },

  rebuildRawData() {
    this.rawData = [];
    Object.values(this.dataSources).forEach(src => {
      if (src.data) this.rawData = this.rawData.concat(src.data);
    });
    window.rawData = this.rawData; // Compatibilité Facturator
  },

  clearData() {
    if (!confirm("Voulez-vous supprimer TOUTES les sources de données CRA ?")) return;
    this.dataSources = {};
    Storage.set('cra_data_sources', this.dataSources);
    this.rebuildRawData();
    this.init();
  },

  renderSourceChips() {
    const container = document.getElementById('source-chips');
    if (!container) return;
    
    container.innerHTML = Object.keys(this.dataSources).map(id => `
      <span class="text-[10px] font-bold px-2 py-1 rounded" style="background:var(--brand-soft); color:var(--brand-hover);">
        ${this.dataSources[id].name}
        <button onclick="CRAModule.removeSource('${id}')" style="background:none; border:none; color:var(--danger); cursor:pointer; margin-left:4px;">✕</button>
      </span>
    `).join('');
  },

  removeSource(id) {
    delete this.dataSources[id];
    Storage.set('cra_data_sources', this.dataSources);
    this.rebuildRawData();
    this.init();
  },

  // ==========================================
  // UI & NAVIGATION INTERNE
  // ==========================================
  switchTab(tabName) {
    document.getElementById('dashboard-content').classList.toggle('hidden', tabName !== 'dashboard');
    document.getElementById('explorer-content').classList.toggle('hidden', tabName !== 'explorer');
    
    document.getElementById('btn-tab-dashboard').className = tabName === 'dashboard' ? 'btn-gradient text-xs flex items-center gap-1.5' : 'btn-ghost text-xs flex items-center gap-1.5';
    document.getElementById('btn-tab-explorer').className = tabName === 'explorer' ? 'btn-gradient text-xs flex items-center gap-1.5' : 'btn-ghost text-xs flex items-center gap-1.5';
    
    if (tabName === 'explorer') this.renderExplorer();
  },

  openModal(id) {
    const el = document.getElementById(id);
    if (el) { el.classList.remove('hidden'); el.classList.add('flex'); }
  },

  closeModal(id) {
    const el = document.getElementById(id);
    if (el) { el.classList.add('hidden'); el.classList.remove('flex'); }
  },

  // ==========================================
  // FILTRES TOMSELECT
  // ==========================================
  initTomSelects() {
    if (typeof TomSelect === 'undefined' || this.ts.client) return;
    const config = { plugins: ['remove_button'], maxItems: null, hideSelected: true };
    
    this.ts.annee = new TomSelect('#filter-annee', config);
    this.ts.mois = new TomSelect('#filter-mois', config);
    this.ts.client = new TomSelect('#filter-client', config);
    this.ts.collab = new TomSelect('#filter-collab', config);
  },

  populateFilters() {
    if (!this.ts.client) return;

    const fill = (tsInstance, key) => {
        const uniqueValues = [...new Set(this.rawData.map(d => d[key]))].filter(v => v !== "N/A" && v).sort();
        const currentSelected = tsInstance.getValue();
        tsInstance.clearOptions();
        uniqueValues.forEach(val => tsInstance.addOption({value: val, text: val}));
        tsInstance.setValue(currentSelected, true);
    };

    fill(this.ts.annee, 'annee');
    fill(this.ts.mois, 'moisAnnee');
    fill(this.ts.client, 'client');
    fill(this.ts.collab, 'collaborateur');
  },

  applyFilters() {
    const fA = this.ts.annee ? this.ts.annee.getValue() : [];
    const fM = this.ts.mois ? this.ts.mois.getValue() : [];
    const fC = this.ts.client ? this.ts.client.getValue() : [];
    const fCo = this.ts.collab ? this.ts.collab.getValue() : [];

    this.filteredData = this.rawData.filter(d => 
        (fA.length === 0 || fA.includes(d.annee)) &&
        (fM.length === 0 || fM.includes(d.moisAnnee)) &&
        (fC.length === 0 || fC.includes(d.client)) &&
        (fCo.length === 0 || fCo.includes(d.collaborateur))
    );

    const activeCount = fA.length + fM.length + fC.length + fCo.length;
    const badge = document.getElementById('filter-badge');
    if (badge) {
        badge.innerText = activeCount;
        badge.classList.toggle('hidden', activeCount === 0);
    }
  },

  // ==========================================
  // GRAPHIQUES (CHART.JS)
  // ==========================================
  updateDashboard() {
    if (this.rawData.length === 0) return;
    this.applyFilters();
    this.renderCharts();
  },

  renderCharts() {
    if (typeof Chart === 'undefined') return;
    const bgColors = ['#1B3B5C', '#5EB091', '#2A517A', '#4A9076', '#3B82F6', '#D97706'];

    // Fonction Helper d'agrégation (Somme des jours)
    const agg = (key) => {
        const map = {};
        this.filteredData.forEach(r => {
            if(!map[r[key]]) map[r[key]] = 0;
            map[r[key]] += r.jours;
        });
        return Object.entries(map).map(([name, value]) => ({name, value})).sort((a,b) => b.value - a.value);
    };

    // Fonction Helper de dessin Chart.js
    const draw = (id, data, type, isCurrency = false) => {
        const canvas = document.getElementById(id);
        if (!canvas) return;
        if (this.charts[id]) this.charts[id].destroy();
        
        this.charts[id] = new Chart(canvas.getContext('2d'), {
            type: type,
            data: { 
              labels: data.map(d => d.name), 
              datasets: [{ data: data.map(d => d.value), backgroundColor: bgColors, borderRadius: type === 'bar' ? 4 : 0 }] 
            },
            options: { 
              responsive: true, maintainAspectRatio: false, 
              plugins: { legend: { display: type === 'doughnut', position: 'right' } }
            }
        });
    };

    draw('clientChart', agg('client'), 'bar');
    draw('collabChart', agg('collaborateur'), 'bar');
    draw('taskChart', agg('tache'), 'doughnut');

    // Chart: Evolution Temporelle
    const timeCanvas = document.getElementById('timeChart');
    if (timeCanvas) {
        if (this.charts.time) this.charts.time.destroy();
        const timeMap = {};
        this.filteredData.forEach(r => {
            if(r.sortDate === "0000-00") return;
            if(!timeMap[r.sortDate]) timeMap[r.sortDate] = { label: r.moisAnnee, jours: 0 };
            timeMap[r.sortDate].jours += r.jours;
        });
        
        const sortedKeys = Object.keys(timeMap).sort();
        const timeLabels = sortedKeys.map(k => timeMap[k].label);
        const timeValues = sortedKeys.map(k => timeMap[k].jours);

        this.charts.time = new Chart(timeCanvas.getContext('2d'), {
            type: 'line',
            data: { labels: timeLabels, datasets: [{ label: 'Jours consommés', data: timeValues, borderColor: '#5EB091', backgroundColor: 'rgba(94, 176, 145, 0.2)', fill: true, tension: 0.4 }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
        });
    }

    // Chart: CA par Client
    const caCanvas = document.getElementById('caChart');
    if (caCanvas) {
        if (this.charts.ca) this.charts.ca.destroy();
        const caMap = {};
        this.filteredData.forEach(r => {
            const tjm = this.clientTjm[r.client] || 0;
            if(!caMap[r.client]) caMap[r.client] = 0;
            caMap[r.client] += r.jours * tjm;
        });
        const caData = Object.entries(caMap).map(([name, value]) => ({name, value})).sort((a,b) => b.value - a.value);

        this.charts.ca = new Chart(caCanvas.getContext('2d'), {
            type: 'bar',
            data: { labels: caData.map(d => d.name), datasets: [{ data: caData.map(d => d.value), backgroundColor: '#2A517A', borderRadius: 4 }] },
            options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y', plugins: { legend: { display: false } } }
        });
    }
  },

  // ==========================================
  // EXPLORATEUR TABLEAU
  // ==========================================
  renderExplorer() {
    const tbody = document.getElementById('explorer-table-body');
    if (!tbody) return;
    
    const search = (document.getElementById('search-explorer')?.value || '').toLowerCase();
    
    let toShow = this.filteredData;
    if (search) {
        toShow = toShow.filter(d => 
            (d.client||'').toLowerCase().includes(search) || 
            (d.collaborateur||'').toLowerCase().includes(search) || 
            (d.tache||'').toLowerCase().includes(search) ||
            (d.commentaire||'').toLowerCase().includes(search)
        );
    }
    
    toShow.sort((a,b) => (b.rawDateObj || 0) - (a.rawDateObj || 0));

    tbody.innerHTML = toShow.slice(0, 150).map(d => `
      <tr class="hover:bg-gray-50 transition" style="border-color: var(--border-subtle);">
        <td class="px-4 py-2 font-mono text-muted text-xs">${Utils.escape(d.date || 'N/A')}</td>
        <td class="px-4 py-2 font-bold text-primary">${Utils.escape(d.client)}</td>
        <td class="px-4 py-2 text-xs">${Utils.escape(d.mission)}</td>
        <td class="px-4 py-2 text-xs">${Utils.escape(d.collaborateur)}</td>
        <td class="px-4 py-2 text-center font-bold text-brand">${d.jours.toFixed(2)}</td>
        <td class="px-4 py-2 text-xs">
            <div class="font-medium text-primary">${Utils.escape(d.tache)}</div>
            ${d.commentaire ? `<div class="italic text-muted mt-1" style="font-size: 10px;">${Utils.escape(d.commentaire)}</div>` : ''}
        </td>
      </tr>
    `).join('');
  }
};

window.CRAModule = CRAModule;
