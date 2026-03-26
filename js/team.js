/* ===================================
   TaskPro — Team Logic
   =================================== */

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  if (!token || !user) {
    window.location.href = 'login.html';
    return;
  }

  const API_BASE = 'http://localhost:5001/api';
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
  let memberToDelete = null;

  // ========== INITIALIZE ==========
  async function init() {
    setupAuthUI();
    await fetchTeam();
    setupEventListeners();
  }

  function setupAuthUI() {
    document.getElementById('userName').textContent = user.name;
    document.getElementById('userAvatar').textContent = user.name.charAt(0).toUpperCase();
  }

  async function fetchTeam() {
    try {
      const res = await fetch(`${API_BASE}/team`, { headers });
      const members = await res.json();
      renderTeam(members);
    } catch (err) { console.error(err); }
  }

  function renderTeam(members) {
    const grid = document.getElementById('teamGrid');
    grid.innerHTML = members.map(m => `
      <div class="member-card anim-fade-up">
        <div class="member-header">
           <div class="member-avatar" style="background: var(--gradient-main)">${m.name.charAt(0).toUpperCase()}</div>
           <div class="member-info">
              <span class="member-name">${m.name}</span>
              <span class="member-role role-${m.role}">${m.role}</span>
              <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px; font-weight: 500;">${m.email}</p>
           </div>
        </div>
        <div class="member-stats">
           <div class="stat-item">
              <div style="color: var(--neon-purple); margin-bottom: 4px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
              </div>
              <span class="stat-value">${m.assignedCount}</span>
              <span class="stat-label">Assigned</span>
           </div>
           <div class="stat-item">
              <div style="color: var(--neon-green); margin-bottom: 4px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              </div>
              <span class="stat-value">${m.completedCount}</span>
              <span class="stat-label">Completed</span>
           </div>
        </div>
        <div class="member-footer">
           <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 8px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
              <span>Performance</span>
              <span style="color: var(--text-primary)">${m.performance}%</span>
           </div>
           <div class="performance-track">
              <div class="performance-bar" style="width: ${m.performance}%"></div>
           </div>
           ${user.role === 'admin' && m._id !== user.id ? `
             <div class="member-actions">
                <button class="btn-remove" onclick="openDeleteModal('${m._id}')">Remove Member</button>
             </div>
           ` : ''}
        </div>
      </div>
    `).join('') || '<div class="loading-state">No other members in team yet.</div>';
  }

  // ========== OPERATIONS ==========
  window.openDeleteModal = (id) => {
    memberToDelete = id;
    document.getElementById('deleteModal').classList.add('active');
  };

  const closeDeleteModal = () => {
    document.getElementById('deleteModal').classList.remove('active');
    memberToDelete = null;
  };

  const performRemoveMember = async () => {
    if (!memberToDelete) return;
    try {
        const res = await fetch(`${API_BASE}/team/${memberToDelete}`, { method: 'DELETE', headers });
        if (res.ok) {
            showToast('Member removed');
            closeDeleteModal();
            fetchTeam();
        } else {
            const data = await res.json();
            showToast(data.message);
        }
    } catch (err) { console.error(err); }
  };

  async function inviteMember(e) {
    e.preventDefault();
    const email = document.getElementById('inviteEmail').value;
    const role = document.getElementById('inviteRole').value;

    try {
        const res = await fetch(`${API_BASE}/team/invite`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ email, role })
        });
        const data = await res.json();
        
        if (res.ok) {
            closeModal();
            showToast('Invitation sent successfully');
            fetchTeam();
        } else {
            showToast(data.message);
        }
    } catch (err) { console.error(err); }
  }

  // ========== MODAL LOGIC ==========
  function openModal() { document.getElementById('inviteModal').classList.add('active'); }
  function closeModal() { document.getElementById('inviteModal').classList.remove('active'); }

  // ========== EVENTS ==========
  function setupEventListeners() {
    document.getElementById('inviteBtn').onclick = openModal;
    document.getElementById('closeInviteModal').onclick = closeModal;
    document.getElementById('cancelInviteBtn').onclick = closeModal;
    document.getElementById('inviteForm').onsubmit = inviteMember;

    // Delete Modal Events
    document.getElementById('cancelDeleteBtn').onclick = closeDeleteModal;
    document.getElementById('confirmDeleteBtn').onclick = performRemoveMember;

    // Sidebar Toggle
    const sidebar = document.getElementById('sidebar');
    document.getElementById('sidebarToggle')?.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
    });

    // Logout
    document.getElementById('logoutBtn').onclick = () => {
        localStorage.clear();
        window.location.href = 'login.html';
    };
  }

  function showToast(msg) {
    const t = document.getElementById('toast');
    t.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> ${msg}`;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
  }

  init();
});
