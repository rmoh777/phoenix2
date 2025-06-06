# Gemini API Prompting Guide: Mobile Plan Finder

This guide provides effective prompting techniques for the Gemini API specifically for our Mobile Plan Finder application.

## Core Principles for Effective Prompts

1. **Be specific and structured**
2. **Use clear formatting instructions**
3. **Provide examples of expected output**
4. **Include all necessary context**
5. **Control temperature for consistent results**

## Prompt Formats Used in Mobile Plan Finder

### 1. Plan Recommendation Prompt

```javascript
const prompt = `You are a mobile plan expert helping someone who might not be familiar with technical terms. Based on this request: "${userInput}", recommend exactly 3 plan IDs from this list that best match the user's needs. Rank them as "Best", "Great", and "Good". Return ONLY the 3 plan IDs as comma-separated numbers with their rank (example: "1:Best,7:Great,12:Good"). Plans: ${JSON.stringify(MOBILE_PLANS)}`;
```

**Key Techniques Used:**
- Clear role setting ("You are a mobile plan expert")
- Specific output format instructions
- Inclusion of all necessary data (plan details)
- Constraining response format to ensure parseable output

**Temperature Setting:** 0.2 (low for consistent, predictable outputs)

### 2. Plan Explanation Prompt

```javascript
const prompt = `You are a friendly mobile plan expert explaining things to someone who might not be familiar with technical terms. Use simple, everyday language that a high school student would understand. For each of these plans, provide:
1. A brief explanation (1-2 sentences) of why this plan matches the user's needs
2. A short summary of why these 3 plans were selected overall

User's request: "${userInput}"

Plans:
${plans.map(plan => `
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
${plans.map(plan => `Plan ${plan.id}: [Your explanation here]`).join('\n')}

OVERALL_SUMMARY:
[Your summary here]`;
```

**Key Techniques Used:**
- Tone guidance ("friendly" and "simple, everyday language")
- Structured formatting requirements
- Multiple output sections with templates
- Inclusion of all user context and plan details

**Temperature Setting:** 0.7 (higher for more creative, natural-sounding explanations)

## Optimizing Prompts

### For Accuracy (Recommendations)

1. **Include complete plan data**
   - Never truncate the plan data
   - Include all relevant fields
   
2. **Format constraints**
   - Ask for exact number of recommendations (3)
   - Specify ranking labels ("Best", "Great", "Good")
   - Request specific data format ("1:Best,7:Great,12:Good")

3. **Low temperature**
   - Use 0.2-0.3 for recommendation prompts
   - Ensures consistent, predictable outputs

### For Natural Language (Explanations)

1. **Tone instructions**
   - "Friendly"
   - "Simple, everyday language"
   - "Language a high school student would understand"

2. **Content structure**
   - Request specific sections
   - Define length constraints
   - Provide clear section markers

3. **Higher temperature**
   - Use 0.6-0.7 for explanation prompts
   - Allows for more natural, varied language

## Prompt Debugging Techniques

### When Output Format Is Incorrect

If Gemini returns explanations in the wrong format or includes extra text:

```javascript
// More specific format instructions
Format your response EXACTLY like this with NO additional text:
PLAN_EXPLANATIONS:
Plan 1: [Your explanation here]
Plan 2: [Your explanation here]
Plan 3: [Your explanation here]

OVERALL_SUMMARY:
[Your summary here]
```

### When Response Is Too Long

If explanations are too verbose:

```javascript
// Add length constraints
For each plan, provide EXACTLY ONE SENTENCE explanation of why it matches the user's needs.
The overall summary should be NO MORE THAN 2 SENTENCES.
```

### When Response Is Too Technical

If language is too complex for average users:

```javascript
// Strengthen simplicity instructions
Explain in EXTREMELY SIMPLE terms as if to someone who has never used a smartphone before. Avoid ALL technical terms and jargon. Use words that a 12-year-old would understand.
```

## Temperature and Token Settings

| Purpose | Temperature | Max Tokens | Rationale |
|---------|-------------|------------|-----------|
| Plan IDs | 0.2 | 100 | Low temp for consistent, structured outputs; low token limit for efficient processing |
| Explanations | 0.7 | 500 | Higher temp for more natural language; higher token limit for complete explanations |

## Request Parameters

```javascript
// Parameters for recommendations
{
    prompt: recommendationPrompt,
    temperature: 0.2,
    maxOutputTokens: 100
}

// Parameters for explanations
{
    prompt: explanationPrompt,
    temperature: 0.7,
    maxOutputTokens: 500
}
```

## Response Parsing Strategies

### Parsing Plan IDs

```javascript
const planMatches = data.text.trim().split(',').map(item => {
    const [id, rank] = item.split(':');
    return { id: parseInt(id.trim()), rank: rank.trim() };
});
```

### Parsing Explanations

```javascript
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
```

## Best Practices

1. **Test prompts before implementation**
   - Try variations in Google AI Studio
   - Test with different user inputs

2. **Implement robust error handling**
   - Check for missing fields
   - Have fallback text

3. **Manage token usage**
   - Keep contexts concise
   - Limit output tokens appropriate to task

4. **Use appropriate temperature**
   - Lower (0.1-0.3) for structured data
   - Higher (0.6-0.8) for natural language

5. **Include examples**
   - Show exactly what format you want
   - Particularly important for structured outputs 