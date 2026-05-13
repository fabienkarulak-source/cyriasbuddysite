/**
 * assets/js/router.js - Gestionnaire de navigation asynchrone
 */
const Router = {
  routes: new Map(),
  currentRoute: null,
  contentEl: null,

  /**
   * Enregistre une nouvelle route
   */
  register(name, config) {
    this.routes.set(name, {
      name,
      title: config.title || name,
      page: config.page,
      module: config.module
    });
  },

  /**
   * Initialise le routeur
   */
  init(sel = '#content') {
    this.contentEl = document.querySelector(sel);
    if (!this.contentEl) return console.error("Élément de contenu introuvable");

    window.addEventListener('popstate', () => {
      this._loadRoute(this._hash(), false);
    });

    this.navigate(this._hash() || 'dashboard');
  },

  _hash() {
    return window.location.hash.replace('#/', '').replace('#', '') || null;
  },

  /**
   * Navigue vers une page
   */
  async navigate(name) {
    if (!this.routes.has(name)) name = 'dashboard';
    await this._loadRoute(name, true);
  },

  /**
   * Charge le contenu et initialise le module associé
   */
  async _loadRoute(name, push) {
    const route = this.routes.get(name);
    if (!route) return;

    // 1. Nettoyage du module précédent (Détruit les instances de graphiques)
    if (this.currentRoute) {
      const prevRoute = this.routes.get(this.currentRoute);
      if (prevRoute && prevRoute.module && window[prevRoute.module] && typeof window[prevRoute.module].destroy === 'function') {
        window[prevRoute.module].destroy();
      }
    }

    // 2. Chargement du HTML (Priorité aux templates inline, puis fetch)
    const tpl = document.getElementById('tpl-' + route.page);
    if (tpl) {
      this.contentEl.innerHTML = tpl.innerHTML;
    } else {
      try {
        const response = await fetch('pages/' + route.page + '.html');
        if (!response.ok) throw new Error(response.statusText);
        this.contentEl.innerHTML = await response.text();
      } catch (error) {
        this.contentEl.innerHTML = `
          <div style="padding:40px;text-align:center;">
              <h2 style="color:var(--danger);">Erreur de chargement</h2>
              <p>Impossible de charger <b>pages/${route.page}.html</b>.</p>
          </div>`;
      }
    }

    this.currentRoute = name;

    // 3. Mise à jour visuelle du menu
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.route === name);
    });

    if (push) window.history.pushState({ route: name }, route.title, '#/' + name);
    document.title = route.title + ' — Cyrias Buddy';

    // 4. Initialisation du module métier
    setTimeout(async () => {
      if (route.module && window[route.module] && typeof window[route.module].init === 'function') {
        try { await window[route.module].init(); } catch (e) { console.error(`Erreur d'initialisation du module ${route.module}:`, e); }
      }
    }, 50);
  }
};

window.Router = Router;
