/**
 * UI.JS - Composants UI réutilisables (Toast, Modal, etc.)
 */

// ===== TOAST =====
const Toast = {
  container: null,

  _ensure() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
  },

  show(message, type = 'info', duration = 3000) {
    this._ensure();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = { info: 'ℹ', success: '✓', error: '✕', warn: '⚠' };
    toast.innerHTML = `
      <span style="font-size:16px;">${icons[type] || 'ℹ'}</span>
      <span style="flex:1;">${this._escape(message)}</span>
      <button style="background:none;border:none;color:var(--ink-muted);cursor:pointer;font-size:14px;" onclick="this.parentElement.remove()">✕</button>
    `;
    
    this.container.appendChild(toast);
    
    if (duration > 0) {
      setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
      }, duration);
    }
  },

  success(msg, duration) { this.show(msg, 'success', duration); },
  error(msg, duration) { this.show(msg, 'error', duration); },
  warn(msg, duration) { this.show(msg, 'warn', duration); },
  info(msg, duration) { this.show(msg, 'info', duration); },

  _escape(str) {
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
  }
};

// ===== MODAL =====
const Modal = {
  current: null,

  show(options) {
    this.close();

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3 style="font-size:16px;font-weight:600;">${this._escape(options.title || 'Modal')}</h3>
          <button class="btn-ghost btn btn-sm" id="modal-close-btn">✕</button>
        </div>
        <div class="modal-body" id="modal-body">${options.body || ''}</div>
        ${options.footer !== false ? `
        <div class="modal-footer">
          ${options.cancelText !== false ? `<button class="btn btn-outline" id="modal-cancel">${options.cancelText || 'Annuler'}</button>` : ''}
          ${options.okText !== false ? `<button class="btn btn-primary" id="modal-ok">${options.okText || 'OK'}</button>` : ''}
        </div>
        ` : ''}
      </div>
    `;

    document.body.appendChild(overlay);
    this.current = overlay;

    // Events
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.close();
    });

    overlay.querySelector('#modal-close-btn')?.addEventListener('click', () => this.close());
    overlay.querySelector('#modal-cancel')?.addEventListener('click', () => {
      if (options.onCancel) options.onCancel();
      this.close();
    });
    overlay.querySelector('#modal-ok')?.addEventListener('click', () => {
      if (options.onOk) {
        const result = options.onOk();
        if (result !== false) this.close();
      } else {
        this.close();
      }
    });
  },

  close() {
    if (this.current) {
      this.current.remove();
      this.current = null;
    }
  },

  confirm(message, onConfirm) {
    this.show({
      title: 'Confirmation',
      body: `<p style="font-size:14px;">${this._escape(message)}</p>`,
      okText: 'Confirmer',
      onOk: onConfirm
    });
  },

  prompt(message, defaultValue, onSubmit) {
    this.show({
      title: 'Saisie',
      body: `
        <p style="font-size:14px;margin-bottom:12px;">${this._escape(message)}</p>
        <input class="input" id="modal-prompt-input" value="${this._escape(defaultValue || '')}" autofocus>
      `,
      onOk: () => {
        const value = document.getElementById('modal-prompt-input').value;
        onSubmit(value);
      }
    });
    setTimeout(() => document.getElementById('modal-prompt-input')?.focus(), 100);
  },

  _escape(str) {
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
  }
};

// ===== UTILITAIRES =====
const Utils = {
  /**
   * Échapper du HTML
   */
  escape(str) {
    const div = document.createElement('div');
    div.textContent = String(str ?? '');
    return div.innerHTML;
  },

  /**
   * Format date
   */
  formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR');
  },

  formatDateTime(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleString('fr-FR', { 
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  },

  /**
   * ID unique
   */
  id() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  },

  /**
   * Debounce
   */
  debounce(fn, delay = 300) {
    let timer;
    return function(...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  },

  /**
   * Télécharger un fichier
   */
  download(content, filename, mimeType = 'application/json') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  /**
   * Importer un fichier
   */
  importFile(accept = '.json') {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = accept;
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return reject('Aucun fichier');
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsText(file);
      };
      input.click();
    });
  },

  /**
   * Truncate
   */
  truncate(str, n = 50) {
    if (!str) return '';
    return str.length > n ? str.substring(0, n) + '…' : str;
  }
};

window.Toast = Toast;
window.Modal = Modal;
window.Utils = Utils;
