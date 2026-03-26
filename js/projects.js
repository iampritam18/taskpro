/* ===================================
   TaskPro — Advanced Projects Logic
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
    document.getElementById('userAvatar').textContent = user.name.charAt(0).toUpperCase();

    // ========== API UTILS ==========
    const API_URL = 'http://localhost:5001/api/projects';
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    // ========== STATE ==========
    let allProjects = [];
    let currentSearchTerm = '';
    let currentSort = 'recent';
    let projectToDelete = null;

    // ========== FETCH & RENDER PROJECTS ==========
    async function fetchProjects() {
        showLoading(true);
        try {
            const res = await fetch(`${API_URL}?sort=${currentSort}`, { headers });
            const data = await res.json();
            if (res.ok) {
                allProjects = data;
                updateStats();
                applyFiltersAndRender();
            } else {
                showToast(data.message || 'Failed to fetch projects');
            }
        } catch (err) {
            showToast('Server error. Is the backend running?');
        } finally {
            showLoading(false);
        }
    }

    function updateStats() {
        document.getElementById('totalProjectsCount').textContent = allProjects.length;
        document.getElementById('activeProjectsCount').textContent = allProjects.filter(p => p.progress < 100).length;
        document.getElementById('completedProjectsCount').textContent = allProjects.filter(p => p.progress === 100 && p.totalTasks > 0).length;

        // Inject Icons if empty
        const totalIcon = document.getElementById('totalProjectsIcon');
        const activeIcon = document.getElementById('activeProjectsIcon');
        const completedIcon = document.getElementById('completedProjectsIcon');

        if (totalIcon && !totalIcon.innerHTML) {
            totalIcon.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`;
            activeIcon.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`;
            completedIcon.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
        }
    }

    function applyFiltersAndRender() {
        let projects = [...allProjects];

        // Search Filter
        if (currentSearchTerm) {
            projects = projects.filter(p => 
                p.name.toLowerCase().includes(currentSearchTerm) || 
                (p.description && p.description.toLowerCase().includes(currentSearchTerm))
            );
        }

        renderProjects(projects);
    }

    function renderProjects(projects) {
        const grid = document.getElementById('projectsGrid');
        const emptyState = document.getElementById('emptyState');
        grid.innerHTML = '';

        if (projects.length === 0) {
            grid.classList.add('hidden');
            emptyState.classList.remove('hidden');
            return;
        }

        grid.classList.remove('hidden');
        emptyState.classList.add('hidden');

        projects.forEach((project, index) => {
            const card = createProjectCard(project);
            card.style.animationDelay = `${index * 0.05}s`;
            grid.appendChild(card);
        });
    }

    function createProjectCard(project) {
        const card = document.createElement('div');
        card.className = 'project-card';
        card.style.setProperty('--project-color', project.color || '#6366f1');
        
        card.onclick = (e) => {
            // Don't navigate if clicking on buttons or menu
            if (e.target.closest('.favorite-btn') || e.target.closest('.action-menu-btn') || e.target.closest('.card-menu')) {
                return;
            }
            localStorage.setItem('selectedProjectId', project._id);
            window.location.href = 'dashboard.html';
        };

        const deadline = project.deadline 
            ? new Date(project.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : 'No deadline';

        const createdAt = new Date(project.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

        card.innerHTML = `
            <div class="card-glow" style="background: ${project.color || '#6366f1'}"></div>
            <div class="project-card-inner">
                <div class="project-card-header">
                    <div class="project-title-wrap">
                        <button class="favorite-btn ${project.isFavorite ? 'active' : ''}" title="Favorite">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="${project.isFavorite ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                        </button>
                        <h3>${project.name}</h3>
                    </div>
                    <div class="project-actions-wrap">
                        <button class="action-menu-btn">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                        </button>
                        <div class="card-menu">
                            <button class="menu-item edit-proj">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                <span>Edit Details</span>
                            </button>
                            <button class="menu-item delete menu-item delete-proj">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                <span>Delete Project</span>
                            </button>
                        </div>
                    </div>
                </div>
                
                <p class="project-desc">${project.description || 'Focus on the milestones and achieve success.'}</p>
                
                <div class="card-progress-section">
                    <div class="card-progress-label">
                        <div class="progress-info">
                            <span class="p-icon">⚡</span>
                            <span class="p-text">Progress</span>
                        </div>
                        <span class="p-percentage">${project.progress}%</span>
                    </div>
                    <div class="progress-shimmer">
                        <div class="progress-fill" style="width: ${project.progress}%; background: ${project.color || '#6366f1'}">
                            <div class="progress-glow"></div>
                        </div>
                    </div>
                </div>

                <div class="project-card-footer">
                    <div class="footer-info-pill">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                        <span>${deadline}</span>
                    </div>
                    <div class="footer-info-pill tasks">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                        <span>${project.completedTasks}/${project.totalTasks}</span>
                    </div>
                </div>
            </div>
        `;

        // Favorite Toggle
        card.querySelector('.favorite-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFavorite(project._id);
        });

        // Action Menu Toggle
        card.querySelector('.action-menu-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            const menu = card.querySelector('.card-menu');
            const isActive = menu.classList.contains('active');
            
            // Close all other menus
            document.querySelectorAll('.card-menu').forEach(m => m.classList.remove('active'));
            
            if (!isActive) menu.classList.add('active');
        });

        // Delete Handler
        card.querySelector('.delete-proj').addEventListener('click', (e) => {
            e.stopPropagation();
            openDeleteModal(project._id);
        });

        // Edit Handler
        card.querySelector('.edit-proj').addEventListener('click', (e) => {
            e.stopPropagation();
            openEditModal(project);
        });

        return card;
    }

    // ========== PROJECT OPERATIONS ==========
    async function saveProject(e) {
        e.preventDefault();
        const id = document.getElementById('projectId').value;
        const btn = document.getElementById('saveProjectBtn');
        const spinner = btn.querySelector('.btn-spinner');
        const btnText = btn.querySelector('span');

        btn.disabled = true;
        spinner.classList.remove('hidden');
        btnText.style.opacity = '0.5';

        const projectData = {
            name: document.getElementById('projectName').value.trim(),
            description: document.getElementById('projectDesc').value.trim(),
            color: document.getElementById('projectColor').value,
            deadline: document.getElementById('projectDeadline').value || null
        };

        if (!projectData.name) {
            showToast('Project name is required');
            return;
        }

        const method = id ? 'PUT' : 'POST';
        const url = id ? `${API_URL}/${id}` : API_URL;

        console.log(`[${method}] Sending to ${url}:`, projectData);
        console.log('Using Token:', token ? 'Exists' : 'MISSING');

        try {
            const res = await fetch(url, {
                method,
                headers,
                body: JSON.stringify(projectData)
            });
            console.log('Response Status:', res.status);
            const data = await res.json();
            console.log('Response Data:', data);
            
            if (res.ok) {
                showToast(id ? 'Project updated' : 'Project created! 🚀');
                closeModal();
                fetchProjects(); // Refresh everything
            } else {
                showToast(data.message || 'Error saving project');
            }
        } catch (err) {
            console.error('Fetch error:', err);
            showToast('Connection error');
        } finally {
            btn.disabled = false;
            spinner.classList.add('hidden');
            btnText.style.opacity = '1';
        }
    }

    async function toggleFavorite(id) {
        try {
            const res = await fetch(`${API_URL}/${id}/favorite`, {
                method: 'PATCH',
                headers
            });
            if (res.ok) {
                fetchProjects(); // Reload to apply sort
            }
        } catch (err) {
            console.error('Favorite error', err);
        }
    }


    window.openDeleteModal = (id) => {
        projectToDelete = id;
        document.getElementById('deleteModal').classList.add('active');
    };

    const closeDeleteModal = () => {
        document.getElementById('deleteModal').classList.remove('active');
        projectToDelete = null;
    };

    const performDeleteProject = async () => {
        if (!projectToDelete) return;
        try {
            const res = await fetch(`${API_URL}/${projectToDelete}`, {
                method: 'DELETE',
                headers
            });
            if (res.ok) {
                showToast('Project deleted');
                closeDeleteModal();
                fetchProjects();
            } else {
                showToast('Delete failed');
            }
        } catch (err) {
            showToast('Connection error');
        }
    };

    // ========== MODAL LOGIC ==========
    const modalOverlay = document.getElementById('modalOverlay');
    const projectForm = document.getElementById('projectForm');

    function openModal() {
        document.getElementById('modalTitle').textContent = 'Create New Project';
        document.getElementById('projectId').value = '';
        projectForm.reset();
        modalOverlay.classList.add('active');
    }

    function openEditModal(project) {
        document.getElementById('modalTitle').textContent = 'Edit Project';
        document.getElementById('projectId').value = project._id;
        document.getElementById('projectName').value = project.name;
        document.getElementById('projectDesc').value = project.description || '';
        document.getElementById('projectColor').value = project.color || '#6366f1';
        if (project.deadline) {
            document.getElementById('projectDeadline').value = new Date(project.deadline).toISOString().split('T')[0];
        }
        modalOverlay.classList.add('active');
    }

    function closeModal() {
        modalOverlay.classList.remove('active');
        projectForm.reset();
    }

    document.getElementById('newProjectBtn').addEventListener('click', openModal);
    document.getElementById('closeProjectModal').addEventListener('click', closeModal);
    document.getElementById('cancelProjectBtn').addEventListener('click', closeModal);
    projectForm.addEventListener('submit', saveProject);

    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });

    // Delete Modal Events
    document.getElementById('cancelDeleteBtn').onclick = closeDeleteModal;
    document.getElementById('confirmDeleteBtn').onclick = performDeleteProject;

    // Close menus on click outside
    document.addEventListener('click', () => {
        document.querySelectorAll('.card-menu').forEach(m => m.classList.remove('active'));
    });

    // ========== SEARCH & SORT ==========
    document.querySelectorAll('.nav-item').forEach(link => {
        const href = link.getAttribute('href');
        if (href && href !== '#' && !href.startsWith('javascript')) {
            // Keep real links
        } else {
            // Placeholder toast for now if still needed, but we have real pages now
        }
    });

    document.getElementById('projectSearch').addEventListener('input', (e) => {
        currentSearchTerm = e.target.value.toLowerCase();
        applyFiltersAndRender();
    });

    document.getElementById('projectSort').addEventListener('change', (e) => {
        currentSort = e.target.value;
        fetchProjects();
    });

    // ========== HELPERS ==========
    function showLoading(isLoading) {
        const grid = document.getElementById('projectsGrid');
        if (isLoading) {
            grid.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Syncing workspace...</p></div>';
        }
    }

    function showToast(message) {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }

    // ========== LOGOUT ==========
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    });

    // ========== INITIALIZE ==========
    fetchProjects();
});
