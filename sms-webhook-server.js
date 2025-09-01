const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS for all routes
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// In-memory storage for messages
let messages = [];

// Health check endpoint
app.get('/', (req, res) => {
    res.json({
        status: 'SMS Webhook Server is running! 🚀',
        timestamp: new Date().toISOString(),
        endpoints: {
            webhook: 'POST /webhook/sms',
            messages: 'GET /messages'
        },
        stored_messages: messages.length
    });
});

// POST route to receive SMS from Telnyx
app.post('/webhook/sms', (req, res) => {
    console.log('📥 Webhook received:', JSON.stringify(req.body, null, 2));
    
    try {
        const event = req.body;
        
        // Handle Telnyx SMS message.received event
        if (event.data?.event_type === 'message.received') {
            const payload = event.data.payload;
            
            // Extract message data
            const message = {
                id: payload.id,
                from: payload.from.phone_number,
                to: payload.to[0].phone_number,
                text: payload.text,
                timestamp: new Date().toISOString(),
                received_at: payload.received_at
            };
            
            // Store message in memory array
            messages.unshift(message); // Add to beginning of array
            
            // Keep only last 100 messages
            if (messages.length > 100) {
                messages = messages.slice(0, 100);
            }
            
            console.log('📱 SMS stored:', {
                from: message.from,
                to: message.to,
                text: message.text,
                total_messages: messages.length
            });
        }
        
        // Respond to Telnyx with success
        res.status(200).json({
            status: 'success',
            event_type: event.data?.event_type || 'unknown',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Webhook error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// GET route to return all messages as JSON
app.get('/messages', (req, res) => {
    res.json({
        messages: messages,
        count: messages.length,
        timestamp: new Date().toISOString()
    });
});

// Start the server
app.listen(port, () => {
    console.log(`🚀 SMS Webhook Server running on port ${port}`);
    console.log(`📡 Webhook endpoint: http://localhost:${port}/webhook/sms`);
    console.log(`📨 Messages API: http://localhost:${port}/messages`);
    console.log(`🌐 Health check: http://localhost:${port}/`);
    console.log('');
    console.log('Ready to receive SMS messages from Telnyx! 📱');
});