/**
 * STORAGE.JS - Stockage local avec synchronisation cloud GitHub
 */
const GitHubDB = {
  config: {
    token: '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', // ⚠️ Token GitHub
    owner: 'fabienkarulak-source',                // ⚠️ Ton pseudo GitHub
    repo: 'cyriasbuddysite',            // ⚠️ Le repo qui stocke le json
    path: 'cyrias-db.json',
    sha: null
  },
  syncTimeout: null,

  async pull() {
    try {
      const res = await fetch(`https://api.github.com/repos/${this.config.owner}/${this.config.repo}/contents/${this.config.path}`, {
        headers: { 'Authorization': `Bearer ${this.config.token}`, 'Accept': 'application/vnd.github.v3+json' }
      });
      if (res.ok) {
        const data = await res.json();
        this.config.sha = data.sha;
        const content = JSON.parse(decodeURIComponent(escape(atob(data.content))));
        Object.keys(content).forEach(k => localStorage.setItem(k, content[k]));
        console.log("☁️ BDD GitHub: Données synchronisées !");
        return true;
      }
    } catch (e) { console.warn("☁️ BDD GitHub: Mode hors-ligne actif."); }
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
          headers: { 'Authorization': `Bearer ${this.config.token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        if (res.ok) {
          const data = await res.json();
          this.config.sha = data.content.sha;
        }
      } catch (e) { console.error("☁️ Erreur Sauvegarde GitHub", e); }
    }, 2500); // 2.5s de debounce pour ne pas spammer l'API GitHub
  }
};

const Storage = {
  PREFIX: 'cyrias_',
  
  async initCloud() {
    await GitHubDB.pull();
  },

  get(key, defaultValue = null) {
    try {
      const raw = localStorage.getItem(this.PREFIX + key);
      return raw !== null ? JSON.parse(raw) : defaultValue;
    } catch (e) { return defaultValue; }
  },

  set(key, value) {
    try {
      localStorage.setItem(this.PREFIX + key, JSON.stringify(value));
      GitHubDB.push(); // Sauvegarde sur GitHub à chaque modif
      return true;
    } catch (e) { return false; }
  }
};

window.Storage = Storage;
