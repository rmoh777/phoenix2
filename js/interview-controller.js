/**
 * InterviewController class for managing the interview flow
 */
class InterviewController {
    constructor() {
        this.stateManager = new StateManager();
        this.geminiService = new GeminiService();
        this.resultsRenderer = new ResultsRenderer();
        this.analytics = new Analytics();
        
        // Initialize UI elements
        this.initializeElements();
        
        // Bind event handlers
        this.bindEvents();
        
        // Start analytics tracking
        this.analytics.trackEvent('interview_started');
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
        
        // Preference buttons
        this.preferenceButtons = document.querySelectorAll('.preference-btn');
        
        // Text input
        this.preferencesText = document.getElementById('preferencesText');
        
        // Navigation buttons
        this.nextButtons = document.querySelectorAll('.next-btn');
        this.backButtons = document.querySelectorAll('.back-btn');
        
        // Results container
        this.resultsContainer = document.getElementById('resultsContainer');
        
        // Loading indicator
        this.loadingIndicator = document.getElementById('loadingIndicator');
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
        if (this.stateManager.setSelectedState(state)) {
            this.analytics.trackEvent('state_selected', { state });
            this.stateManager.recordInteraction('state_selection', { state });
            this.updateUI();
        }
    }

    /**
     * Handle preference button selection
     * @param {HTMLElement} button - Clicked button
     */
    handlePreferenceSelection(button) {
        const preference = button.dataset.preference;
        const isSelected = button.classList.contains('selected');
        
        if (isSelected) {
            if (this.stateManager.removePreference(preference)) {
                button.classList.remove('selected');
                this.analytics.trackEvent('preference_removed', { preference });
                this.stateManager.recordInteraction('preference_removed', { preference });
            }
        } else {
            if (this.stateManager.addPreference(preference)) {
                button.classList.add('selected');
                this.analytics.trackEvent('preference_selected', { preference });
                this.stateManager.recordInteraction('preference_selected', { preference });
            }
        }
        
        this.updateUI();
    }

    /**
     * Handle text input
     */
    handleTextInput() {
        const text = this.preferencesText.value;
        if (this.stateManager.setFreeFormText(text)) {
            this.analytics.trackEvent('preferences_text_updated');
            this.stateManager.recordInteraction('text_input', { length: text.length });
        }
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

        const select = document.getElementById('stateSelect');
        select.innerHTML = '<option value="">Select your state</option>' +
            states.map(state => `<option value="${state}">${state}</option>`).join('');
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
        const state = this.stateManager.getState();
        if (state.preferences.selectedButtons.length === 0 && !state.preferences.freeFormText.trim()) {
            alert('Please select at least one preference or describe what you\'re looking for.');
            return false;
        }
        return true;
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
} 