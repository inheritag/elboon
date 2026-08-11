/**
 * Elboon Landing Page Script
 */
document.addEventListener('DOMContentLoaded', () => {
  initScrollReveal();
  initFAQAccordion();
  initWaitlistForm();
});

/* Scroll Reveal */
function initScrollReveal() {
  const els = document.querySelectorAll('.feature-card, .accordion-item, .cat-pill');
  els.forEach(el => el.classList.add('reveal'));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  els.forEach(el => observer.observe(el));
}

/* FAQ Accordion */
function initFAQAccordion() {
  const items = document.querySelectorAll('.accordion-item');

  items.forEach(item => {
    item.querySelector('.accordion-header').addEventListener('click', () => {
      const isActive = item.classList.contains('active');

      items.forEach(other => {
        if (other !== item) {
          other.classList.remove('active');
          other.querySelector('.accordion-body').style.maxHeight = null;
        }
      });

      if (isActive) {
        item.classList.remove('active');
        item.querySelector('.accordion-body').style.maxHeight = null;
      } else {
        item.classList.add('active');
        const body = item.querySelector('.accordion-body');
        body.style.maxHeight = body.scrollHeight + 'px';
      }
    });
  });
}

/* Waitlist Form */
function initWaitlistForm() {
  const form = document.getElementById('waitlist-form');
  const input = document.getElementById('email-input');
  const btn = document.getElementById('submit-btn');
  const feedback = document.getElementById('form-feedback');
  const canvas = document.getElementById('confetti-canvas');

  if (!form) return;

  const saved = localStorage.getItem('elboon_email');
  if (saved) {
    input.value = saved;
    input.disabled = true;
    btn.disabled = true;
    btn.textContent = 'Joined!';
    showFeedback('Welcome back! You are on our waitlist.', 'success');
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = input.value.trim();
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email || !re.test(email)) {
      showFeedback('Please enter a valid email address.', 'error');
      return;
    }

    btn.disabled = true;
    input.disabled = true;
    btn.textContent = 'Joining...';

    await new Promise(r => setTimeout(r, 1200));

    localStorage.setItem('elboon_email', email);
    btn.textContent = 'Joined!';
    showFeedback('You are on the list! We will be in touch soon.', 'success');
    triggerConfetti(canvas);
  });

  function showFeedback(msg, type) {
    feedback.textContent = msg;
    feedback.className = 'form-feedback ' + type;
  }
}

/* Confetti */
function triggerConfetti(canvas) {
  if (!canvas) return;
  canvas.style.display = 'block';
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = ['#E8503A', '#7C3AED', '#10B981', '#F59E0B', '#3B82F6'];
  const particles = [];

  for (let i = 0; i < 120; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 10 + Math.random() * 14;
    particles.push({
      x: canvas.width / 2, y: canvas.height / 2,
      vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 4,
      size: 5 + Math.random() * 7,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 10,
      opacity: 1
    });
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = 0;
    particles.forEach(p => {
      if (p.opacity <= 0) return;
      alive++;
      p.vx *= 0.96; p.vy *= 0.96; p.vy += 0.35;
      p.x += p.vx; p.y += p.vy;
      p.rotation += p.rotSpeed; p.opacity -= 0.013;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation * Math.PI / 180);
      ctx.globalAlpha = Math.max(0, p.opacity);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    });
    if (alive > 0) requestAnimationFrame(animate);
    else { canvas.style.display = 'none'; ctx.clearRect(0, 0, canvas.width, canvas.height); }
  }
  animate();
}
