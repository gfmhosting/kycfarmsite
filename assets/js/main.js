document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('Initializing Remote Customer Service Landing Page...');

        await window.componentLoader.loadAllComponents();
        
        setTimeout(() => {
            window.formHandler.init();
            window.analytics.init();
            
            initializeInteractiveFeatures();
            initializePerformanceOptimizations();
            
            console.log('Landing page initialized successfully');
        }, 100);

    } catch (error) {
        console.error('Error initializing landing page:', error);
        
        const loadingOverlay = document.getElementById('loading');
        if (loadingOverlay) {
            loadingOverlay.innerHTML = `
                <div style="text-align: center; color: #ef4444;">
                    <p>Sorry, there was an error loading the page.</p>
                    <button onclick="location.reload()" style="padding: 12px 24px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer;">
                        Reload Page
                    </button>
                </div>
            `;
        }
    }
});

function initializeInteractiveFeatures() {
    setupHeroAnimations();
    setupCounterAnimations();
    setupIntersectionObserver();
    setupKeyboardNavigation();
}

function setupHeroAnimations() {
    const heroFeatures = document.querySelectorAll('.feature-item');
    
    heroFeatures.forEach((feature, index) => {
        feature.style.animationDelay = `${index * 0.1}s`;
        feature.addEventListener('mouseenter', () => {
            feature.style.transform = 'translateY(-4px) scale(1.02)';
        });
        feature.addEventListener('mouseleave', () => {
            feature.style.transform = 'translateY(0) scale(1)';
        });
    });
}

function setupCounterAnimations() {
    const counters = document.querySelectorAll('.stat-number');
    const observerOptions = {
        threshold: 0.5,
        rootMargin: '0px'
    };

    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                counterObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    counters.forEach(counter => {
        counterObserver.observe(counter);
    });
}

function animateCounter(element) {
    const text = element.textContent;
    const isNumber = /^\d+/.test(text);
    
    if (!isNumber) return;
    
    const number = parseInt(text.match(/\d+/)[0]);
    const suffix = text.replace(/\d+/, '');
    const duration = 2000;
    const steps = 60;
    const increment = number / steps;
    const stepDuration = duration / steps;
    
    let current = 0;
    const timer = setInterval(() => {
        current += increment;
        if (current >= number) {
            current = number;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current) + suffix;
    }, stepDuration);
}

function setupIntersectionObserver() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                
                if (entry.target.classList.contains('benefit-card')) {
                    const delay = Array.from(entry.target.parentNode.children).indexOf(entry.target) * 100;
                    entry.target.style.animationDelay = `${delay}ms`;
                }
            }
        });
    }, observerOptions);

    setTimeout(() => {
        document.querySelectorAll('.card, .benefit-card, .responsibility-item, .process-step').forEach(el => {
            observer.observe(el);
        });
    }, 500);
}

function setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            document.body.classList.add('keyboard-navigation');
        }
        
        if (e.key === 'Escape') {
            const successMessage = document.getElementById('success-message');
            if (successMessage && successMessage.style.display === 'flex') {
                successMessage.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        }
    });

    document.addEventListener('mousedown', () => {
        document.body.classList.remove('keyboard-navigation');
    });
    
    // Setup smooth scrolling for Apply Now buttons
    setupApplyNowButtons();
}

function setupApplyNowButtons() {
    document.addEventListener('click', (e) => {
        if (e.target.getAttribute('href') === '#application-section') {
            e.preventDefault();
            const applicationSection = document.getElementById('application-section');
            if (applicationSection) {
                applicationSection.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start',
                    inline: 'nearest'
                });
            }
        }
    });
}

function loadScript(src) {
    const script = document.createElement('script');
    script.src = src;
    document.head.appendChild(script);
}

function initializePerformanceOptimizations() {
    if ('loading' in HTMLImageElement.prototype) {
        const images = document.querySelectorAll('img[data-src]');
        images.forEach(img => {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
        });
    }

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(console.error);
    }

    const prefetchLinks = [
        '/api/submit-application',
        'mailto:careers@company.com'
    ];
    
    prefetchLinks.forEach(url => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = url;
        document.head.appendChild(link);
    });
}

function addAnimationCSS() {
    const style = document.createElement('style');
    style.textContent = `
        .animate-in {
            animation: slideInUp 0.6s ease-out forwards;
        }
        
        @keyframes slideInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .benefit-card {
            opacity: 0;
            transform: translateY(30px);
        }
        
        .benefit-card.animate-in {
            opacity: 1;
            transform: translateY(0);
            transition: opacity 0.6s ease-out, transform 0.6s ease-out;
        }
        
        .keyboard-navigation *:focus {
            outline: 2px solid #667eea !important;
            outline-offset: 2px !important;
        }
    `;
    document.head.appendChild(style);
}

addAnimationCSS();

window.addEventListener('load', () => {
    window.analytics.trackEvent('Page Fully Loaded', {
        load_time: performance.now(),
        timestamp: new Date().toISOString()
    });
});

window.addEventListener('error', (e) => {
    console.error('JavaScript Error:', e.error);
    window.analytics.trackEvent('JavaScript Error', {
        message: e.message,
        filename: e.filename,
        lineno: e.lineno,
        timestamp: new Date().toISOString()
    });
}); 