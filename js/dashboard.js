/* ===================================
   TaskPro — Dashboard JavaScript
   =================================== */

document.addEventListener('DOMContentLoaded', () => {
  // ========== AUTH CHECK ==========
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  if (!token || !user) {
    window.location.href = 'login.html';
    return;
  }

  // Update UI with user info
  document.getElementById('userName').textContent = user.name;
  document.getElementById('welcomeName').textContent = user.name.split(' ')[0];
  document.getElementById('userAvatar').textContent = user.name.charAt(0).toUpperCase();

  // ========== API UTILS ==========
  const API_BASE = 'http://localhost:5001/api';
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // ========== STATE ==========
  let allTasks = [];
  let allProjects = [];
  let teamMembers = [];
  let activities = [];
  let selectedProjectId = localStorage.getItem('selectedProjectId') || null;
  let taskToDelete = null;

  // ========== INITIALIZE ==========
  async function init() {
    await fetchProjects();
    await fetchTasks();
    await fetchTeamMembers();
    await fetchActivities();
    setupGlobalSearch();
    setupKanbanDragDrop();
    setupSidebarEvents();
    setupModalEvents();
    setupFilterEvents();
  }

  // ========== DATA FETCHING ==========
  async function fetchTasks(filterTag = 'All') {
    showKanbanSkeletons(true);
    try {
      let url = `${API_BASE}/tasks`;
      const queryParams = [];
      if (selectedProjectId) queryParams.push(`projectId=${selectedProjectId}`);
      if (filterTag !== 'All') queryParams.push(`tag=${filterTag}`);
      
      if (queryParams.length) {
        url += `?${queryParams.join('&')}`;
      }

      if (selectedProjectId) {
        updateDashboardHeader();
      } else {
        resetDashboardHeader();
      }

      const res = await fetch(url, { headers });
      const data = await res.json();
      if (res.ok) {
        allTasks = data;
        renderTasks();
        updateStats();
      }
    } catch (err) {
      showToast('Error fetching tasks');
    } finally {
      showKanbanSkeletons(false);
    }
  }

  async function fetchProjects() {
    try {
      const res = await fetch(`${API_BASE}/projects`, { headers });
      const data = await res.json();
      if (res.ok) {
        allProjects = data;
        populateProjectDropdown();
        renderSidebarProjects();
      }
    } catch (err) {
      console.error('Failed to fetch projects');
    }
  }

  async function fetchTeamMembers() {
    try {
      const res = await fetch(`${API_BASE}/team`, { headers });
      const data = await res.json();
      if (res.ok) {
        teamMembers = data;
        renderTeamMembers();
        populateAssigneeDropdown();
      }
    } catch (err) {
      console.error('Failed to fetch team');
    }
  }

  function populateAssigneeDropdown() {
    const dropdown = document.getElementById('taskAssignedTo');
    if (!dropdown) return;
    dropdown.innerHTML = '<option value="">No one (Unassigned)</option>';
    teamMembers.forEach(m => {
      dropdown.innerHTML += `<option value="${m._id}">${m.name}</option>`;
    });
  }

  async function fetchActivities() {
    try {
      const res = await fetch(`${API_BASE}/activities`, { headers });
      const data = await res.json();
      if (res.ok) {
        activities = data;
        renderActivities();
      }
    } catch (err) {
      console.error('Failed to fetch activities');
    }
  }

  // ========== RENDERING ==========
  function renderTasks() {
    const columns = {
      'todo': document.getElementById('todo-cards'),
      'in-progress': document.getElementById('inprogress-cards'),
      'done': document.getElementById('done-cards')
    };

    Object.values(columns).forEach(col => {
      const skeletons = col.querySelectorAll('.skeleton-card');
      col.innerHTML = '';
      skeletons.forEach(s => col.appendChild(s));
    });

    allTasks.forEach(task => {
      const card = createTaskCard(task);
      const col = columns[task.status];
      if (col) col.appendChild(card);
    });

    Object.keys(columns).forEach(status => {
      const colCards = columns[status];
      const count = colCards.querySelectorAll('.kanban-card').length;
      const countEl = colCards.closest('.kanban-col').querySelector('.kanban-count');
      if (countEl) countEl.textContent = count;
    });
  }

  function createTaskCard(task) {
    const card = document.createElement('div');
    card.className = 'kanban-card anim-fade-up';
    card.draggable = true;
    card.dataset.id = task._id;
    
    const colors = { design: '#f472b6', frontend: '#06b6d4', backend: '#7c3aed' };
    const tagColor = colors[task.category?.toLowerCase()] || '#6366f1';
    card.style.setProperty('--tag-color', tagColor);

    card.innerHTML = `
      <div class="kanban-card-top">
        <span class="kanban-tag" style="background: ${tagColor}20; color: ${tagColor}">${task.category || 'General'}</span>
        <button class="delete-task" data-id="${task._id}">
           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </div>
      <h4>${task.title}</h4>
      <p>${task.description || 'No description provided.'}</p>
      <div class="kanban-card-footer">
        <div class="kanban-meta">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/></svg>
          ${task.deadline ? new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No date'}
        </div>
        <div class="kanban-avatars">
           <div class="kanban-avatar" style="background: ${tagColor}" title="${task.assignedTo?.name || 'Unassigned'}">
             ${(task.assignedTo?.name || 'U').charAt(0)}
           </div>
        </div>
      </div>
    `;

    card.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', task._id);
      card.classList.add('dragging');
    });

    card.addEventListener('dragend', () => card.classList.remove('dragging'));
    
    card.querySelector('.delete-task').onclick = (e) => {
      e.stopPropagation();
      deleteTask(task._id);
    };

    return card;
  }

  function renderSidebarProjects() {
    const container = document.getElementById('sidebarProjectList');
    if (!container) return;

    container.innerHTML = '';
    
    allProjects.slice(0, 5).forEach(project => {
      const item = document.createElement('a');
      item.href = '#';
      item.className = `nav-item ${project._id === selectedProjectId ? 'active' : ''}`;
      item.style.borderLeft = `3px solid ${project.color || '#6366f1'}`;
      item.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
        <span>${project.name}</span>
      `;
      item.onclick = (e) => {
        e.preventDefault();
        selectedProjectId = project._id;
        localStorage.setItem('selectedProjectId', selectedProjectId);
        fetchTasks();
        renderSidebarProjects();
      };
      container.appendChild(item);
    });
  }

  function renderTeamMembers() {
    const container = document.querySelector('.team-list');
    if (!container) return;
    container.innerHTML = teamMembers.map(member => `
      <div class="team-member">
        <div class="team-avatar-wrap">
          <div class="team-avatar" style="background: var(--gradient-main)">${member.name.charAt(0)}</div>
          <span class="team-status online"></span>
        </div>
        <div class="team-info">
          <div class="team-name">${member.name}</div>
          <div class="team-role">${member.role}</div>
        </div>
        <span class="team-tasks">${member.assignedCount} tasks</span>
      </div>
    `).join('');
  }

  function renderActivities() {
    const container = document.querySelector('.activity-list');
    if (!container) return;
    container.innerHTML = activities.map(act => `
      <div class="activity-item">
        <div class="activity-avatar" style="background: var(--gradient-main)">${act.user.name.charAt(0)}</div>
        <div class="activity-body">
          <p><strong>${act.user.name}</strong> ${act.description}</p>
          <span class="activity-time">${timeAgo(new Date(act.createdAt))}</span>
        </div>
      </div>
    `).join('');
  }

  function updateDashboardHeader() {
    const project = allProjects.find(p => p._id === selectedProjectId);
    if (project) {
      const titleEl = document.getElementById('dashboardTitle');
      const descEl = document.getElementById('dashboardSubtitle');
      if (titleEl) titleEl.textContent = project.name;
      if (descEl) descEl.textContent = project.description || 'Project details and tasks';
      document.getElementById('clearProjectFilter')?.classList.remove('hidden');
    }
  }

  function resetDashboardHeader() {
    const titleEl = document.getElementById('dashboardTitle');
    if (titleEl) titleEl.innerHTML = `Welcome back, <span id="welcomeName">${user.name.split(' ')[0]}</span>`;
    const descEl = document.getElementById('dashboardSubtitle');
    if (descEl) descEl.textContent = "Here's what's happening with your projects today.";
    document.getElementById('clearProjectFilter')?.classList.add('hidden');
  }

  function populateProjectDropdown() {
    const dropdown = document.getElementById('taskProject');
    if (!dropdown) return;
    dropdown.innerHTML = '<option value="">No Project (General)</option>';
    allProjects.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p._id;
      opt.textContent = p.name;
      if (p._id === selectedProjectId) opt.selected = true;
      dropdown.appendChild(opt);
    });
  }

  function updateStats() {
    const total = allTasks.length;
    const inProgress = allTasks.filter(t => t.status === 'in-progress').length;
    const done = allTasks.filter(t => t.status === 'done').length;
    const overdue = allTasks.filter(t => t.deadline && new Date(t.deadline) < new Date() && t.status !== 'done').length;

    const stats = {
      'Total Tasks': { val: total, pct: total > 0 ? 80 : 0 },
      'In Progress': { val: inProgress, pct: total > 0 ? (inProgress / total) * 100 : 0 },
      'Completed': { val: done, pct: total > 0 ? (done / total) * 100 : 0 },
      'Overdue': { val: overdue, pct: total > 0 ? (overdue / total) * 100 : 0 }
    };

    document.querySelectorAll('.stat-card').forEach(card => {
      const labelEl = card.querySelector('.stat-label');
      if (!labelEl) return;
      const label = labelEl.textContent;
      if (stats[label]) {
        const valEl = card.querySelector('.stat-value');
        if (valEl) valEl.dataset.target = stats[label].val;
        const barEl = card.querySelector('.stat-bar-fill');
        if (barEl) barEl.style.width = `${stats[label].pct}%`;
      }
    });

    animateCounters();
  }

  async function createTask(e) {
    e.preventDefault();
    const btn = document.getElementById('saveTaskBtn');
    btn.disabled = true;
    btn.textContent = 'Saving...';

    const newTask = {
      title: document.getElementById('taskTitle').value,
      description: document.getElementById('taskDesc').value,
      status: document.getElementById('taskStatus').value,
      projectId: document.getElementById('taskProject').value || undefined,
      category: document.getElementById('taskCategory').value,
      deadline: document.getElementById('taskDeadline').value || undefined,
      assignedTo: document.getElementById('taskAssignedTo').value || undefined
    };

    try {
      const res = await fetch(`${API_BASE}/tasks`, {
        method: 'POST',
        headers,
        body: JSON.stringify(newTask)
      });
      if (res.ok) {
        showToast('Task created successfully');
        closeModal();
        fetchTasks();
        fetchActivities();
      }
    } catch (err) {
      showToast('Error creating task');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Save Task';
    }
  }

  async function updateTaskStatus(id, newStatus) {
    try {
      const res = await fetch(`${API_BASE}/tasks/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        showToast(`Task moved to ${newStatus}`);
        fetchTasks();
        fetchActivities();
      }
    } catch (err) {
      showToast('Error updating status');
    }
  }

  function deleteTask(id) {
    taskToDelete = id;
    document.getElementById('deleteModal').classList.add('active');
  }

  async function performDelete(id) {
    try {
      const res = await fetch(`${API_BASE}/tasks/${id}`, { method: 'DELETE', headers });
      if (res.ok) {
        showToast('Task deleted');
        fetchTasks();
        fetchActivities();
      }
    } catch (err) {
      showToast('Error deleting task');
    }
  }

  function setupFilterEvents() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
      btn.onclick = () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        fetchTasks(btn.textContent);
      };
    });
  }

  function setupGlobalSearch() {
    const searchInput = document.getElementById('searchInput');
    const resultsPanel = document.getElementById('searchResults');
    if (!searchInput || !resultsPanel) return;

    searchInput.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase().trim();
      if (!term) {
        resultsPanel.classList.add('hidden');
        return;
      }

      const results = [
        ...allTasks.map(t => ({ title: t.title, type: 'Task', id: t._id })),
        ...allProjects.map(p => ({ title: p.name, type: 'Project', id: p._id })),
        ...teamMembers.map(m => ({ title: m.name, type: 'Member', id: m._id }))
      ].filter(r => r.title.toLowerCase().includes(term));

      resultsPanel.innerHTML = results.map(r => `
        <div class="search-result-item" onclick="handleSearchResultClick('${r.type}', '${r.id}')">
          <div class="search-result-icon">${r.type[0]}</div>
          <div class="search-result-info">
            <span class="search-result-title">${r.title}</span>
            <span class="search-result-type">${r.type}</span>
          </div>
        </div>
      `).join('') || '<div class="search-result-item">No results found</div>';
      
      resultsPanel.classList.remove('hidden');
    });

    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInput.focus();
      }
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.topbar-search')) resultsPanel.classList.add('hidden');
    });
  }

  window.handleSearchResultClick = (type, id) => {
    if (type === 'Project') {
      selectedProjectId = id;
      localStorage.setItem('selectedProjectId', id);
      fetchTasks();
      renderSidebarProjects();
    }
    document.getElementById('searchResults').classList.add('hidden');
    const input = document.getElementById('searchInput');
    if (input) input.value = '';
  };

  function setupKanbanDragDrop() {
    document.querySelectorAll('.kanban-cards').forEach(col => {
      col.addEventListener('dragover', (e) => {
        e.preventDefault();
        col.classList.add('drag-over');
      });
      col.addEventListener('dragleave', () => col.classList.remove('drag-over'));
      col.addEventListener('drop', (e) => {
        col.classList.remove('drag-over');
        const taskId = e.dataTransfer.getData('text/plain');
        const newStatus = col.id.replace('-cards', '');
        const finalStatus = newStatus === 'inprogress' ? 'in-progress' : newStatus;
        updateTaskStatus(taskId, finalStatus);
      });
    });
  }

  function setupSidebarEvents() {
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    sidebarToggle?.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
      localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
    });

    document.getElementById('navMyTasks')?.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      e.target.closest('.nav-item').classList.add('active');
      allTasks = allTasks.filter(t => t.userId === user.id); 
      renderTasks();
      showToast('Showing your tasks');
    });

    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.clear();
        window.location.href = 'login.html';
    });
  }

  function setupModalEvents() {
    const modal = document.getElementById('taskModal');
    const openBtn = document.getElementById('newTaskBtn');
    const closeBtn = document.getElementById('closeModal');
    const taskForm = document.getElementById('taskForm');

    openBtn?.addEventListener('click', () => modal.classList.add('active'));
    closeBtn?.addEventListener('click', () => {
      modal.classList.remove('active');
      taskForm.reset();
    });
    taskForm?.addEventListener('submit', createTask);
    window.onclick = (e) => { 
      if (e.target.classList.contains('modal')) e.target.classList.remove('active'); 
    };

    // Delete Modal Events
    document.getElementById('cancelDelete').onclick = () => document.getElementById('deleteModal').classList.remove('active');
    document.getElementById('confirmDelete').onclick = async () => {
      if (taskToDelete) {
        await performDelete(taskToDelete);
        document.getElementById('deleteModal').classList.remove('active');
        taskToDelete = null;
      }
    };
  }

  function closeModal() {
    document.getElementById('taskModal').classList.remove('active');
    document.getElementById('taskForm').reset();
  }

  function showKanbanSkeletons(show) {
    document.querySelectorAll('.skeleton-card').forEach(s => s.style.display = show ? 'block' : 'none');
  }

  function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
  }

  function timeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  }

  function animateCounters() {
    document.querySelectorAll('.stat-value[data-target]').forEach(el => {
      const target = parseInt(el.dataset.target);
      if (isNaN(target)) return;
      const duration = 1000;
      const start = performance.now();
      function update(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - progress, 3)));
        if (progress < 1) requestAnimationFrame(update);
      }
      requestAnimationFrame(update);
    });
  }

  init();
});
