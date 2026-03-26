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

    const eyeIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z"/><circle cx="12" cy="12" r="3"/></svg>`;
    const eyeOffIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 1.55-.12"/><path d="M22 2 2 22"/><path d="M2 12s3-7 10-7a9.74 9.74 0 0 1 1.55.12"/></svg>`;

    toggle.addEventListener('click', () => {
      if (input.type === 'password') {
        input.type = 'text';
        toggle.innerHTML = eyeOffIcon;
      } else {
        input.type = 'password';
        toggle.innerHTML = eyeIcon;
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

      fetch('http://localhost:5001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
        .then(res => res.json())
        .then(data => {
          btn.classList.remove('loading');
          btn.textContent = 'Log In';

          if (data.token) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data));
            showToast(`Welcome back, ${data.name}!`);
            
            loginForm.style.display = 'none';
            document.querySelector('#loginCard .auth-tabs').style.display = 'none';
            loginSuccess.querySelector('h3').textContent = `Welcome, ${data.name}! 🎉`;
            loginSuccess.classList.add('visible');

            setTimeout(() => { window.location.href = 'dashboard.html'; }, 1500);
          } else {
            showToast(data.message || 'Login failed');
          }
        })
        .catch(err => {
          btn.classList.remove('loading');
          btn.textContent = 'Log In';
          showToast('Server error. Is the backend running?');
        });
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

      fetch('http://localhost:5001/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })
        .then(res => res.json())
        .then(data => {
          btn.classList.remove('loading');
          btn.textContent = 'Create Account';

          if (data.token) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data));
            showToast('Account created successfully!');
            
            signupForm.style.display = 'none';
            document.querySelector('#loginCard .auth-tabs').style.display = 'none';
            loginSuccess.querySelector('h3').textContent = `Welcome, ${data.name}! 🎉`;
            loginSuccess.classList.add('visible');

            setTimeout(() => { window.location.href = 'dashboard.html'; }, 1500);
          } else {
            showToast(data.message || 'Registration failed');
          }
        })
        .catch(err => {
          btn.classList.remove('loading');
          btn.textContent = 'Create Account';
          showToast('Server error. Is the backend running?');
        });
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
