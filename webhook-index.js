// Simple Telnyx Webhook Handler - Working Version
export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    console.log('📥 Webhook received:', req.method, req.url);

    try {
        if (req.method === 'POST') {
            const event = req.body;
            console.log('📨 Event received:', event);
            
            // Handle Telnyx SMS events
            if (event.data?.event_type === 'message.received') {
                const msg = event.data.payload;
                console.log('📱 SMS received:', {
                    from: msg.from.phone_number,
                    to: msg.to[0].phone_number,
                    text: msg.text
                });
                
                // Store message in memory
                global.messages = global.messages || [];
                global.messages.unshift({
                    id: msg.id,
                    from: msg.from.phone_number,
                    to: msg.to[0].phone_number,
                    text: msg.text,
                    timestamp: new Date().toISOString()
                });
                
                // Keep only last 50 messages
                if (global.messages.length > 50) {
                    global.messages = global.messages.slice(0, 50);
                }
            }
            
            res.status(200).json({ 
                status: 'success',
                event_type: event.data?.event_type || 'unknown',
                timestamp: new Date().toISOString()
            });
            
        } else if (req.method === 'GET') {
            // Check if requesting messages
            if (req.url?.includes('/messages')) {
                res.status(200).json({
                    messages: global.messages || [],
                    count: (global.messages || []).length,
                    timestamp: new Date().toISOString()
                });
                return;
            }
            
            // Health check - main endpoint
            res.status(200).json({
                status: 'Webhook is running! 🚀',
                timestamp: new Date().toISOString(),
                endpoints: {
                    webhook: 'POST /',
                    messages: 'GET /messages'
                },
                stored_messages: (global.messages || []).length,
                version: '1.0.0'
            });
        } else {
            res.status(405).json({ error: 'Method not allowed' });
        }
        
    } catch (error) {
        console.error('❌ Webhook error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
}