/**
 * STORAGE.JS - Système de persistance avec Synchronisation GitHub Cloud
 */
const GitHubDB = {
  config: {
    owner: 'Fabien',                    // ⚠️ Remplacez par votre pseudo
    repo: 'cyrias-buddy-db',                 // ⚠️ Remplacez par votre repo
    path: 'cyrias-db.json',
    sha: null
  },
  syncTimeout: null,

  async pull() {
    try {
      const res = await fetch(`https://api.github.com/repos/${this.config.owner}/${this.config.repo}/contents/${this.config.path}`, {
        headers: { 
          'Authorization': `Bearer ${this.config.token}`, 
          'Accept': 'application/vnd.github.v3+json' 
        }
      });
      if (res.ok) {
        const data = await res.json();
        this.config.sha = data.sha;
        const content = JSON.parse(decodeURIComponent(escape(atob(data.content))));
        Object.keys(content).forEach(k => localStorage.setItem(k, content[k]));
        console.log("☁️ Synchro GitHub: Données téléchargées.");
        return true;
      } else if (res.status === 404) {
        console.warn("☁️ GitHub: Fichier introuvable. Il sera créé à la prochaine sauvegarde.");
      }
    } catch (e) { console.warn("☁️ Synchro GitHub: Mode hors-ligne.", e); }
    return false;
  },

  push() {
    clearTimeout(this.syncTimeout);
    this.syncTimeout = setTimeout(async () => {
      try {
        const allData = {};
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k.startsWith('cyrias_') || k.startsWith('cra_') || k.startsWith('compagnon_')) {
            allData[k] = localStorage.getItem(k);
          }
        }
        const contentB64 = btoa(unescape(encodeURIComponent(JSON.stringify(allData, null, 2))));
        const body = { message: "Auto-sync Cyrias Buddy", content: contentB64 };
        if (this.config.sha) body.sha = this.config.sha;

        const res = await fetch(`https://api.github.com/repos/${this.config.owner}/${this.config.repo}/contents/${this.config.path}`, {
          method: 'PUT',
          headers: { 
            'Authorization': `Bearer ${this.config.token}`, 
            'Content-Type': 'application/json' 
          },
          body: JSON.stringify(body)
        });
        if (res.ok) {
          const data = await res.json();
          this.config.sha = data.content.sha;
          console.log("☁️ Sauvegarde GitHub réussie.");
        }
      } catch (e) { console.error("☁️ Erreur Push GitHub", e); }
    }, 2000); // Anti-spam API
  }
};

const Storage = {
  PREFIX: 'cyrias_',
  _cache: new Map(),
  _listeners: new Map(),

  async initCloud() {
    await GitHubDB.pull();
  },

  get(key, defaultValue = null) {
    const fullKey = this.PREFIX + key;
    if (this._cache.has(fullKey)) return this._cache.get(fullKey);
    try {
      const raw = localStorage.getItem(fullKey);
      if (raw === null) return defaultValue;
      const data = JSON.parse(raw);
      this._cache.set(fullKey, data);
      return data;
    } catch (e) {
      console.error(`[Storage] Read error ${key}:`, e);
      return defaultValue;
    }
  },

  set(key, value) {
    const fullKey = this.PREFIX + key;
    try {
      localStorage.setItem(fullKey, JSON.stringify(value));
      this._cache.set(fullKey, value);
      this._notify(key, value);
      GitHubDB.push(); // ⚡ Déclenche la sauvegarde Cloud asynchrone
      return true;
    } catch (e) {
      console.error(`[Storage] Write error ${key}:`, e);
      if (e.name === 'QuotaExceededError' && window.Toast) Toast.error('Espace de stockage plein!');
      return false;
    }
  },

  remove(key) {
    const fullKey = this.PREFIX + key;
    localStorage.removeItem(fullKey);
    this._cache.delete(fullKey);
    this._notify(key, null);
    GitHubDB.push(); // ⚡ Déclenche la sauvegarde Cloud
  },

  watch(key, callback) {
    if (!this._listeners.has(key)) this._listeners.set(key, new Set());
    this._listeners.get(key).add(callback);
    return () => this._listeners.get(key)?.delete(callback);
  },

  _notify(key, value) {
    this._listeners.get(key)?.forEach(cb => { try { cb(value); } catch (e) {} });
  },

  keys() {
    return Object.keys(localStorage)
      .filter(k => k.startsWith(this.PREFIX))
      .map(k => k.substring(this.PREFIX.length));
  },

  exportAll() {
    const data = {};
    this.keys().forEach(key => data[key] = this.get(key));
    return { version: '1.0', timestamp: new Date().toISOString(), data };
  },

  importAll(backup) {
    try {
      if (!backup.data) throw new Error('Format invalide');
      Object.entries(backup.data).forEach(([key, value]) => this.set(key, value));
      return true;
    } catch (e) { return false; }
  },

  clearAll() {
    this.keys().forEach(key => this.remove(key));
    this._cache.clear();
  },

  getStats() {
    let total = 0; const modules = {};
    this.keys().forEach(key => {
      const data = localStorage.getItem(this.PREFIX + key);
      const size = new Blob([data || '']).size;
      modules[key] = { size: this._formatSize(size), items: Array.isArray(this.get(key)) ? this.get(key).length : 0 };
      total += size;
    });
    return { total: this._formatSize(total), totalBytes: total, modules, moduleCount: Object.keys(modules).length };
  },

  _formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  }
};

window.Storage = Storage;
