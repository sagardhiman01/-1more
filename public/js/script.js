document.addEventListener('DOMContentLoaded', () => {
    // Lucide Icon Initializer
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // Scroll States
    const header = document.querySelector('#main-nav');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // Mobile Menu Toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            const icon = mobileMenuBtn.querySelector('i');
            if (navLinks.classList.contains('active')) {
                icon.setAttribute('data-lucide', 'x');
            } else {
                icon.setAttribute('data-lucide', 'menu');
            }
            lucide.createIcons();
        });
    }

    // Intersection Observer for Entrance Animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-active');
                // If it's the stats section, we don't need a separate trigger here 
                // as CSS handles the base animation, but we can trigger counters
                if (entry.target.classList.contains('stats')) {
                    startCounters();
                }
            }
        });
    }, observerOptions);

    document.querySelectorAll('.fade-up, .fade-in, .slide-in, .stats').forEach(el => observer.observe(el));

    // Stats Counter Logic
    function startCounters() {
        const counters = document.querySelectorAll('.counter');
        counters.forEach(counter => {
            if (counter.classList.contains('counted')) return;
            counter.classList.add('counted');
            
            const target = +counter.getAttribute('data-target');
            const duration = 2000; // 2 seconds
            const step = target / (duration / 16);
            let current = 0;

            const update = () => {
                current += step;
                if (current < target) {
                    counter.innerText = Math.floor(current);
                    requestAnimationFrame(update);
                } else {
                    counter.innerText = target + (target > 100 ? '+' : '');
                }
            };
            update();
        });
    }

    // Active Link Highlighting
    const currentPath = window.location.pathname;
    document.querySelectorAll('.nav-links a').forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        }
    });
});
