/**
 * TESTS - FRAMEWORK CORE
 * Tests des modules de base : Storage, Router, UI, Utils
 */

// ===== STORAGE =====
TNR.describe('🗄 Storage API', () => {
  TNR.beforeEach(() => TNR.resetStorage());

  TNR.it('doit être défini globalement', () => {
    TNR.expect(window.Storage).toBeDefined();
    TNR.expect(typeof Storage.get).toBe('function');
    TNR.expect(typeof Storage.set).toBe('function');
  });

  TNR.it('doit stocker et récupérer une valeur', () => {
    Storage.set('test_key', { foo: 'bar' });
    const result = Storage.get('test_key');
    TNR.expect(result).toEqual({ foo: 'bar' });
  });

  TNR.it('doit retourner la valeur par défaut si la clé n\'existe pas', () => {
    const result = Storage.get('inexistant', 'default');
    TNR.expect(result).toBe('default');
  });

  TNR.it('doit utiliser le préfixe cyrias_', () => {
    Storage.set('test_prefix', 'value');
    const raw = localStorage.getItem('cyrias_test_prefix');
    TNR.expect(raw).toBeTruthy();
  });

  TNR.it('doit supprimer une clé', () => {
    Storage.set('to_delete', 'value');
    Storage.remove('to_delete');
    TNR.expect(Storage.get('to_delete')).toBeNull();
  });

  TNR.it('doit lister les clés', () => {
    Storage.set('key1', 1);
    Storage.set('key2', 2);
    const keys = Storage.keys();
    TNR.expect(keys).toContain('key1');
    TNR.expect(keys).toContain('key2');
  });

  TNR.it('doit exporter toutes les données', () => {
    Storage.set('exp1', 'a');
    Storage.set('exp2', 'b');
    const exp = Storage.exportAll();
    TNR.expect(exp).toHaveProperty('version');
    TNR.expect(exp).toHaveProperty('timestamp');
    TNR.expect(exp.data).toHaveProperty('exp1');
    TNR.expect(exp.data).toHaveProperty('exp2');
  });

  TNR.it('doit importer des données', () => {
    const ok = Storage.importAll({
      data: { imp1: 'value1', imp2: { nested: true } }
    });
    TNR.expect(ok).toBeTruthy();
    TNR.expect(Storage.get('imp1')).toBe('value1');
    TNR.expect(Storage.get('imp2')).toEqual({ nested: true });
  });

  TNR.it('doit gérer un import invalide', () => {
    const ok = Storage.importAll({});
    TNR.expect(ok).toBeFalsy();
  });

  TNR.it('doit notifier les watchers', () => {
    let notified = false;
    let receivedValue = null;
    const unsubscribe = Storage.watch('watched', (value) => {
      notified = true;
      receivedValue = value;
    });
    Storage.set('watched', 'new value');
    TNR.expect(notified).toBeTruthy();
    TNR.expect(receivedValue).toBe('new value');
    unsubscribe();
  });

  TNR.it('doit retourner des stats correctes', () => {
    Storage.set('stat1', { a: 1 });
    Storage.set('stat2', [1, 2, 3]);
    const stats = Storage.getStats();
    TNR.expect(stats).toHaveProperty('total');
    TNR.expect(stats).toHaveProperty('modules');
    TNR.expect(stats.moduleCount).toBeGreaterThan(1);
  });

  TNR.it('doit nettoyer toutes les données', () => {
    Storage.set('clear1', 'a');
    Storage.set('clear2', 'b');
    Storage.clearAll();
    TNR.expect(Storage.keys()).toHaveLength(0);
  });
});

// ===== UTILS =====
TNR.describe('🛠 Utils', () => {
  TNR.it('escape() doit échapper le HTML', () => {
    TNR.expect(Utils.escape('<script>alert(1)</script>'))
      .toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  TNR.it('escape() doit gérer null/undefined', () => {
    TNR.expect(Utils.escape(null)).toBe('');
    TNR.expect(Utils.escape(undefined)).toBe('');
  });

  TNR.it('id() doit générer un ID unique', () => {
    const id1 = Utils.id();
    const id2 = Utils.id();
    TNR.expect(id1).toBeTruthy();
    TNR.expect(id1).toBeDefined();
    TNR.expect(id1 === id2).toBeFalsy();
  });

  TNR.it('formatDate() doit formater une date', () => {
    const result = Utils.formatDate('2024-01-15');
    TNR.expect(result).toContain('2024');
  });

  TNR.it('formatDate() doit retourner vide pour null', () => {
    TNR.expect(Utils.formatDate(null)).toBe('');
  });

  TNR.it('truncate() doit tronquer une chaîne', () => {
    TNR.expect(Utils.truncate('Hello World', 5)).toBe('Hello…');
  });

  TNR.it('truncate() doit garder une chaîne courte intacte', () => {
    TNR.expect(Utils.truncate('Hi', 10)).toBe('Hi');
  });

  TNR.it('debounce() doit limiter les appels', async () => {
    let count = 0;
    const fn = Utils.debounce(() => count++, 50);
    fn(); fn(); fn();
    await new Promise(r => setTimeout(r, 100));
    TNR.expect(count).toBe(1);
  });
});

// ===== UI / TOAST =====
TNR.describe('💬 Toast', () => {
  TNR.afterEach(() => {
    document.querySelector('.toast-container')?.remove();
    Toast.container = null;
  });

  TNR.it('doit être défini globalement', () => {
    TNR.expect(window.Toast).toBeDefined();
    TNR.expect(typeof Toast.show).toBe('function');
  });

  TNR.it('doit afficher un toast', () => {
    Toast.show('Test message');
    const toast = document.querySelector('.toast');
    TNR.expect(toast).toBeTruthy();
    TNR.expect(toast.textContent).toContain('Test message');
  });

  TNR.it('doit avoir 4 niveaux (success/error/warn/info)', () => {
    TNR.expect(typeof Toast.success).toBe('function');
    TNR.expect(typeof Toast.error).toBe('function');
    TNR.expect(typeof Toast.warn).toBe('function');
    TNR.expect(typeof Toast.info).toBe('function');
  });

  TNR.it('doit appliquer la classe error', () => {
    Toast.error('Error');
    const toast = document.querySelector('.toast.error');
    TNR.expect(toast).toBeTruthy();
  });
});

// ===== UI / MODAL =====
TNR.describe('🪟 Modal', () => {
  TNR.afterEach(() => Modal.close());

  TNR.it('doit être défini globalement', () => {
    TNR.expect(window.Modal).toBeDefined();
    TNR.expect(typeof Modal.show).toBe('function');
  });

  TNR.it('doit afficher un modal', () => {
    Modal.show({ title: 'Test Modal', body: '<p>Contenu</p>' });
    const modal = document.querySelector('.modal-overlay');
    TNR.expect(modal).toBeTruthy();
  });

  TNR.it('doit fermer un modal', () => {
    Modal.show({ title: 'Test' });
    Modal.close();
    const modal = document.querySelector('.modal-overlay');
    TNR.expect(modal).toBeNull();
  });

  TNR.it('doit afficher le titre', () => {
    Modal.show({ title: 'Mon Titre Test' });
    const modal = document.querySelector('.modal');
    TNR.expect(modal.textContent).toContain('Mon Titre Test');
  });
});

// ===== ROUTER =====
TNR.describe('🧭 Router', () => {
  TNR.it('doit être défini globalement', () => {
    TNR.expect(window.Router).toBeDefined();
    TNR.expect(typeof Router.register).toBe('function');
    TNR.expect(typeof Router.navigate).toBe('function');
  });

  TNR.it('doit enregistrer des routes', () => {
    TNR.expect(Router.routes.size).toBeGreaterThan(0);
  });

  TNR.it('doit avoir les 20 routes principales', () => {
    const expected = [
      'dashboard', 'links', 'organisator', 'journal', 'notifcenter', 'communicator',
      'direction', 'craminator', 'facturator', 'agregator', 'kanban',
      'snippets', 'sql', 'loganalyzer', 'xmlviewer', 'bible',
      'analytics', 'errortracker', 'gitcicd', 'config'
    ];
    expected.forEach(route => {
      TNR.expect(Router.routes.has(route)).toBeTruthy();
    });
  });
});
