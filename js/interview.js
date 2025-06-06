// Character counter
const userInput = document.getElementById('userInput');
const charCount = document.getElementById('charCount');

userInput.addEventListener('input', function() {
    charCount.textContent = this.value.length;
});

// Get recommendations from Gemini API
async function getRecommendations() {
    const userInputText = document.getElementById('userInput').value.trim();
    
    if (!userInputText) {
        alert('Please enter your mobile plan requirements.');
        return;
    }

    // Show loading state
    document.getElementById('questionSection').style.display = 'none';
    document.getElementById('loading').style.display = 'block';

    try {
        // First API call - get plan recommendations
        const recommendationPrompt = `You are a mobile plan expert helping someone who might not be familiar with technical terms. Based on this request: "${userInputText}", recommend exactly 3 plan IDs from this list that best match the user's needs. Rank them as "Best", "Great", and "Good". Return ONLY the 3 plan IDs as comma-separated numbers with their rank (example: "1:Best,7:Great,12:Good"). Plans: ${JSON.stringify(MOBILE_PLANS)}`;

        const recommendationResponse = await callGeminiAPI(recommendationPrompt, 0.2, 100);
        
        // Defensive check before using .trim()
        if (typeof recommendationResponse !== 'string') {
            throw new Error('No recommendation response from API');
        }
        
        // Parse the plan IDs and ranks
        const planMatches = recommendationResponse.trim().split(',').map(item => {
            const [id, rank] = item.split(':');
            return { id: parseInt(id?.trim()), rank: rank?.trim() };
        });

        // Get the actual plan data
        const recommendedPlans = planMatches.map(match => {
            const plan = MOBILE_PLANS.find(p => p.id === match.id);
            return { ...plan, rank: match.rank };
        });

        // Second API call - get explanations
        const explanationPrompt = `You are a friendly mobile plan expert explaining things to someone who might not be familiar with technical terms. 
Use simple, everyday language that a high school student would understand. 
For each of these plans, provide:
1. A brief explanation (1-2 sentences) of why this plan matches the user's needs
2. A short summary of why these 3 plans were selected overall

User's request: "${userInputText}"

Plans:
${recommendedPlans.map(plan => `
Plan ${plan.id} (${plan.rank}):
- Name: ${plan.name}
- Carrier: ${plan.carrier}
- Price: $${plan.price}/mo
- Data: ${plan.data}
- Features: ${plan.features.join(', ')}
- Hotspot: ${plan.hotspot}
`).join('\n')}

Format your response exactly like this:
PLAN_EXPLANATIONS:
${recommendedPlans.map(plan => `Plan ${plan.id}: [Your explanation here]`).join('\n')}

OVERALL_SUMMARY:
[Your summary here]`;

        const explanationResponse = await callGeminiAPI(explanationPrompt, 0.7, 500);
        
        // Defensive check before using .trim() or parsing
        if (typeof explanationResponse !== 'string') {
            throw new Error('No explanation response from API');
        }
        
        // Parse the explanations
        const explanations = parseExplanations(explanationResponse);
        
        // Display results
        displayResults(recommendedPlans, explanations);
        
    } catch (error) {
        console.error('Error:', error);
        // Show more detailed error message
        const errorMessage = error.message || 'Unknown error occurred';
        alert(`Error: ${errorMessage}\n\nPlease try again or contact support if the problem persists.`);
    } finally {
        // Hide loading state
        document.getElementById('loading').style.display = 'none';
        document.getElementById('questionSection').style.display = 'block';
    }
}

// Call the Gemini API directly
async function callGeminiAPI(prompt, temperature = 0.7, maxOutputTokens = 500, retries = 3) {
    const API_KEY = 'AIzaSyBZpY3-IjZCgxF0a-nQ6Ovs4Pz6N6z1UM0';
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
    
    let lastError = null;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            console.log(`API call attempt ${attempt}/${retries}`);
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
                    }]
                })
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', Object.fromEntries(response.headers.entries()));

            const responseText = await response.text();
            console.log('Raw response:', responseText);

            let data;
            try {
                data = JSON.parse(responseText);
            } catch (e) {
                console.error('JSON parse error. Response was:', responseText);
                throw new Error('Server returned invalid response');
            }

            if (!response.ok) {
                // If it's a 503 and retryable, wait and try again
                if (response.status === 503 && attempt < retries) {
                    const waitTime = 2000 * attempt; // 2s, 4s, 6s
                    console.log(`API overloaded, retrying in ${waitTime}ms...`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                    continue;
                }
                throw new Error(data.error?.message || 'API request failed');
            }

            // Extract text from Gemini API response
            if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
                return data.candidates[0].content.parts[0].text;
            } else {
                throw new Error('Invalid response format from Gemini API');
            }

        } catch (error) {
            console.error(`Attempt ${attempt} failed:`, error);
            lastError = error;
            
            if (attempt < retries) {
                const waitTime = 1000 * attempt; // 1s, 2s, 3s
                console.log(`Waiting ${waitTime}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }
    }
    
    throw lastError || new Error('All API attempts failed');
}

function parseExplanations(text) {
    const planExplanations = {};
    const planMatches = text.match(/Plan (\d+): (.*?)(?=\nPlan \d+:|$)/gs);
    
    if (planMatches) {
        planMatches.forEach(match => {
            const [_, planId, explanation] = match.match(/Plan (\d+): (.*)/);
            planExplanations[planId] = explanation.trim();
        });
    }

    const summaryMatch = text.match(/OVERALL_SUMMARY:\n(.*)/s);
    const summary = summaryMatch ? summaryMatch[1].trim() : '';

    return {
        planExplanations,
        summary
    };
}

function displayResults(plans, explanations) {
    // Hide loading
    document.getElementById('loading').style.display = 'none';

    // Create plan cards
    const plansGrid = document.getElementById('plansGrid');
    plansGrid.innerHTML = '';

    plans.forEach(plan => {
        const card = document.createElement('div');
        card.className = 'plan-card';

        const rankClass = {
            'Best': 'rank-best',
            'Great': 'rank-great',
            'Good': 'rank-good'
        }[plan.rank] || 'rank-good';

        card.innerHTML = `
            <div class="plan-rank ${rankClass}">${plan.rank}</div>
            <div class="plan-carrier">${plan.carrier}</div>
            <div class="plan-name">${plan.name}</div>
            <div class="plan-price">$${plan.price}<span style="font-size: 0.875rem; font-weight: 400;">/mo</span></div>
            <ul class="plan-features">
                <li>Unlimited Data</li>
                <li>5G</li>
                <li>Premium streaming</li>
                <li>${plan.hotspot !== 'No' ? plan.hotspot + ' hotspot' : 'No hotspot'}</li>
                ${plan.features.includes('Netflix included') ? '<li>Netflix included</li>' : ''}
                ${plan.features.includes('HBO Max included') ? '<li>HBO Max included</li>' : ''}
                ${plan.features.includes('4K video') ? '<li>4K video</li>' : ''}
                ${plan.features.includes('International calling') ? '<li>International calling</li>' : ''}
            </ul>
            <div class="plan-explanation">
                ${explanations.planExplanations[plan.id] || 'This plan offers great value for your needs.'}
            </div>
            <a href="https://www.carrierURL.com" target="_blank" class="plan-details-btn">Full Plan Details</a>
        `;

        plansGrid.appendChild(card);
    });

    // Show results
    document.getElementById('resultsSection').style.display = 'block';
}

function startOver() {
    location.reload();
}

// Update the form submission handler
document.getElementById('interviewForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const submitButton = document.getElementById('submitButton');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const errorMessage = document.getElementById('errorMessage');
    
    try {
        // Show loading state
        submitButton.disabled = true;
        loadingSpinner.style.display = 'inline-block';
        errorMessage.textContent = '';
        
        // Get form data
        const formData = new FormData(this);
        const prompt = formData.get('prompt');
        
        // Call API with retry logic
        const response = await callGeminiAPI(prompt);
        
        // Handle successful response
        document.getElementById('response').textContent = response;
        document.getElementById('responseContainer').style.display = 'block';
        
    } catch (error) {
        console.error('Error:', error);
        errorMessage.textContent = error.message || 'An error occurred. Please try again.';
        errorMessage.style.display = 'block';
    } finally {
        // Reset loading state
        submitButton.disabled = false;
        loadingSpinner.style.display = 'none';
    }
}); 