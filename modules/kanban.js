/**
 * KANBAN MODULE - Gestion complète des tâches
 */
const KanbanModule = {
  KEY: 'kanban',
  
  columns: [
    { id: 'todo', title: 'À faire', icon: '📋' },
    { id: 'in-progress', title: 'En cours', icon: '⏳' },
    { id: 'review', title: 'En revue', icon: '👀' },
    { id: 'done', title: 'Terminé', icon: '✅' }
  ],

  data: { tasks: [] },
  filters: { search: '', priority: '', assignee: '' },

  async init() {
    this.load();
    this.renderBoard();
    this.updateStats();
    this.setupEvents();
    this.updateAssigneeFilter();
  },

  load() {
    this.data = Storage.get(this.KEY, { tasks: [] });
    if (!Array.isArray(this.data.tasks)) this.data.tasks = [];
  },

  save() {
    Storage.set(this.KEY, this.data);
  },

  setupEvents() {
    document.getElementById('kanban-new-task')?.addEventListener('click', () => this.newTask());
    document.getElementById('kanban-export')?.addEventListener('click', () => this.export());
    document.getElementById('kanban-import')?.addEventListener('click', () => this.import());
    
    const search = document.getElementById('kb-search');
    if (search) {
      search.addEventListener('input', Utils.debounce((e) => {
        this.filters.search = e.target.value.toLowerCase();
        this.renderBoard();
      }, 200));
    }

    document.getElementById('kb-filter-priority')?.addEventListener('change', (e) => {
      this.filters.priority = e.target.value;
      this.renderBoard();
    });

    document.getElementById('kb-filter-assignee')?.addEventListener('change', (e) => {
      this.filters.assignee = e.target.value;
      this.renderBoard();
    });
  },

  filteredTasks() {
    return this.data.tasks.filter(t => {
      if (this.filters.search && 
          !(t.title?.toLowerCase().includes(this.filters.search) || 
            t.description?.toLowerCase().includes(this.filters.search))) {
        return false;
      }
      if (this.filters.priority && t.priority !== this.filters.priority) return false;
      if (this.filters.assignee && t.assignee !== this.filters.assignee) return false;
      return true;
    });
  },

  renderBoard() {
    const board = document.getElementById('kanban-board');
    if (!board) return;

    const tasks = this.filteredTasks();
    
    board.innerHTML = this.columns.map(col => {
      const colTasks = tasks.filter(t => (t.status || 'todo') === col.id);
      return `
        <div class="kanban-col" data-column="${col.id}">
          <div class="kanban-col-header">
            <div class="kanban-col-title">${col.icon} ${col.title}</div>
            <span class="kanban-col-count">${colTasks.length}</span>
          </div>
          <div class="kanban-col-body" data-column="${col.id}">
            ${colTasks.map(t => this.renderCard(t)).join('')}
          </div>
          <button class="btn btn-ghost btn-sm" onclick="KanbanModule.newTask('${col.id}')" style="margin-top:auto;">+ Ajouter</button>
        </div>
      `;
    }).join('');

    this.setupDragDrop();
  },

  renderCard(task) {
    return `
      <div class="kanban-card" draggable="true" data-task-id="${task.id}" onclick="KanbanModule.editTask('${task.id}')">
        <div class="kanban-card-title">${Utils.escape(task.title)}</div>
        ${task.description ? `<div class="text-xs text-muted" style="margin-bottom:6px;line-height:1.4;">${Utils.truncate(Utils.escape(task.description), 60)}</div>` : ''}
        <div class="kanban-card-meta">
          <div style="display:flex;gap:6px;align-items:center;">
            ${task.priority ? `<span class="kanban-card-priority priority-${task.priority}" title="${task.priority}"></span>` : ''}
            ${task.assignee ? `<span title="Assigné à ${Utils.escape(task.assignee)}">👤 ${Utils.escape(task.assignee.substring(0, 8))}</span>` : ''}
          </div>
          ${task.dueDate ? `<span>${Utils.formatDate(task.dueDate)}</span>` : ''}
        </div>
      </div>
    `;
  },

  setupDragDrop() {
    document.querySelectorAll('.kanban-card').forEach(card => {
      card.addEventListener('dragstart', (e) => {
        card.classList.add('dragging');
        e.dataTransfer.setData('taskId', card.dataset.taskId);
      });
      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
      });
    });

    document.querySelectorAll('.kanban-col').forEach(col => {
      col.addEventListener('dragover', (e) => {
        e.preventDefault();
        col.classList.add('drag-over');
      });
      col.addEventListener('dragleave', () => {
        col.classList.remove('drag-over');
      });
      col.addEventListener('drop', (e) => {
        e.preventDefault();
        col.classList.remove('drag-over');
        const taskId = e.dataTransfer.getData('taskId');
        const newStatus = col.dataset.column;
        this.moveTask(taskId, newStatus);
      });
    });
  },

  moveTask(taskId, newStatus) {
    const task = this.data.tasks.find(t => t.id === taskId);
    if (!task || task.status === newStatus) return;
    
    task.status = newStatus;
    task.updatedAt = new Date().toISOString();
    this.save();
    this.renderBoard();
    this.updateStats();
    
    Toast.success(`Déplacé vers "${this.columns.find(c => c.id === newStatus)?.title}"`);
  },

  newTask(defaultStatus = 'todo') {
    this.showTaskModal(null, defaultStatus);
  },

  editTask(taskId) {
    const task = this.data.tasks.find(t => t.id === taskId);
    if (task) this.showTaskModal(task);
  },

  showTaskModal(task = null, defaultStatus = 'todo') {
    const isEdit = !!task;
    Modal.show({
      title: isEdit ? '✏️ Modifier la tâche' : '➕ Nouvelle tâche',
      body: `
        <div class="form-group">
          <label class="label">Titre *</label>
          <input class="input" id="task-title" value="${Utils.escape(task?.title || '')}" placeholder="Titre de la tâche" required>
        </div>
        <div class="form-group">
          <label class="label">Description</label>
          <textarea class="textarea" id="task-desc" placeholder="Description...">${Utils.escape(task?.description || '')}</textarea>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div class="form-group">
            <label class="label">Statut</label>
            <select class="select" id="task-status">
              ${this.columns.map(c => `<option value="${c.id}" ${(task?.status || defaultStatus) === c.id ? 'selected' : ''}>${c.icon} ${c.title}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="label">Priorité</label>
            <select class="select" id="task-priority">
              <option value="">—</option>
              <option value="low" ${task?.priority === 'low' ? 'selected' : ''}>🟢 Basse</option>
              <option value="medium" ${task?.priority === 'medium' ? 'selected' : ''}>🟡 Moyenne</option>
              <option value="high" ${task?.priority === 'high' ? 'selected' : ''}>🔴 Haute</option>
            </select>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div class="form-group">
            <label class="label">Assigné à</label>
            <input class="input" id="task-assignee" value="${Utils.escape(task?.assignee || '')}" placeholder="Nom">
          </div>
          <div class="form-group">
            <label class="label">Échéance</label>
            <input class="input" id="task-due" type="date" value="${task?.dueDate || ''}">
          </div>
        </div>
        ${isEdit ? `<button class="btn btn-danger btn-sm" id="task-delete-btn">🗑 Supprimer</button>` : ''}
      `,
      okText: isEdit ? 'Mettre à jour' : 'Créer',
      onOk: () => {
        const title = document.getElementById('task-title').value.trim();
        if (!title) {
          Toast.error('Titre requis');
          return false;
        }
        
        const newTask = {
          id: task?.id || Utils.id(),
          title,
          description: document.getElementById('task-desc').value.trim(),
          status: document.getElementById('task-status').value,
          priority: document.getElementById('task-priority').value,
          assignee: document.getElementById('task-assignee').value.trim(),
          dueDate: document.getElementById('task-due').value,
          createdAt: task?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        if (isEdit) {
          const idx = this.data.tasks.findIndex(t => t.id === task.id);
          this.data.tasks[idx] = newTask;
          Toast.success('Tâche mise à jour');
        } else {
          this.data.tasks.push(newTask);
          Toast.success('Tâche créée');
        }
        
        this.save();
        this.renderBoard();
        this.updateStats();
        this.updateAssigneeFilter();
      }
    });

    // Setup delete button
    setTimeout(() => {
      document.getElementById('task-delete-btn')?.addEventListener('click', () => {
        Modal.close();
        Modal.confirm('Supprimer cette tâche ?', () => {
          this.deleteTask(task.id);
        });
      });
    }, 100);
  },

  deleteTask(taskId) {
    this.data.tasks = this.data.tasks.filter(t => t.id !== taskId);
    this.save();
    this.renderBoard();
    this.updateStats();
    Toast.success('Tâche supprimée');
  },

  updateStats() {
    const tasks = this.data.tasks;
    document.getElementById('kb-total').textContent = tasks.length;
    document.getElementById('kb-todo').textContent = tasks.filter(t => (t.status || 'todo') === 'todo').length;
    document.getElementById('kb-doing').textContent = tasks.filter(t => t.status === 'in-progress').length;
    document.getElementById('kb-done').textContent = tasks.filter(t => t.status === 'done').length;
  },

  updateAssigneeFilter() {
    const select = document.getElementById('kb-filter-assignee');
    if (!select) return;
    
    const assignees = [...new Set(this.data.tasks.map(t => t.assignee).filter(Boolean))];
    const currentValue = select.value;
    select.innerHTML = '<option value="">Tous assignés</option>' + 
      assignees.map(a => `<option value="${Utils.escape(a)}">${Utils.escape(a)}</option>`).join('');
    select.value = currentValue;
  },

  export() {
    const filename = `kanban_${new Date().toISOString().split('T')[0]}.json`;
    Utils.download(JSON.stringify(this.data, null, 2), filename);
    Toast.success('Kanban exporté');
  },

  async import() {
    try {
      const content = await Utils.importFile('.json');
      const imported = JSON.parse(content);
      if (!imported.tasks || !Array.isArray(imported.tasks)) {
        throw new Error('Format invalide');
      }
      Modal.confirm(`Importer ${imported.tasks.length} tâches ?`, () => {
        this.data = imported;
        this.save();
        this.renderBoard();
        this.updateStats();
        Toast.success('Kanban importé');
      });
    } catch (e) {
      Toast.error('Erreur: ' + e.message);
    }
  }
};

window.KanbanModule = KanbanModule;
