const GitHubDB = {
  config: {
    // On ne met PLUS le token ici en dur !
    owner: 'fabienkarulak-source',      
    repo: 'cyriasbuddysite',           
    path: 'cyrias-db.json',
    sha: null
  },
  syncTimeout: null,

  getToken() {
    // Récupère le token depuis la mémoire locale du navigateur
    return localStorage.getItem('cyrias_github_token');
  },

  async pull() {
    const token = this.getToken();
    if (!token) {
        console.log("☁️ BDD GitHub: Aucun token configuré. Mode local uniquement.");
        return false;
    }

    try {
      const res = await fetch(`https://api.github.com/repos/${this.config.owner}/${this.config.repo}/contents/${this.config.path}`, {
        headers: { 
            'Authorization': `Bearer ${token}`, 
            'Accept': 'application/vnd.github.v3+json' 
        }
      });
      if (res.ok) {
        const data = await res.json();
        this.config.sha = data.sha;
        const content = JSON.parse(decodeURIComponent(escape(atob(data.content))));
        Object.keys(content).forEach(k => localStorage.setItem(k, content[k]));
        console.log("☁️ BDD GitHub: Données synchronisées !");
        return true;
      }
    } catch (e) { console.warn("☁️ BDD GitHub: Échec de la connexion."); }
    return false;
  },

 push() {
    const token = this.getToken();
    if (!token) return;

    clearTimeout(this.syncTimeout);
    this.syncTimeout = setTimeout(async () => {
      try {
        const allData = {};
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          // On sauvegarde tout ce qui commence par cyrias_ (données, config, etc.)
          if (k.startsWith('cyrias_') && k !== 'cyrias_github_token') {
            allData[k] = localStorage.getItem(k);
          }
        }

        const contentB64 = btoa(unescape(encodeURIComponent(JSON.stringify(allData, null, 2))));
        
        // 1. On vérifie d'abord si le fichier existe pour récupérer son SHA actuel
        // Cela évite l'erreur 409 (Conflict)
        const checkRes = await fetch(`https://api.github.com/repos/${this.config.owner}/${this.config.repo}/contents/${this.config.path}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (checkRes.ok) {
            const fileInfo = await checkRes.json();
            this.config.sha = fileInfo.sha;
        }

        const body = { 
            message: "Mise à jour Cyrias Buddy", 
            content: contentB64 
        };
        
        // Si on a un SHA, on l'ajoute obligatoirement pour avoir le droit de modifier
        if (this.config.sha) body.sha = this.config.sha;

        const res = await fetch(`https://api.github.com/repos/${this.config.owner}/${this.config.repo}/contents/${this.config.path}`, {
          method: 'PUT',
          headers: { 
              'Authorization': `Bearer ${token}`, 
              'Content-Type': 'application/json' 
          },
          body: JSON.stringify(body)
        });
        
        if (res.ok) {
            const data = await res.json();
            this.config.sha = data.content.sha;
            console.log("☁️ BDD GitHub: Données transmises avec succès !");
        } else {
            const errData = await res.json();
            console.error("☁️ Échec de transmission :", errData.message);
        }
      } catch (e) { 
          console.error("☁️ Erreur réseau GitHub", e); 
      }
    }, 2000); // Délai de 2 secondes après la dernière saisie
  }

const Storage = {
  PREFIX: 'cyrias_',
  async initCloud() { await GitHubDB.pull(); },
  get(key, defaultValue = null) {
    try {
      const raw = localStorage.getItem(this.PREFIX + key);
      return raw !== null ? JSON.parse(raw) : defaultValue;
    } catch (e) { return defaultValue; }
  },
  set(key, value) {
    try {
      localStorage.setItem(this.PREFIX + key, JSON.stringify(value));
      GitHubDB.push(); 
      return true;
    } catch (e) { return false; }
  }
};

window.Storage = Storage;
