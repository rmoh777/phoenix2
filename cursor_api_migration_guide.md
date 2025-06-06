# Cursor AI Engineering Guide: Migrate Google Gemini API to Server-Side

## Objective
Transform the current static website from exposing the Google Gemini API key on the client-side to using Vercel environment variables securely on the server-side.

## Current State Analysis
The website currently has:
- An input field where users enter their Google Gemini API key
- Client-side JavaScript that directly calls the Gemini API
- API key exposed in the browser/network requests (security risk)

## Target State
- API key stored securely in Vercel environment variables
- Server-side API route handling Gemini requests
- Client-side code making requests to our own API endpoint
- No API key exposure to end users

## Step-by-Step Migration Instructions

### Step 1: Create Server-Side API Route
Create a new API route file at `/pages/api/gemini.js` (Next.js) or `/api/gemini.js` (if using different framework):

```javascript
// pages/api/gemini.js or api/gemini.js
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get API key from environment variables
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error('GOOGLE_GEMINI_API_KEY not found in environment variables');
      return res.status(500).json({ error: 'API configuration error' });
    }

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Extract prompt from request body
    const { prompt, ...otherParams } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Make request to Gemini API
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Return the response
    res.status(200).json({ 
      success: true, 
      response: text,
      ...otherParams // Include any other response data needed
    });

  } catch (error) {
    console.error('Gemini API Error:', error);
    res.status(500).json({ 
      error: 'Failed to generate content',
      details: error.message 
    });
  }
}
```

### Step 2: Update Client-Side Code
Replace the current client-side API key input and direct Gemini calls with requests to your new API endpoint:

**Remove/Replace:**
- API key input field from the UI
- Direct Gemini API initialization code
- Any client-side API key storage

**Add/Update:**
```javascript
// Replace direct Gemini API calls with this function
async function callGeminiAPI(prompt, additionalData = {}) {
  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
        ...additionalData
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'API request failed');
    }

    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw error;
  }
}

// Example usage - replace existing Gemini API calls
// OLD: const result = await model.generateContent(userPrompt);
// NEW: const result = await callGeminiAPI(userPrompt);
```

### Step 3: Update UI Components
Remove API key related UI elements:

```javascript
// REMOVE these elements from your HTML/JSX:
// - API key input field: <input type="text" placeholder="Enter your Gemini API key">
// - API key validation messages
// - API key storage/retrieval logic

// UPDATE existing form submissions to use the new function:
// Replace form handlers that used the API key with calls to callGeminiAPI()
```

### Step 4: Environment Variable Configuration
Ensure your Vercel environment variable is properly configured:

**Variable Name:** `GOOGLE_GEMINI_API_KEY`
**Value:** [Your actual Google Gemini API key]

Verify this is set in:
1. Vercel Dashboard > Project Settings > Environment Variables
2. Local development: `.env.local` file with `GOOGLE_GEMINI_API_KEY=your_key_here`

### Step 5: Update Dependencies
Ensure your `package.json` includes the necessary dependencies:

```json
{
  "dependencies": {
    "@google/generative-ai": "^0.15.0"
  }
}
```

### Step 6: Error Handling Updates
Update error handling throughout the application:

```javascript
// Replace API key validation errors with generic API errors
// OLD: "Please enter a valid API key"
// NEW: "Unable to process request. Please try again."

// Add proper error boundaries for API failures
function handleAPIError(error) {
  console.error('API Error:', error);
  // Show user-friendly error message
  showErrorMessage('Sorry, there was an issue processing your request. Please try again.');
}
```

### Step 7: Testing Checklist
After implementation, verify:
- [ ] API key input field is completely removed from UI
- [ ] All Gemini API calls go through `/api/gemini` endpoint
- [ ] Environment variable is properly loaded in server environment
- [ ] Error handling works for both API failures and missing env vars
- [ ] No API key appears in browser network tab
- [ ] Application functionality remains the same for end users

## Security Benefits Achieved
✅ API key no longer exposed to clients
✅ Rate limiting can be implemented server-side
✅ Request validation and sanitization possible
✅ Centralized error handling and logging
✅ Better control over API usage and costs

## Common Issues & Solutions

**Issue:** `GOOGLE_GEMINI_API_KEY not found`
**Solution:** Verify environment variable is set in Vercel dashboard and restart deployment

**Issue:** CORS errors
**Solution:** API routes in Vercel/Next.js handle CORS automatically for same-origin requests

**Issue:** API calls failing locally
**Solution:** Ensure `.env.local` file exists with the environment variable

## Final Notes
- Test thoroughly in both development and production environments
- Consider adding rate limiting to prevent abuse
- Monitor API usage through Vercel analytics
- Keep error messages generic to avoid information disclosure

This migration significantly improves security while maintaining all existing functionality.