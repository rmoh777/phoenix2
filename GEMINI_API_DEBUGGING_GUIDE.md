# Gemini API Debugging Guide

## Common Issues When Implementing Gemini API

This guide documents the common errors we encountered when implementing the Gemini API in our Mobile Plan Finder project and how we resolved them.

## Setup Issues

### 1. Installation Errors

**Issue**: Package installation fails with dependency conflicts.
```
npm ERR! code ERESOLVE
npm ERR! ERESOLVE unable to resolve dependency tree
```

**Solution**:
- Update npm: `npm install -g npm@latest`
- Force installation: `npm install @google/generative-ai --force`
- Use a package version that matches your Node.js version

### 2. API Key Configuration

**Issue**: API key not found or recognized.
```
Error: No API key provided. Pass it when initializing the GenerativeAI object.
```

**Solutions**:
- Double-check the environment variable name (case-sensitive)
- Verify the API key is valid and has not expired
- Ensure environment variables are properly loaded
- Check for typos in the variable name in your code

```javascript
// Correct implementation
const genAI = new GoogleGenerativeAI(process.env.GeminiAPI);

// Incorrect implementation
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API); // Wrong variable name
```

## API Request Issues

### 1. Model Selection Errors

**Issue**: Specified model doesn't exist or isn't available for your account.
```
Error: Model 'gemini-1.5-flash' not found
```

**Solutions**:
- Check available models in your Google AI Studio account
- Use a supported model version:
  - `gemini-1.5-flash`
  - `gemini-1.5-pro`
  - `gemini-pro`

```javascript
// Updated code with fallback options
try {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
} catch (error) {
  // Fallback to an older model if the newest one isn't available
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });
}
```

### 2. Request Format Errors

**Issue**: Invalid request format causing API errors.
```
Error: Invalid request format. Expected a different structure.
```

**Solutions**:
- Follow the exact request format from the documentation
- Check for changes in the API that might require updates to your code
- Validate your request parameters before sending

```javascript
// Correct request format
const result = await model.generateContent({
  contents: [{ parts: [{ text: prompt }] }],
  generationConfig: {
    temperature,
    topK: 40,
    topP: 0.95,
    maxOutputTokens,
  },
});

// Incorrect format (outdated or wrong structure)
const result = await model.generate({  // Wrong method name
  prompt,  // Wrong parameter structure
  temperature,
  maxTokens: maxOutputTokens,  // Wrong parameter name
});
```

## Response Handling Issues

### 1. Response Parsing Errors

**Issue**: Unable to extract text from the response.
```
TypeError: response.text is not a function
```

**Solutions**:
- Check the response structure in the documentation
- Update your code to match the current API response format
- Add error handling for different response types

```javascript
// Correct implementation
const response = await result.response;
const text = response.text();

// Alternative implementation with more error handling
let text;
try {
  const response = await result.response;
  text = response.text();
} catch (error) {
  // Try alternative parsing methods
  text = result.response?.candidates?.[0]?.content?.parts?.[0]?.text || '';
}
```

### 2. Content Filtering Issues

**Issue**: Content filtered due to safety settings.
```
Error: The response was filtered due to safety settings.
```

**Solutions**:
- Adjust your prompt to avoid triggering content filters
- Check Google's content safety documentation
- Implement fallback responses for when content is filtered

```javascript
try {
  const result = await model.generateContent({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature,
      maxOutputTokens,
    },
    safetySettings: [
      {
        category: "HARM_CATEGORY_HARASSMENT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE",
      },
    ],
  });
  
  const response = await result.response;
  const text = response.text();
  return text;
} catch (error) {
  if (error.message.includes('filtered due to safety settings')) {
    return "I'm sorry, I can't provide that information.";
  }
  throw error;
}
```

## Rate Limiting and Quota Issues

### 1. Rate Limit Exceeded

**Issue**: Too many requests in a short period.
```
Error: Resource has been exhausted (e.g. check quota).
```

**Solutions**:
- Implement exponential backoff and retry logic
- Cache responses when possible
- Monitor API usage

```javascript
// Retry logic implementation
async function callGeminiWithRetry(prompt, maxRetries = 3) {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      const result = await model.generateContent({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature,
          maxOutputTokens,
        },
      });
      
      return result.response.text();
    } catch (error) {
      if (error.message.includes('quota') && retries < maxRetries - 1) {
        retries++;
        // Exponential backoff: 1s, 2s, 4s, etc.
        const delay = 1000 * Math.pow(2, retries - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
}
```

### 2. Token Limit Exceeded

**Issue**: Response exceeds maximum token limit.
```
Error: The response exceeded the maximum token limit.
```

**Solutions**:
- Reduce the requested maxOutputTokens
- Break down complex prompts into smaller requests
- Implement streaming for large responses

```javascript
// Setting appropriate token limits
const result = await model.generateContent({
  contents: [{ parts: [{ text: prompt }] }],
  generationConfig: {
    temperature,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 500,  // Keep this reasonably low
  },
});
```

## CORS and Deployment Issues

### 1. CORS Errors in Browser

**Issue**: API requests blocked by CORS policy.
```
Access to fetch at 'https://api.example.com/gemini' from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Solutions**:
- Always use a serverless function approach (never call Gemini directly from frontend)
- Configure CORS headers in your serverless function
- Deploy frontend and backend to the same domain

```javascript
// Adding CORS headers in serverless function
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // Rest of your code...
}
```

### 2. Environment Variable Issues in Deployment

**Issue**: Environment variables not available in production.
```
Error: No API key provided. Pass it when initializing the GenerativeAI object.
```

**Solutions**:
- Verify environment variables are set in your deployment platform
- Check for platform-specific environment variable formats
- Use a .env.local file for local development

For Vercel:
```bash
vercel env add GeminiAPI
```

For Netlify:
```bash
netlify env:set GeminiAPI your_api_key_here
```

## API Response Format Issues

### 1. Inconsistent Responses

**Issue**: The API returns responses in an unexpected format or structure.
```
Error: Invalid response format from Gemini API
```

**Solutions**:
- Add robust parsing with fallbacks
- Log the actual response structure for debugging
- Validate the response before processing

```javascript
try {
  const response = await result.response;
  console.log('Response structure:', JSON.stringify(response, null, 2));
  
  // Check if response has expected format
  if (!response || typeof response.text !== 'function') {
    throw new Error('Invalid response format');
  }
  
  const text = response.text();
  return text;
} catch (error) {
  console.error('Parsing error:', error);
  // Try alternative parsing if available
  return result.response?.candidates?.[0]?.content?.parts?.[0]?.text || 'Failed to parse response';
}
```

## Testing and Debugging Tips

1. **Use Logging**:
   ```javascript
   console.log('Request:', JSON.stringify({ prompt, temperature, maxOutputTokens }));
   console.log('Response:', JSON.stringify(result));
   ```

2. **Create Test Scripts**:
   ```javascript
   // test-gemini.js
   require('dotenv').config();
   const { GoogleGenerativeAI } = require('@google/generative-ai');
   
   async function testGemini() {
     const genAI = new GoogleGenerativeAI(process.env.GeminiAPI);
     const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
     
     try {
       const result = await model.generateContent({
         contents: [{ parts: [{ text: "Hello, what can you do?" }] }],
       });
       
       console.log('Success:', result.response.text());
     } catch (error) {
       console.error('Error:', error);
     }
   }
   
   testGemini();
   ```
   
   Run with:
   ```bash
   node test-gemini.js
   ```

3. **Implement Proper Error Handling**:
   ```javascript
   try {
     // API call
   } catch (error) {
     // Check for specific error types
     if (error.message.includes('API key')) {
       console.error('API Key Issue:', error);
     } else if (error.message.includes('quota')) {
       console.error('Rate Limit Issue:', error);
     } else {
       console.error('Unexpected Error:', error);
     }
   }
   ```

## Resources

- [Google Generative AI Documentation](https://ai.google.dev/docs)
- [Gemini API Reference](https://ai.google.dev/api/rest/v1beta/models)
- [Gemini Quotas and Limits](https://ai.google.dev/docs/quotas_and_limits)
- [Content Safety Documentation](https://ai.google.dev/docs/safety_setting_gemini) 