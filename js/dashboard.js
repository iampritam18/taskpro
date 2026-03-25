/* ===================================
   TaskPro — Dashboard JavaScript
   =================================== */

document.addEventListener('DOMContentLoaded', () => {

  // ========== SIDEBAR TOGGLE ==========
  const sidebar = document.getElementById('sidebar');
  const sidebarToggle = document.getElementById('sidebarToggle');
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');

  // Desktop collapse/expand
  sidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
  });

  // Restore sidebar state
  if (localStorage.getItem('sidebarCollapsed') === 'true') {
    sidebar.classList.add('collapsed');
  }

  // Mobile menu
  mobileMenuBtn.addEventListener('click', () => {
    sidebar.classList.toggle('mobile-open');
    toggleOverlay();
  });

  function toggleOverlay() {
    let overlay = document.querySelector('.sidebar-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'sidebar-overlay';
      document.body.appendChild(overlay);
      overlay.addEventListener('click', () => {
        sidebar.classList.remove('mobile-open');
        overlay.classList.remove('visible');
      });
    }
    overlay.classList.toggle('visible', sidebar.classList.contains('mobile-open'));
  }

  // ========== ANIMATED STAT COUNTERS ==========
  const statValues = document.querySelectorAll('.stat-value[data-target]');

  function animateCounters() {
    statValues.forEach(el => {
      const target = parseInt(el.dataset.target);
      const duration = 1200;
      const start = performance.now();

      function update(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // Ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(target * eased);
        if (progress < 1) requestAnimationFrame(update);
      }

      requestAnimationFrame(update);
    });
  }

  // Trigger counters after a short delay for entrance animation
  setTimeout(animateCounters, 300);

  // ========== STAT BAR ANIMATION ==========
  // Set initial width to 0 then animate
  document.querySelectorAll('.stat-bar-fill').forEach(bar => {
    const targetWidth = bar.style.width;
    bar.style.width = '0%';
    setTimeout(() => {
      bar.style.width = targetWidth;
    }, 500);
  });

  // ========== FILTER BUTTONS ==========
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // ========== NAV ITEM ACTIVE STATE ==========
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
    });
  });

  // ========== SEARCH FOCUS SHORTCUT (⌘K) ==========
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      document.getElementById('searchInput').focus();
    }
  });

  // ========== KANBAN CARD HOVER EFFECT ==========
  document.querySelectorAll('.kanban-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.style.transition = 'all 0.3s ease';
    });
  });

  // ========== GREETING TIME-BASED ==========
  const hour = new Date().getHours();
  let greeting = 'Good evening';
  if (hour < 12) greeting = 'Good morning';
  else if (hour < 17) greeting = 'Good afternoon';

  const h1 = document.querySelector('.welcome-text h1');
  if (h1) {
    h1.innerHTML = `${greeting}, <span class="gradient-text">Pritam</span> 👋`;
  }

});
