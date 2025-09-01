const express = require('express');
const cors = require('cors');

const app = express();
const port = 3001; // Different port

app.use(cors());
app.use(express.json());

let messages = [];

app.get('/', (req, res) => {
    console.log('Health check requested');
    res.json({
        status: 'Simple Backend Running! 🚀',
        port: port,
        messages_count: messages.length
    });
});

app.get('/messages', (req, res) => {
    console.log('Messages requested');
    res.json({
        messages: messages,
        count: messages.length
    });
});

app.post('/webhook/sms', (req, res) => {
    console.log('📥 Webhook received:', req.body);
    
    if (req.body.data?.event_type === 'message.received') {
        const msg = req.body.data.payload;
        const message = {
            id: msg.id,
            from: msg.from.phone_number,
            to: msg.to[0].phone_number,
            text: msg.text,
            timestamp: new Date().toISOString()
        };
        
        messages.unshift(message);
        console.log('📱 Message stored:', message);
    }
    
    res.json({ status: 'received' });
});

app.post('/test-message', (req, res) => {
    const testMessage = {
        id: 'test-' + Date.now(),
        from: '+1234567890',
        to: '+18137420762',
        text: 'Test message from simple backend',
        timestamp: new Date().toISOString()
    };
    
    messages.unshift(testMessage);
    console.log('📱 Test message added:', testMessage);
    
    res.json({ status: 'Test message added', message: testMessage });
});

app.listen(port, () => {
    console.log(`🚀 Simple Backend running on http://localhost:${port}`);
    console.log(`📨 Test it: http://localhost:${port}/`);
    console.log(`📨 Messages: http://localhost:${port}/messages`);
    console.log(`📨 Add test: http://localhost:${port}/test-message`);
});