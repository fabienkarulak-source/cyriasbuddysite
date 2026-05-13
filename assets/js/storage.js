/**
 * STORAGE.JS - Système de persistance centralisé
 * Chaque module a son propre espace de stockage isolé
 */

const Storage = {
  PREFIX: 'cyrias_',
  
  // Cache en mémoire pour performance
  _cache: new Map(),
  
  // Listeners pour réactivité
  _listeners: new Map(),

  /**
   * Récupère les données d'un module
   */
  get(key, defaultValue = null) {
    const fullKey = this.PREFIX + key;
    
    // Vérifier le cache
    if (this._cache.has(fullKey)) {
      return this._cache.get(fullKey);
    }
    
    try {
      const raw = localStorage.getItem(fullKey);
      if (raw === null) {
        return defaultValue;
      }
      const data = JSON.parse(raw);
      this._cache.set(fullKey, data);
      return data;
    } catch (e) {
      console.error(`[Storage] Read error ${key}:`, e);
      return defaultValue;
    }
  },

  /**
   * Sauvegarde les données d'un module
   */
  set(key, value) {
    const fullKey = this.PREFIX + key;
    try {
      localStorage.setItem(fullKey, JSON.stringify(value));
      this._cache.set(fullKey, value);
      this._notify(key, value);
      return true;
    } catch (e) {
      console.error(`[Storage] Write error ${key}:`, e);
      if (e.name === 'QuotaExceededError') {
        Toast.error('Espace de stockage plein!');
      }
      return false;
    }
  },

  /**
   * Supprime une clé
   */
  remove(key) {
    const fullKey = this.PREFIX + key;
    localStorage.removeItem(fullKey);
    this._cache.delete(fullKey);
    this._notify(key, null);
  },

  /**
   * S'abonner aux changements d'un module
   */
  watch(key, callback) {
    if (!this._listeners.has(key)) {
      this._listeners.set(key, new Set());
    }
    this._listeners.get(key).add(callback);
    
    // Retourner fonction de désabonnement
    return () => {
      this._listeners.get(key)?.delete(callback);
    };
  },

  _notify(key, value) {
    this._listeners.get(key)?.forEach(cb => {
      try { cb(value); } catch (e) { console.error(e); }
    });
  },

  /**
   * Liste toutes les clés du module
   */
  keys() {
    return Object.keys(localStorage)
      .filter(k => k.startsWith(this.PREFIX))
      .map(k => k.substring(this.PREFIX.length));
  },

  /**
   * Exporte toutes les données
   */
  exportAll() {
    const data = {};
    this.keys().forEach(key => {
      data[key] = this.get(key);
    });
    return {
      version: '1.0',
      timestamp: new Date().toISOString(),
      data
    };
  },

  /**
   * Importe des données
   */
  importAll(backup) {
    try {
      if (!backup.data) throw new Error('Format invalide');
      Object.entries(backup.data).forEach(([key, value]) => {
        this.set(key, value);
      });
      return true;
    } catch (e) {
      console.error('[Storage] Import error:', e);
      return false;
    }
  },

  /**
   * Nettoie toutes les données Cyrias
   */
  clearAll() {
    this.keys().forEach(key => this.remove(key));
    this._cache.clear();
  },

  /**
   * Statistiques de stockage
   */
  getStats() {
    let total = 0;
    const modules = {};
    
    this.keys().forEach(key => {
      const data = localStorage.getItem(this.PREFIX + key);
      const size = new Blob([data || '']).size;
      modules[key] = {
        size: this._formatSize(size),
        items: Array.isArray(this.get(key)) ? this.get(key).length : 0
      };
      total += size;
    });

    return {
      total: this._formatSize(total),
      totalBytes: total,
      modules,
      moduleCount: Object.keys(modules).length
    };
  },

  _formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  }
};

window.Storage = Storage;
