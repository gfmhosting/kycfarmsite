class Analytics {
    constructor() {
        this.events = [];
        this.sessionStartTime = Date.now();
        this.pageviews = 0;
    }

    init() {
        this.trackPageView();
        this.setupScrollTracking();
        this.setupCTATracking();
        this.setupFormTracking();
        this.trackSession();
    }

    trackPageView() {
        this.pageviews++;
        this.trackEvent('Page View', {
            page: window.location.pathname,
            referrer: document.referrer,
            timestamp: new Date().toISOString(),
            user_agent: navigator.userAgent
        });

        if (typeof fbq !== 'undefined') {
            fbq('track', 'PageView');
        }

        if (typeof gtag !== 'undefined') {
            gtag('event', 'page_view', {
                page_title: document.title,
                page_location: window.location.href
            });
        }
    }

    setupScrollTracking() {
        let scrolledPercents = new Set();
        const trackingPoints = [25, 50, 75, 90];

        window.addEventListener('scroll', () => {
            const scrollPercent = Math.round(
                (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
            );

            trackingPoints.forEach(point => {
                if (scrollPercent >= point && !scrolledPercents.has(point)) {
                    scrolledPercents.add(point);
                    this.trackEvent('Scroll Depth', {
                        percent: point,
                        timestamp: new Date().toISOString()
                    });
                }
            });
        });
    }

    setupCTATracking() {
        document.addEventListener('click', (e) => {
            const target = e.target.closest('.btn, a[href="#application-section"]');
            if (!target) return;

            const buttonText = target.textContent.trim();
            const buttonClass = target.className;
            const section = this.getCurrentSection(target);

            this.trackEvent('CTA Click', {
                button_text: buttonText,
                button_class: buttonClass,
                section: section,
                timestamp: new Date().toISOString()
            });

            if (buttonText.toLowerCase().includes('apply')) {
                if (typeof fbq !== 'undefined') {
                    fbq('track', 'InitiateCheckout');
                }
                
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'begin_checkout', {
                        currency: 'USD',
                        value: 15.00
                    });
                }
            }
        });
    }

    setupFormTracking() {
        document.addEventListener('focus', (e) => {
            if (e.target.matches('#wizardForm input, #wizardForm select')) {
                this.trackEvent('Form Field Focus', {
                    field_name: e.target.name,
                    field_type: e.target.type,
                    timestamp: new Date().toISOString()
                });
            }
        }, true);

        document.addEventListener('submit', (e) => {
            if (e.target.id === 'wizardForm') {
                this.trackEvent('Form Submission Started', {
                    timestamp: new Date().toISOString()
                });
            }
        });
    }

    trackFormCompletion() {
        this.trackEvent('Job Application Completed', {
            session_duration: Date.now() - this.sessionStartTime,
            timestamp: new Date().toISOString()
        });

        if (typeof fbq !== 'undefined') {
            fbq('track', 'CompleteRegistration');
            fbq('track', 'Lead');
        }

        if (typeof gtag !== 'undefined') {
            gtag('event', 'conversion', {
                send_to: 'AW-CONVERSION_ID/CONVERSION_LABEL',
                value: 1.0,
                currency: 'USD'
            });
        }
    }

    trackSession() {
        const sessionData = {
            start_time: new Date(this.sessionStartTime).toISOString(),
            user_agent: navigator.userAgent,
            screen_resolution: `${screen.width}x${screen.height}`,
            viewport: `${window.innerWidth}x${window.innerHeight}`,
            referrer: document.referrer,
            utm_source: this.getURLParameter('utm_source'),
            utm_medium: this.getURLParameter('utm_medium'),
            utm_campaign: this.getURLParameter('utm_campaign'),
            utm_content: this.getURLParameter('utm_content')
        };

        this.trackEvent('Session Start', sessionData);

        window.addEventListener('beforeunload', () => {
            this.trackEvent('Session End', {
                duration: Date.now() - this.sessionStartTime,
                pageviews: this.pageviews,
                timestamp: new Date().toISOString()
            });
        });
    }

    getCurrentSection(element) {
        const sections = ['hero-section', 'job-details-section', 'benefits-section', 'application-section'];
        
        for (let section of sections) {
            const sectionElement = document.getElementById(section);
            if (sectionElement && sectionElement.contains(element)) {
                return section.replace('-section', '');
            }
        }
        
        return 'unknown';
    }

    getURLParameter(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }

    trackEvent(eventName, properties = {}) {
        const event = {
            event: eventName,
            properties: {
                ...properties,
                page_url: window.location.href,
                timestamp: new Date().toISOString()
            }
        };

        this.events.push(event);
        console.log('Analytics Event:', event);

        if (window.dataLayer) {
            window.dataLayer.push({
                event: eventName,
                ...properties
            });
        }
    }

    getSessionData() {
        return {
            events: this.events,
            session_duration: Date.now() - this.sessionStartTime,
            pageviews: this.pageviews
        };
    }
}

window.analytics = new Analytics(); 