/**
 * assets/js/router.js - Chargement asynchrone des vues HTML
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
    window.addEventListener('popstate', () => {
      this._loadRoute(this._hash(), false);
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

    // 1. Détruire les graphiques du module précédent (évite les plantages)
    if (this.currentRoute) {
      const prevRoute = this.routes.get(this.currentRoute);
      if (prevRoute && prevRoute.module && window[prevRoute.module]?.destroy) {
        window[prevRoute.module].destroy();
      }
    }

    // 2. Charger le HTML depuis le dossier pages/
    try {
      const response = await fetch('pages/' + route.page + '.html');
      if (!response.ok) throw new Error(response.statusText);
      this.contentEl.innerHTML = await response.text();
    } catch (error) {
      console.error("Erreur de chargement de la page :", error);
      this.contentEl.innerHTML = `
        <div style="padding:40px;text-align:center;">
            <h2 style="color:var(--danger);font-size:24px;margin-bottom:12px;">Erreur de chargement</h2>
            <p style="color:var(--ink-secondary);">Impossible de charger le fichier <b>pages/${route.page}.html</b>.</p>
            <div style="background:var(--warn-soft);padding:16px;border-radius:8px;margin-top:20px;display:inline-block;text-align:left;">
                <strong>⚠️ Avez-vous ouvert ce fichier avec un double-clic ?</strong><br>
                Si l'URL de votre navigateur commence par <code>file:///</code>, le chargement est bloqué par sécurité.<br>
                Vous devez impérativement utiliser un Serveur Local (ex: Live Server).
            </div>
        </div>`;
    }

    this.currentRoute = name;

    // 3. Surligner le menu actif
    document.querySelectorAll('.nav-item').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-route') === name);
    });

    if (push) window.history.pushState(null, '', '#/' + name);

    // 4. Lancer l'initialisation Javascript du module métier
    setTimeout(async () => {
      if (route.module && window[route.module] && typeof window[route.module].init === 'function') {
        try { await window[route.module].init(); } catch(e) { console.error('Erreur module:', e); }
      }
    }, 50);
  }
};

window.Router = Router;
