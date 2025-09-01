import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3003;

app.use(cors());
app.use(express.json());

// Store call events
let callEvents = [];

// Webhook endpoint for call events
app.post('/webhook/call', (req, res) => {
    console.log('📞 Call webhook received:', req.body);
    callEvents.push({
        timestamp: new Date().toISOString(),
        event: req.body
    });
    
    // Keep only last 50 events
    if (callEvents.length > 50) {
        callEvents = callEvents.slice(-50);
    }
    
    res.status(200).json({ status: 'ok' });
});

// View call events
app.get('/webhook/call', (req, res) => {
    res.json({
        message: 'Call webhook endpoint is active',
        events: callEvents,
        total: callEvents.length
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`🚀 Call Webhook Server running on http://localhost:${PORT}`);
    console.log(`📞 Webhook endpoint: http://localhost:${PORT}/webhook/call`);
    console.log(`📊 View events: http://localhost:${PORT}/webhook/call`);
    console.log(`💚 Health check: http://localhost:${PORT}/health`);
}); 