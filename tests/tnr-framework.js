/**
 * TNR FRAMEWORK - Tests de Non-Régression
 * Mini framework de test sans dépendances
 */

const TNR = {
  suites: [],
  results: [],
  currentSuite: null,

  /**
   * Définir une suite de tests
   */
  describe(name, fn) {
    const suite = {
      name,
      tests: [],
      beforeEach: null,
      afterEach: null
    };
    this.suites.push(suite);
    this.currentSuite = suite;
    fn();
    this.currentSuite = null;
  },

  /**
   * Définir un test
   */
  it(name, fn) {
    if (!this.currentSuite) throw new Error('it() doit être appelé dans describe()');
    this.currentSuite.tests.push({ name, fn });
  },

  /**
   * Hook avant chaque test
   */
  beforeEach(fn) {
    if (this.currentSuite) this.currentSuite.beforeEach = fn;
  },

  /**
   * Hook après chaque test
   */
  afterEach(fn) {
    if (this.currentSuite) this.currentSuite.afterEach = fn;
  },

  /**
   * Assertions
   */
  expect(actual) {
    return {
      toBe(expected) {
        if (actual !== expected) {
          throw new Error(`Expected ${JSON.stringify(actual)} to be ${JSON.stringify(expected)}`);
        }
      },
      toEqual(expected) {
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
          throw new Error(`Expected ${JSON.stringify(actual)} to equal ${JSON.stringify(expected)}`);
        }
      },
      toBeTruthy() {
        if (!actual) throw new Error(`Expected ${JSON.stringify(actual)} to be truthy`);
      },
      toBeFalsy() {
        if (actual) throw new Error(`Expected ${JSON.stringify(actual)} to be falsy`);
      },
      toBeDefined() {
        if (actual === undefined) throw new Error(`Expected value to be defined`);
      },
      toBeNull() {
        if (actual !== null) throw new Error(`Expected ${JSON.stringify(actual)} to be null`);
      },
      toContain(item) {
        if (!actual || !actual.includes(item)) {
          throw new Error(`Expected ${JSON.stringify(actual)} to contain ${JSON.stringify(item)}`);
        }
      },
      toHaveLength(len) {
        if (!actual || actual.length !== len) {
          throw new Error(`Expected length ${len}, got ${actual?.length}`);
        }
      },
      toBeGreaterThan(val) {
        if (!(actual > val)) {
          throw new Error(`Expected ${actual} to be greater than ${val}`);
        }
      },
      toBeInstanceOf(cls) {
        if (!(actual instanceof cls)) {
          throw new Error(`Expected instance of ${cls.name}`);
        }
      },
      toThrow() {
        let threw = false;
        try { actual(); } catch (e) { threw = true; }
        if (!threw) throw new Error('Expected function to throw');
      },
      toHaveProperty(prop) {
        if (!actual || !(prop in actual)) {
          throw new Error(`Expected object to have property "${prop}"`);
        }
      }
    };
  },

  /**
   * Lancer tous les tests
   */
  async run(onProgress) {
    this.results = [];
    let total = 0;
    let passed = 0;
    let failed = 0;
    const startTime = Date.now();

    for (const suite of this.suites) {
      const suiteResult = {
        name: suite.name,
        tests: [],
        passed: 0,
        failed: 0
      };

      for (const test of suite.tests) {
        total++;
        const testStart = Date.now();
        let result = { name: test.name, status: 'pass', error: null, duration: 0 };

        try {
          if (suite.beforeEach) await suite.beforeEach();
          await test.fn();
          if (suite.afterEach) await suite.afterEach();
          passed++;
          suiteResult.passed++;
        } catch (e) {
          result.status = 'fail';
          result.error = e.message || String(e);
          failed++;
          suiteResult.failed++;
        }

        result.duration = Date.now() - testStart;
        suiteResult.tests.push(result);
        
        if (onProgress) onProgress(result, suiteResult, { total, passed, failed });
      }

      this.results.push(suiteResult);
    }

    return {
      suites: this.results,
      total,
      passed,
      failed,
      duration: Date.now() - startTime,
      success: failed === 0
    };
  },

  /**
   * Nettoyage - sauvegarder/restaurer le storage
   */
  _snapshot: null,
  
  saveSnapshot() {
    this._snapshot = {};
    Storage.keys().forEach(k => {
      this._snapshot[k] = Storage.get(k);
    });
  },

  restoreSnapshot() {
    if (!this._snapshot) return;
    Storage.keys().forEach(k => Storage.remove(k));
    Object.entries(this._snapshot).forEach(([k, v]) => Storage.set(k, v));
  },

  /**
   * Reset complet pour les tests
   */
  resetStorage() {
    Storage.keys().forEach(k => Storage.remove(k));
  }
};

window.TNR = TNR;
