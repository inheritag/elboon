/**
 * Elboon Landing Page Interactive Script (E-commerce Version)
 */

document.addEventListener('DOMContentLoaded', () => {
  initScrollReveal();
  initFAQAccordion();
  initWaitlistAndWheel();
});

/* ==========================================================================
   SCROLL REVEAL ANIMATIONS
   ========================================================================== */
function initScrollReveal() {
  const revealElements = [
    ...document.querySelectorAll('.feature-card'),
    ...document.querySelectorAll('.faq-item'),
    ...document.querySelectorAll('.section-header')
  ];

  revealElements.forEach(el => el.classList.add('reveal'));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  revealElements.forEach(el => observer.observe(el));
}

/* ==========================================================================
   FAQ ACCORDION
   ========================================================================== */
function initFAQAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');

    question.addEventListener('click', () => {
      const isActive = item.classList.contains('active');

      faqItems.forEach(otherItem => {
        if (otherItem !== item && otherItem.classList.contains('active')) {
          otherItem.classList.remove('active');
          otherItem.querySelector('.faq-answer').style.maxHeight = null;
        }
      });

      if (isActive) {
        item.classList.remove('active');
        answer.style.maxHeight = null;
      } else {
        item.classList.add('active');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });
}

/* ==========================================================================
   WAITLIST FORM & LUCKY WHEEL ENGINE
   ========================================================================== */
function initWaitlistAndWheel() {
  const form = document.getElementById('waitlist-form');
  const emailInput = document.getElementById('email-input');
  const submitBtn = document.getElementById('submit-btn');
  const feedback = document.getElementById('form-feedback');
  
  const formTitle = document.getElementById('form-title-text');
  const formNote = document.getElementById('form-note');
  
  const wheel = document.getElementById('lucky-wheel');
  const spinBtn = document.getElementById('wheel-spin-btn');
  const confettiCanvas = document.getElementById('confetti-canvas');

  // Rewards catalog mapping to slices (1-indexed matching CSS variables)
  const rewards = {
    1: { name: 'FREE SHIPPING', code: 'BOONSHIP' },
    2: { name: '20% OFF YOUR ORDER', code: 'BOON20' },
    3: { name: '$10 GIFT CARD', code: 'BOON10' },
    4: { name: 'VIP ACCESS PASS', code: 'BOONVIP' },
    5: { name: '15% OFF YOUR ORDER', code: 'BOON15' },
    6: { name: 'A MYSTERY GIFT', code: 'BOONGIFT' }
  };

  let registeredEmail = '';
  let isSpinning = false;

  // STEP 1: Waitlist Email Submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = emailInput.value.trim();
    feedback.className = 'form-feedback';
    feedback.textContent = '';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      showFeedback('Please enter your email.', 'error');
      return;
    }
    if (!emailRegex.test(email)) {
      showFeedback('Please enter a valid email address.', 'error');
      return;
    }

    // Mock network submitting state
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;
    emailInput.disabled = true;

    try {
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      // Save email state
      registeredEmail = email;
      
      // Update Form State to "Unlock Spin"
      submitBtn.classList.remove('loading');
      submitBtn.querySelector('#btn-text').textContent = 'Unlocked!';
      showFeedback('Email recorded! Tap SPIN on the wheel to win your reward!', 'success');
      
      formTitle.textContent = '🎰 Spin the lucky wheel now!';
      formNote.innerHTML = `Linked email: <strong>${email}</strong>. Tap the center button of the wheel.`;

      // Enable Spin Button
      spinBtn.disabled = false;
      spinBtn.classList.remove('disabled');
      spinBtn.classList.add('active-glow');

    } catch (err) {
      showFeedback('Something went wrong. Please try again.', 'error');
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;
      emailInput.disabled = false;
    }
  });

  // STEP 2: Lucky Wheel Spin
  spinBtn.addEventListener('click', () => {
    if (isSpinning || !registeredEmail) return;

    isSpinning = true;
    spinBtn.disabled = true;
    spinBtn.classList.remove('active-glow');
    spinBtn.classList.add('disabled');
    showFeedback('Spinning the wheel of fortune...', 'success');

    // Pick a reward. 
    // Slices 2 (20% OFF) and 1 (FREE SHIPPING) are premium targets
    const rewardSlices = [1, 2, 3, 5, 6]; // Avoid 4 (VIP ACCESS) by default or pick randomly
    const wonSlice = rewardSlices[Math.floor(Math.random() * rewardSlices.length)];
    const reward = rewards[wonSlice];

    // Math: Center of slice is at (i - 0.5) * 60 degrees.
    // To align this slice center with the top pointer (at 0 degrees rotation):
    // Rotation = 360 * full_spins - (i - 1)*60 - 30
    const fullSpins = 6;
    const finalDegree = (fullSpins * 360) - ((wonSlice - 1) * 60) - 30;

    // Apply rotation CSS
    wheel.style.transform = `rotate(${finalDegree}deg)`;

    // Wait for transition to finish (matches CSS transition: 5s)
    setTimeout(() => {
      // Complete state updates
      showFeedback(`🎉 Success! You won ${reward.name}!`, 'success');
      formTitle.textContent = '🎁 Your Reward is Locked!';
      formNote.innerHTML = `We sent promo code <strong>${reward.code}</strong> for <strong>${reward.name}</strong> to <strong>${registeredEmail}</strong>.`;

      // Persist in localStorage to prevent repeat play
      localStorage.setItem('elboon_email', registeredEmail);
      localStorage.setItem('elboon_reward_name', reward.name);
      localStorage.setItem('elboon_reward_code', reward.code);

      // Explosive confetti celebrate!
      triggerConfetti(confettiCanvas);
      isSpinning = false;
    }, 5000);
  });

  // Helper to update feedback banner text
  function showFeedback(text, type) {
    feedback.textContent = text;
    feedback.className = `form-feedback ${type}`;
  }

  // Load existing registrations
  const savedEmail = localStorage.getItem('elboon_email');
  const savedReward = localStorage.getItem('elboon_reward_name');
  const savedCode = localStorage.getItem('elboon_reward_code');

  if (savedEmail && savedReward && savedCode) {
    emailInput.value = savedEmail;
    emailInput.disabled = true;
    submitBtn.disabled = true;
    submitBtn.querySelector('#btn-text').textContent = 'Registered';
    formTitle.textContent = '🔒 Launch Reward Locked In';
    formNote.innerHTML = `Welcome back! You won <strong>${savedReward}</strong> (Code: <strong>${savedCode}</strong>) linked to <strong>${savedEmail}</strong>.`;
    
    // Position wheel slightly rotated to make it look active
    wheel.style.transform = 'rotate(750deg)';
    wheel.style.transition = 'none';
  }
}

// Confetti Particle Engine
function triggerConfetti(canvas) {
  canvas.style.display = 'block';
  const ctx = canvas.getContext('2d');
  
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // Warm coral, neon purple, emerald green, gold, and white
  const colors = ['#FF5A36', '#7C3AED', '#10B981', '#F59E0B', '#FFFFFF'];
  const particleCount = 140;
  const particles = [];

  class ConfettiParticle {
    constructor() {
      this.x = canvas.width / 2;
      this.y = canvas.height / 2 + 50;
      this.size = Math.random() * 8 + 6;
      this.color = colors[Math.floor(Math.random() * colors.length)];
      
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 16 + 12;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed - 6;

      this.gravity = 0.35;
      this.friction = 0.95;
      this.rotation = Math.random() * 360;
      this.rotationSpeed = Math.random() * 12 - 6;
      this.opacity = 1;
    }

    update() {
      this.vx *= this.friction;
      this.vy *= this.friction;
      this.vy += this.gravity;
      this.x += this.vx;
      this.y += this.vy;
      this.rotation += this.rotationSpeed;
      this.opacity -= 0.012;
    }

    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate((this.rotation * Math.PI) / 180);
      ctx.globalAlpha = this.opacity;
      ctx.fillStyle = this.color;
      ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
      ctx.restore();
    }
  }

  for (let i = 0; i < particleCount; i++) {
    particles.push(new ConfettiParticle());
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    let activeParticles = 0;
    particles.forEach(p => {
      if (p.opacity > 0) {
        p.update();
        p.draw();
        activeParticles++;
      }
    });

    if (activeParticles > 0) {
      requestAnimationFrame(animate);
    } else {
      canvas.style.display = 'none';
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  animate();

  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });
}
