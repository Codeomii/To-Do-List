/**
 * TASKSPACE 3D - Interactive 3D To-Do Application Logic
 * Vanilla JavaScript ES6+
 */

document.addEventListener('DOMContentLoaded', () => {

  // ------------------------------------------------------------------------
  // 1. STATE & STORAGE MANAGEMENT
  // ------------------------------------------------------------------------
  const STORAGE_KEY = 'taskspace_3d_tasks_data';
  
  // Initialize tasks array with default demo tasks if first time
  let tasks = loadFromStorage() || [
    {
      id: 'demo-1',
      text: 'Explore 3D depth and card hover tilt effects',
      priority: 'high',
      completed: false,
      createdAt: new Date().toISOString()
    },
    {
      id: 'demo-2',
      text: 'Complete daily goal targets & review progress bar',
      priority: 'medium',
      completed: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'demo-3',
      text: 'Customize theme accents and priority tags',
      priority: 'low',
      completed: false,
      createdAt: new Date().toISOString()
    }
  ];

  let currentFilter = 'all';
  let searchQuery = '';

  // ------------------------------------------------------------------------
  // 2. DOM ELEMENT REFERENCES
  // ------------------------------------------------------------------------
  const mainCard = document.getElementById('main-card');
  const todoForm = document.getElementById('todo-form');
  const taskInput = document.getElementById('task-input');
  const prioritySelect = document.getElementById('priority-select');
  const taskList = document.getElementById('task-list');
  const emptyState = document.getElementById('empty-state');
  const emptyMsg = document.getElementById('empty-msg');
  const searchInput = document.getElementById('search-input');
  const clearSearchBtn = document.getElementById('clear-search');
  const filterTabs = document.querySelectorAll('.filter-tab');
  const clearCompletedBtn = document.getElementById('clear-completed-btn');

  // Stats & Progress Elements
  const statTotal = document.getElementById('stat-total');
  const statPending = document.getElementById('stat-pending');
  const statCompleted = document.getElementById('stat-completed');
  const progressPercentText = document.getElementById('progress-percent-text');
  const progressFill = document.getElementById('progress-fill');
  const headerStatusText = document.getElementById('header-status-text');
  const toastContainer = document.getElementById('toast-container');

  // ------------------------------------------------------------------------
  // 3. INITIALIZATION & RENDER
  // ------------------------------------------------------------------------
  init3DTiltEffect();
  renderTasks();

  // ------------------------------------------------------------------------
  // 4. EVENT LISTENERS
  // ------------------------------------------------------------------------

  // Form Submit - Add Task
  todoForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = taskInput.value.trim();
    const priority = prioritySelect.value;

    if (!text) return;

    addTask(text, priority);
    taskInput.value = '';
    taskInput.focus();
  });

  // Filter Tabs
  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      filterTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilter = tab.dataset.filter;
      renderTasks();
    });
  });

  // Search Input
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase().trim();
    clearSearchBtn.style.display = searchQuery ? 'block' : 'none';
    renderTasks();
  });

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    clearSearchBtn.style.display = 'none';
    renderTasks();
  });

  // Clear Completed Tasks
  clearCompletedBtn.addEventListener('click', () => {
    const completedCount = tasks.filter(t => t.completed).length;
    if (completedCount === 0) {
      showToast('No completed tasks to clear!', 'info');
      return;
    }

    // Animate removal of completed items
    const completedEls = taskList.querySelectorAll('.task-card-3d.completed');
    completedEls.forEach(el => el.classList.add('removing'));

    setTimeout(() => {
      tasks = tasks.filter(t => !t.completed);
      saveToStorage();
      renderTasks();
      showToast(`Cleared ${completedCount} finished task(s)`, 'success');
    }, 300);
  });

  // Keyboard shortcut listener
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && searchQuery) {
      searchInput.value = '';
      searchQuery = '';
      clearSearchBtn.style.display = 'none';
      renderTasks();
    }
  });

  // ------------------------------------------------------------------------
  // 5. CORE TASK OPERATIONS
  // ------------------------------------------------------------------------

  function addTask(text, priority) {
    const newTask = {
      id: 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      text,
      priority,
      completed: false,
      createdAt: new Date().toISOString()
    };

    tasks.unshift(newTask);
    saveToStorage();
    renderTasks();
    showToast('New task added successfully!', 'success');
  }

  function toggleTaskComplete(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    task.completed = !task.completed;
    saveToStorage();

    const taskEl = document.querySelector(`[data-task-id="${id}"]`);
    if (taskEl) {
      if (task.completed) {
        taskEl.classList.add('completed');
        showToast('Task marked as done! 🎉', 'success');
      } else {
        taskEl.classList.remove('completed');
        showToast('Task reactivated', 'info');
      }
    }

    // Re-render after brief delay to maintain filter accuracy if active filter != 'all'
    setTimeout(() => {
      renderTasks();
    }, 350);
  }

  function deleteTask(id) {
    const taskEl = document.querySelector(`[data-task-id="${id}"]`);
    if (taskEl) {
      taskEl.classList.add('removing');
    }

    setTimeout(() => {
      tasks = tasks.filter(t => t.id !== id);
      saveToStorage();
      renderTasks();
      showToast('Task removed', 'delete');
    }, 300);
  }

  // ------------------------------------------------------------------------
  // 6. RENDER LOGIC
  // ------------------------------------------------------------------------

  function renderTasks() {
    // 1. Filter logic
    let filtered = tasks.filter(task => {
      // Filter tab condition
      if (currentFilter === 'active' && task.completed) return false;
      if (currentFilter === 'completed' && !task.completed) return false;

      // Search condition
      if (searchQuery && !task.text.toLowerCase().includes(searchQuery)) return false;

      return true;
    });

    // 2. Clear current list
    taskList.innerHTML = '';

    // 3. Handle Empty State
    if (filtered.length === 0) {
      emptyState.classList.add('show');
      if (searchQuery) {
        emptyMsg.textContent = `No tasks matching "${searchQuery}"`;
      } else if (currentFilter === 'active') {
        emptyMsg.textContent = 'All caught up! No pending tasks.';
      } else if (currentFilter === 'completed') {
        emptyMsg.textContent = 'No finished tasks yet. Keep grinding!';
      } else {
        emptyMsg.textContent = 'You are all clear! Add a new task above to get started.';
      }
    } else {
      emptyState.classList.remove('show');

      // Build items
      filtered.forEach(task => {
        const li = createTaskElement(task);
        taskList.appendChild(li);
      });
    }

    // 4. Update Stats & Progress
    updateStatsAndProgress();
  }

  function createTaskElement(task) {
    const li = document.createElement('li');
    li.className = `task-card-3d ${task.completed ? 'completed' : ''}`;
    li.dataset.taskId = task.id;

    // Time formatting helper
    const timeFormatted = formatTimeAgo(task.createdAt);

    li.innerHTML = `
      <div class="task-left">
        <label class="checkbox-3d-wrapper" title="${task.completed ? 'Mark as incomplete' : 'Mark as completed'}">
          <input type="checkbox" ${task.completed ? 'checked' : ''}>
          <span class="checkbox-custom">
            <i class="fa-solid fa-check"></i>
          </span>
        </label>
        
        <div class="task-content">
          <span class="task-text">${escapeHTML(task.text)}</span>
          <div class="task-meta">
            <span class="priority-badge priority-${task.priority}">
              <i class="fa-solid fa-circle" style="font-size: 6px;"></i> ${task.priority}
            </span>
            <span class="task-time">${timeFormatted}</span>
          </div>
        </div>
      </div>

      <div class="task-actions">
        <button type="button" class="delete-btn-3d" title="Delete Task">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>
    `;

    // Add card tilt hover bindings
    bindCardTilt(li);

    // Event Bindings
    const checkbox = li.querySelector('input[type="checkbox"]');
    checkbox.addEventListener('change', () => {
      toggleTaskComplete(task.id);
    });

    const deleteBtn = li.querySelector('.delete-btn-3d');
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteTask(task.id);
    });

    return li;
  }

  // ------------------------------------------------------------------------
  // 7. STATS & PROGRESS BAR COMPUTATION
  // ------------------------------------------------------------------------

  function updateStatsAndProgress() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;

    // Numbers counter update
    statTotal.textContent = total;
    statPending.textContent = pending;
    statCompleted.textContent = completed;

    // Percentage calculation
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
    progressPercentText.textContent = `${percentage}%`;
    progressFill.style.width = `${percentage}%`;

    // Dynamic Header Status text
    if (total === 0) {
      headerStatusText.textContent = 'Empty List';
    } else if (percentage === 100) {
      headerStatusText.textContent = 'All Completed! 🌟';
    } else if (percentage >= 50) {
      headerStatusText.textContent = 'Great Progress! 🚀';
    } else {
      headerStatusText.textContent = `${pending} Pending`;
    }
  }

  // ------------------------------------------------------------------------
  // 8. 3D INTERACTIVE TILT EFFECT (GLASS CONTAINER & CARDS)
  // ------------------------------------------------------------------------

  function init3DTiltEffect() {
    if (!mainCard) return;

    let bounds;

    function rotateToMouse(e) {
      bounds = mainCard.getBoundingClientRect();
      const mouseX = e.clientX;
      const mouseY = e.clientY;
      
      const leftX = mouseX - bounds.left;
      const topY = mouseY - bounds.top;
      
      const center = {
        x: leftX - bounds.width / 2,
        y: topY - bounds.height / 2
      };

      // Calculate tilt degrees (Max 8 deg for smooth subtle 3D feel)
      const rotateX = (center.y / (bounds.height / 2)) * -6;
      const rotateY = (center.x / (bounds.width / 2)) * 6;

      mainCard.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    }

    mainCard.addEventListener('mousemove', rotateToMouse);

    mainCard.addEventListener('mouseleave', () => {
      mainCard.style.transform = 'rotateX(0deg) rotateY(0deg)';
    });
  }

  function bindCardTilt(cardEl) {
    cardEl.addEventListener('mousemove', (e) => {
      const rect = cardEl.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const tiltX = ((y - centerY) / centerY) * -5;
      const tiltY = ((x - centerX) / centerX) * 5;

      cardEl.style.transform = `translateY(-4px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(1.01)`;
    });

    cardEl.addEventListener('mouseleave', () => {
      cardEl.style.transform = '';
    });
  }

  // ------------------------------------------------------------------------
  // 9. UTILITIES & TOAST ALERTS
  // ------------------------------------------------------------------------

  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let iconClass = 'fa-circle-info';
    if (type === 'success') iconClass = 'fa-circle-check';
    if (type === 'delete') iconClass = 'fa-trash-can';

    toast.innerHTML = `
      <i class="fa-solid ${iconClass} toast-icon"></i>
      <span>${escapeHTML(message)}</span>
    `;

    toastContainer.appendChild(toast);

    // Trigger frame for smooth transition
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 2800);
  }

  function loadFromStorage() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      console.error('Error loading tasks from localStorage', err);
      return null;
    }
  }

  function saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (err) {
      console.error('Error saving tasks to localStorage', err);
    }
  }

  function escapeHTML(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatTimeAgo(isoString) {
    if (!isoString) return 'Just now';
    const date = new Date(isoString);
    const now = new Date();
    const diffSecs = Math.floor((now - date) / 1000);

    if (diffSecs < 60) return 'Just now';
    if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`;
    if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)}h ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

});
