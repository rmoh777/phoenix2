// Character counter
const userInput = document.getElementById('userInput');
const charCount = document.getElementById('charCount');

userInput.addEventListener('input', function() {
    charCount.textContent = this.value.length;
});

// Get recommendations from Gemini API
async function getRecommendations() {
    const userInput = document.getElementById('userInput').value.trim();
    
    if (!userInput) {
        alert('Please enter your mobile plan requirements.');
        return;
    }

    // Show loading state
    document.getElementById('questionSection').style.display = 'none';
    document.getElementById('loading').style.display = 'block';

    try {
        // First API call - get plan recommendations
        const recommendationPrompt = `You are a mobile plan expert helping someone who might not be familiar with technical terms. Based on this request: "${userInput}", recommend exactly 3 plan IDs from this list that best match the user's needs. Rank them as "Best", "Great", and "Good". Return ONLY the 3 plan IDs as comma-separated numbers with their rank (example: "1:Best,7:Great,12:Good"). Plans: ${JSON.stringify(MOBILE_PLANS)}`;

        const recommendationResponse = await fetch('/api/gemini', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: recommendationPrompt,
                temperature: 0.2,
                maxOutputTokens: 100
            })
        });

        console.log('Response status:', recommendationResponse.status);
        console.log('Response headers:', recommendationResponse.headers.get('content-type'));
        
        const responseText = await recommendationResponse.text();
        console.log('Raw response:', responseText);
        
        let recommendationData;
        try {
            recommendationData = JSON.parse(responseText);
        } catch (parseError) {
            console.error('JSON parse error:', parseError);
            console.error('Response was not JSON:', responseText);
            throw new Error(`API returned invalid response (likely HTML error page): ${responseText.substring(0, 100)}...`);
        }
        
        console.log('Recommendation API Response:', recommendationData);
        
        if (!recommendationResponse.ok) {
            console.error('API Error Response:', recommendationResponse.status, recommendationData);
            throw new Error(recommendationData.error || `API returned ${recommendationResponse.status}: Failed to get recommendations`);
        }

        // Parse the plan IDs and ranks
        const planMatches = recommendationData.text.trim().split(',').map(item => {
            const [id, rank] = item.split(':');
            return { id: parseInt(id.trim()), rank: rank.trim() };
        });

        // Get the actual plan data
        const recommendedPlans = planMatches.map(match => {
            const plan = MOBILE_PLANS.find(p => p.id === match.id);
            return { ...plan, rank: match.rank };
        });

        // Second API call - get explanations
        const explanationPrompt = `You are a friendly mobile plan expert explaining things to someone who might not be familiar with technical terms. Use simple, everyday language that a high school student would understand. For each of these plans, provide:
1. A brief explanation (1-2 sentences) of why this plan matches the user's needs
2. A short summary of why these 3 plans were selected overall

User's request: "${userInput}"

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

        const explanationResponse = await fetch('/api/gemini', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: explanationPrompt,
                temperature: 0.7,
                maxOutputTokens: 500
            })
        });

        const explanationResponseText = await explanationResponse.text();
        console.log('Explanation raw response:', explanationResponseText);
        
        let explanationData;
        try {
            explanationData = JSON.parse(explanationResponseText);
        } catch (parseError) {
            console.error('Explanation JSON parse error:', parseError);
            throw new Error(`Explanation API returned invalid response: ${explanationResponseText.substring(0, 100)}...`);
        }
        
        console.log('Explanation API Response:', explanationData);
        
        if (!explanationResponse.ok) {
            console.error('Explanation API Error Response:', explanationResponse.status, explanationData);
            throw new Error(explanationData.error || `API returned ${explanationResponse.status}: Failed to get explanations`);
        }

        // Parse explanations
        const explanationText = explanationData.text;
        const planExplanations = {};
        
        // Extract individual plan explanations
        const planMatches2 = explanationText.match(/Plan (\d+): (.*?)(?=\nPlan \d+:|$)/gs);
        if (planMatches2) {
            planMatches2.forEach(match => {
                const [, planId, explanation] = match.match(/Plan (\d+): (.*)/);
                planExplanations[planId] = explanation.trim();
            });
        }

        // Extract overall summary
        const summaryMatch = explanationText.match(/OVERALL_SUMMARY:\n(.*)/s);
        const overallSummary = summaryMatch ? summaryMatch[1].trim() : '';

        // Display results
        displayResults(recommendedPlans, planExplanations, overallSummary);

    } catch (error) {
        console.error('Error details:', error);
        console.error('Error message:', error.message);
        document.getElementById('loading').style.display = 'none';
        document.getElementById('questionSection').style.display = 'block';
        alert(`Sorry, there was an error getting recommendations: ${error.message}. Please check the console for details and try again.`);
    }
}

function displayResults(plans, explanations, summary) {
    // Hide loading
    document.getElementById('loading').style.display = 'none';

    // Set overall explanation
    document.getElementById('explanationText').textContent = summary;

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
                ${explanations[plan.id] || 'This plan offers great value for your needs.'}
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