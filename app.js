/**
 * Main Application Logic for Elboon Landing Page
 */

document.addEventListener('DOMContentLoaded', () => {
    initScrollReveal();
    initFAQAccordion();
    initWaitlistForm();
});

/**
 * Initializes IntersectionObserver for reveal animations
 */
function initScrollReveal() {
    const revealElements = document.querySelectorAll('.feature-card, .accordion-item, .trust-item, .cat-card, .reveal');
    
    if (!revealElements.length) return;

    const observerOptions = {
        root: null,
        rootMargin: '0px 0px -50px 0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    revealElements.forEach(el => observer.observe(el));
}

/**
 * Initializes FAQ Accordion functionality
 */
function initFAQAccordion() {
    const faqItems = document.querySelectorAll('.accordion-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.accordion-header');
        
        if (question) {
            question.addEventListener('click', () => {
                const isActive = item.classList.contains('active');
                
                // Close all other open items
                faqItems.forEach(otherItem => {
                    if (otherItem !== item) {
                        otherItem.classList.remove('active');
                        const otherAnswer = otherItem.querySelector('.accordion-content');
                        if (otherAnswer) {
                            otherAnswer.style.maxHeight = null;
                        }
                    }
                });
                
                // Toggle current item
                if (!isActive) {
                    item.classList.add('active');
                    const answer = item.querySelector('.accordion-content');
                    if (answer) {
                        answer.style.maxHeight = answer.scrollHeight + "px";
                    }
                } else {
                    item.classList.remove('active');
                    const answer = item.querySelector('.accordion-content');
                    if (answer) {
                        answer.style.maxHeight = null;
                    }
                }
            });
        }
    });
}

/**
 * Initializes Waitlist Form handling
 */
function initWaitlistForm() {
    const form = document.getElementById('waitlist-form');
    const emailInput = document.getElementById('email-input');
    const submitBtn = document.getElementById('submit-btn');
    const feedbackDiv = document.getElementById('form-feedback');
    const confettiCanvas = document.getElementById('confetti-canvas');
    
    if (!form || !emailInput || !submitBtn) return;
    
    // Check local storage for previous submission
    const savedEmail = localStorage.getItem('elboon_email');
    if (savedEmail) {
        showJoinedState(savedEmail);
    }
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!emailRegex.test(email)) {
            showFeedback('Please enter a valid email address.', 'error');
            return;
        }
        
        // Simulate network request
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;
        emailInput.disabled = true;
        
        setTimeout(() => {
            submitBtn.classList.remove('loading');
            
            // Save to local storage
            localStorage.setItem('elboon_email', email);
            
            showJoinedState(email, true);
            
            if (confettiCanvas) {
                triggerConfetti(confettiCanvas);
            }
            
        }, 1200);
    });
    
    function showFeedback(message, type) {
        if (!feedbackDiv) return;
        feedbackDiv.textContent = message;
        feedbackDiv.className = type;
        feedbackDiv.style.display = 'block';
    }
    
    function showJoinedState(email, isNew = false) {
        emailInput.value = email;
        emailInput.disabled = true;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Joined!';
        submitBtn.classList.add('joined');
        
        if (isNew) {
            showFeedback('You are on the list! We will be in touch soon.', 'success');
        } else {
            showFeedback('Welcome back! You are on our waitlist.', 'success');
        }
    }
}

/**
 * Triggers a confetti explosion effect on the given canvas
 */
function triggerConfetti(canvas) {
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.display = 'block';
    
    const colors = ['#FF5A36', '#7C3AED', '#10B981', '#F59E0B', '#FFFFFF'];
    const particles = [];
    const particleCount = 140;
    const gravity = 0.35;
    const friction = 0.95;
    
    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 12 + Math.random() * 16;
        
        particles.push({
            x: canvas.width / 2,
            y: canvas.height / 2,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: 6 + Math.random() * 8,
            color: colors[Math.floor(Math.random() * colors.length)],
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 10,
            opacity: 1
        });
    }
    
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        let allFaded = true;
        
        particles.forEach(p => {
            if (p.opacity > 0) {
                allFaded = false;
                
                // Update position
                p.vx *= friction;
                p.vy *= friction;
                p.vy += gravity;
                p.x += p.vx;
                p.y += p.vy;
                
                // Update rotation and opacity
                p.rotation += p.rotationSpeed;
                p.opacity -= 0.012;
                
                // Draw particle (rectangle)
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate((p.rotation * Math.PI) / 180);
                ctx.globalAlpha = Math.max(0, p.opacity);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                ctx.restore();
            }
        });
        
        if (!allFaded) {
            requestAnimationFrame(animate);
        } else {
            canvas.style.display = 'none';
        }
    }
    
    animate();
}
