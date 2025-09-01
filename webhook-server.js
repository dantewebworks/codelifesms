const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// In-memory storage for messages (in production, use a database)
let messages = [];
let calls = [];

// Health check endpoint
app.get('/', (req, res) => {
    res.json({
        status: 'Webhook is running! 🚀',
        timestamp: new Date().toISOString(),
        endpoints: {
            webhook: 'POST /webhook',
            webhook_sms: 'POST /webhook/sms',
            messages: 'GET /messages',
            calls: 'GET /calls'
        },
        stored_messages: messages.length,
        stored_calls: calls.length
    });
});

// Webhook endpoint for Telnyx - multiple routes
app.post('/webhook', handleWebhook);
app.post('/webhook/sms', handleWebhook);

function handleWebhook(req, res) {
    console.log('📥 Webhook received:', req.body);
    
    try {
        const event = req.body;
        
        // Handle SMS messages
        if (event.data?.event_type === 'message.received') {
            const msg = event.data.payload;
            console.log('📱 SMS received:', {
                from: msg.from.phone_number,
                to: msg.to[0].phone_number,
                text: msg.text
            });
            
            // Store message
            const message = {
                id: msg.id,
                from: msg.from.phone_number,
                to: msg.to[0].phone_number,
                text: msg.text,
                timestamp: new Date().toISOString()
            };
            
            messages.unshift(message);
            
            // Keep only last 100 messages
            if (messages.length > 100) {
                messages = messages.slice(0, 100);
            }
            
            console.log('✅ Message stored. Total messages:', messages.length);
        }
        
        // Handle call events
        if (event.data?.event_type?.includes('call')) {
            const call = event.data.payload;
            console.log('📞 Call event:', event.data.event_type);
            
            const callEvent = {
                id: call.call_control_id,
                event_type: event.data.event_type,
                from: call.from,
                to: call.to,
                timestamp: new Date().toISOString()
            };
            
            calls.unshift(callEvent);
            
            if (calls.length > 50) {
                calls = calls.slice(0, 50);
            }
        }
        
        res.status(200).json({ 
            status: 'success',
            event_type: event.data?.event_type || 'unknown'
        });
        
    } catch (error) {
        console.error('❌ Webhook error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
}

// Get messages endpoint
app.get('/messages', (req, res) => {
    res.json({
        messages: messages,
        count: messages.length,
        timestamp: new Date().toISOString()
    });
});

// Get calls endpoint
app.get('/calls', (req, res) => {
    res.json({
        calls: calls,
        count: calls.length,
        timestamp: new Date().toISOString()
    });
});

// Add a test message endpoint
app.post('/test-message', (req, res) => {
    const testMessage = {
        id: 'test-' + Date.now(),
        from: req.body.from || '+1234567890',
        to: req.body.to || '+1987654321',
        text: req.body.text || 'Test message from webhook',
        timestamp: new Date().toISOString()
    };
    
    messages.unshift(testMessage);
    console.log('✅ Test message added:', testMessage);
    
    res.json({
        status: 'Test message added',
        message: testMessage,
        total_messages: messages.length
    });
});

app.listen(port, () => {
    console.log(`🚀 Webhook server running on port ${port}`);
    console.log(`📡 Webhook URL: http://localhost:${port}/webhook`);
    console.log(`📨 Messages API: http://localhost:${port}/messages`);
});