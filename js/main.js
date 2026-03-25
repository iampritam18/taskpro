document.addEventListener('DOMContentLoaded', () => {

  // 1. Navbar Scroll Effect
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  // 2. Typewriter Effect
  const words = ['AI Workflows.', 'Seamless Boards.', 'Smart Documents.'];
  const typeTarget = document.getElementById('typewriter');
  let wordIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  let typingSpeed = 100;

  function type() {
    const currentWord = words[wordIndex];
    if (isDeleting) {
      typeTarget.textContent = currentWord.substring(0, charIndex - 1);
      charIndex--;
      typingSpeed = 50;
    } else {
      typeTarget.textContent = currentWord.substring(0, charIndex + 1);
      charIndex++;
      typingSpeed = 100;
    }

    if (!isDeleting && charIndex === currentWord.length) {
      typingSpeed = 2000; // Pause at end of word
      isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      wordIndex = (wordIndex + 1) % words.length;
      typingSpeed = 500; // Pause before new word
    }

    setTimeout(type, typingSpeed);
  }

  if (typeTarget) {
    setTimeout(type, 1000); // Initial delay
  }

  // 3. Scroll Reveal Engine
  const reveals = document.querySelectorAll('.reveal');
  const revealOptions = {
    threshold: 0.15,
    rootMargin: "0px 0px -50px 0px"
  };

  const revealObserver = new IntersectionObserver(function(entries, observer) {
    entries.forEach(entry => {
      if (!entry.isIntersecting) {
        return;
      } else {
        entry.target.classList.add('active');
        observer.unobserve(entry.target);
      }
    });
  }, revealOptions);

  reveals.forEach(reveal => {
    revealObserver.observe(reveal);
  });

  // 4. Particle Background (Hero)
  const canvas = document.getElementById('hero-particles');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    const particles = [];
    const numParticles = 80;

    class Particle {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 1;
        this.vy = (Math.random() - 0.5) * 1;
        this.radius = Math.random() * 2;
        this.alpha = Math.random() * 0.5 + 0.1;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;

        // Bounce edges
        if (this.x < 0 || this.x > width) this.vx = -this.vx;
        if (this.y < 0 || this.y > height) this.vy = -this.vy;
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(124, 58, 237, ${this.alpha})`;
        ctx.fill();
      }
    }

    // Init
    for (let i = 0; i < numParticles; i++) {
      particles.push(new Particle());
    }

    function animate() {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();

        // Connect particles
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 150) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(6, 182, 212, ${0.1 * (1 - dist / 150)})`;
            ctx.lineWidth = 1;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(animate);
    }

    animate();

    // Resize
    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });
  }

});
