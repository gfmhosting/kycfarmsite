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
            this.setupTimeSlots();
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
    
    setupTimeSlots() {
        const timeSlots = document.querySelectorAll('.time-slot');
        timeSlots.forEach(slot => {
            slot.addEventListener('click', () => {
                timeSlots.forEach(s => s.classList.remove('selected'));
                slot.classList.add('selected');
                document.getElementById('selectedSlot').value = slot.textContent;
                
                // Update confirmation display
                const selectedDate = document.getElementById('selectedDate');
                if (selectedDate) {
                    const today = slot.closest('.time-slots').previousElementSibling.textContent.includes('Today');
                    const dateText = today ? `Today at ${slot.textContent}` : `Tomorrow at ${slot.textContent}`;
                    selectedDate.textContent = dateText;
                }
            });
        });
    }

    updateProgress() {
        const progress = (this.currentStep / 4) * 100;
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
        
        // Special validation for Step 3 (time slot selection)
        if (stepNumber === 3) {
            const selectedSlot = document.getElementById('selectedSlot');
            if (!selectedSlot || !selectedSlot.value) {
                alert('Please select an interview time slot before continuing.');
                return false;
            }
            return true;
        }
        
        const inputs = step.querySelectorAll('input[required], select[required]');
        console.log('Found required inputs:', inputs.length);
        
        let isValid = true;
        inputs.forEach(input => {
            let valid;
            
            if (input.type === 'checkbox') {
                valid = input.checked;
            } else if (input.type === 'file') {
                valid = input.files && input.files.length > 0;
            } else {
                valid = input.value.trim() !== '';
            }
            
            console.log('Input', input.name || input.id, 'valid:', valid, 'value:', input.type === 'file' ? (input.files ? input.files.length + ' files' : 'no files') : input.value);
            
            if (!valid) {
                isValid = false;
                input.style.borderColor = '#ef4444';
                this.showFieldError(input, 'This field is required');
            } else {
                input.style.borderColor = '#e2e8f0';
                this.clearFieldError(input);
            }
        });
        
        if (!isValid && stepNumber === this.currentStep) {
            alert('Please fill in all required fields before continuing.');
        }
        
        console.log('Step validation result:', isValid);
        return isValid;
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

    async startCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            const preview = document.getElementById('preview');
            const cameraError = document.getElementById('cameraError');
            const startCameraBtn = document.getElementById('startCamera');
            const recordBtn = document.getElementById('recordBtn');
            
            preview.srcObject = stream;
            preview.style.display = 'block';
            cameraError.style.display = 'none';
            startCameraBtn.style.display = 'none';
            recordBtn.style.display = 'inline-block';
            
            this.currentStream = stream;
            
        } catch (error) {
            console.error('Camera access denied:', error);
            const cameraError = document.getElementById('cameraError');
            cameraError.style.display = 'block';
            document.getElementById('preview').style.display = 'none';
        }
    }

    startRecording() {
        if (!this.currentStream) {
            alert('Please start the camera first');
            return;
        }

        try {
            const recordBtn = document.getElementById('recordBtn');
            const stopBtn = document.getElementById('stopBtn');
            const recordingStatus = document.getElementById('recordingStatus');
            
            this.mediaRecorder = new MediaRecorder(this.currentStream);
            const chunks = [];

            this.mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
            this.mediaRecorder.onstop = () => {
                this.recordedBlob = new Blob(chunks, { type: 'video/webm' });
                const recorded = document.getElementById('recorded');
                recorded.src = URL.createObjectURL(this.recordedBlob);
                recorded.style.display = 'block';
                
                recordingStatus.textContent = '✅ ID verification video recorded successfully!';
                recordingStatus.className = 'recording-status completed';
                
                this.showRetakeOption();
            };

            this.mediaRecorder.start();
            
            recordBtn.style.display = 'none';
            stopBtn.style.display = 'inline-block';
            recordingStatus.textContent = '🔴 Recording... Look at camera, then turn head left and right';
            recordingStatus.className = 'recording-status recording';
            
            // Auto-stop after 5 seconds for ID verification
            this.recordingTimeout = setTimeout(() => {
                if (this.mediaRecorder.state === 'recording') {
                    this.stopRecording();
                }
            }, 5000);

        } catch (error) {
            console.error('Recording failed:', error);
            alert('Recording failed. Please try again.');
        }
    }

    stopRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.stop();
            clearTimeout(this.recordingTimeout);
            
            const stopBtn = document.getElementById('stopBtn');
            stopBtn.style.display = 'none';
        }
    }

    retakeVideo() {
        const recorded = document.getElementById('recorded');
        const recordBtn = document.getElementById('recordBtn');
        const retakeBtn = document.getElementById('retakeBtn');
        const recordingStatus = document.getElementById('recordingStatus');
        
        recorded.style.display = 'none';
        retakeBtn.style.display = 'none';
        recordBtn.style.display = 'inline-block';
        recordingStatus.textContent = '';
        recordingStatus.className = 'recording-status';
        
        this.recordedBlob = null;
    }

    showRetakeOption() {
        const retakeBtn = document.getElementById('retakeBtn');
        retakeBtn.style.display = 'inline-block';
        
        // Stop camera preview
        if (this.currentStream) {
            this.currentStream.getTracks().forEach(track => track.stop());
            this.currentStream = null;
        }
        
        const preview = document.getElementById('preview');
        preview.style.display = 'none';
    }

    handleFileUpload(input) {
        const file = input.files[0];
        if (file) {
            const previewId = input.id === 'idFront' ? 'frontPreview' : 'backPreview';
            const preview = document.getElementById(previewId);
            
            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
            if (!allowedTypes.includes(file.type)) {
                alert('Please upload an image file (JPG, PNG, GIF, WebP)');
                input.value = '';
                return;
            }
            
            // Validate file size (10MB limit)
            if (file.size > 10 * 1024 * 1024) {
                alert('File size must be less than 10MB');
                input.value = '';
                return;
            }
            
            if (preview) {
                preview.innerHTML = `
                    <div style="color: #059669; font-weight: 600; padding: 10px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px;">
                        ✅ ${file.name} uploaded successfully
                        <div style="font-size: 12px; font-weight: normal; margin-top: 5px;">
                            Size: ${(file.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                    </div>
                `;
            }
            
            // Clear any error for this field
            this.clearFieldError(input);
            input.style.borderColor = '#059669';
            
            console.log(`File uploaded for ${input.id}:`, file.name, file.size, 'bytes');
        }
    }

    async submitForm() {
        console.log('Starting form submission...');
        
        // Validate required fields first
        if (!this.validateStep(4)) {
            console.log('Step 4 validation failed');
            return;
        }
        
        this.saveData();
        
        const formData = new FormData();
        
        // Get fresh form data from the actual form
        const form = document.getElementById('wizardForm');
        if (form) {
            const formDataObj = new FormData(form);
            for (let [key, value] of formDataObj.entries()) {
                // Skip file inputs and tracking fields - we'll handle them separately
                if (key !== 'idFront' && key !== 'idBack' && key !== 'video' && !key.endsWith('_hasFile')) {
                    formData.append(key, value);
                }
            }
        }
        
        // Add essential data from saved state (in case form missed something)
        const essentialFields = ['firstName', 'lastName', 'email', 'phone', 'location', 'experience', 'schedule'];
        essentialFields.forEach(field => {
            if (this.data[field] && !formData.has(field)) {
                formData.append(field, this.data[field]);
            }
        });

        // Add files (only if not already added from form data)
        const idFrontFile = document.getElementById('idFront');
        const idBackFile = document.getElementById('idBack');
        
        if (idFrontFile && idFrontFile.files[0]) {
            // Remove any existing idFront entries to avoid duplicates
            formData.delete('idFront');
            formData.append('idFront', idFrontFile.files[0]);
            console.log('Added front ID file:', idFrontFile.files[0].name);
        }
        
        if (idBackFile && idBackFile.files[0]) {
            // Remove any existing idBack entries to avoid duplicates
            formData.delete('idBack');
            formData.append('idBack', idBackFile.files[0]);
            console.log('Added back ID file:', idBackFile.files[0].name);
        }

        if (this.recordedBlob) {
            formData.append('video', this.recordedBlob, 'verification-video.webm');
            console.log('Added video blob');
        }

        // Log what we're sending
        console.log('FormData contents:');
        for (let [key, value] of formData.entries()) {
            console.log(`${key}:`, typeof value === 'object' ? value.name || 'File' : value);
        }

        try {
            // Show loading overlay
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
            
            const response = await fetch('/api/submit-application', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            console.log('Submission response:', result);

            if (response.ok && result.success) {
                localStorage.removeItem('wizardData');
                this.hideLoadingOverlay();
                this.showSuccessMessage(result);
            } else {
                throw new Error(result.message || 'Submission failed');
            }
        } catch (err) {
            console.error('Submission error:', err);
            this.hideLoadingOverlay();
            alert(`Submission failed: ${err.message}. Please try again.`);
            
            const submitBtn = document.getElementById('finalSubmit');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '🚀 Complete Application & Confirm Interview';
            }
        }
    }

    showSuccessMessage(result) {
        const successModal = document.getElementById('successModal');
        if (successModal) {
            successModal.innerHTML = `
                <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); padding: 50px; border-radius: 20px; text-align: center; max-width: 600px; margin: 0 auto; box-shadow: 0 25px 50px rgba(0,0,0,0.25); border: 1px solid #0ea5e9;">
                    <div style="background: linear-gradient(135deg, #059669, #10b981); width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 30px; box-shadow: 0 10px 20px rgba(5, 150, 105, 0.3);">
                        <span style="font-size: 40px; color: white;">✓</span>
                    </div>
                    <h2 style="color: #0c4a6e; margin-bottom: 15px; font-size: 28px; font-weight: 700;">Application Submitted Successfully!</h2>
                    <p style="color: #0369a1; font-size: 18px; margin-bottom: 30px; font-weight: 500;">Your application has been received and is being processed.</p>
                    
                    <div style="background: white; border-radius: 12px; padding: 25px; margin: 30px 0; border: 1px solid #bae6fd;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                            <span style="color: #64748b; font-weight: 500;">Application ID:</span>
                            <span style="color: #0f172a; font-weight: 700; font-family: monospace; background: #f1f5f9; padding: 5px 10px; border-radius: 6px;">${result.applicationId}</span>
                        </div>
                        ${result.applicantFolder ? `
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="color: #64748b; font-weight: 500;">Reference:</span>
                            <span style="color: #0f172a; font-weight: 600;">${result.applicantFolder}</span>
                        </div>
                        ` : ''}
                    </div>
                    
                    <div style="text-align: left; margin: 30px 0; background: #fefefe; border-radius: 12px; padding: 25px; border-left: 4px solid #10b981;">
                        <h4 style="color: #059669; margin-bottom: 15px; font-size: 18px; display: flex; align-items: center;">
                            <span style="margin-right: 10px;">📋</span> What Happens Next:
                        </h4>
                        <ul style="color: #374151; line-height: 1.8; padding-left: 0; list-style: none;">
                            ${result.nextSteps ? result.nextSteps.map(step => `
                                <li style="margin-bottom: 8px; display: flex; align-items: flex-start;">
                                    <span style="color: #10b981; margin-right: 10px; font-weight: bold;">✓</span>
                                    ${step}
                                </li>
                            `).join('') : `
                                <li style="margin-bottom: 8px; display: flex; align-items: flex-start;">
                                    <span style="color: #10b981; margin-right: 10px; font-weight: bold;">✓</span>
                                    Check your email for confirmation within 15 minutes
                                </li>
                                <li style="margin-bottom: 8px; display: flex; align-items: flex-start;">
                                    <span style="color: #10b981; margin-right: 10px; font-weight: bold;">✓</span>
                                    Prepare for a brief phone screening call
                                </li>
                                <li style="margin-bottom: 8px; display: flex; align-items: flex-start;">
                                    <span style="color: #10b981; margin-right: 10px; font-weight: bold;">✓</span>
                                    Background check will begin processing
                                </li>
                                <li style="display: flex; align-items: flex-start;">
                                    <span style="color: #10b981; margin-right: 10px; font-weight: bold;">✓</span>
                                    Interview scheduling confirmation coming soon
                                </li>
                            `}
                        </ul>
                    </div>
                    
                    <div style="margin-top: 40px;">
                        <button onclick="location.reload()" style="background: linear-gradient(135deg, #059669, #10b981); color: white; border: none; padding: 15px 30px; border-radius: 10px; cursor: pointer; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3); transition: all 0.3s ease; margin-right: 15px;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                            Submit Another Application
                        </button>
                        <button onclick="window.close()" style="background: transparent; color: #64748b; border: 2px solid #e2e8f0; padding: 15px 30px; border-radius: 10px; cursor: pointer; font-size: 16px; font-weight: 600; transition: all 0.3s ease;" onmouseover="this.style.borderColor='#94a3b8'; this.style.color='#475569'" onmouseout="this.style.borderColor='#e2e8f0'; this.style.color='#64748b'">
                            Close Window
                        </button>
                    </div>
                    
                    <p style="color: #94a3b8; font-size: 14px; margin-top: 30px; font-style: italic;">
                        Save this confirmation for your records. You can also screenshot this page.
                    </p>
                </div>
            `;
            successModal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.85);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 100000;
                backdrop-filter: blur(5px);
                animation: fadeIn 0.3s ease-out;
            `;
            
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