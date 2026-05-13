/**
 * CRAMINATOR MODULE — Analyseur d'exports
 */
const CRAModule = {
  charts: {},
  dataSources: {},
  rawData: [],

  async init() {
    this.dataSources = Storage.get('cra_data_sources', {});
    this.rebuildRawData();

    if (Object.keys(this.dataSources).length > 0) {
      document.getElementById('upload-section').classList.add('is-hidden');
      document.getElementById('source-manager').classList.remove('is-hidden');
      document.getElementById('dashboard-section').classList.remove('is-hidden');
      this.updateDashboard();
      this.renderSourceChips();
    } else {
      document.getElementById('upload-section').classList.remove('is-hidden');
      document.getElementById('source-manager').classList.add('is-hidden');
      document.getElementById('dashboard-section').classList.add('is-hidden');
    }
  },

  destroy() {
    Object.values(this.charts).forEach(c => { if (c) c.destroy(); });
    this.charts = {};
  },

  rebuildRawData() {
    this.rawData = [];
    Object.values(this.dataSources).forEach(src => {
      if (src.data) this.rawData = this.rawData.concat(src.data);
    });
  },

  handleFiles(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    
    document.getElementById('upload-progress-container').classList.remove('is-hidden');
    let processed = 0;
    
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
              tache: String(row['Tâche'] || row['Task'] || "").trim(),
              date: String(row['Date'] || "").trim()
            });
          });

          if (parsed.length > 0) {
            const sourceId = 'src_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
            this.dataSources[sourceId] = { name: file.name, data: parsed };
          }
        } catch(err) { console.error("Erreur Excel", err); }

        processed++;
        document.getElementById('upload-progress-bar').style.width = Math.round((processed/files.length)*100) + '%';
        document.getElementById('upload-progress-text').innerText = Math.round((processed/files.length)*100) + '%';
        
        if (processed === files.length) {
          setTimeout(() => {
              document.getElementById('upload-progress-container').classList.add('is-hidden');
              Storage.set('cra_data_sources', this.dataSources);
              this.init(); 
          }, 500);
        }
      };
      reader.readAsArrayBuffer(file);
    });
  },

  clearData() {
    if (!confirm("Effacer toutes les sources CRA ?")) return;
    this.dataSources = {};
    Storage.set('cra_data_sources', this.dataSources);
    this.init();
  },

  renderSourceChips() {
    const container = document.getElementById('source-chips');
    if (!container) return;
    const keys = Object.keys(this.dataSources);
    document.getElementById('source-count').textContent = keys.length;
    document.getElementById('total-records-count').textContent = this.rawData.length;
    
    container.innerHTML = keys.map((id) => `
      <span class="badge badge-info" style="cursor:pointer;" onclick="CRAModule.removeSource('${id}')" title="Supprimer">
        ${Utils.escape(this.dataSources[id].name)} ✕
      </span>`).join('');
  },

  removeSource(id) {
    if (!confirm("Retirer ce fichier ?")) return;
    delete this.dataSources[id];
    Storage.set('cra_data_sources', this.dataSources);
    this.init();
  },

  switchTab(tabName) {
    document.getElementById('dashboard-content').classList.toggle('is-hidden', tabName !== 'dashboard');
    document.getElementById('explorer-content').classList.toggle('is-hidden', tabName !== 'explorer');
    
    document.getElementById('btn-tab-dashboard').className = tabName === 'dashboard' ? 'btn btn-primary text-xs' : 'btn btn-outline text-xs';
    document.getElementById('btn-tab-explorer').className = tabName === 'explorer' ? 'btn btn-primary text-xs' : 'btn btn-outline text-xs';
    
    if (tabName === 'explorer') this.renderExplorer();
  },

  updateDashboard() {
    if (this.rawData.length === 0 || typeof Chart === 'undefined') return;
    
    const bgColors = ['#19365D', '#66BB93', '#4491B6', '#E9BD27', '#E75B3C'];
    const agg = (k) => Object.entries(this.rawData.reduce((a, r)=>{if(!a[r[k]])a[r[k]]=0; a[r[k]]+=r.jours; return a;},{})).map(([n,v])=>({name:n,value:v})).sort((a,b)=>b.value-a.value);

    const draw = (id, data, type) => {
        const canvas = document.getElementById(id);
        if (!canvas) return;
        if (this.charts[id]) this.charts[id].destroy();
        
        this.charts[id] = new Chart(canvas.getContext('2d'), {
            type: type,
            data: { labels: data.map(d=>d.name), datasets: [{ data: data.map(d=>d.value), backgroundColor: bgColors }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: type==='doughnut', position: 'right' }} }
        });
    };

    draw('clientChart', agg('client'), 'bar');
    draw('taskChart', agg('tache'), 'doughnut');
  },

  renderExplorer() {
    const tbody = document.getElementById('explorer-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = this.rawData.slice(0, 100).map(d => `
      <tr class="hover:bg-gray-50 transition">
        <td class="font-mono text-muted">${Utils.escape(d.date || 'N/A')}</td>
        <td class="font-bold text-primary">${Utils.escape(d.client)}</td>
        <td>${Utils.escape(d.collaborateur)}</td>
        <td class="text-center font-bold text-brand">${d.jours.toFixed(2)}</td>
        <td>${Utils.escape(d.tache)}</td>
      </tr>
    `).join('');
  }
};

window.CRAModule = CRAModule;
