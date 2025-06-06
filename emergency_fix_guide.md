# EMERGENCY FIX: "Server returned invalid response"

## Step 1: IMMEDIATE DIAGNOSIS
**Cursor should do this FIRST to see what's actually happening:**

### Test the API Route Directly
1. Open browser and go to: `https://phoenix-git-fix-gemini-15-flas-dfb0bc-rmoxom-gmailcoms-projects.vercel.app/api/gemini`
2. What do you see?
   - **JSON response** = Route exists, continue to Step 2
   - **404 error** = Route doesn't exist, go to Step 3
   - **HTML page** = Wrong export format, go to Step 4

## Step 2: IF ROUTE EXISTS (returns JSON)
The API route is working but client-side call is wrong.

### Fix Client-Side Code
Replace your current fetch call with this EXACT code:

```javascript
async function callGeminiAPI(prompt) {
  try {
    console.log('Making API call with prompt:', prompt);
    
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt: prompt }),
    });

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    
    const text = await response.text();
    console.log('Raw response text:', text);
    
    if (!text) {
      throw new Error('Empty response from server');
    }
    
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error(`Invalid JSON response: ${text}`);
    }
    
    if (!response.ok) {
      throw new Error(data.error || 'API request failed');
    }
    
    return data.response;
    
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}
```

## Step 3: IF ROUTE DOESN'T EXIST (404 error)
Create the API route file in the correct location.

### For Next.js App Router (most likely):
Create file: `app/api/gemini/route.js`

```javascript
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    const { prompt } = await request.json();
    
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ success: true, response: text });

  } catch (error) {
    console.error('Gemini API Error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate content',
      details: error.message 
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: 'Gemini API route is working',
    timestamp: new Date().toISOString()
  });
}
```

### For Next.js Pages Router (if using older setup):
Create file: `pages/api/gemini.js`

```javascript
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.status(200).json({ success: true, response: text });

  } catch (error) {
    console.error('Gemini API Error:', error);
    res.status(500).json({ 
      error: 'Failed to generate content',
      details: error.message 
    });
  }
}
```

## Step 4: IF ROUTE EXISTS BUT RETURNS HTML
Wrong export format. Fix the route file:

### Check which Next.js version you're using:
Look at your `package.json` for the Next.js version.

- **Next.js 13+ with App Router**: Use `export async function POST()`
- **Next.js 12 or Pages Router**: Use `export default function handler()`

## Step 5: VERIFY ENVIRONMENT VARIABLE
1. In Vercel dashboard, go to your project settings
2. Click "Environment Variables"
3. Make sure `GOOGLE_GEMINI_API_KEY` exists and has a value
4. **IMPORTANT**: After adding/changing env vars, you MUST redeploy!

## Step 6: DEPENDENCY CHECK
Make sure you have the Gemini dependency installed:

```bash
npm install @google/generative-ai
```

Check your `package.json` should include:
```json
{
  "dependencies": {
    "@google/generative-ai": "^0.15.0"
  }
}
```

## Step 7: QUICK TEST SEQUENCE

### Test 1: Basic API Route
Visit: `https://your-domain.vercel.app/api/gemini`
Expected: JSON response like `{"status":"Gemini API route is working"}`

### Test 2: POST Request
Use browser console or Postman to test:
```javascript
fetch('https://your-domain.vercel.app/api/gemini', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt: 'Hello, world!' })
})
.then(r => r.text())
.then(console.log);
```

## Step 8: EMERGENCY FALLBACK
If nothing works, create this minimal test route first:

### Create: `app/api/test/route.js`
```javascript
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'API routes are working!' });
}

export async function POST(request) {
  const body = await request.json();
  return NextResponse.json({ 
    message: 'POST received',
    data: body 
  });
}
```

Test this route first. If it works, gradually add Gemini functionality.

## MOST COMMON FIXES:
1. **Wrong file location** - Move to `app/api/gemini/route.js`
2. **Wrong export** - Use `export async function POST()`
3. **Missing redeploy** - Redeploy after adding environment variables
4. **Missing dependency** - Run `npm install @google/generative-ai`

## DEBUG COMMANDS:
```bash
# Check Next.js version
npm list next

# Check if dependency exists
npm list @google/generative-ai

# Reinstall dependencies
npm install

# Force redeploy
vercel --prod
```