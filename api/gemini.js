const { GoogleGenerativeAI } = require('@google/generative-ai');

module.exports = async (req, res) => {
  console.log('API Request received:', {
    method: req.method,
    headers: req.headers,
    body: req.body
  });

  // Set CORS headers to allow requests from your domain
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

  if (req.method !== 'POST') {
    console.error('Invalid method:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, temperature = 0.7, maxOutputTokens = 500 } = req.body;
    console.log('Request parameters:', { prompt, temperature, maxOutputTokens });

    if (!prompt) {
      console.error('No prompt provided in request body');
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Get API key from environment variable
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    console.log('API Key present:', !!apiKey);
    
    if (!apiKey) {
      console.error('GOOGLE_GEMINI_API_KEY not found in environment variables');
      return res.status(500).json({ 
        error: 'API configuration error',
        details: 'API key not found in environment variables'
      });
    }

    console.log('Initializing Gemini API with key length:', apiKey.length);
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    console.log('Generating content with prompt length:', prompt.length);
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
    console.log('Successfully generated response with length:', text.length);

    return res.status(200).json({ text });
  } catch (error) {
    console.error('Gemini API Error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return res.status(500).json({ 
      error: 'Failed to generate content',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 
