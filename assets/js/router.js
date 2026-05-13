const GitHubDB = {
  config: {
    token: 'VOTRE_TOKEN_GITHUB', 
    owner: 'VOTRE_PSEUDO',
    repo: 'VOTRE_REPO',
    path: 'db.json',
    sha: null
  },
  async pull() {
    try {
      const res = await fetch(`https://api.github.com/repos/${this.config.owner}/${this.config.repo}/contents/${this.config.path}`, {
        headers: { 'Authorization': `token ${this.config.token}` }
      });
      if (res.ok) {
        const d = await res.json();
        this.config.sha = d.sha;
        const content = JSON.parse(atob(d.content));
        Object.keys(content).forEach(k => localStorage.setItem(k, content[k]));
      }
    } catch(e) { console.warn("Offline mode"); }
  },
  async push() {
    const all = {};
    for(let i=0; i<localStorage.length; i++) {
      const k = localStorage.key(i);
      if(k.startsWith('cyrias_')) all[k] = localStorage.getItem(k);
    }
    const body = { message: "Sync", content: btoa(JSON.stringify(all)), sha: this.config.sha };
    await fetch(`https://api.github.com/repos/${this.config.owner}/${this.config.repo}/contents/${this.config.path}`, {
      method: 'PUT',
      headers: { 'Authorization': `token ${this.config.token}` },
      body: JSON.stringify(body)
    });
  }
};

const Storage = {
  PREFIX: 'cyrias_',
  get(key, def = null) {
    const val = localStorage.getItem(this.PREFIX + key);
    return val ? JSON.parse(val) : def;
  },
  set(key, val) {
    localStorage.setItem(this.PREFIX + key, JSON.stringify(val));
    GitHubDB.push(); // Sauvegarde GitHub en arrière-plan
  },
  async initCloud() { await GitHubDB.pull(); }
};
