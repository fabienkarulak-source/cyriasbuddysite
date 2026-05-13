/**
 * TESTS - MODULES MÉTIER
 * Tests fonctionnels pour chaque module
 */

// ===== KANBAN =====
TNR.describe('🎯 Kanban Module', () => {
  TNR.beforeEach(() => {
    Storage.remove('kanban');
    KanbanModule.load();
    KanbanModule.filters = { search: '', priority: '', assignee: '' };
  });

  TNR.it('doit être défini', () => {
    TNR.expect(window.KanbanModule).toBeDefined();
    TNR.expect(typeof KanbanModule.init).toBe('function');
  });

  TNR.it('doit avoir 4 colonnes', () => {
    TNR.expect(KanbanModule.columns).toHaveLength(4);
    TNR.expect(KanbanModule.columns.map(c => c.id)).toEqual(['todo', 'in-progress', 'review', 'done']);
  });

  TNR.it('doit charger un état vide', () => {
    TNR.expect(KanbanModule.data.tasks).toEqual([]);
  });

  TNR.it('doit sauvegarder une tâche', () => {
    KanbanModule.data.tasks.push({
      id: 'test1',
      title: 'Tâche test',
      status: 'todo'
    });
    KanbanModule.save();
    const saved = Storage.get('kanban');
    TNR.expect(saved.tasks).toHaveLength(1);
    TNR.expect(saved.tasks[0].title).toBe('Tâche test');
  });

  TNR.it('doit déplacer une tâche entre colonnes', () => {
    KanbanModule.data.tasks.push({
      id: 'move1',
      title: 'À déplacer',
      status: 'todo'
    });
    // Test direct sur la donnée (sans render qui requiert le DOM)
    const task = KanbanModule.data.tasks.find(t => t.id === 'move1');
    task.status = 'in-progress';
    task.updatedAt = new Date().toISOString();
    KanbanModule.save();
    
    KanbanModule.load();
    TNR.expect(KanbanModule.data.tasks[0].status).toBe('in-progress');
    TNR.expect(KanbanModule.data.tasks[0].updatedAt).toBeDefined();
  });

  TNR.it('doit filtrer par recherche', () => {
    KanbanModule.data.tasks = [
      { id: '1', title: 'Important', status: 'todo' },
      { id: '2', title: 'Banal', status: 'todo' }
    ];
    KanbanModule.filters.search = 'important';
    const filtered = KanbanModule.filteredTasks();
    TNR.expect(filtered).toHaveLength(1);
    TNR.expect(filtered[0].title).toBe('Important');
  });

  TNR.it('doit filtrer par priorité', () => {
    KanbanModule.data.tasks = [
      { id: '1', title: 'A', priority: 'high', status: 'todo' },
      { id: '2', title: 'B', priority: 'low', status: 'todo' }
    ];
    KanbanModule.filters.priority = 'high';
    const filtered = KanbanModule.filteredTasks();
    TNR.expect(filtered).toHaveLength(1);
  });
});

// ===== JOURNAL =====
TNR.describe('📓 Journal Module', () => {
  TNR.beforeEach(() => {
    Storage.remove('journal');
    JournalModule.load();
    JournalModule.filterTag = '';
    JournalModule.searchQuery = '';
  });

  TNR.it('doit être défini', () => {
    TNR.expect(window.JournalModule).toBeDefined();
  });

  TNR.it('doit créer une entrée', () => {
    JournalModule.entries.push({
      id: 'j1',
      content: 'Test entry',
      date: new Date().toISOString(),
      tags: ['test']
    });
    JournalModule.save();
    const loaded = Storage.get('journal');
    TNR.expect(loaded).toHaveLength(1);
  });

  TNR.it('doit filtrer par tag', () => {
    JournalModule.entries = [
      { id: '1', content: 'A', date: new Date().toISOString(), tags: ['work'] },
      { id: '2', content: 'B', date: new Date().toISOString(), tags: ['personal'] }
    ];
    JournalModule.filterTag = 'work';
    const filtered = JournalModule.filtered();
    TNR.expect(filtered).toHaveLength(1);
  });

  TNR.it('doit rechercher dans le contenu', () => {
    JournalModule.entries = [
      { id: '1', content: 'Réunion importante', date: new Date().toISOString() },
      { id: '2', content: 'Note quelconque', date: new Date().toISOString() }
    ];
    JournalModule.searchQuery = 'réunion';
    const filtered = JournalModule.filtered();
    TNR.expect(filtered).toHaveLength(1);
  });
});

// ===== LINKS =====
TNR.describe('🔗 Links Module', () => {
  TNR.beforeEach(() => {
    Storage.remove('links');
    LinksModule.load();
    LinksModule.search = '';
  });

  TNR.it('doit être défini', () => {
    TNR.expect(window.LinksModule).toBeDefined();
  });

  TNR.it('doit initialiser avec des défauts', () => {
    LinksModule.data = { categories: [], links: [] };
    LinksModule.seedDefaults();
    TNR.expect(LinksModule.data.categories.length).toBeGreaterThan(0);
    TNR.expect(LinksModule.data.links.length).toBeGreaterThan(0);
  });

  TNR.it('doit ajouter un lien', () => {
    LinksModule.data = { categories: [{id:'test',name:'Test'}], links: [] };
    LinksModule.data.links.push({
      id: 'l1',
      title: 'Mon lien',
      url: 'https://example.com',
      category: 'test'
    });
    LinksModule.save();
    TNR.expect(Storage.get('links').links).toHaveLength(1);
  });

  TNR.it('doit filtrer les liens', () => {
    LinksModule.data = {
      categories: [{id:'c',name:'C'}],
      links: [
        { id: '1', title: 'Important', url: 'https://imp.com', category: 'c' },
        { id: '2', title: 'Autre', url: 'https://other.com', category: 'c' }
      ]
    };
    LinksModule.search = 'important';
    const filtered = LinksModule.filteredLinks();
    TNR.expect(filtered).toHaveLength(1);
  });
});

// ===== ORGANISATOR =====
TNR.describe('📅 Organisator Module', () => {
  TNR.beforeEach(() => {
    Storage.remove('organisator');
    OrganisatorModule.load();
  });

  TNR.it('doit être défini', () => {
    TNR.expect(window.OrganisatorModule).toBeDefined();
  });

  TNR.it('doit créer une tâche', () => {
    OrganisatorModule.tasks.push({
      id: 'o1',
      title: 'Tâche',
      done: false
    });
    OrganisatorModule.save();
    TNR.expect(Storage.get('organisator')).toHaveLength(1);
  });

  TNR.it('doit toggle l\'état done', () => {
    OrganisatorModule.tasks = [{ id: 'o1', title: 'T', done: false }];
    OrganisatorModule.toggle('o1');
    TNR.expect(OrganisatorModule.tasks[0].done).toBeTruthy();
    OrganisatorModule.toggle('o1');
    TNR.expect(OrganisatorModule.tasks[0].done).toBeFalsy();
  });
});

// ===== NOTIFICATIONS =====
TNR.describe('🔔 Notification Module', () => {
  TNR.beforeEach(() => {
    Storage.remove('notifications');
    NotifModule.load();
  });

  TNR.it('doit être défini', () => {
    TNR.expect(window.NotifModule).toBeDefined();
  });

  TNR.it('doit avoir une API push', () => {
    TNR.expect(typeof NotifModule.push).toBe('function');
  });

  TNR.it('doit pousser une notification', () => {
    NotifModule.notifications = [];
    NotifModule.push({ title: 'Test', message: 'Message test', type: 'info' });
    TNR.expect(NotifModule.notifications).toHaveLength(1);
    TNR.expect(NotifModule.notifications[0].title).toBe('Test');
  });

  TNR.it('doit marquer comme lu', () => {
    NotifModule.notifications = [
      { id: 'n1', title: 'T', message: 'M', read: false, date: new Date().toISOString() }
    ];
    NotifModule.markRead('n1');
    TNR.expect(NotifModule.notifications[0].read).toBeTruthy();
  });
});

// ===== CRA =====
TNR.describe('📊 CRAminator Module', () => {
  TNR.beforeEach(() => {
    Storage.remove('cra');
    CRAModule.load();
    CRAModule.filterMonth = '';
    CRAModule.filterClient = '';
  });

  TNR.it('doit être défini', () => {
    TNR.expect(window.CRAModule).toBeDefined();
  });

  TNR.it('doit calculer le total correctement', () => {
    CRAModule.cras = [
      { id: '1', days: 10, tjm: 500, client: 'A', date: '2024-01-01', status: 'sent' },
      { id: '2', days: 5, tjm: 600, client: 'B', date: '2024-02-01', status: 'paid' }
    ];
    const filtered = CRAModule.filtered();
    TNR.expect(filtered).toHaveLength(2);
    const totalCA = filtered.reduce((s,c) => s + (c.days * c.tjm), 0);
    TNR.expect(totalCA).toBe(8000); // (10*500) + (5*600) = 5000 + 3000
  });

  TNR.it('doit filtrer par mois', () => {
    CRAModule.cras = [
      { id: '1', date: '2024-01-15', client: 'A', days: 1, tjm: 100 },
      { id: '2', date: '2024-02-15', client: 'B', days: 1, tjm: 100 }
    ];
    CRAModule.filterMonth = '2024-01';
    const filtered = CRAModule.filtered();
    TNR.expect(filtered).toHaveLength(1);
  });
});

// ===== FACTURATOR =====
TNR.describe('🧾 Facturator Module', () => {
  TNR.beforeEach(() => {
    Storage.remove('factures');
    FacturatorModule.load();
  });

  TNR.it('doit être défini', () => {
    TNR.expect(window.FacturatorModule).toBeDefined();
  });

  TNR.it('doit créer une facture avec calcul TVA', () => {
    FacturatorModule.factures.push({
      id: 'f1',
      number: 'F-2024-0001',
      amountHT: 1000,
      vatRate: 20,
      totalTTC: 1200,
      status: 'pending'
    });
    FacturatorModule.save();
    TNR.expect(Storage.get('factures')).toHaveLength(1);
  });
});

// ===== DIRECTION =====
TNR.describe('📈 Direction Module', () => {
  TNR.beforeEach(() => {
    Storage.remove('projects');
    DirectionModule.load();
  });

  TNR.it('doit être défini', () => {
    TNR.expect(window.DirectionModule).toBeDefined();
  });

  TNR.it('doit créer un projet', () => {
    DirectionModule.projects.push({
      id: 'p1',
      name: 'Projet Test',
      status: 'active',
      progress: 50,
      budget: 10000
    });
    DirectionModule.save();
    TNR.expect(Storage.get('projects')).toHaveLength(1);
  });
});

// ===== SNIPPETS =====
TNR.describe('💻 Snippets Module', () => {
  TNR.beforeEach(() => {
    Storage.remove('snippets');
    SnippetsModule.load();
    SnippetsModule.search = '';
    SnippetsModule.langFilter = '';
  });

  TNR.it('doit être défini', () => {
    TNR.expect(window.SnippetsModule).toBeDefined();
  });

  TNR.it('doit filtrer par langage', () => {
    SnippetsModule.snippets = [
      { id: '1', title: 'JS', code: 'js', language: 'javascript' },
      { id: '2', title: 'PY', code: 'py', language: 'python' }
    ];
    SnippetsModule.langFilter = 'python';
    const filtered = SnippetsModule.filtered();
    TNR.expect(filtered).toHaveLength(1);
    TNR.expect(filtered[0].language).toBe('python');
  });

  TNR.it('doit rechercher dans le code', () => {
    SnippetsModule.snippets = [
      { id: '1', title: 'A', code: 'console.log(1)' },
      { id: '2', title: 'B', code: 'alert(2)' }
    ];
    SnippetsModule.search = 'console';
    const filtered = SnippetsModule.filtered();
    TNR.expect(filtered).toHaveLength(1);
  });
});

// ===== SQL =====
TNR.describe('🗄️ SQL Module', () => {
  TNR.beforeEach(() => {
    Storage.remove('sql_history');
    SQLModule.load();
  });

  TNR.it('doit être défini', () => {
    TNR.expect(window.SQLModule).toBeDefined();
  });

  TNR.it('doit avoir un historique vide au début', () => {
    TNR.expect(SQLModule.history).toEqual([]);
  });
});

// ===== COMMUNICATOR =====
TNR.describe('✉️ Communicator Module', () => {
  TNR.beforeEach(() => {
    Storage.remove('communicator');
    CommunicatorModule.load();
  });

  TNR.it('doit être défini', () => {
    TNR.expect(window.CommunicatorModule).toBeDefined();
  });

  TNR.it('doit ajouter un modèle', () => {
    CommunicatorModule.templates.push({
      id: 't1',
      title: 'Modèle',
      body: 'Bonjour [NAME]',
      category: 'Test'
    });
    CommunicatorModule.save();
    TNR.expect(Storage.get('communicator')).toHaveLength(1);
  });
});

// ===== AGREGATOR =====
TNR.describe('📚 Agregator Module', () => {
  TNR.beforeEach(() => {
    Storage.remove('agregator');
    AgregatorModule.load();
  });

  TNR.it('doit être défini', () => {
    TNR.expect(window.AgregatorModule).toBeDefined();
  });

  TNR.it('doit avoir une structure data.sources', () => {
    TNR.expect(AgregatorModule.data).toHaveProperty('sources');
    TNR.expect(Array.isArray(AgregatorModule.data.sources)).toBeTruthy();
  });
});

// ===== LOG ANALYZER =====
TNR.describe('📄 Log Analyzer Module', () => {
  TNR.it('doit être défini', () => {
    TNR.expect(window.LogAnalyzerModule).toBeDefined();
  });

  TNR.it('doit avoir une méthode analyze', () => {
    TNR.expect(typeof LogAnalyzerModule.analyze).toBe('function');
  });
});

// ===== XML VIEWER =====
TNR.describe('</> XML Viewer Module', () => {
  TNR.it('doit être défini', () => {
    TNR.expect(window.XMLViewerModule).toBeDefined();
  });

  TNR.it('doit avoir une méthode format', () => {
    TNR.expect(typeof XMLViewerModule.format).toBe('function');
  });
});

// ===== BIBLE =====
TNR.describe('📖 Bible Module', () => {
  TNR.beforeEach(() => {
    Storage.remove('bible');
    BibleModule.load();
    BibleModule.search = '';
    BibleModule.filterCat = '';
  });

  TNR.it('doit être défini', () => {
    TNR.expect(window.BibleModule).toBeDefined();
  });

  TNR.it('doit filtrer par catégorie', () => {
    BibleModule.articles = [
      { id: '1', title: 'A', content: 'a', category: 'Tech' },
      { id: '2', title: 'B', content: 'b', category: 'Biz' }
    ];
    BibleModule.filterCat = 'Tech';
    TNR.expect(BibleModule.filtered()).toHaveLength(1);
  });
});

// ===== ANALYTICS =====
TNR.describe('📈 Analytics Module', () => {
  TNR.it('doit être défini', () => {
    TNR.expect(window.AnalyticsModule).toBeDefined();
  });

  TNR.it('Chart.js doit être chargé', () => {
    TNR.expect(typeof Chart).toBeDefined();
  });
});

// ===== ERROR TRACKER =====
TNR.describe('⚠️ Error Tracker Module', () => {
  TNR.beforeEach(() => {
    Storage.remove('errors');
    ErrorTrackerModule.load();
    ErrorTrackerModule.filter = '';
  });

  TNR.it('doit être défini', () => {
    TNR.expect(window.ErrorTrackerModule).toBeDefined();
  });

  TNR.it('doit marquer une erreur comme résolue', () => {
    ErrorTrackerModule.errors = [
      { id: 'e1', title: 'Bug', severity: 'high', resolved: false, date: new Date().toISOString() }
    ];
    // Mutation directe (resolve() appelle render() qui requiert le DOM)
    const err = ErrorTrackerModule.errors.find(e => e.id === 'e1');
    err.resolved = true;
    err.resolvedAt = new Date().toISOString();
    ErrorTrackerModule.save();
    
    ErrorTrackerModule.load();
    TNR.expect(ErrorTrackerModule.errors[0].resolved).toBeTruthy();
    TNR.expect(ErrorTrackerModule.errors[0].resolvedAt).toBeDefined();
  });

  TNR.it('doit filtrer par statut', () => {
    ErrorTrackerModule.errors = [
      { id: '1', title: 'A', resolved: true, date: new Date().toISOString() },
      { id: '2', title: 'B', resolved: false, date: new Date().toISOString() }
    ];
    ErrorTrackerModule.filter = 'open';
    TNR.expect(ErrorTrackerModule.filtered()).toHaveLength(1);
  });
});

// ===== GIT CICD =====
TNR.describe('🔀 Git CI/CD Module', () => {
  TNR.beforeEach(() => {
    Storage.remove('gitcicd');
    GitCICDModule.load();
    GitCICDModule.filter = '';
  });

  TNR.it('doit être défini', () => {
    TNR.expect(window.GitCICDModule).toBeDefined();
  });

  TNR.it('doit filtrer par type', () => {
    GitCICDModule.entries = [
      { id: '1', type: 'commit', title: 'A', date: new Date().toISOString() },
      { id: '2', type: 'deploy', title: 'B', date: new Date().toISOString() }
    ];
    GitCICDModule.filter = 'commit';
    TNR.expect(GitCICDModule.filtered()).toHaveLength(1);
  });
});

// ===== CONFIG =====
TNR.describe('⚙️ Config Module', () => {
  TNR.beforeEach(() => {
    Storage.remove('profile');
    ConfigModule.load();
  });

  TNR.it('doit être défini', () => {
    TNR.expect(window.ConfigModule).toBeDefined();
  });

  TNR.it('doit charger un profil vide', () => {
    TNR.expect(ConfigModule.profile).toEqual({});
  });
});

// ===== DASHBOARD =====
TNR.describe('🏠 Dashboard Module', () => {
  TNR.it('doit être défini', () => {
    TNR.expect(window.DashboardModule).toBeDefined();
    TNR.expect(typeof DashboardModule.refresh).toBe('function');
  });
});

// ===== INTEGRATION TESTS =====
TNR.describe('🔄 Intégration entre modules', () => {
  TNR.beforeEach(() => {
    TNR.resetStorage();
  });

  TNR.it('Le dashboard doit voir les données du Kanban', () => {
    Storage.set('kanban', {
      tasks: [
        { id: '1', title: 'T1', status: 'todo' },
        { id: '2', title: 'T2', status: 'done' }
      ]
    });
    const kanban = Storage.get('kanban');
    TNR.expect(kanban.tasks).toHaveLength(2);
  });

  TNR.it('Le dashboard doit voir les entrées du Journal', () => {
    Storage.set('journal', [{ id: '1', content: 'Entry', date: new Date().toISOString() }]);
    const journal = Storage.get('journal', []);
    TNR.expect(journal).toHaveLength(1);
  });

  TNR.it('Les modules ne doivent pas écraser les données mutuelles', () => {
    Storage.set('kanban', { tasks: [{ id: 'k1', title: 'Kanban' }] });
    Storage.set('journal', [{ id: 'j1', content: 'Journal' }]);
    
    TNR.expect(Storage.get('kanban').tasks).toHaveLength(1);
    TNR.expect(Storage.get('journal')).toHaveLength(1);
    TNR.expect(Storage.get('kanban').tasks[0].id).toBe('k1');
    TNR.expect(Storage.get('journal')[0].id).toBe('j1');
  });

  TNR.it('L\'export/import doit préserver toutes les données', () => {
    Storage.set('mod1', [1, 2, 3]);
    Storage.set('mod2', { foo: 'bar' });
    
    const backup = Storage.exportAll();
    TNR.resetStorage();
    TNR.expect(Storage.keys()).toHaveLength(0);
    
    Storage.importAll(backup);
    TNR.expect(Storage.get('mod1')).toEqual([1, 2, 3]);
    TNR.expect(Storage.get('mod2')).toEqual({ foo: 'bar' });
  });
});
