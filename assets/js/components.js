class ComponentLoader {
    constructor() {
        this.loadedComponents = new Set();
    }

    async loadComponent(componentName, targetId) {
        try {
            if (this.loadedComponents.has(componentName)) {
                return;
            }

            const response = await fetch(`components/${componentName}.html`);
            if (!response.ok) {
                throw new Error(`Failed to load component: ${componentName}`);
            }

            const html = await response.text();
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                targetElement.innerHTML = html;
                this.loadedComponents.add(componentName);
                console.log(`Component ${componentName} loaded successfully`);
            } else {
                console.error(`Target element not found: ${targetId}`);
            }
        } catch (error) {
            console.error(`Error loading component ${componentName}:`, error);
        }
    }

    async loadAllComponents() {
        const components = [
            { name: 'hero', target: 'hero-section' },
            { name: 'job-details', target: 'job-details-section' },
            { name: 'benefits', target: 'benefits-section' },
            { name: 'application-form', target: 'application-section' },
            { name: 'footer', target: 'footer-section' }
        ];

        const loadPromises = components.map(component => 
            this.loadComponent(component.name, component.target)
        );

        try {
            await Promise.all(loadPromises);
            console.log('All components loaded successfully');
            
            this.hideLoadingSpinner();
            this.initializeScrollBehavior();
            this.initializeAnimations();
        } catch (error) {
            console.error('Error loading components:', error);
            this.hideLoadingSpinner();
        }
    }

    hideLoadingSpinner() {
        const loadingOverlay = document.getElementById('loading');
        if (loadingOverlay) {
            loadingOverlay.classList.add('hidden');
            setTimeout(() => {
                loadingOverlay.remove();
            }, 300);
        }
    }

    initializeScrollBehavior() {
        document.querySelectorAll('a[href^="#"]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    initializeAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, observerOptions);

        document.querySelectorAll('.card, .benefit-card, .responsibility-item').forEach(el => {
            observer.observe(el);
        });
    }
}

window.componentLoader = new ComponentLoader(); 