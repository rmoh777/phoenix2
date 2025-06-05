/**
 * InterviewController class for managing the interview flow
 */
class InterviewController {
    constructor() {
        this.stateManager = new StateManager();
        this.geminiService = new GeminiService();
        this.resultsRenderer = new ResultsRenderer();
        this.analytics = new Analytics();
        this.sessionManager = new SessionManager();
        
        // Error handling state
        this.errorState = {
            hasError: false,
            currentError: null,
            errorContext: null
        };
        
        // Initialize UI elements
        this.initializeElements();
        
        // Bind event handlers
        this.bindEvents();
        
        // Start analytics tracking
        this.analytics.trackInterviewStart();
        
        // Initialize session
        this.initializeSession();

        this.currentStep = 'state';
        this.steps = ['state', 'preferences', 'results'];
        this.state = '';
        this.preferences = new Set();
        this.isMobile = window.innerWidth <= 768;
        this.touchStartX = 0;
        this.touchEndX = 0;
    }

    /**
     * Initialize UI elements
     */
    initializeElements() {
        // Step containers
        this.step1Container = document.getElementById('step1');
        this.step2Container = document.getElementById('step2');
        this.step3Container = document.getElementById('step3');
        
        // State selection
        this.stateSelect = document.getElementById('stateSelect');
        this.stateError = document.getElementById('stateError');
        
        // Preference buttons
        this.preferenceButtons = document.querySelectorAll('.preference-btn');
        this.preferencesError = document.getElementById('preferencesError');
        
        // Text input
        this.preferencesText = document.getElementById('preferencesText');
        this.textInputError = document.getElementById('textInputError');
        
        // Navigation buttons
        this.nextButtons = document.querySelectorAll('.next-btn');
        this.backButtons = document.querySelectorAll('.back-btn');
        
        // Results container
        this.resultsContainer = document.getElementById('resultsContainer');
        
        // Loading indicator
        this.loadingIndicator = document.getElementById('loadingIndicator');

        // Initialize state dropdown
        this.populateStateDropdown();
        
        // Restore previous preferences if they exist
        this.restorePreferences();
    }

    /**
     * Restore previous preferences
     */
    restorePreferences() {
        const savedPreferences = this.stateManager.getPreferences();
        
        // Restore button selections
        this.preferenceButtons.forEach(button => {
            const preference = button.dataset.preference;
            if (savedPreferences.selectedButtons.includes(preference)) {
                button.classList.add('selected');
            }
        });
        
        // Restore text input
        if (savedPreferences.freeFormText) {
            this.preferencesText.value = savedPreferences.freeFormText;
        }
    }

    /**
     * Bind event handlers
     */
    bindEvents() {
        // State selection
        this.stateSelect.addEventListener('change', () => this.handleStateSelection());
        
        // Preference buttons
        this.preferenceButtons.forEach(button => {
            button.addEventListener('click', () => this.handlePreferenceSelection(button));
        });
        
        // Text input
        this.preferencesText.addEventListener('input', () => this.handleTextInput());
        
        // Navigation buttons
        this.nextButtons.forEach(button => {
            button.addEventListener('click', () => this.handleNext(button));
        });
        
        this.backButtons.forEach(button => {
            button.addEventListener('click', () => this.handleBack(button));
        });
    }

    /**
     * Handle state selection
     */
    handleStateSelection() {
        const state = this.stateSelect.value;
        
        // Clear previous error
        this.stateError.textContent = '';
        
        // Validate state selection
        if (!state) {
            this.stateError.textContent = 'Please select a state';
            this.stateSelect.classList.add('error');
            return;
        }
        
        // Update state manager
        if (this.stateManager.setSelectedState(state)) {
            // Update UI
            this.stateSelect.classList.remove('error');
            this.stateSelect.classList.add('selected');
            
            // Update available providers
            const availableProviders = this.stateManager.getAvailableProviders();
            this.updateProviderAvailability(availableProviders);
            
            // Track analytics
            this.analytics.trackStateSelection(state);
            this.stateManager.recordInteraction('state_selection', { state });
            
            // Update UI state
            this.updateUI();
        } else {
            this.stateError.textContent = 'Invalid state selection';
            this.stateSelect.classList.add('error');
        }
    }

    /**
     * Update provider availability based on selected state
     * @param {Array} providers - Available providers for the state
     */
    updateProviderAvailability(providers) {
        // Update provider cards visibility
        document.querySelectorAll('.provider-card').forEach(card => {
            const providerId = card.dataset.providerId;
            const isAvailable = providers.some(p => p.id === providerId);
            card.style.display = isAvailable ? 'block' : 'none';
        });
    }

    /**
     * Populate the state dropdown with all US states
     */
    populateStateDropdown() {
        const states = [
            'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
            'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
            'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
            'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
            'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
            'DC'
        ];

        // Clear existing options
        this.stateSelect.innerHTML = '<option value="">Select your state</option>';
        
        // Add state options
        states.forEach(state => {
            const option = document.createElement('option');
            option.value = state;
            option.textContent = state;
            this.stateSelect.appendChild(option);
        });

        // Restore previous selection if exists
        const savedState = this.stateManager.getSelectedState();
        if (savedState) {
            this.stateSelect.value = savedState;
            this.stateSelect.classList.add('selected');
        }
    }

    /**
     * Update UI based on current state
     */
    updateUI() {
        const currentStep = this.stateManager.getCurrentStep();
        const selectedState = this.stateManager.getSelectedState();
        const preferences = this.stateManager.getPreferences();
        
        // Update next button state
        this.nextButtons.forEach(button => {
            const step = parseInt(button.dataset.step);
            if (step === 1) {
                button.disabled = !selectedState;
            } else if (step === 2) {
                // Enable next button if there are any preferences
                const hasPreferences = preferences.selectedButtons.length > 0 || preferences.freeFormText.trim().length > 0;
                button.disabled = !hasPreferences;
            }
        });
        
        // Update progress indicator
        this.updateProgressIndicator(currentStep);
        
        // Update preference buttons state
        this.updatePreferenceButtonsState();
    }

    /**
     * Update progress indicator
     * @param {number} currentStep - Current step number
     */
    updateProgressIndicator(currentStep) {
        document.querySelectorAll('.progress-step').forEach((step, index) => {
            step.classList.toggle('active', index + 1 === currentStep);
            step.classList.toggle('completed', index + 1 < currentStep);
        });
    }

    /**
     * Handle preference button selection
     * @param {HTMLElement} button - Clicked button
     */
    handlePreferenceSelection(button) {
        const preference = button.dataset.preference;
        const isSelected = button.classList.toggle('selected');
        
        // Update state manager
        if (isSelected) {
            this.stateManager.addPreference(preference);
            this.analytics.trackPreferenceSelection(preference, true);
            this.stateManager.recordInteraction('preference_selected', { preference });
        } else {
            this.stateManager.removePreference(preference);
            this.analytics.trackPreferenceSelection(preference, false);
            this.stateManager.recordInteraction('preference_removed', { preference });
        }
        
        // Update UI state
        this.updateUI();
    }

    /**
     * Handle text input
     */
    handleTextInput() {
        const text = this.preferencesText.value.trim();
        
        // Clear previous error
        this.textInputError.textContent = '';
        
        // Update state manager
        if (this.stateManager.setFreeFormText(text)) {
            this.analytics.trackTextInput(text.length);
            this.stateManager.recordInteraction('text_input', { length: text.length });
        }
        
        // Update UI state
        this.updateUI();
    }

    /**
     * Handle next button click
     * @param {HTMLElement} button - Clicked button
     */
    async handleNext(button) {
        const currentStep = this.stateManager.getCurrentStep();
        
        // Validate current step
        if (!this.validateStep(currentStep)) {
            this.showError(`Please complete all required fields in step ${currentStep}`);
            return;
        }
        
        // Record step completion
        document.getElementById('prevBtn').addEventListener('click', () => this.previousStep());
        document.getElementById('nextBtn').addEventListener('click', () => this.nextStep());
        document.getElementById('restartBtn').addEventListener('click', () => this.restart());

        // State selection
        document.getElementById('stateSelect').addEventListener('change', (e) => {
            this.stateManager.setSelectedState(e.target.value);
        });

        // Preference buttons
        document.querySelectorAll('.preference-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const preference = e.target.dataset.preference;
                if (e.target.classList.contains('selected')) {
                    e.target.classList.remove('selected');
                    this.stateManager.removePreference(preference);
                } else {
                    e.target.classList.add('selected');
                    this.stateManager.addPreference(preference);
                }
            });
        });

        // Free form text
        document.getElementById('customPreferences').addEventListener('input', (e) => {
            this.stateManager.setFreeFormText(e.target.value);
        });
    }

    /**
     * Show a specific step
     * @param {number} step - Step number to show
     */
    showStep(step) {
        // Hide all steps
        document.querySelectorAll('.interview-step').forEach(el => {
            el.classList.remove('active');
        });

        // Show selected step
        document.getElementById(`step-${this.getStepName(step)}`).classList.add('active');

        // Update progress indicator
        document.querySelectorAll('.progress-step').forEach((el, index) => {
            el.classList.toggle('active', index + 1 === step);
        });

        // Update navigation buttons
        this.updateNavigationButtons(step);

        // Record step time
        this.stateManager.recordStepTime(step);
    }

    /**
     * Get step name from step number
     * @param {number} step - Step number
     * @returns {string} Step name
     */
    getStepName(step) {
        const stepNames = ['state', 'preferences', 'results'];
        return stepNames[step - 1];
    }

    /**
     * Update navigation buttons based on current step
     * @param {number} step - Current step
     */
    updateNavigationButtons(step) {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');

        prevBtn.style.display = step === 1 ? 'none' : 'block';
        nextBtn.style.display = step === this.totalSteps ? 'none' : 'block';
        nextBtn.textContent = step === this.totalSteps - 1 ? 'Get Results' : 'Next';
    }

    /**
     * Move to the next step
     */
    nextStep() {
        if (this.validateCurrentStep()) {
            const nextStep = this.currentStep + 1;
            if (nextStep <= this.totalSteps) {
                this.currentStep = nextStep;
                this.stateManager.setCurrentStep(nextStep);
                this.showStep(nextStep);

                // If moving to results, fetch recommendations
                if (nextStep === this.totalSteps) {
                    this.processRecommendations();
                }
            }
        }
    }

    /**
     * Move to the previous step
     */
    previousStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.stateManager.setCurrentStep(this.currentStep);
            this.showStep(this.currentStep);
        }
    }

    /**
     * Restart the interview
     */
    restart() {
        this.stateManager.resetState();
        this.currentStep = 1;
        this.showStep(1);
    }

    /**
     * Validate the current step
     * @returns {boolean} Whether the step is valid
     */
    validateCurrentStep() {
        switch (this.currentStep) {
            case 1:
                return this.validateStateSelection();
            case 2:
                return this.validatePreferences();
            default:
                return true;
        }
    }

    /**
     * Validate state selection
     * @returns {boolean} Whether state is selected
     */
    validateStateSelection() {
        const state = this.stateManager.getState().selectedState;
        if (!state) {
            alert('Please select your state to continue.');
            return false;
        }
        return true;
    }

    /**
     * Validate preferences
     * @returns {boolean} Whether preferences are valid
     */
    validatePreferences() {
        const preferences = this.stateManager.getPreferences();
        let isValid = true;
        
        // Check if there are any preferences
        if (preferences.selectedButtons.length === 0 && preferences.freeFormText.trim().length === 0) {
            this.preferencesError.textContent = 'Please select at least one preference or enter your requirements';
            isValid = false;
        } else {
            this.preferencesError.textContent = '';
        }
        
        // Validate text input length
        if (preferences.freeFormText.trim().length > 500) {
            this.textInputError.textContent = 'Additional preferences must be 500 characters or less';
            isValid = false;
        } else {
            this.textInputError.textContent = '';
        }
        
        return isValid;
    }

    /**
     * Process recommendations using Gemini service
     */
    async processRecommendations() {
        try {
            const state = this.stateManager.getState();
            const geminiService = new GeminiService();
            const results = await geminiService.getRecommendations(
                state.selectedState,
                state.preferences,
                LIFELINE_PROVIDERS
            );
            
            this.stateManager.setResults(results);
            this.renderResults(results);
        } catch (error) {
            console.error('Error getting recommendations:', error);
            alert('Sorry, there was an error getting your recommendations. Please try again.');
        }
    }

    /**
     * Render the results
     * @param {Object} results - Results from Gemini
     */
    renderResults(results) {
        const renderer = new ResultsRenderer();
        renderer.renderComparison(results.recommendations);
    }

    /**
     * Handle errors in the interview flow
     * @param {Error} error - The error object
     * @param {string} context - The context where the error occurred
     * @param {Object} options - Additional error handling options
     */
    handleError(error, context, options = {}) {
        // Set error state
        this.errorState.hasError = true;
        this.errorState.currentError = error;
        this.errorState.errorContext = context;

        // Track error in analytics
        this.analytics.trackError(error, context);

        // Log error for debugging
        console.error(`Error in ${context}:`, error);

        // Show error message to user
        this.showErrorMessage(error, context, options);

        // Handle specific error types
        if (error instanceof NetworkError) {
            this.handleNetworkError(error);
        } else if (error instanceof ValidationError) {
            this.handleValidationError(error);
        } else if (error instanceof APIError) {
            this.handleAPIError(error);
        } else {
            this.handleGenericError(error);
        }
    }

    /**
     * Show error message to user
     * @param {Error} error - The error object
     * @param {string} context - The context where the error occurred
     * @param {Object} options - Additional error handling options
     */
    showErrorMessage(error, context, options = {}) {
        const errorContainer = document.getElementById('errorContainer');
        if (!errorContainer) return;

        // Create error message
        const errorMessage = this.formatErrorMessage(error, context);
        
        // Update error container
        errorContainer.innerHTML = `
            <div class="error-message ${options.severity || 'error'}">
                <div class="error-icon">⚠️</div>
                <div class="error-content">
                    <h3>${errorMessage.title}</h3>
                    <p>${errorMessage.message}</p>
                    ${errorMessage.action ? `<button class="error-action">${errorMessage.action}</button>` : ''}
                </div>
            </div>
        `;

        // Show error container
        errorContainer.style.display = 'block';

        // Add action button handler if present
        if (errorMessage.action) {
            const actionButton = errorContainer.querySelector('.error-action');
            actionButton.addEventListener('click', () => this.handleErrorAction(error, context));
        }

        // Auto-hide error after timeout if specified
        if (options.autoHide) {
            setTimeout(() => {
                this.clearError();
            }, options.autoHide);
        }
    }

    /**
     * Format error message for display
     * @param {Error} error - The error object
     * @param {string} context - The context where the error occurred
     * @returns {Object} Formatted error message
     */
    formatErrorMessage(error, context) {
        const errorMessages = {
            network: {
                title: 'Connection Error',
                message: 'Unable to connect to the server. Please check your internet connection and try again.',
                action: 'Retry'
            },
            validation: {
                title: 'Invalid Input',
                message: error.message || 'Please check your input and try again.',
                action: 'Fix Input'
            },
            api: {
                title: 'Service Error',
                message: 'We encountered an issue with our service. Please try again later.',
                action: 'Try Again'
            },
            default: {
                title: 'Something Went Wrong',
                message: 'An unexpected error occurred. Please try again.',
                action: 'Retry'
            }
        };

        return errorMessages[error.type] || errorMessages.default;
    }

    /**
     * Handle network errors
     * @param {NetworkError} error - The network error
     */
    handleNetworkError(error) {
        // Show offline indicator
        this.showOfflineIndicator();
        
        // Attempt to reconnect
        this.attemptReconnection();
    }

    /**
     * Handle validation errors
     * @param {ValidationError} error - The validation error
     */
    handleValidationError(error) {
        // Highlight invalid fields
        this.highlightInvalidFields(error.fields);
        
        // Focus first invalid field
        if (error.fields.length > 0) {
            const firstField = document.getElementById(error.fields[0]);
            if (firstField) firstField.focus();
        }
    }

    /**
     * Handle API errors
     * @param {APIError} error - The API error
     */
    handleAPIError(error) {
        // Check if error is retryable
        if (error.isRetryable) {
            this.retryFailedRequest(error);
        } else {
            // Show fallback content
            this.showFallbackContent();
        }
    }

    /**
     * Handle generic errors
     * @param {Error} error - The generic error
     */
    handleGenericError(error) {
        // Log error for debugging
        console.error('Generic error:', error);
        
        // Show generic error message
        this.showErrorMessage(error, 'generic');
    }

    /**
     * Clear current error state
     */
    clearError() {
        this.errorState.hasError = false;
        this.errorState.currentError = null;
        this.errorState.errorContext = null;

        // Hide error container
        const errorContainer = document.getElementById('errorContainer');
        if (errorContainer) {
            errorContainer.style.display = 'none';
            errorContainer.innerHTML = '';
        }
    }

    /**
     * Handle error action button click
     * @param {Error} error - The error object
     * @param {string} context - The context where the error occurred
     */
    handleErrorAction(error, context) {
        switch (context) {
            case 'network':
                this.retryFailedRequest(error);
                break;
            case 'validation':
                this.focusFirstInvalidField(error);
                break;
            case 'api':
                this.retryAPIRequest(error);
                break;
            default:
                this.retryLastAction();
        }
    }

    initializeSession() {
        // Check for saved session
        this.checkSavedSession();
    }

    checkSavedSession() {
        const savedSession = this.sessionManager.loadSession();
        if (savedSession) {
            // Show resume dialog
            if (confirm('Would you like to continue where you left off?')) {
                this.restoreSession(savedSession);
                this.analytics.trackSessionResume({
                    age: this.sessionManager.getSessionAge(),
                    step: savedSession.currentStep
                });
            } else {
                this.sessionManager.clearSession();
            }
        }
    }

    restoreSession(session) {
        // Restore state
        if (session.selectedState) {
            this.stateManager.setSelectedState(session.selectedState);
        }

        // Restore preferences
        if (session.preferences) {
            this.stateManager.setPreferences(session.preferences);
        }

        // Restore step
        if (session.currentStep) {
            this.stateManager.setCurrentStep(session.currentStep);
        }

        // Update UI
        this.updateUI();
    }

    saveCurrentSession() {
        const sessionState = {
            currentStep: this.stateManager.getCurrentStep(),
            selectedState: this.stateManager.getSelectedState(),
            preferences: this.stateManager.getPreferences()
        };
        this.sessionManager.saveSession(sessionState);
    }

    init() {
        this.setupEventListeners();
        this.populateStates();
        this.checkForExistingSession();
        this.analytics.trackPageView('interview');
        
        // Add mobile-specific event listeners
        if (this.isMobile) {
            this.setupMobileEventListeners();
        }
    }

    setupEventListeners() {
        // State selection
        this.stateSelect.addEventListener('change', this.handleStateChange);
        
        // Preference buttons
        this.preferenceButtons.forEach(btn => {
            btn.addEventListener('click', this.handlePreferenceClick);
        });
        
        // Navigation
        this.backButtons.forEach(btn => {
            btn.addEventListener('click', () => this.handleNavigation('prev'));
        });
        
        // Window resize
        window.addEventListener('resize', this.handleResize.bind(this));
    }

    setupMobileEventListeners() {
        const container = document.querySelector('.interview-container');
        
        // Touch events for swipe navigation
        container.addEventListener('touchstart', this.handleTouchStart, { passive: true });
        container.addEventListener('touchmove', this.handleTouchMove, { passive: true });
        container.addEventListener('touchend', this.handleTouchEnd);
        
        // Prevent pull-to-refresh
        document.body.style.overscrollBehavior = 'none';
        
        // Add haptic feedback
        if ('vibrate' in navigator) {
            this.addHapticFeedback();
        }
    }

    handleResize() {
        const wasMobile = this.isMobile;
        this.isMobile = window.innerWidth <= 768;
        
        if (wasMobile !== this.isMobile) {
            if (this.isMobile) {
                this.setupMobileEventListeners();
            } else {
                this.removeMobileEventListeners();
            }
        }
    }

    handleTouchStart(e) {
        this.touchStartX = e.touches[0].clientX;
    }

    handleTouchMove(e) {
        this.touchEndX = e.touches[0].clientX;
    }

    handleTouchEnd() {
        const swipeThreshold = 50;
        const diff = this.touchStartX - this.touchEndX;
        
        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                // Swipe left - go to next step
                this.handleNavigation('next');
            } else {
                // Swipe right - go to previous step
                this.handleNavigation('prev');
            }
            
            // Provide haptic feedback
            if ('vibrate' in navigator) {
                navigator.vibrate(50);
            }
        }
    }

    addHapticFeedback() {
        // Add haptic feedback to buttons
        this.nextButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                navigator.vibrate(50);
            });
        });
    }

    handleStateChange(e) {
        this.state = e.target.value;
        this.stateError.textContent = '';
        
        // Track state selection
        this.analytics.trackEvent('state_selected', {
            state: this.state
        });
        
        // Save session
        this.saveSession();
    }

    handlePreferenceClick(e) {
        const btn = e.currentTarget;
        const preference = btn.dataset.preference;
        
        btn.classList.toggle('selected');
        
        if (btn.classList.contains('selected')) {
            this.preferences.add(preference);
        } else {
            this.preferences.delete(preference);
        }
        
        // Track preference selection
        this.analytics.trackEvent('preference_selected', {
            preference,
            selected: btn.classList.contains('selected')
        });
        
        // Save session
        this.saveSession();
    }

    handleNavigation(direction) {
        const currentIndex = this.steps.indexOf(this.currentStep);
        let nextIndex;
        
        if (direction === 'next') {
            if (!this.validateCurrentStep()) return;
            nextIndex = currentIndex + 1;
        } else {
            nextIndex = currentIndex - 1;
        }
        
        if (nextIndex >= 0 && nextIndex < this.steps.length) {
            this.showStep(this.steps[nextIndex]);
        }
        
        // Track navigation
        this.analytics.trackEvent('step_navigation', {
            from: this.currentStep,
            to: this.steps[nextIndex],
            direction
        });
    }

    validateCurrentStep() {
        switch (this.currentStep) {
            case 'state':
                if (!this.state) {
                    this.stateError.textContent = 'Please select your state';
                    return false;
                }
                break;
                
            case 'preferences':
                if (this.preferences.size === 0) {
                    this.preferencesError.textContent = 'Please select at least one preference';
                    return false;
                }
                break;
        }
        
        return true;
    }

    showStep(step) {
        // Hide all steps
        document.querySelectorAll('.interview-step').forEach(el => {
            el.classList.remove('active');
        });
        
        // Show selected step
        document.getElementById(`${step}Step`).classList.add('active');
        
        // Update progress indicator
        document.querySelectorAll('.progress-step').forEach(el => {
            el.classList.remove('active');
            if (el.dataset.step === step) {
                el.classList.add('active');
            }
        });
        
        // Update navigation buttons
        this.backButtons.forEach(btn => {
            btn.disabled = step === 'state';
        });
        
        this.currentStep = step;
    }

    async fetchRecommendations() {
        this.loadingIndicator.style.display = 'block';
        this.resultsContainer.innerHTML = '';
        
        try {
            const response = await this.makeApiRequest({
                preferences: {
                    state: this.state,
                    preferences: Array.from(this.preferences),
                    additionalInfo: document.getElementById('preferencesText').value
                }
            });
            
            this.displayResults(response);
            
            // Track successful recommendations
            this.analytics.trackEvent('recommendations_received', {
                state: this.state,
                preferenceCount: this.preferences.size
            });
        } catch (error) {
            this.handleError(error);
            
            // Track error
            this.analytics.trackEvent('recommendations_error', {
                error: error.message
            });
        } finally {
            this.loadingIndicator.style.display = 'none';
        }
    }

    displayResults(response) {
        const container = this.resultsContainer;
        container.innerHTML = '';
        
        if (!response.recommendations || response.recommendations.length === 0) {
            container.innerHTML = `
                <div class="no-results">
                    <h3>No Plans Found</h3>
                    <p>We couldn't find any plans matching your preferences. Please try adjusting your selections.</p>
                </div>
            `;
            return;
        }
        
        const resultsList = document.createElement('div');
        resultsList.className = 'results-list';
        
        response.recommendations.forEach(plan => {
            const planElement = document.createElement('div');
            planElement.className = 'plan-card';
            planElement.innerHTML = `
                <h3>${plan.name}</h3>
                <p>${plan.description}</p>
                <div class="plan-details">
                    <span class="price">$${plan.price}/month</span>
                    <a href="${plan.applyUrl}" class="btn btn-primary" target="_blank">Apply Now</a>
                </div>
            `;
            resultsList.appendChild(planElement);
        });
        
        container.appendChild(resultsList);
    }

    saveSession() {
        this.sessionManager.saveSession({
            currentStep: this.currentStep,
            state: this.state,
            preferences: Array.from(this.preferences),
            additionalInfo: document.getElementById('preferencesText').value
        });
    }

    checkForExistingSession() {
        const session = this.sessionManager.getSession();
        if (session) {
            const sessionAge = this.sessionManager.getSessionAge();
            if (sessionAge < 24 * 60 * 60 * 1000) { // 24 hours
                if (confirm('Would you like to continue where you left off?')) {
                    this.restoreSession(session);
                    
                    // Track session resume
                    this.analytics.trackEvent('session_resumed', {
                        sessionAge: Math.floor(sessionAge / 1000 / 60), // in minutes
                        currentStep: session.currentStep
                    });
                } else {
                    this.sessionManager.clearSession();
                }
            } else {
                this.sessionManager.clearSession();
            }
        }
    }

    populateStates() {
        const states = [
            'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California',
            'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia',
            'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
            'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland',
            'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri',
            'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey',
            'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
            'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina',
            'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
            'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
        ];
        
        states.forEach(state => {
            const option = document.createElement('option');
            option.value = state;
            option.textContent = state;
            this.stateSelect.appendChild(option);
        });
    }
} 