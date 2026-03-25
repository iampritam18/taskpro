/* ===================================
   TaskPro — Login Page JavaScript
   =================================== */

// ========== PARTICLE BACKGROUND ANIMATION ==========
(function () {
  const canvas = document.getElementById('bg');
  const ctx = canvas.getContext('2d');
  let W, H, particles = [];

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function rand(a, b) {
    return Math.random() * (b - a) + a;
  }

  function initParticles() {
    particles = [];
    const count = Math.floor((W * H) / 8000);
    for (let i = 0; i < count; i++) {
      particles.push({
        x: rand(0, W),
        y: rand(0, H),
        vx: rand(-0.3, 0.3),
        vy: rand(-0.4, -0.1),
        r: rand(1, 2.5),
        alpha: rand(0.2, 0.8),
        phase: rand(0, Math.PI * 2),
      });
    }
  }

  function drawParticles(t) {
    ctx.clearRect(0, 0, W, H);

    // Draw particles
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.y < -5) p.y = H + 5;
      if (p.x < -5) p.x = W + 5;
      if (p.x > W + 5) p.x = -5;

      const pulse = 0.4 + 0.4 * Math.sin(t * 0.001 + p.phase);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(124, 58, 237, ${p.alpha * pulse})`;
      ctx.fill();
    });

    // Draw connecting lines
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 90) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(124, 58, 237, ${0.15 * (1 - d / 90)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  }

  let splashDone = false;
  let cardRevealed = false;

  // Dismiss splash after intro animation completes (~2.8s)
  setTimeout(() => {
    const splash = document.getElementById('splash');
    if (splash) {
      splash.classList.add('fade-out');
      setTimeout(() => {
        splash.style.display = 'none';
        splashDone = true;
      }, 600);
    }
  }, 2800);

  function animate(t) {
    drawParticles(t);
    if (!cardRevealed && splashDone) {
      cardRevealed = true;
      document.getElementById('loginCard').classList.add('visible');
      document.querySelector('.login-logo').classList.add('visible');
    }
    requestAnimationFrame(animate);
  }

  resize();
  initParticles();
  requestAnimationFrame(animate);

  window.addEventListener('resize', () => {
    resize();
    initParticles();
  });
})();

// ========== MAIN LOGIN LOGIC ==========
document.addEventListener('DOMContentLoaded', () => {

  // ========== TAB SWITCHING ==========
  const tabLogin = document.getElementById('tabLogin');
  const tabSignup = document.getElementById('tabSignup');
  const tabIndicator = document.getElementById('tabIndicator');
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const loginSuccess = document.getElementById('loginSuccess');

  function switchTab(tab) {
    if (tab === 'login') {
      tabLogin.classList.add('active');
      tabSignup.classList.remove('active');
      tabIndicator.classList.remove('right');
      loginForm.classList.remove('hidden');
      signupForm.classList.add('hidden');
    } else {
      tabSignup.classList.add('active');
      tabLogin.classList.remove('active');
      tabIndicator.classList.add('right');
      signupForm.classList.remove('hidden');
      loginForm.classList.add('hidden');
    }
    loginSuccess.classList.remove('visible');
    clearErrors();
  }

  tabLogin.addEventListener('click', () => switchTab('login'));
  tabSignup.addEventListener('click', () => switchTab('signup'));

  // ========== VALIDATION HELPERS ==========
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function showError(inputId, errorId) {
    const input = document.getElementById(inputId);
    const error = document.getElementById(errorId);
    if (input) input.classList.add('error');
    if (input) input.classList.remove('success');
    if (error) error.classList.add('visible');
  }

  function showSuccess(inputId, errorId) {
    const input = document.getElementById(inputId);
    const error = document.getElementById(errorId);
    if (input) input.classList.remove('error');
    if (input) input.classList.add('success');
    if (error) error.classList.remove('visible');
  }

  function clearErrors() {
    document.querySelectorAll('.form-error').forEach(e => e.classList.remove('visible'));
    document.querySelectorAll('.auth-form input').forEach(i => {
      i.classList.remove('error');
      i.classList.remove('success');
    });
  }

  // ========== REAL-TIME VALIDATION ==========
  function addRealtimeValidation(inputId, errorId, validator) {
    const input = document.getElementById(inputId);
    if (!input) return;

    input.addEventListener('input', () => {
      if (input.value.length === 0) {
        input.classList.remove('error', 'success');
        document.getElementById(errorId)?.classList.remove('visible');
        return;
      }
      if (validator(input.value)) {
        showSuccess(inputId, errorId);
      } else {
        input.classList.remove('success');
      }
    });

    input.addEventListener('blur', () => {
      if (input.value.length > 0 && !validator(input.value)) {
        showError(inputId, errorId);
      }
    });
  }

  addRealtimeValidation('loginEmail', 'loginEmailError', isValidEmail);
  addRealtimeValidation('loginPassword', 'loginPasswordError', v => v.length >= 8);
  addRealtimeValidation('signupName', 'signupNameError', v => v.trim().length >= 2);
  addRealtimeValidation('signupEmail', 'signupEmailError', isValidEmail);
  addRealtimeValidation('signupPassword', 'signupPasswordError', v => v.length >= 8);

  // ========== PASSWORD TOGGLE ==========
  function setupPasswordToggle(toggleId, inputId) {
    const toggle = document.getElementById(toggleId);
    const input = document.getElementById(inputId);
    if (!toggle || !input) return;

    toggle.addEventListener('click', () => {
      if (input.type === 'password') {
        input.type = 'text';
        toggle.textContent = '🙈';
      } else {
        input.type = 'password';
        toggle.textContent = '👁';
      }
    });
  }

  setupPasswordToggle('loginPassToggle', 'loginPassword');
  setupPasswordToggle('signupPassToggle', 'signupPassword');

  // ========== TOAST NOTIFICATION ==========
  function showToast(message) {
    const toast = document.getElementById('toast');
    if (message) toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
  }

  // ========== LOGIN FORM SUBMIT ==========
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    clearErrors();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    let valid = true;

    if (!isValidEmail(email)) {
      showError('loginEmail', 'loginEmailError');
      valid = false;
    } else {
      showSuccess('loginEmail', 'loginEmailError');
    }

    if (password.length < 8) {
      showError('loginPassword', 'loginPasswordError');
      valid = false;
    } else {
      showSuccess('loginPassword', 'loginPasswordError');
    }

    if (valid) {
      const btn = document.getElementById('loginSubmit');
      btn.classList.add('loading');
      btn.textContent = 'Logging in...';

      const userName = email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

      setTimeout(() => {
        btn.classList.remove('loading');
        btn.textContent = 'Log In';

        // Show toast
        showToast(`Welcome back, ${userName}!`);

        // Show success state
        loginForm.style.display = 'none';
        document.querySelector('#loginCard .auth-tabs').style.display = 'none';
        loginSuccess.querySelector('h3').textContent = `Welcome, ${userName}! 🎉`;
        loginSuccess.classList.add('visible');

        // Redirect to dashboard
        setTimeout(() => { window.location.href = 'dashboard.html'; }, 1500);
      }, 1500);
    }
  });

  // ========== SIGNUP FORM SUBMIT ==========
  signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    clearErrors();

    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    let valid = true;

    if (name.trim().length < 2) {
      showError('signupName', 'signupNameError');
      valid = false;
    } else {
      showSuccess('signupName', 'signupNameError');
    }

    if (!isValidEmail(email)) {
      showError('signupEmail', 'signupEmailError');
      valid = false;
    } else {
      showSuccess('signupEmail', 'signupEmailError');
    }

    if (password.length < 8) {
      showError('signupPassword', 'signupPasswordError');
      valid = false;
    } else {
      showSuccess('signupPassword', 'signupPasswordError');
    }

    if (valid) {
      const btn = document.getElementById('signupSubmit');
      btn.classList.add('loading');
      btn.textContent = 'Creating account...';

      const firstName = name.trim().split(' ')[0];

      setTimeout(() => {
        btn.classList.remove('loading');
        btn.textContent = 'Create Account';

        // Show toast
        showToast('Account created successfully!');

        // Show success state
        signupForm.style.display = 'none';
        document.querySelector('#loginCard .auth-tabs').style.display = 'none';
        loginSuccess.querySelector('h3').textContent = `Welcome, ${firstName}! 🎉`;
        loginSuccess.classList.add('visible');

        // Redirect to dashboard
        setTimeout(() => { window.location.href = 'dashboard.html'; }, 1500);
      }, 1500);
    }
  });

  // ========== SOCIAL BUTTON CLICK EFFECT ==========
  document.querySelectorAll('.btn-social').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.style.transform = 'scale(0.97)';
      setTimeout(() => {
        btn.style.transform = '';
      }, 150);
    });
  });

});
