/**
 * XML VIEWER MODULE
 */
const XMLViewerModule = {
  KEY: 'xmlviewer',

  async init() {
    this.load();
    document.getElementById('xml-format')?.addEventListener('click', () => this.format());
    document.getElementById('xml-import')?.addEventListener('click', () => this.import());
    document.getElementById('xml-copy')?.addEventListener('click', () => this.copy());
  },

  load() {
    const saved = Storage.get(this.KEY, {});
    const input = document.getElementById('xml-input');
    if (input && saved.xml) {
      input.value = saved.xml;
      setTimeout(() => this.format(), 100);
    }
  },

  save() {
    Storage.set(this.KEY, { xml: document.getElementById('xml-input')?.value || '' });
  },

  format() {
    const input = document.getElementById('xml-input').value.trim();
    if (!input) { Toast.error('Entrez du XML'); return; }

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(input, 'text/xml');
      const err = doc.querySelector('parsererror');
      if (err) throw new Error('XML invalide: ' + err.textContent.substring(0, 100));

      const tree = document.getElementById('xml-tree');
      tree.innerHTML = this.renderNode(doc.documentElement, 0);
      
      this.save();
      Toast.success('XML formaté');
    } catch (e) {
      Toast.error('Erreur: ' + e.message);
      document.getElementById('xml-tree').innerHTML = `<div style="color:var(--danger);">${Utils.escape(e.message)}</div>`;
    }
  },

  renderNode(node, depth) {
    const indent = '  '.repeat(depth);
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent.trim();
      return text ? `<div class="xml-node">${indent}<span class="xml-text">${Utils.escape(text)}</span></div>` : '';
    }
    if (node.nodeType === Node.COMMENT_NODE) {
      return `<div class="xml-node xml-comment">${indent}&lt;!-- ${Utils.escape(node.textContent)} --&gt;</div>`;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return '';

    let attrs = '';
    if (node.attributes && node.attributes.length) {
      attrs = Array.from(node.attributes).map(a => 
        ` <span class="xml-attr">${Utils.escape(a.name)}</span>="<span class="xml-text">${Utils.escape(a.value)}</span>"`
      ).join('');
    }

    const hasChildren = node.childNodes.length > 0;
    if (!hasChildren) {
      return `<div class="xml-node">${indent}&lt;<span class="xml-tag">${node.tagName}</span>${attrs}/&gt;</div>`;
    }

    let result = `<div class="xml-node">${indent}&lt;<span class="xml-tag">${node.tagName}</span>${attrs}&gt;</div>`;
    Array.from(node.childNodes).forEach(child => {
      result += this.renderNode(child, depth + 1);
    });
    result += `<div class="xml-node">${indent}&lt;/<span class="xml-tag">${node.tagName}</span>&gt;</div>`;
    return result;
  },

  async import() {
    try {
      const content = await Utils.importFile('.xml,.txt');
      document.getElementById('xml-input').value = content;
      this.format();
    } catch (e) { Toast.error('Erreur import'); }
  },

  copy() {
    const input = document.getElementById('xml-input').value;
    if (!input) { Toast.warn('Aucun XML'); return; }
    navigator.clipboard.writeText(input)
      .then(() => Toast.success('Copié'))
      .catch(() => Toast.error('Erreur copie'));
  }
};

window.XMLViewerModule = XMLViewerModule;
