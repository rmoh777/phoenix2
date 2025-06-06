# Mobile Plan Finder: Gemini API Implementation Guide

## Project Overview

The Mobile Plan Finder is a web application that uses the Gemini API to provide personalized mobile plan recommendations based on user requirements. The application has a simple HTML/CSS/JS frontend and uses serverless functions to handle API requests to Google's Gemini API.

## Architecture

The application follows a simple architecture:

1. Frontend (index.html): Contains the UI, plan data, and JavaScript to handle user input and display recommendations
2. Serverless API (api/gemini.js): Handles communication with the Gemini API
3. Environment Variables: Store the API key securely

## Implementation Steps

### 1. Project Setup

```bash
# Create project directory
mkdir mobile-plan-finder
cd mobile-plan-finder

# Initialize npm
npm init -y

# Install the Gemini API client
npm install @google/generative-ai
```

### 2. Frontend Development

We created `index.html` with:
- UI for user input (requirements textarea)
- CSS for styling
- JavaScript for handling user interaction
- Hard-coded mobile plan data
- Functions for calling our serverless API endpoint

### 3. Gemini API Integration

#### Setting Up the Serverless Function

We created an `api/gemini.js` file to handle requests to the Gemini API:

```javascript
const { GoogleGenerativeAI } = require('@google/generative-ai');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, temperature = 0.7, maxOutputTokens = 500 } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const genAI = new GoogleGenerativeAI(process.env.GeminiAPI);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature,
        topK: 40,
        topP: 0.95,
        maxOutputTokens,
      },
    });

    const response = await result.response;
    const text = response.text();

    return res.status(200).json({ text });
  } catch (error) {
    console.error('Gemini API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
```

#### Common Errors and Solutions

During development, we encountered several issues with the Gemini API integration:

1. **API Key Not Found Error**
   - Error: `Error: No API key provided. Pass it when initializing the GenerativeAI object.`
   - Solution: Ensure the API key is properly set in environment variables and the variable name matches what's used in the code.

2. **CORS Issues**
   - Error: `Access to fetch at 'https://api.example.com/gemini' from origin 'http://localhost:3000' has been blocked by CORS policy`
   - Solution: Deploy to the same domain or configure CORS headers in the serverless function.

3. **Rate Limiting**
   - Error: `Error: Resource has been exhausted (e.g. check quota).`
   - Solution: Implement retry logic and respect API quotas.

4. **Invalid Response Format**
   - Error: `Error: Invalid response format from Gemini API`
   - Solution: Ensure the prompt is formatted correctly and the response parsing logic matches the expected output format.

5. **Model Not Found**
   - Error: `Error: Model 'gemini-1.5-flash' not found`
   - Solution: Check available models and use a model name that exists in your account.

### 4. Environment Variables Setup

For local development:
```
# .env.local
GeminiAPI=your_api_key_here
```

For production deployment (e.g., Vercel):
1. Go to project settings
2. Add environment variable `GeminiAPI` with your API key value

### 5. Frontend-API Connection

In the frontend JavaScript, we implemented two main functions:

1. `getRecommendations`: Calls the Gemini API to get plan recommendations
2. `getPlanExplanations`: Gets explanations for the recommended plans

Both functions use the same serverless endpoint but with different prompts and parameters.

### 6. Deployment

The application can be deployed to platforms like Vercel, Netlify, or GitHub Pages (with additional backend configuration).

For Vercel:
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

## Best Practices Implemented

1. **Security**
   - API key stored in environment variables
   - No API key exposed in frontend code
   - API requests made through serverless functions

2. **Error Handling**
   - Comprehensive error handling in the API
   - User-friendly error messages
   - Logging for debugging

3. **Performance**
   - Appropriate temperature settings for different use cases
   - Limiting token output to reduce costs
   - Caching plan data on the client

4. **UX Considerations**
   - Loading indicators during API calls
   - Informative error messages
   - Start-over functionality

## Troubleshooting Guide

### API Key Issues
- Verify the API key is correct
- Check the environment variable name
- Ensure the API key has the necessary permissions

### API Response Issues
- Check the prompt format
- Validate the response parsing logic
- Adjust temperature and max tokens for better results

### Deployment Issues
- Verify environment variables are set in deployment platform
- Check serverless function logs for errors
- Test locally before deploying

## Future Improvements

1. Implement caching to reduce API calls
2. Add user accounts and save preferences
3. Incorporate more carriers and plan options
4. Add filters for specific requirements
5. Implement analytics to track usage patterns

## Resources

- [Google Generative AI Documentation](https://ai.google.dev/docs)
- [Vercel Serverless Functions](https://vercel.com/docs/functions)
- [GitHub Pages Documentation](https://docs.github.com/en/pages) 