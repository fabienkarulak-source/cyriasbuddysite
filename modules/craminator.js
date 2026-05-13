/**
 * CRAMINATOR MODULE — Refondu pour le routeur modulaire
 */
const CRAModule = {
  // Stockage des instances externes (pour pouvoir les détruire proprement)
  charts: {},
  ts: {}, 
  
  // Données internes
  dataSources: {},
  rawData: [],
  filteredData: [],
  clientTjm: {},

  // ⚡ Appelée automatiquement par le routeur quand on arrive sur la page
  async init() {
    // 1. Récupération des données depuis le Storage local (synchronisé GitHub)
    this.dataSources = Storage.get('cra_data_sources', {});
    this.clientTjm = Storage.get('cra_tjm', {});
    this.rebuildRawData();

    // 2. Initialisation des plugins UI (Filtres)
    this.initTomSelects();

    // 3. Affichage conditionnel (Zone de dépôt vs Dashboard)
    if (Object.keys(this.dataSources).length > 0) {
      document.getElementById('upload-section').classList.add('hidden');
      document.getElementById('dashboard-section').classList.remove('hidden');
      this.populateFilters();
      this.updateDashboard();
      this.renderSourceChips();
    } else {
      document.getElementById('upload-section').classList.remove('hidden');
      document.getElementById('dashboard-section').classList.add('hidden');
    }

    // 4. Configuration du Drag & Drop pour l'import de fichiers
    const dropZone = document.getElementById('drop-zone');
    if (dropZone) {
      dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
      dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
      dropZone.addEventListener('drop', (e) => {
        e.preventDefault(); dropZone.classList.remove('drag-over');
        if (e.dataTransfer.files.length) this.handleFiles({ target: { files: e.dataTransfer.files } });
      });
    }
  },

  // ⚡ CRUCIAL : Appelée automatiquement par le routeur AVANT de quitter la page
  destroy() {
    // Détruire les graphiques Chart.js pour libérer la mémoire
    Object.values(this.charts).forEach(c => { if (c) c.destroy(); });
    this.charts = {};
    
    // Détruire les TomSelects
    Object.values(this.ts).forEach(t => { if (t) t.destroy(); });
    this.ts = {};
  },

  /* --------------------------------------------------------
   * GESTION DES DONNÉES ET FICHIERS EXCEL
   * -------------------------------------------------------- */
  rebuildRawData() {
    this.rawData = [];
    Object.values(this.dataSources).forEach(src => {
      if (src.data) this.rawData = this.rawData.concat(src.data);
    });
    // On expose globalement si d'autres modules (Facturator) en ont encore besoin
    window.rawData = this.rawData; 
  },

  handleFiles(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    
    document.getElementById('upload-progress-container').classList.remove('hidden');
    
    let processed = 0;
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const workbook = XLSX.read(new Uint8Array(evt.target.result), {type: 'array'});
          const json = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: "" });
          const parsed = this.parseData(json, file.name);
          
          if (parsed.length > 0) {
            const sourceId = 'src_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
            this.dataSources[sourceId] = { name: file.name.replace(/\.[^/.]+$/, ""), data: parsed, addedAt: Date.now() };
          }
        } catch(err) { console.error("Erreur Excel", err); }

        processed++;
        document.getElementById('upload-progress-bar').style.width = Math.round((processed/files.length)*100) + '%';
        
        if (processed === files.length) {
          document.getElementById('upload-progress-container').classList.add('hidden');
          // Sauvegarde centralisée
          Storage.set('cra_data_sources', this.dataSources);
          this.rebuildRawData();
          this.init(); // On relance l'affichage
        }
      };
      reader.readAsArrayBuffer(file);
    });
  },

  parseData(json, sourceName) {
    const parsedData = [];
    json.forEach(row => {
      const j = parseFloat(row['Jours'] || row['Fractions'] || 0);
      if (j <= 0) return;
      
      parsedData.push({
        equipe: String(row['Equipe'] || row['Team'] || "N/A").trim(),
        client: String(row['Client'] || row['Project'] || "N/A").trim(),
        collaborateur: String(row['Collaborateur'] || "N/A").trim(),
        mission: String(row['Mission'] || "N/A").trim(),
        jours: j,
        tache: String(row['Tâche'] || row['Task'] || "").trim(),
        date: String(row['Date'] || "").trim(),
        _source: sourceName
      });
    });
    return parsedData;
  },

  clearData() {
    if (!confirm("Effacer toutes les sources CRA ?")) return;
    this.dataSources = {};
    Storage.set('cra_data_sources', this.dataSources);
    this.rebuildRawData();
    this.init();
  },

  renderSourceChips() {
    const container = document.getElementById('source-chips');
    if (!container) return;

    const keys = Object.keys(this.dataSources);
    document.getElementById('source-count').textContent = keys.length;
    document.getElementById('total-records-count').textContent = this.rawData.length;
    
    container.innerHTML = keys.map((id) => `
      <span class="badge badge-info" style="cursor:pointer;" onclick="CRAModule.removeSource('${id}')">
        ${this.dataSources[id].name} (x)
      </span>`).join('');
  },

  removeSource(id) {
    delete this.dataSources[id];
    Storage.set('cra_data_sources', this.dataSources);
    this.rebuildRawData();
    this.init();
  },

  /* --------------------------------------------------------
   * NAVIGATION & FILTRES
   * -------------------------------------------------------- */
  switchTab(tabName) {
    const tabs = ['dashboard', 'explorer'];
    tabs.forEach(t => {
        const content = document.getElementById(`${t}-content`);
        const btn = document.getElementById(`btn-tab-${t}`);
        if (content) content.classList.toggle('hidden', t !== tabName);
        if (btn) {
            btn.classList.toggle('btn-primary', t === tabName);
            btn.classList.toggle('btn-outline', t !== tabName);
        }
    });

    if (tabName === 'explorer') this.renderExplorer();
  },

  openFilters() {
    const modal = document.getElementById('filters-modal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
  },
  
  closeFilters() {
    const modal = document.getElementById('filters-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        this.updateDashboard();
    }
  },

  initTomSelects() {
    if (typeof TomSelect === 'undefined' || this.ts.client) return;
    const config = { plugins: ['remove_button'], maxItems: null, hideSelected: true };
    
    if(document.getElementById('filter-client')) this.ts.client = new TomSelect('#filter-client', config);
    if(document.getElementById('filter-collab')) this.ts.collab = new TomSelect('#filter-collab', config);
  },

  populateFilters() {
    if (!this.ts.client || !this.ts.collab) return;
    
    const clients = [...new Set(this.rawData.map(d => d.client))].sort();
    const collabs = [...new Set(this.rawData.map(d => d.collaborateur))].sort();

    this.ts.client.clearOptions();
    clients.forEach(c => this.ts.client.addOption({value: c, text: c}));
    
    this.ts.collab.clearOptions();
    collabs.forEach(c => this.ts.collab.addOption({value: c, text: c}));
  },

  applyFilters() {
    const fC = this.ts.client ? this.ts.client.getValue() : [];
    const fCo = this.ts.collab ? this.ts.collab.getValue() : [];

    this.filteredData = this.rawData.filter(d => 
        (fC.length === 0 || fC.includes(d.client)) &&
        (fCo.length === 0 || fCo.includes(d.collaborateur))
    );
  },

  /* --------------------------------------------------------
   * GRAPHIQUES DU DASHBOARD
   * -------------------------------------------------------- */
  updateDashboard() {
    if (this.rawData.length === 0) return;
    this.applyFilters();
    this.renderCharts();
  },

  renderCharts() {
    if (typeof Chart === 'undefined') return;
    
    const bgColors = ['#19365D', '#66BB93', '#4491B6', '#2E678D', '#E9BD27', '#E75B3C'];
    const agg = (k) => Object.entries(this.filteredData.reduce((a, r)=>{if(!a[r[k]])a[r[k]]=0; a[r[k]]+=r.jours; return a;},{})).map(([n,v])=>({name:n,value:v})).sort((a,b)=>b.value-a.value);

    const draw = (id, data, type) => {
        const canvas = document.getElementById(id);
        if (!canvas) return;
        if (this.charts[id]) this.charts[id].destroy();
        
        this.charts[id] = new Chart(canvas.getContext('2d'), {
            type: type,
            data: { 
              labels: data.map(d=>d.name), 
              datasets: [{ data: data.map(d=>d.value), backgroundColor: bgColors }] 
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }} }
        });
    };

    draw('clientChart', agg('client'), 'bar');
    draw('collabChart', agg('collaborateur'), 'bar');
    
    const taskCanvas = document.getElementById('taskChart');
    if (taskCanvas) {
      if (this.charts.task) this.charts.task.destroy();
      this.charts.task = new Chart(taskCanvas.getContext('2d'), {
          type: 'doughnut',
          data: { labels: agg('tache').map(d=>d.name), datasets: [{ data: agg('tache').map(d=>d.value), backgroundColor: bgColors }] },
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' }} }
      });
    }
  },

  /* --------------------------------------------------------
   * EXPLORATEUR DE DONNÉES
   * -------------------------------------------------------- */
  renderExplorer() {
    const tbody = document.getElementById('explorer-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = this.filteredData.slice(0, 100).map(d => `
      <tr style="border-bottom: 1px solid var(--border-light);">
        <td style="padding: 10px;">${d.date || 'N/A'}</td>
        <td style="padding: 10px; font-weight: bold; color: var(--primary);">${d.client}</td>
        <td style="padding: 10px;">${d.collaborateur}</td>
        <td style="padding: 10px; text-align: center; font-weight: bold; color: var(--brand);">${d.jours.toFixed(2)}</td>
        <td style="padding: 10px;">${d.tache}</td>
      </tr>
    `).join('');
  }
};

window.CRAModule = CRAModule;
