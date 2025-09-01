const express = require('express');
const cors = require('cors');

const app = express();
const port = 3000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// In-memory storage for messages
let messages = [];

// Health check
app.get('/', (req, res) => {
    res.json({
        status: 'SMS Backend is running! 🚀',
        messages_count: messages.length,
        endpoints: {
            webhook: 'POST /webhook/sms',
            messages: 'GET /messages'
        }
    });
});

// POST /webhook/sms - Receive incoming messages from Telnyx
app.post('/webhook/sms', (req, res) => {
    console.log('📥 Incoming webhook:', JSON.stringify(req.body, null, 2));
    
    try {
        const event = req.body;
        
        // Parse Telnyx message.received event
        if (event.data?.event_type === 'message.received') {
            const payload = event.data.payload;
            
            // Extract message fields
            const message = {
                id: payload.id || Date.now().toString(),
                from: payload.from.phone_number,
                to: payload.to[0].phone_number,
                text: payload.text,
                timestamp: new Date().toISOString()
            };
            
            // Store in memory array (newest first)
            messages.unshift(message);
            
            // Keep only last 50 messages
            if (messages.length > 50) {
                messages = messages.slice(0, 50);
            }
            
            console.log('📱 New SMS stored:', {
                from: message.from,
                to: message.to,
                text: message.text,
                total: messages.length
            });
        }
        
        // Respond to Telnyx
        res.status(200).json({ status: 'received' });
        
    } catch (error) {
        console.error('❌ Webhook error:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /messages - Return all messages in JSON format
app.get('/messages', (req, res) => {
    res.json({
        messages: messages,
        count: messages.length,
        last_updated: new Date().toISOString()
    });
});

// Add test message endpoint
app.post('/test-message', (req, res) => {
    const testMessage = {
        id: 'test-' + Date.now(),
        from: '+1234567890',
        to: '+18137420762',
        text: 'Test message from backend',
        timestamp: new Date().toISOString()
    };
    
    messages.unshift(testMessage);
    console.log('📱 Test message added:', testMessage);
    
    res.json({ status: 'Test message added', message: testMessage });
});

// Start server
app.listen(port, () => {
    console.log(`🚀 SMS Backend running on http://localhost:${port}`);
    console.log(`📡 Webhook URL: https://b7926f883d32.ngrok-free.app/webhook/sms`);
    console.log(`📨 Messages API: http://localhost:${port}/messages`);
    console.log('Ready to receive SMS! 📱');
});