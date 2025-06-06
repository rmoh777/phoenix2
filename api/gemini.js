import { GoogleGenerativeAI } from "@google/generative-ai";

// Add retry logic with exponential backoff
async function callGeminiWithRetry(genAI, prompt, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      });
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.log(`Attempt ${attempt} failed:`, error.message);
      
      // If it's a 503 error and not the last attempt, wait and retry
      if ((error.message.includes('503') || error.message.includes('overloaded') || error.message.includes('unavailable')) && attempt < maxRetries) {
        const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s, 8s
        console.log(`Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      throw error; // If not retryable or max attempts reached
    }
  }
}

export default async function handler(req, res) {
  // Add debugging logs
  console.log('API Request received:', {
    method: req.method,
    headers: req.headers,
    url: req.url
  });

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    console.error('Invalid method:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Log environment check
    console.log('Environment check:', {
      NODE_ENV: process.env.NODE_ENV,
      API_KEY_EXISTS: !!process.env.GOOGLE_GEMINI_API_KEY,
      API_KEY_LENGTH: process.env.GOOGLE_GEMINI_API_KEY?.length || 0
    });

    // Get API key from environment variables
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error('GOOGLE_GEMINI_API_KEY not found in environment variables');
      return res.status(500).json({ error: 'API configuration error' });
    }

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(apiKey);

    // Extract prompt from request body
    const { prompt, temperature = 0.7, maxOutputTokens = 500 } = req.body;
    console.log('Request parameters:', { prompt, temperature, maxOutputTokens });

    if (!prompt) {
      console.error('No prompt provided in request body');
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Use retry logic instead of direct call
    const text = await callGeminiWithRetry(genAI, prompt, 3);

    // Return the response
    res.status(200).json({ 
      success: true, 
      text: text,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Gemini API Error:', error);
    
    // Return specific error messages for common issues
    if (error.message.includes('503') || error.message.includes('overloaded')) {
      return res.status(503).json({ 
        error: 'AI service is temporarily overloaded. Please try again in a few minutes.',
        retryable: true
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to generate content',
      details: error.message 
    });
  }
} 
