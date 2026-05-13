/**
 * LOG ANALYZER MODULE
 */
const LogAnalyzerModule = {
  KEY: 'loganalyzer',
  parsed: [],

  async init() {
    this.load();
    document.getElementById('log-analyze')?.addEventListener('click', () => this.analyze());
    document.getElementById('log-import')?.addEventListener('click', () => this.importLog());
    document.getElementById('log-clear')?.addEventListener('click', () => this.clear());
    
    // Restaurer
    if (this.parsed.length > 0) {
      this.renderResults();
    }
  },

  load() {
    const saved = Storage.get(this.KEY, {});
    this.parsed = saved.parsed || [];
    const input = document.getElementById('log-input');
    if (input && saved.rawInput) input.value = saved.rawInput;
  },

  save() {
    Storage.set(this.KEY, {
      parsed: this.parsed,
      rawInput: document.getElementById('log-input')?.value || ''
    });
  },

  analyze() {
    const text = document.getElementById('log-input').value.trim();
    if (!text) { Toast.error('Entrez des logs'); return; }
    
    const lines = text.split('\n').filter(l => l.trim());
    const parsed = lines.map(line => {
      // Regex pour détecter date, niveau, message
      const dateMatch = line.match(/(\d{4}[-/]\d{2}[-/]\d{2}[\sT]\d{2}:\d{2}:\d{2}(?:\.\d+)?)/);
      const levelMatch = line.match(/\b(ERROR|WARN|WARNING|INFO|DEBUG|TRACE|FATAL|CRITICAL)\b/i);
      
      return {
        raw: line,
        date: dateMatch ? dateMatch[1] : null,
        level: levelMatch ? levelMatch[1].toUpperCase() : 'INFO',
        message: line.replace(dateMatch?.[0] || '', '').replace(levelMatch?.[0] || '', '').trim()
      };
    });
    
    this.parsed = parsed;
    this.save();
    this.renderResults();
    Toast.success(`${parsed.length} lignes analysées`);
  },

  renderResults() {
    const stats = { ERROR: 0, WARN: 0, WARNING: 0, INFO: 0, DEBUG: 0, FATAL: 0, TRACE: 0, CRITICAL: 0 };
    this.parsed.forEach(p => { stats[p.level] = (stats[p.level] || 0) + 1; });
    
    const statsEl = document.getElementById('log-stats');
    if (statsEl) {
      statsEl.innerHTML = `
        <div class="stat"><div class="stat-label">Total</div><div class="stat-value">${this.parsed.length}</div></div>
        <div class="stat"><div class="stat-label">Erreurs</div><div class="stat-value" style="color:var(--danger);">${(stats.ERROR || 0) + (stats.FATAL || 0) + (stats.CRITICAL || 0)}</div></div>
        <div class="stat"><div class="stat-label">Warnings</div><div class="stat-value" style="color:var(--warn);">${(stats.WARN || 0) + (stats.WARNING || 0)}</div></div>
        <div class="stat"><div class="stat-label">Info</div><div class="stat-value" style="color:var(--info-fg);">${stats.INFO || 0}</div></div>
      `;
    }

    const results = document.getElementById('log-results');
    if (results) {
      const errors = this.parsed.filter(p => ['ERROR', 'FATAL', 'CRITICAL'].includes(p.level));
      if (errors.length > 0) {
        results.innerHTML = `
          <div class="text-xs font-semibold text-muted mb-2">⚠️ ERREURS (${errors.length})</div>
          ${errors.slice(0, 5).map(e => `
            <div style="padding:6px 10px;background:var(--danger-soft);color:var(--danger-fg);border-radius:6px;margin-bottom:4px;font-size:11px;font-family:var(--font-mono);">
              ${Utils.escape(Utils.truncate(e.message, 80))}
            </div>
          `).join('')}
        `;
      } else {
        results.innerHTML = '<div class="text-sm text-ok">✅ Aucune erreur détectée</div>';
      }
    }

    const parsedEl = document.getElementById('log-parsed');
    if (parsedEl) {
      parsedEl.innerHTML = this.parsed.slice(0, 100).map(p => `
        <div style="padding:6px 10px;border-bottom:1px solid var(--divider);font-family:var(--font-mono);font-size:11px;display:flex;gap:8px;">
          <span class="badge ${this._levelClass(p.level)}" style="flex-shrink:0;width:60px;text-align:center;">${p.level}</span>
          ${p.date ? `<span class="text-muted" style="flex-shrink:0;">${p.date}</span>` : ''}
          <span style="flex:1;">${Utils.escape(p.message)}</span>
        </div>
      `).join('');
      if (this.parsed.length > 100) {
        parsedEl.innerHTML += `<div class="text-xs text-muted mt-2 text-center">... et ${this.parsed.length - 100} autres</div>`;
      }
    }
  },

  _levelClass(level) {
    return {
      ERROR: 'badge-danger', FATAL: 'badge-danger', CRITICAL: 'badge-danger',
      WARN: 'badge-warn', WARNING: 'badge-warn',
      INFO: 'badge-info',
      DEBUG: '', TRACE: ''
    }[level] || '';
  },

  async importLog() {
    try {
      const content = await Utils.importFile('.log,.txt,.json');
      document.getElementById('log-input').value = content;
      Toast.success('Fichier importé');
    } catch (e) { Toast.error('Erreur import'); }
  },

  clear() {
    Modal.confirm('Effacer les logs analysés ?', () => {
      this.parsed = [];
      document.getElementById('log-input').value = '';
      this.save();
      document.getElementById('log-stats').innerHTML = '';
      document.getElementById('log-results').innerHTML = '';
      document.getElementById('log-parsed').innerHTML = '';
      Toast.success('Effacé');
    });
  }
};

window.LogAnalyzerModule = LogAnalyzerModule;
