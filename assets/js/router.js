/**
 * ROUTER.JS — Gère l'injection HTML et la destruction des instances
 */
const Router = {
  routes: new Map(),
  currentRoute: null,
  contentEl: null,

  register(name, config) {
    this.routes.set(name, {
      name, title: config.title || name, subtitle: config.subtitle || '',
      icon: config.icon || '', page: config.page, module: config.module,
    });
  },

  init(sel = '#content') {
    this.contentEl = document.querySelector(sel);
    window.addEventListener('popstate', (e) => {
      this._loadRoute(e.state?.route || this._hash(), false);
    });
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

    // ⚡ 1. NETTOYAGE : Détruit les graphiques du module précédent avant de vider le DOM
    if (this.currentRoute) {
      const prevRoute = this.routes.get(this.currentRoute);
      if (prevRoute && prevRoute.module && window[prevRoute.module] && typeof window[prevRoute.module].destroy === 'function') {
        window[prevRoute.module].destroy();
      }
    }

    // 2. INJECTION HTML (Depuis les templates de index.html)
    const tpl = document.getElementById('tpl-' + route.page);
    if (tpl) {
      this.contentEl.innerHTML = tpl.innerHTML;
    } else {
      try {
        const r = await fetch('pages/' + route.page + '.html');
        if (!r.ok) throw new Error(r.status);
        this.contentEl.innerHTML = await r.text();
      } catch (e) {
        this.contentEl.innerHTML = '<div style="padding:40px;color:var(--danger);">Erreur: impossible de charger ' + route.page + '. (Les templates HTML manquent dans index.html)</div>';
      }
    }

    this.currentRoute = name;
    
    // Surligner le menu actif
    document.querySelectorAll('.nav-item[data-route]').forEach(b => {
      b.classList.toggle('active', b.dataset.route === name);
    });
    
    if (push) window.history.pushState({route: name}, route.title, '#/' + name);
    document.title = route.title + ' — Cyrias Buddy';

    // ⚡ 3. INITIALISATION : On laisse 50ms au DOM pour insérer les <canvas> avant d'appeler le JS
    setTimeout(async () => {
      if (route.module && window[route.module] && typeof window[route.module].init === 'function') {
        try { await window[route.module].init(); } catch(e) { console.error('[Router Init Error]', e); }
      }
      if (typeof Icons !== 'undefined') Icons.hydrate();
    }, 50);
  },

  getCurrentRoute() { return this.currentRoute; }
};
window.Router = Router;
