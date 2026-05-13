/**
 * ROUTER.JS - Navigation modulaire asynchrone
 */
const Router = {
  routes: new Map(),
  currentRoute: null,
  contentEl: null,

  register(name, config) {
    this.routes.set(name, config);
  },

  init(sel = '#content') {
    this.contentEl = document.querySelector(sel);
    window.addEventListener('popstate', () => this._loadRoute(this._hash(), false));
    this.navigate(this._hash() || 'dashboard');
  },

  _hash() { return window.location.hash.replace('#/', '').replace('#', '') || null; },

  async navigate(name) {
    if (!this.routes.has(name)) name = 'dashboard';
    await this._loadRoute(name, true);
  },

  async _loadRoute(name, push) {
    const route = this.routes.get(name);
    if (!route) return;

    // 1. Destruction propre des instances du module précédent (ex: Chart.js)
    if (this.currentRoute) {
      const prevRoute = this.routes.get(this.currentRoute);
      if (prevRoute && prevRoute.module && window[prevRoute.module]?.destroy) {
        window[prevRoute.module].destroy();
      }
    }

    // 2. Fetch du HTML depuis GitHub Pages
    try {
      const response = await fetch('pages/' + route.page + '.html');
      if (!response.ok) throw new Error("Fichier introuvable");
      this.contentEl.innerHTML = await response.text();
    } catch (error) {
      this.contentEl.innerHTML = `<div style="padding:40px;color:red;">Erreur: impossible de charger pages/${route.page}.html</div>`;
    }

    this.currentRoute = name;

    // Mise à jour de la classe CSS active dans le menu
    document.querySelectorAll('.nav-item').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-route') === name);
    });

    if (push) window.history.pushState(null, '', '#/' + name);

    // 3. Initialisation du module JS lié à la page
    setTimeout(async () => {
      if (route.module && window[route.module]?.init) {
        try { await window[route.module].init(); } catch(e) { console.error('Erreur init:', e); }
      }
    }, 50);
  }
};

window.Router = Router;
