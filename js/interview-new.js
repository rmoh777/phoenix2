// Interview New Controller
class InterviewController {
    constructor() {
        this.form = document.getElementById('planForm');
        this.requirementsInput = document.getElementById('requirements');
        this.charCount = document.getElementById('charCount');
        this.loading = document.querySelector('.loading');
        this.errorMessage = document.getElementById('errorMessage');
        this.results = document.getElementById('results');
        this.findPlansBtn = document.getElementById('findPlansBtn');
        this.startOverBtn = document.getElementById('startOverBtn');
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Character counter
        this.requirementsInput.addEventListener('input', () => {
            this.charCount.textContent = this.requirementsInput.value.length;
        });

        // Form submission
        this.form.addEventListener('submit', this.handleSubmit.bind(this));

        // Start Over button
        this.startOverBtn.addEventListener('click', () => {
            window.location.reload();
        });
    }

    async handleSubmit(event) {
        event.preventDefault();
        
        // Validate input
        const requirements = this.requirementsInput.value.trim();
        if (requirements.length < 20) {
            this.showError('Please provide more details about your requirements (minimum 20 characters)');
            return;
        }

        // Show loading state
        this.showLoading();

        try {
            const data = await this.getRecommendations(requirements);
            this.renderResults(data);
        } catch (error) {
            this.showError(error.message);
        } finally {
            this.hideLoading();
        }
    }

    async getRecommendations(userInput) {
        const prompt = this.buildPrompt(userInput);

        try {
            const response = await fetch('/api/gemini', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt,
                    temperature: 0.2,
                    maxOutputTokens: 100
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to get recommendations');
            }

            const data = await response.json();
            if (!data.text) {
                throw new Error('Invalid response format from Gemini API');
            }

            // Parse the response text to extract plan IDs and ranks
            const planMatches = this.parsePlanMatches(data.text);
            if (!planMatches || planMatches.length !== 3) {
                throw new Error('Invalid plan recommendations received');
            }

            const recommendedPlans = this.getRecommendedPlans(planMatches);
            
            // Get explanations for the recommended plans
            const explanations = await this.getPlanExplanations(userInput, recommendedPlans);
            
            return {
                plans: recommendedPlans,
                explanations: explanations
            };
        } catch (error) {
            console.error('API Error:', error);
            throw new Error('Error getting recommendations: ' + error.message);
        }
    }

    buildPrompt(userInput) {
        const prompt = `You are a Lifeline program expert helping someone find government-assisted mobile plans for low-income households.

Based on this request: "${userInput}", recommend exactly 3 plan IDs from this list that best match the user's needs for affordable connectivity. 

Focus on:
- FREE or very low-cost plans (under $5/month) 
- Plans with "Lifeline" benefits
- Government assistance programs
- Basic connectivity needs

Rank them as "Best", "Great", and "Good". 
Return ONLY the 3 plan IDs as comma-separated numbers with their rank (example: "1:Best,7:Great,12:Good"). 

Plans: ${JSON.stringify(window.MOBILE_PLANS)}`;

        return prompt;
    }

    parsePlanMatches(text) {
        try {
            // Clean up the text and extract the plan matches
            const cleanText = text.trim();
            const matches = cleanText.split(',').map(item => {
                const [id, rank] = item.split(':').map(part => part.trim());
                if (!id || !rank) {
                    throw new Error('Invalid plan match format');
                }
                return {
                    id: parseInt(id),
                    rank: rank
                };
            });

            // Validate the matches
            if (matches.length !== 3) {
                throw new Error('Expected exactly 3 plan matches');
            }

            if (matches.some(match => isNaN(match.id) || !match.rank)) {
                throw new Error('Invalid plan ID or rank format');
            }

            return matches;
        } catch (error) {
            console.error('Error parsing plan matches:', error);
            throw new Error('Failed to parse plan recommendations');
        }
    }

    getRecommendedPlans(planMatches) {
        if (planMatches.length !== 3 || planMatches.some(match => isNaN(match.id))) {
            throw new Error('Invalid plan recommendations received');
        }

        return planMatches.map(match => {
            const plan = window.MOBILE_PLANS.find(plan => plan.id === match.id);
            return {
                ...plan,
                rank: match.rank,
                companyName: plan.carrier // Assuming 'carrier' is the company name
            };
        });
    }

    async getPlanExplanations(userInput, plans) {
        const prompt = `CRITICAL CONSTRAINT: You MUST write exactly 2 short sentences maximum for the overall summary. Any longer response will be REJECTED.

STRICT RULES:
- Individual plan explanations: 1 sentence only 
- Overall summary: EXACTLY 2 sentences maximum
- Use casual, everyday language
- NO plan numbers or IDs - only company names

EXAMPLE FORMAT YOU MUST FOLLOW:
PLAN_EXPLANATIONS:
IM TELECOM: Great plan with lots of data for just $1.
IM TELECOM: Solid option with unlimited data and decent price.
IM TELECOM: Free plan that gives you 6GB and unlimited texts.

OVERALL_SUMMARY:
These plans all give you tons of data and unlimited texts for super cheap prices. The main differences are just the cost and whether you qualify for free service.

User request: "${userInput}"

Plans:
${plans.map(plan => `
${plan.companyName} ${plan.name} (${plan.rank}):
- Price: $${plan.price}/mo
- Data: ${plan.data}
- Features: ${plan.features.join(', ')}
`).join('\n')}

RESPOND IN EXACT FORMAT SHOWN ABOVE. 2 SENTENCES MAX FOR SUMMARY OR YOUR RESPONSE WILL BE REJECTED.

PLAN_EXPLANATIONS:
${plans.map(plan => `${plan.companyName}: [1 sentence only]`).join('\n')}

OVERALL_SUMMARY:
[EXACTLY 2 sentences maximum explaining why these plans work together]`;

        try {
            const response = await fetch('/api/gemini', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt,
                    temperature: 0.3,
                    maxOutputTokens: 150
                })
            });

            if (!response.ok) {
                throw new Error('Failed to get plan explanations');
            }

            const data = await response.json();
            return this.parseExplanations(data.text);
        } catch (error) {
            console.error('Error getting explanations:', error);
            return {
                planExplanations: {},
                summary: 'Unable to generate explanations at this time.'
            };
        }
    }

    parseExplanations(text) {
        const planExplanations = {};
        // Updated regex to handle company names without "Plan" prefix
        const planMatches = text.match(/([A-Z\s]+(?:TELECOM|Telecom)?[^:]*): (.*?)(?=\n[A-Z\s]+(?:TELECOM|Telecom)?[^:]*:|$)/gs);
        
        if (planMatches) {
            planMatches.forEach(match => {
                const [_, companyName, explanation] = match.match(/([A-Z\s]+(?:TELECOM|Telecom)?[^:]*): (.*)/s);
                if (companyName && explanation) {
                    // Truncate to 1 sentence if too long
                    let truncatedExplanation = explanation.trim();
                    const sentences = truncatedExplanation.split(/[.!?]+/);
                    if (sentences.length > 1) {
                        truncatedExplanation = sentences[0] + '.';
                    }
                    planExplanations[companyName.trim()] = truncatedExplanation;
                }
            });
        }

        const summaryMatch = text.match(/OVERALL_SUMMARY:\s*\n(.*)/s);
        let summary = summaryMatch ? summaryMatch[1].trim() : '';
        
        // FORCE 2 sentence maximum - truncate if longer
        if (summary) {
            const sentences = summary.split(/[.!?]+/).filter(s => s.trim().length > 0);
            if (sentences.length > 2) {
                summary = sentences.slice(0, 2).join('. ') + '.';
            } else if (sentences.length <= 2) {
                summary = sentences.join('. ') + '.';
            }
        }

        return {
            planExplanations,
            summary
        };
    }

    renderResults(data) {
        const { plans, explanations } = data;
        
        // Add summary section
        const summaryHtml = `
            <div class="summary">
                <h3>Why These Plans?</h3>
                <p>${explanations.summary}</p>
            </div>
        `;

        // Add plan cards with explanations
        const plansHtml = `
            <div class="plans-row">
                ${plans.map(plan => `
                    <div class="plan-card">
                        <div class="plan-header">
                            <div class="rank-badge rank-${plan.rank.toLowerCase()}">${plan.rank}</div>
                            <div class="carrier">${plan.companyName}</div>
                            <div class="plan-name">${plan.name}</div>
                            <div class="price">$${plan.price}<span style="font-size:0.9rem;font-weight:400;">/mo</span></div>
                            ${plan.price === 0 ? '<div style="color: #22c55e; font-weight: bold; font-size: 0.9rem;">✓ FREE with Lifeline</div>' : ''}
                        </div>
                        <ul class="features">
                            <li>${plan.data} Data</li>
                            ${plan.features.map(feature => `<li>${feature}</li>`).join('')}
                            <li>Hotspot: ${plan.hotspot}</li>
                        </ul>
                        <div class="plan-explanation">
                            ${explanations.planExplanations[plan.companyName] || 'No explanation available.'}
                        </div>
                        <button class="plan-details-btn" tabindex="0">Check Eligibility & Apply</button>
                    </div>
                `).join('')}
            </div>
        `;

        this.results.innerHTML = summaryHtml + plansHtml;
        this.results.style.display = 'flex';
        
        // Hide Find My Plans, show Start Over
        this.findPlansBtn.style.display = 'none';
        this.startOverBtn.style.display = 'inline-block';
    }

    showLoading() {
        this.loading.style.display = 'block';
        this.form.style.display = 'none';
        this.errorMessage.style.display = 'none';
        this.results.style.display = 'none';
    }

    hideLoading() {
        this.loading.style.display = 'none';
        this.form.style.display = 'block';
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.errorMessage.style.display = 'block';
    }
}

// Initialize the controller when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new InterviewController();
}); 