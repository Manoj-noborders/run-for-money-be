const config = require("../config");

// Predefined list of API keys (you should store these securely)
const validApiKeys = [config.x_api_key];

// Function to authenticate an incoming request based on API key
exports.authenticateApiKey = function (req, res, next) {
    const apiKey = req.headers['x-api-key']; // Assuming the API key is passed in the 'x-api-key' header
    console.log(apiKey)
    if (!apiKey) {
        return res.status(401).json({ error: 'API key is missing in the request headers.' });
    }

    if (validApiKeys.includes(apiKey)) {
        // Valid API key
        next(); // Continue with the next middleware or route handler
    } else {
        // Invalid API key
        return res.status(403).json({ error: 'Invalid API key.' });
    }
}