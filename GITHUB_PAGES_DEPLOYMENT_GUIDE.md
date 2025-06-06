# Deploying Mobile Plan Finder to GitHub Pages with Serverless API

This guide covers how to deploy the Mobile Plan Finder application to GitHub Pages while setting up a serverless backend for the Gemini API integration.

## Architecture Overview

Since GitHub Pages only serves static content, we need a separate serverless backend to handle our Gemini API calls:

1. **Frontend**: Deployed on GitHub Pages
2. **Backend**: Deployed on a serverless platform (Vercel, Netlify, or similar)

## Step 1: Prepare Your Repository

1. Create a GitHub repository for your project
2. Push your code to the repository

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/mobile-plan-finder.git
git push -u origin main
```

## Step 2: Set Up the Frontend for GitHub Pages

1. Add a `.nojekyll` file to the root of your repository to bypass Jekyll processing:

```bash
touch .nojekyll
```

2. If your repository name isn't `yourusername.github.io`, update the API endpoints in your `index.html` to use absolute URLs pointing to your serverless functions:

```javascript
// Change this:
const response = await fetch('/api/gemini', {
    // ...
});

// To this:
const response = await fetch('https://your-serverless-api.vercel.app/api/gemini', {
    // ...
});
```

## Step 3: Set Up the Serverless Backend

### Option 1: Vercel

1. Create a new project on Vercel and connect it to your GitHub repository
2. Set up environment variables in the Vercel dashboard:
   - `GeminiAPI`: Your Gemini API key

3. Create a `/api` directory in your project with the Gemini API serverless function:

**api/gemini.js**:
```javascript
const { GoogleGenerativeAI } = require('@google/generative-ai');

module.exports = async (req, res) => {
  // Set CORS headers to allow requests from your GitHub Pages domain
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', 'https://yourusername.github.io');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

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
};
```

4. Create a separate `vercel.json` file in your project root:

```json
{
  "version": 2,
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    }
  ],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Credentials", "value": "true" },
        { "key": "Access-Control-Allow-Origin", "value": "https://yourusername.github.io" },
        { "key": "Access-Control-Allow-Methods", "value": "GET,OPTIONS,POST" },
        { "key": "Access-Control-Allow-Headers", "value": "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" }
      ]
    }
  ]
}
```

5. Deploy to Vercel:

```bash
npm install -g vercel
vercel
```

### Option 2: Netlify

1. Create a new project on Netlify and connect it to your GitHub repository
2. Set up environment variables in the Netlify dashboard:
   - `GeminiAPI`: Your Gemini API key

3. Create a `netlify/functions` directory in your project for serverless functions:

**netlify/functions/gemini.js**:
```javascript
const { GoogleGenerativeAI } = require('@google/generative-ai');

exports.handler = async (event, context) => {
  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': 'https://yourusername.github.io',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const body = JSON.parse(event.body);
    const { prompt, temperature = 0.7, maxOutputTokens = 500 } = body;

    if (!prompt) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Prompt is required' })
      };
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

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': 'https://yourusername.github.io',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text })
    };
  } catch (error) {
    console.error('Gemini API Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': 'https://yourusername.github.io',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: error.message || 'Internal server error' })
    };
  }
};
```

4. Create a `netlify.toml` file in your project root:

```toml
[build]
  functions = "netlify/functions"

[[headers]]
  for = "/api/*"
  [headers.values]
    Access-Control-Allow-Origin = "https://yourusername.github.io"
    Access-Control-Allow-Methods = "GET, POST, OPTIONS"
    Access-Control-Allow-Headers = "Content-Type"
```

5. Update your `index.html` to use the Netlify function URL:

```javascript
const response = await fetch('https://your-netlify-app.netlify.app/.netlify/functions/gemini', {
    // ...
});
```

6. Deploy to Netlify:

```bash
npm install -g netlify-cli
netlify deploy --prod
```

## Step 4: Deploy to GitHub Pages

1. Go to your GitHub repository settings
2. Navigate to the "Pages" section
3. Select the branch you want to deploy (usually `main` or `master`)
4. Set the folder to `/ (root)`
5. Click "Save"

GitHub will provide you with a URL for your deployed site (e.g., `https://yourusername.github.io/mobile-plan-finder`).

## Step 5: Update CORS Settings

Make sure to update the CORS settings in your serverless function to allow requests from your GitHub Pages domain:

```javascript
// For Vercel
res.setHeader('Access-Control-Allow-Origin', 'https://yourusername.github.io');

// For Netlify
headers: {
  'Access-Control-Allow-Origin': 'https://yourusername.github.io',
  // ...
}
```

## Step 6: Testing the Deployment

1. Visit your GitHub Pages URL
2. Enter some requirements in the form
3. Click "Find My Plans"
4. Verify that the API calls are successful and the results are displayed correctly

## Troubleshooting

### CORS Issues

If you encounter CORS errors:

1. Check that your serverless function's CORS headers match your GitHub Pages URL exactly
2. Make sure you're using HTTPS for both the GitHub Pages site and the API endpoint
3. Verify that the OPTIONS request handler is correctly implemented

### API Key Issues

If your API calls fail:

1. Check that your API key is correctly set in your serverless platform's environment variables
2. Verify that the key has the necessary permissions
3. Check the logs in your serverless platform's dashboard for more details

### 404 Errors

If your API endpoints return 404:

1. Check the paths in your code and configuration files
2. For Netlify, make sure you're using the correct path format (`.netlify/functions/gemini`)
3. For Vercel, verify your `vercel.json` routing configuration

## Conclusion

You now have a fully functional Mobile Plan Finder application deployed to GitHub Pages with a serverless backend for the Gemini API. This architecture separates the frontend and backend concerns while maintaining security (API key not exposed in the frontend) and providing a seamless user experience. 