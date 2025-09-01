import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3002;

// Configure CORS more specifically
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.use(express.json());

// Store messages in memory
let messages = [];

// Webhook endpoint for SMS
app.post('/webhook/sms', (req, res) => {
    console.log('📱 SMS webhook received:', req.body);
    
    const message = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        direction: 'inbound',
        from: req.body.from || req.body.data?.payload?.from?.phone_number || 'Unknown',
        to: req.body.to || req.body.data?.payload?.to?.phone_number || 'Unknown',
        text: req.body.text || req.body.body || req.body.data?.payload?.text || req.body.data?.payload?.body || 'No text',
        status: 'received'
    };
    
    messages.unshift(message);
    
    // Keep only last 100 messages
    if (messages.length > 100) {
        messages = messages.slice(0, 100);
    }
    
    console.log('✅ Message stored:', message);
    res.status(200).json({ success: true, message: 'Message received successfully', messageId: message.id });
});

// Get all messages
app.get('/api/messages', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    res.json({
        success: true,
        messages: messages,
        count: messages.length
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        messageCount: messages.length
    });
});

// Root page
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>SMS Webhook Server</title>
            <style>
                body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
                .status { padding: 10px; border-radius: 5px; margin: 10px 0; }
                .success { background: #d4edda; color: #155724; }
                .info { background: #d1ecf1; color: #0c5460; }
                .message { border: 1px solid #ddd; padding: 10px; margin: 5px 0; border-radius: 5px; }
                .timestamp { color: #666; font-size: 0.8em; }
            </style>
        </head>
        <body>
            <h1>📱 SMS Webhook Server</h1>
            
            <div class="status success">
                <strong>✅ Server is running!</strong><br>
                Webhook URL: <code>${req.protocol}://${req.get('host')}/webhook/sms</code>
            </div>
            
            <div class="status info">
                <strong>📊 Messages received:</strong> ${messages.length}
            </div>
            
            <h2>📨 Recent Messages:</h2>
            <div id="messages">
                ${messages.length === 0 ? '<p>No messages yet. Send an SMS to your Telnyx number to see messages here!</p>' : 
                messages.map(msg => 
                    '<div class="message">' +
                    '<strong>From:</strong> ' + msg.from + '<br>' +
                    '<strong>To:</strong> ' + msg.to + '<br>' +
                    '<strong>Message:</strong> ' + msg.text + '<br>' +
                    '<div class="timestamp">' + new Date(msg.timestamp).toLocaleString() + '</div>' +
                    '</div>'
                ).join('')}
            </div>
            
            <script>
                // Auto-refresh every 5 seconds
                setInterval(() => {
                    fetch('/api/messages')
                        .then(res => res.json())
                        .then(data => {
                            const messagesDiv = document.getElementById('messages');
                            if (data.messages.length === 0) {
                                messagesDiv.innerHTML = '<p>No messages yet. Send an SMS to your Telnyx number to see messages here!</p>';
                            } else {
                                messagesDiv.innerHTML = data.messages.map(msg => 
                                    '<div class="message">' +
                                    '<strong>From:</strong> ' + msg.from + '<br>' +
                                    '<strong>To:</strong> ' + msg.to + '<br>' +
                                    '<strong>Message:</strong> ' + msg.text + '<br>' +
                                    '<div class="timestamp">' + new Date(msg.timestamp).toLocaleString() + '</div>' +
                                    '</div>'
                                ).join('');
                            }
                        });
                }, 5000);
            </script>
        </body>
        </html>
    `);
});

app.listen(PORT, () => {
    console.log(`🚀 SMS Webhook Server running on port ${PORT}`);
    console.log(`📱 Webhook endpoint: http://localhost:${PORT}/webhook/sms`);
    console.log(`📊 Messages API: http://localhost:${PORT}/api/messages`);
    console.log(`💚 Health check: http://localhost:${PORT}/health`);
}); 