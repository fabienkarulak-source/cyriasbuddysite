/**
 * ROUTER.JS — Compatible file:// (templates inline) ET http:// (fetch)
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

    // 1. Template inline (file://) — prioritaire
    const tpl = document.getElementById('tpl-' + route.page);
    if (tpl) {
      this.contentEl.innerHTML = tpl.innerHTML;
    } else {
      // 2. Fetch (http://)
      try {
        const r = await fetch('pages/' + route.page + '.html');
        if (!r.ok) throw new Error(r.status);
        this.contentEl.innerHTML = await r.text();
      } catch (e) {
        this.contentEl.innerHTML = '<div style="padding:40px;color:var(--danger);">Erreur: impossible de charger ' + route.page + ' (' + e.message + '). Utilisez un serveur HTTP local.</div>';
      }
    }

    this.currentRoute = name;
    // Highlight nav
    document.querySelectorAll('.nav-item[data-route]').forEach(b => {
      b.classList.toggle('active', b.dataset.route === name);
    });
    if (push) window.history.pushState({route: name}, route.title, '#/' + name);
    document.title = route.title + ' — Cyrias Buddy';

    // Init module
    if (route.module && window[route.module]?.init) {
      try { await window[route.module].init(); } catch(e) { console.error('[Router]', e); }
    }
  },

  getCurrentRoute() { return this.currentRoute; }
};
window.Router = Router;
