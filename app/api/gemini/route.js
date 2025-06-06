import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from 'next/server';

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

export async function POST(request) {
  // Add debugging logs
  console.log('API Request received:', {
    url: request.url,
    method: request.method
  });

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
      return NextResponse.json(
        { error: 'API configuration error' },
        { status: 500 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { prompt, temperature = 0.7, maxOutputTokens = 500 } = body;
    console.log('Request parameters:', { prompt, temperature, maxOutputTokens });

    if (!prompt) {
      console.error('No prompt provided in request body');
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(apiKey);

    // Use retry logic instead of direct call
    const text = await callGeminiWithRetry(genAI, prompt, 3);

    // Return the response
    return NextResponse.json({ 
      success: true, 
      text: text,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Gemini API Error:', error);
    
    // Return specific error messages for common issues
    if (error.message.includes('503') || error.message.includes('overloaded')) {
      return NextResponse.json(
        { 
          error: 'AI service is temporarily overloaded. Please try again in a few minutes.',
          retryable: true
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to generate content',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
} 