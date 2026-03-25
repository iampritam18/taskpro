/* ===================================
   TaskPro — Premium Landing Page JS
   =================================== */

document.addEventListener('DOMContentLoaded', () => {

  // ========== 1. PARTICLE CANVAS BACKGROUND ==========
  const canvas = document.getElementById('particleCanvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let particles = [];
    let w, h;
    const PARTICLE_COUNT = 70;
    const CONNECT_DIST = 140;
    const MOUSE = { x: null, y: null, radius: 150 };

    function resize() {
      const section = canvas.parentElement;
      w = canvas.width = section.offsetWidth;
      h = canvas.height = section.offsetHeight;
    }

    function createParticles() {
      particles = [];
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          r: Math.random() * 2 + 1,
          alpha: Math.random() * 0.5 + 0.3,
          pulse: Math.random() * Math.PI * 2
        });
      }
    }

    function drawParticles() {
      ctx.clearRect(0, 0, w, h);
      const time = Date.now() * 0.001;

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECT_DIST) {
            const opacity = (1 - dist / CONNECT_DIST) * 0.15;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(124, 58, 237, ${opacity})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      // Draw particles
      particles.forEach(p => {
        const pulse = Math.sin(time * 2 + p.pulse) * 0.3 + 0.7;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * pulse, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(124, 58, 237, ${p.alpha * pulse})`;
        ctx.fill();

        // Subtle glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * pulse * 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(124, 58, 237, ${p.alpha * 0.05})`;
        ctx.fill();
      });
    }

    function updateParticles() {
      particles.forEach(p => {
        // Mouse repulsion
        if (MOUSE.x !== null) {
          const dx = p.x - MOUSE.x;
          const dy = p.y - MOUSE.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MOUSE.radius) {
            const force = (MOUSE.radius - dist) / MOUSE.radius * 0.02;
            p.vx += (dx / dist) * force;
            p.vy += (dy / dist) * force;
          }
        }

        p.x += p.vx;
        p.y += p.vy;

        // Damping
        p.vx *= 0.998;
        p.vy *= 0.998;

        // Wrap edges
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;
      });
    }

    function animateParticles() {
      drawParticles();
      updateParticles();
      requestAnimationFrame(animateParticles);
    }

    // Mouse interaction
    canvas.addEventListener('mousemove', e => {
      const rect = canvas.getBoundingClientRect();
      MOUSE.x = e.clientX - rect.left;
      MOUSE.y = e.clientY - rect.top;
    });
    canvas.addEventListener('mouseleave', () => {
      MOUSE.x = null;
      MOUSE.y = null;
    });

    resize();
    createParticles();
    animateParticles();
    window.addEventListener('resize', () => { resize(); createParticles(); });
  }

  // ========== 2. NAVBAR SCROLL EFFECT ==========
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 30);
  });

  // ========== 3. MOBILE NAV TOGGLE ==========
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      navLinks.classList.toggle('open');
    });
    // Close on link click
    navLinks.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => navLinks.classList.remove('open'));
    });
  }

  // ========== 4. SCROLL REVEAL ANIMATIONS ==========
  const revealElements = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        // Stagger delay for siblings
        const siblings = entry.target.parentElement.querySelectorAll('.reveal');
        let staggerIndex = 0;
        siblings.forEach((sib, i) => {
          if (sib === entry.target) staggerIndex = i;
        });
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, staggerIndex * 80);
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  revealElements.forEach(el => revealObserver.observe(el));

  // ========== 5. STAT COUNTER ANIMATION ==========
  const statNumbers = document.querySelectorAll('.stat-number[data-target]');
  const statObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        statObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  statNumbers.forEach(el => statObserver.observe(el));

  function animateCounter(el) {
    const target = parseFloat(el.dataset.target);
    const suffix = el.dataset.suffix || '';
    const isDecimal = el.dataset.decimal === 'true';
    const duration = 2000;
    const start = performance.now();
    const isLarge = target >= 1000;

    function update(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = target * eased;

      if (isDecimal) {
        el.textContent = current.toFixed(1) + suffix;
      } else if (isLarge) {
        el.textContent = Math.round(current).toLocaleString() + '+';
      } else {
        el.textContent = Math.round(current) + '+' + suffix;
      }

      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  // ========== 6. TIMELINE ANIMATION ==========
  const timelineLine = document.getElementById('timelineLine');
  const timelineSteps = document.querySelectorAll('.timeline-step');
  const timelineObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Animate the connecting line
        if (timelineLine) timelineLine.classList.add('animate');
        // Stagger step reveals
        timelineSteps.forEach((step, i) => {
          setTimeout(() => {
            step.classList.add('visible');
          }, 300 + i * 400);
        });
        timelineObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  if (timelineSteps.length > 0) {
    timelineObserver.observe(timelineSteps[0].parentElement);
  }

  // ========== 7. TESTIMONIAL MARQUEE — DUPLICATE FOR LOOP ==========
  const marqueeTrack = document.getElementById('marqueeTrack');
  if (marqueeTrack) {
    // Clone cards for infinite scroll
    const cards = marqueeTrack.querySelectorAll('.testimonial-card');
    cards.forEach(card => {
      const clone = card.cloneNode(true);
      marqueeTrack.appendChild(clone);
    });
  }

  // ========== 8. LOGIN MODAL ==========
  const modal = document.getElementById('loginModal');
  const openBtn = document.getElementById('openModalBtn');
  const closeBtn = document.getElementById('modalCloseBtn');

  function openModal() {
    if (modal) {
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeModal() {
    if (modal) {
      modal.classList.remove('open');
      document.body.style.overflow = '';
    }
  }

  if (openBtn) openBtn.addEventListener('click', openModal);
  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  // Close on overlay click
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  // Modal form submit — redirect to dashboard
  const modalForm = document.getElementById('modalLoginForm');
  if (modalForm) {
    modalForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('modalEmail').value;
      const pass = document.getElementById('modalPassword').value;

      if (!email || !pass) return;

      const btn = document.getElementById('modalSubmitBtn');
      btn.textContent = 'Signing in...';
      btn.style.opacity = '0.7';
      btn.disabled = true;

      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1200);
    });
  }

  // ========== 9. SMOOTH ANCHOR SCROLL ==========
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href');
      if (id === '#') return;
      const target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

});
