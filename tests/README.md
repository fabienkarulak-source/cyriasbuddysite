# 🧪 Tests de Non-Régression (TNR) — Cyrias Buddy

Suite de tests complète pour valider le bon fonctionnement du portail après chaque modification.

## 📂 Structure

```
tests/
├── index.html              # Page principale - Tests automatiques
├── checklist.html          # Checklist manuelle interactive
├── tnr-framework.js        # Mini framework de test (describe/it/expect)
├── tests-core.js           # Tests du framework core (~30 tests)
└── tests-modules.js        # Tests des 20 modules métier (~50 tests)
```

## 🚀 Utilisation

### Lancer les tests automatiques

1. Ouvrir `tests/index.html` dans le navigateur
2. Cliquer sur **"▶️ Lancer tous les tests"**
3. Observer les résultats en temps réel

Les tests couvrent :
- **Storage API** : get, set, remove, watch, exportAll, importAll, getStats
- **Utils** : escape, id, formatDate, truncate, debounce
- **Toast** : affichage, 4 niveaux (success/error/warn/info)
- **Modal** : show, close, confirm
- **Router** : enregistrement des 20 routes
- **Chaque module** : présence globale, méthodes principales, filtres, CRUD
- **Intégration** : isolation des données, export/import complet

### Utiliser la checklist manuelle

1. Ouvrir `tests/checklist.html`
2. Cliquer sur chaque item pour cycler entre : ⏸ → ✅ → ❌ → ⏸
3. Le progrès est sauvegardé automatiquement dans localStorage
4. Exporter un rapport HTML via "📥 Exporter rapport"

La checklist couvre **~150 points de contrôle** répartis sur 24 sections :
- Navigation, fonctions globales, persistance, responsive
- Chaque module (Dashboard, Kanban, Journal, etc.)

## 🧪 Mini-framework de test

Syntaxe similaire à Jest/Mocha :

```javascript
TNR.describe('Mon module', () => {
  TNR.beforeEach(() => {
    // Setup avant chaque test
  });

  TNR.it('doit faire X', () => {
    TNR.expect(value).toBe(42);
    TNR.expect(array).toHaveLength(3);
    TNR.expect(obj).toHaveProperty('foo');
    TNR.expect(() => bad()).toThrow();
  });
});

// Lancer
TNR.run((test, suite, stats) => {
  console.log(`${test.name}: ${test.status}`);
});
```

### Assertions disponibles

- `toBe(expected)` — Égalité stricte
- `toEqual(expected)` — Égalité profonde (JSON)
- `toBeTruthy()` / `toBeFalsy()`
- `toBeDefined()` / `toBeNull()`
- `toContain(item)`
- `toHaveLength(n)`
- `toBeGreaterThan(n)`
- `toBeInstanceOf(Class)`
- `toThrow()`
- `toHaveProperty(prop)`

## 📊 Couverture

| Module | Tests auto | Items checklist |
|--------|-----------|----------------|
| Storage / Utils / UI / Router | 30+ | 5 |
| Dashboard | 1 | 6 |
| Kanban | 7 | 12 |
| Journal | 3 | 8 |
| Links | 4 | 7 |
| Organisator | 3 | 5 |
| Notifications | 4 | 5 |
| Communicator | 2 | 5 |
| Direction | 2 | 5 |
| CRAminator | 3 | 7 |
| Facturator | 2 | 5 |
| Agregator | 2 | 4 |
| Snippets | 3 | 7 |
| SQL | 2 | 6 |
| Log Analyzer | 2 | 5 |
| XML Viewer | 2 | 5 |
| Bible | 3 | 5 |
| Analytics | 2 | 5 |
| Error Tracker | 3 | 6 |
| Git CI/CD | 2 | 5 |
| Config | 2 | 6 |
| **Intégration** | 4 | — |
| **Total** | **~85 tests auto** | **~150 items** |

## 🔄 Workflow recommandé

Après une modification :

1. **Tests auto** → `tests/index.html` → "▶️ Lancer"
   - Si tout est ✅, OK
   - Si des ❌, corriger avant tout déploiement

2. **Tests manuels** → `tests/checklist.html`
   - Valider visuellement les changements
   - Exporter un rapport si livraison

## 📥 Export de rapport

Les deux interfaces permettent d'exporter un rapport :
- **Auto** : JSON avec toutes les suites et tests
- **Manuel** : HTML stylisé prêt à archiver

## ⚠️ Notes importantes

- Les tests sont **non-destructifs** : ils utilisent un snapshot/restore du localStorage
- `TNR.resetStorage()` efface uniquement les clés `cyrias_*`
- La checklist manuelle est conservée dans `cyrias_tnr_checklist`
- Tous les tests s'exécutent dans le navigateur, pas de serveur requis
