const express = require('express');
const cors = require('cors');
const handleRequest = require('./api/gemini');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static('.'));

// API endpoint
app.post('/api/gemini', handleRequest);

// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
}); 