const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize the Gemini API with your API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Handle the API request
async function handleRequest(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    try {
        // Parse the request body
        const { prompt, temperature = 0.7, maxOutputTokens = 500 } = req.body;

        if (!prompt) {
            res.status(400).json({ error: 'Prompt is required' });
            return;
        }

        // Get the model
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        // Generate content
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
                temperature,
                maxOutputTokens,
            },
        });

        const response = await result.response;
        const text = response.text();

        res.status(200).json({ text });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

// Export the handler based on the environment
if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
        // Node.js environment
        module.exports = handleRequest;
    } else {
        // Browser environment
        exports.handleRequest = handleRequest;
    }
} 