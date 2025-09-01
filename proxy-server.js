const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = 3001;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Proxy endpoint for Telnyx phone numbers
app.get('/api/telynx/phone-numbers', async (req, res) => {
    try {
        const apiKey = req.headers.authorization;
        
        if (!apiKey) {
            return res.status(400).json({ error: 'API key is required' });
        }
        
        console.log('Making request to Telnyx API with key:', apiKey.substring(0, 10) + '...');
        
        // Use the correct Telnyx API v2 endpoint that we know works
        const endpoint = 'https://api.telnyx.com/v2/phone_numbers';
        
        console.log('Using correct endpoint:', endpoint);
        
        // Clean and format the API key properly
        let cleanApiKey = apiKey.trim();
        
        // Remove "Bearer " prefix if it exists and clean it
        if (cleanApiKey.startsWith('Bearer ')) {
            cleanApiKey = cleanApiKey.substring(7).trim(); // Remove "Bearer " and trim
        }
        
        console.log('API Key length:', cleanApiKey.length);
        console.log('API Key preview:', cleanApiKey.substring(0, 10) + '...');
        
        // Try different authentication methods
        const authMethods = [
            { name: 'Bearer Token', header: 'Authorization', value: `Bearer ${cleanApiKey}` },
            { name: 'X-API-Key', header: 'X-API-Key', value: cleanApiKey },
            { name: 'API Key Only', header: 'Authorization', value: cleanApiKey }
        ];

        // Try each authentication method
        for (const authMethod of authMethods) {
            try {
                console.log(`Trying ${authMethod.name}...`);
                
                const headers = {
                    'Content-Type': 'application/json'
                };
                headers[authMethod.header] = authMethod.value;
                
                const response = await fetch(endpoint, {
                    method: 'GET',
                    headers: headers
                });
                
                console.log(`${authMethod.name} - Response status: ${response.status}`);
                
                if (response.ok) {
                    const data = await response.json();
                    console.log(`✅ Success with ${authMethod.name}! Telnyx API data received:`, data);
                    return res.json(data);
                } else {
                    const errorText = await response.text();
                    console.log(`${authMethod.name} - Error: ${response.status} - ${errorText}`);
                    
                    // If this is the last method, return the error
                    if (authMethod === authMethods[authMethods.length - 1]) {
                        return res.status(response.status).json({ 
                            error: 'Telnyx API request failed',
                            status: response.status,
                            details: errorText,
                            message: 'Please check your API key and Telnyx account status'
                        });
                    }
                    // Otherwise, continue to next method
                }
            } catch (error) {
                console.error(`${authMethod.name} - Network error:`, error.message);
                
                // If this is the last method, return the error
                if (authMethod === authMethods[authMethods.length - 1]) {
                    return res.status(500).json({ 
                        error: 'Network error',
                        details: error.message,
                        message: 'Please check your internet connection and try again'
                    });
                }
                // Otherwise, continue to next method
            }
        }
        
    } catch (error) {
        console.error('Proxy error:', error);
        return res.status(500).json({ error: error.message });
    }
});

// Test endpoint
app.get('/api/test', (req, res) => {
    res.json({ message: 'Proxy server is running!' });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log('🚀 Telnyx API Proxy Server running on http://localhost:3001');
    console.log('📞 Phone numbers endpoint: http://localhost:3001/api/telynx/phone-numbers');
    console.log('✅ Test endpoint: http://localhost:3001/api/test');
    console.log('💚 Health check: http://localhost:3001/health');
});

module.exports = app; 