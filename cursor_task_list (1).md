# Quick Cursor Task: Update to New Lifeline Data (5 minutes)

## What Cursor Needs to Do

Replace the old mobile plan data with the new Lifeline data in 3 simple steps.

---

## Step 1: Replace the Data File (2 minutes)

**File to Update**: `js/mobile-plans.js`

**Action**: Replace the entire `MOBILE_PLANS` array with this new structure:

```javascript
// Replace the entire MOBILE_PLANS array with this:
const MOBILE_PLANS = [
    // IM TELECOM Plans
    {
        id: 1,
        name: "Standard Plan",
        carrier: "IM TELECOM (Excess Telecom)",
        price: 0,
        data: "4.5GB",
        features: ["3,000 minutes", "Unlimited text", "Lifeline discount"],
        hotspot: "Not specified"
    },
    {
        id: 2,
        name: "Advantage Plan", 
        carrier: "IM TELECOM (Excess Telecom)",
        price: 1,
        data: "6.5GB",
        features: ["3,000 minutes", "Unlimited text", "Lifeline discount"],
        hotspot: "Not specified"
    },
    {
        id: 3,
        name: "Kentucky Standard Plan",
        carrier: "IM TELECOM (Excess Telecom)",
        price: 0,
        data: "4.5GB", 
        features: ["Unlimited talk", "Unlimited text", "Kentucky only"],
        hotspot: "Not specified"
    },
    {
        id: 4,
        name: "California Standard Plan",
        carrier: "IM TELECOM (Excess Telecom)",
        price: 0,
        data: "6GB",
        features: ["Unlimited talk", "Unlimited text", "California only"],
        hotspot: "Not specified"
    },
    {
        id: 5,
        name: "Tribal Standard Plan",
        carrier: "IM TELECOM (Excess Telecom)",
        price: 0,
        data: "6GB",
        features: ["3,000 minutes", "Unlimited text", "Qualifying Tribal Lands"],
        hotspot: "Not specified"
    },
    {
        id: 6,
        name: "Tribal Advantage Plan",
        carrier: "IM TELECOM (Excess Telecom)",
        price: 1,
        data: "8GB",
        features: ["3,000 minutes", "Unlimited text", "Qualifying Tribal Lands"],
        hotspot: "Not specified"
    },
    
    // TRACFONE WIRELESS Plans
    {
        id: 7,
        name: "Standard Lifeline Discount",
        carrier: "TRACFONE WIRELESS",
        price: 10,
        data: "At least 4.5GB",
        features: ["$10/month discount", "Caller ID", "Call Waiting", "Voicemail"],
        hotspot: "Depends on plan"
    },
    {
        id: 8,
        name: "Tribal Lifeline Discount", 
        carrier: "TRACFONE WIRELESS",
        price: 0,
        data: "At least 4.5GB",
        features: ["Up to $35/month discount", "Qualifying Tribal Lands", "Caller ID"],
        hotspot: "Depends on plan"
    },
    
    // ASSURANCE WIRELESS Plans
    {
        id: 9,
        name: "Standard Lifeline Service",
        carrier: "VIRGIN MOBILE USA (Assurance Wireless)", 
        price: 0,
        data: "4.5GB",
        features: ["3,000 minutes", "Unlimited text", "Free monthly service"],
        hotspot: "Not included"
    },
    {
        id: 10,
        name: "Data Peace of Mind Plan",
        carrier: "VIRGIN MOBILE USA (Assurance Wireless)",
        price: 10,
        data: "7GB/month hotspot",
        features: ["Mobile hotspot data", "Annual payment option"],
        hotspot: "7GB"
    },
    
    // AIRTALK WIRELESS Plans
    {
        id: 11,
        name: "Standard Lifeline Service",
        carrier: "AIR VOICE WIRELESS (AirTalk Wireless)",
        price: 0,
        data: "Up to 10GB (varies by state)",
        features: ["Unlimited talk", "Unlimited text", "5G+ high-speed", "Free smartphones"],
        hotspot: "Not specified"
    },
    
    // VERIZON Plans
    {
        id: 12,
        name: "Lifeline Discount (general)",
        carrier: "VERIZON",
        price: 9,
        data: "Variable",
        features: ["At least $9.25/month discount", "Depends on chosen plan"],
        hotspot: "Depends on plan"
    },
    {
        id: 13,
        name: "$25.00 Lifeline Plan",
        carrier: "VERIZON", 
        price: 16,
        data: "No data service",
        features: ["1,000 anytime minutes", "Unlimited text", "Local mobile to mobile"],
        hotspot: "No"
    },
    {
        id: 14,
        name: "$19.99 Home Phone Connect Plan",
        carrier: "VERIZON",
        price: 11,
        data: "N/A (home phone)",
        features: ["Unlimited minutes", "Home phone service", "Requires device"],
        hotspot: "N/A"
    }
];
```

---

## Step 2: Update the Prompt (2 minutes)

**File to Update**: `js/interview-new.js`

**Action**: In the `buildPrompt()` method, change the prompt text to focus on Lifeline:

```javascript
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
```

---

## Step 3: Update Results Display (1 minute)

**File to Update**: `js/interview-new.js`

**Action**: In the `renderResults()` method, add eligibility information:

```javascript
// In the renderResults method, update the plan card HTML to include eligibility:
const plansHtml = `
    <div class="plans-row">
        ${plans.map(plan => `
            <div class="plan-card">
                <div class="plan-header">
                    <div class="rank-badge rank-${plan.rank.toLowerCase()}">${plan.rank}</div>
                    <div class="carrier">${plan.carrier}</div>
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
                    ${explanations.planExplanations[plan.id] || 'Affordable plan designed for low-income households.'}
                </div>
                <button class="plan-details-btn" tabindex="0">Check Eligibility & Apply</button>
            </div>
        `).join('')}
    </div>
`;
```

---

## That's It! 

After these 3 changes:

1. ✅ Your site will use the new Lifeline provider data
2. ✅ The AI will focus on affordable/free plans  
3. ✅ Results will show Lifeline-specific information
4. ✅ Everything else continues to work exactly the same

## Test It:
- Go to your interview page
- Type "I need a free phone plan" 
- Should now recommend the $0 Lifeline plans first

## Quick Rollback:
If anything breaks, just restore the old `MOBILE_PLANS` array from your git history.

**Total Time**: 5 minutes
**Risk**: Very low (only changes data, not logic)
**Impact**: Immediate switch to Lifeline focus