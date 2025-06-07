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
            const API_KEY = 'AIzaSyBZpY3-IjZCgxF0a-nQ6Ovs4Pz6N6z1UM0';
            const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
            
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.2,
                        maxOutputTokens: 100
                    }
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to get recommendations');
            }

            const data = await response.json();
            if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
                throw new Error('Invalid response format from Gemini API');
            }

            const responseText = data.candidates[0].content.parts[0].text;

            // Parse the response text to extract plan IDs and ranks
            const planMatches = this.parsePlanMatches(responseText);
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
        const prompt = `You are a concise telecom plan advisor. Respond in this exact format:

PLAN_EXPLANATIONS:
${plans.map(plan => `${plan.companyName}: [One benefit in 8 words max]`).join('\n')}

SUMMARY: [Two facts about the plans in 15 words total]

Example:
PLAN_EXPLANATIONS:
Verizon: Unlimited data with premium network coverage
T-Mobile: Cheapest unlimited plan with decent speeds

SUMMARY: Verizon costs more but faster. T-Mobile saves money.

User request: "${userInput}"

Plans available:
${plans.map(plan => `
${plan.companyName} ${plan.name}: $${plan.price}/mo, ${plan.data}, ${plan.features.join(', ')}
`).join('')}

Respond in exact format shown above.`;

        try {
            const API_KEY = 'AIzaSyBZpY3-IjZCgxF0a-nQ6Ovs4Pz6N6z1UM0';
            const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
            
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.1,
                        maxOutputTokens: 100
                    }
                })
            });

            if (!response.ok) {
                throw new Error('Failed to get plan explanations');
            }

            const data = await response.json();
            const responseText = data.candidates[0].content.parts[0].text;
            return this.parseExplanations(responseText);
        } catch (error) {
            console.error('Error getting explanations:', error);
            return {
                planExplanations: {},
                summary: 'Unable to generate explanations at this time.'
            };
        }
    }

    parseExplanations(text) {
        console.log("RAW GEMINI RESPONSE:", text); // DEBUG: See what Gemini actually returns
        
        const planExplanations = {};
        let summary = '';

        try {
            // Split response into sections
            const sections = text.split('SUMMARY:');
            const planSection = sections[0];
            const summarySection = sections[1];

            // Parse PLAN_EXPLANATIONS section
            if (planSection.includes('PLAN_EXPLANATIONS:')) {
                const explanationText = planSection.split('PLAN_EXPLANATIONS:')[1];
                const lines = explanationText.split('\n').filter(line => line.trim());
                
                lines.forEach(line => {
                    if (line.includes(':')) {
                        const [company, explanation] = line.split(':').map(s => s.trim());
                        if (company && explanation) {
                            planExplanations[company] = explanation;
                        }
                    }
                });
            }

            // Parse SUMMARY section
            if (summarySection) {
                summary = summarySection.trim();
            }

            console.log("PARSED EXPLANATIONS:", planExplanations); // DEBUG
            console.log("PARSED SUMMARY:", summary); // DEBUG

        } catch (error) {
            console.error("Parsing error:", error);
            // Fallback: create short explanations manually
            summary = "These plans offer affordable connectivity options.";
        }

        return {
            planExplanations,
            summary: summary || "Great affordable mobile plan options selected for you."
        };
    }

    renderResults(data) {
        const { plans, explanations } = data;
        
        // Add summary section with light blue background
        const summaryHtml = `
            <div style="background: #EEF2FF; border: 1px solid #C7D2FE; border-radius: 12px; padding: 1.5rem; margin-bottom: 2rem; text-align: left;">
                <h3 style="font-size: 1.25rem; font-weight: 600; color: #4F46E5; margin-bottom: 1rem;">Why These Plans?</h3>
                <p style="color: #374151; line-height: 1.6; margin: 0;">${explanations.summary}</p>
            </div>
        `;

        // Add plan cards with proper 3-column grid
        const plansHtml = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
                ${plans.map(plan => {
                    // Get rank badge color
                    const rankStyles = {
                        'Best': 'background: #2563EB; color: white;',
                        'Great': 'background: #059669; color: white;',
                        'Good': 'background: #D97706; color: white;'
                    };
                    const rankStyle = rankStyles[plan.rank] || rankStyles['Good'];

                    return `
                        <div style="background: white; border: 1px solid #E5E7EB; border-radius: 12px; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); transition: transform 0.2s, box-shadow 0.2s;">
                            <div style="text-align: center; margin-bottom: 1.5rem;">
                                <div style="display: inline-block; padding: 0.25rem 0.75rem; border-radius: 1rem; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.75rem; ${rankStyle}">${plan.rank}</div>
                                <div style="font-size: 0.875rem; color: #6B7280; margin-bottom: 0.25rem;">${plan.companyName}</div>
                                <div style="font-size: 1.25rem; font-weight: 600; color: #111827; margin-bottom: 0.5rem;">${plan.name}</div>
                                <div style="font-size: 1.5rem; font-weight: 700; color: #4F46E5; margin-bottom: 1rem;">$${plan.price}<span style="font-size: 0.9rem; font-weight: 400;">/mo</span></div>
                                ${plan.price === 0 ? '<div style="color: #22c55e; font-weight: bold; font-size: 0.9rem;">✓ FREE with Lifeline</div>' : ''}
                            </div>
                            <ul style="list-style: none; margin: 0 0 1rem 0; padding: 0;">
                                <li style="display: flex; align-items: center; margin-bottom: 0.5rem; font-size: 0.875rem; color: #374151;"><span style="color: #10B981; font-weight: bold; margin-right: 0.5rem;">✓</span>${plan.data} Data</li>
                                ${plan.features.map(feature => `<li style="display: flex; align-items: center; margin-bottom: 0.5rem; font-size: 0.875rem; color: #374151;"><span style="color: #10B981; font-weight: bold; margin-right: 0.5rem;">✓</span>${feature}</li>`).join('')}
                                <li style="display: flex; align-items: center; margin-bottom: 0.5rem; font-size: 0.875rem; color: #374151;"><span style="color: #10B981; font-weight: bold; margin-right: 0.5rem;">✓</span>Hotspot: ${plan.hotspot}</li>
                            </ul>
                            <div style="background: #F9FAFB; border-radius: 8px; padding: 1rem; margin-bottom: 1rem; font-size: 0.875rem; color: #374151; line-height: 1.5;">
                                ${explanations.planExplanations[plan.companyName] || 'This plan offers great value for your needs.'}
                            </div>
                            <button style="background: #4F46E5; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; font-size: 0.875rem; font-weight: 500; cursor: pointer; width: 100%; transition: background 0.2s;" onmouseover="this.style.background='#4338CA'" onmouseout="this.style.background='#4F46E5'">Full Plan Details</button>
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        this.results.innerHTML = summaryHtml + plansHtml;
        this.results.style.display = 'flex';
        this.results.style.flexDirection = 'column';
        
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