class FormHandler {
    constructor() {
        this.form = null;
        this.submitBtn = null;
        this.isSubmitting = false;
    }

    init() {
        // Wait for DOM to be ready and components to load
        this.waitForForm();
    }

    waitForForm() {
        const checkForm = () => {
            this.form = document.getElementById('wizardForm');
            this.submitBtn = document.getElementById('finalSubmit');
            
            if (this.form) {
                this.attachEventListeners();
                this.setupFileUpload();
                console.log('FormHandler initialized successfully');
            } else {
                // Try again after a short delay
                setTimeout(checkForm, 100);
            }
        };
        
        checkForm();
    }

    attachEventListeners() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        const inputs = this.form.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearError(input));
        });
    }

    setupFileUpload() {
        const idFrontInput = document.getElementById('idFront');
        const idBackInput = document.getElementById('idBack');

        if (!idFrontInput && !idBackInput) return;

        // Set up file upload handling for ID uploads
        if (idFrontInput) {
            idFrontInput.addEventListener('change', () => this.handleFileSelection(idFrontInput));
        }
        if (idBackInput) {
            idBackInput.addEventListener('change', () => this.handleFileSelection(idBackInput));
        }
    }

    handleFileSelection(fileInput) {
        const file = fileInput.files[0];

        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            this.showError(fileInput.name, 'File size must be less than 10MB');
            fileInput.value = '';
            return;
        }

        const allowedTypes = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        
        if (!allowedTypes.includes(fileExtension)) {
            this.showError(fileInput.name, 'Please upload an image file (JPG, PNG, GIF, WebP)');
            fileInput.value = '';
            return;
        }

        // Show preview for ID uploads
        const previewId = fileInput.id === 'idFront' ? 'frontPreview' : 'backPreview';
        const preview = document.getElementById(previewId);
        
        if (preview) {
            preview.innerHTML = `
                <div class="upload-success">
                    <div class="success-text">✅ ${file.name} uploaded successfully</div>
                    <div class="file-size">Size: ${(file.size / 1024 / 1024).toFixed(2)} MB</div>
                </div>
            `;
        }

        this.clearError(fileInput);
    }

    removeFile(fileInput) {
        fileInput.value = '';
        
        const previewId = fileInput.id === 'idFront' ? 'frontPreview' : 'backPreview';
        const preview = document.getElementById(previewId);
        
        if (preview) {
            preview.textContent = '';
        }
    }

    validateField(field) {
        const value = field.value.trim();
        const fieldName = field.name;

        this.clearError(field);

        if (field.hasAttribute('required') && !value) {
            this.showError(fieldName, 'This field is required');
            return false;
        }

        switch (fieldName) {
            case 'email':
                if (value && !this.isValidEmail(value)) {
                    this.showError(fieldName, 'Please enter a valid email address');
                    return false;
                }
                break;
            case 'phone':
                if (value && !this.isValidPhone(value)) {
                    this.showError(fieldName, 'Please enter a valid phone number');
                    return false;
                }
                break;
            case 'fullName':
                if (value && value.length < 2) {
                    this.showError(fieldName, 'Name must be at least 2 characters');
                    return false;
                }
                break;
        }

        return true;
    }

    validateForm() {
        let isValid = true;
        const requiredFields = this.form.querySelectorAll('[required]');

        requiredFields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });

        return isValid;
    }

    async handleSubmit(e) {
        e.preventDefault();

        if (this.isSubmitting) return;

        if (!this.validateForm()) {
            this.scrollToFirstError();
            return;
        }

        this.isSubmitting = true;
        this.showLoading();

        try {
            const formData = new FormData(this.form);
            
            await this.simulateSubmission(formData);
            
            this.showSuccessMessage();
            this.trackConversion();
        } catch (error) {
            console.error('Form submission error:', error);
            alert('There was an error submitting your application. Please try again.');
        } finally {
            this.isSubmitting = false;
            this.hideLoading();
        }
    }

    async simulateSubmission(formData) {
        try {
            const response = await fetch('/api/submit-application', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Server error');
            }

            console.log('✅ Application submitted successfully:', result);
            return result;
        } catch (error) {
            console.error('❌ Submission error:', error);
            throw error;
        }
    }

    showLoading() {
        const btnText = this.submitBtn.querySelector('.btn-text');
        const btnLoading = this.submitBtn.querySelector('.btn-loading');
        
        if (btnText) btnText.style.display = 'none';
        if (btnLoading) btnLoading.style.display = 'inline-flex';
        
        this.submitBtn.disabled = true;
    }

    hideLoading() {
        const btnText = this.submitBtn.querySelector('.btn-text');
        const btnLoading = this.submitBtn.querySelector('.btn-loading');
        
        if (btnText) btnText.style.display = 'inline';
        if (btnLoading) btnLoading.style.display = 'none';
        
        this.submitBtn.disabled = false;
    }

    showSuccessMessage() {
        const successMessage = document.getElementById('success-message');
        if (successMessage) {
            successMessage.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }

    showError(fieldName, message) {
        const field = document.querySelector(`[name="${fieldName}"]`);
        const errorElement = document.getElementById(`${fieldName}-error`);
        
        if (field) {
            const formGroup = field.closest('.form-group') || field.closest('.form-field');
            if (formGroup) {
                formGroup.classList.add('error');
            }
        }
        
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('show');
        } else {
            // Create error element if it doesn't exist
            console.warn(`Error element ${fieldName}-error not found, showing alert instead`);
            console.error(`${fieldName}: ${message}`);
        }
    }

    clearError(field) {
        if (!field || !field.name) return;
        
        const fieldName = field.name;
        const errorElement = document.getElementById(`${fieldName}-error`);
        
        const formGroup = field.closest('.form-group') || field.closest('.form-field');
        if (formGroup) {
            formGroup.classList.remove('error');
        }
        
        if (errorElement) {
            errorElement.classList.remove('show');
        }
    }

    scrollToFirstError() {
        const firstError = this.form.querySelector('.form-group.error, .form-field.error');
        if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isValidPhone(phone) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        const cleanPhone = phone.replace(/[\s\-\(\)\.]/g, '');
        return cleanPhone.length >= 10 && phoneRegex.test(cleanPhone);
    }

    trackConversion() {
        if (window.analytics && window.analytics.track) {
            window.analytics.track('Job Application Submitted', {
                source: 'landing_page',
                position: 'customer_service'
            });
        }
    }
}

window.formHandler = new FormHandler(); 