// Simple Telnyx Webhook Handler - Single File Version
// This handles incoming SMS messages and call events

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

    console.log('📥 Webhook received:', req.method, req.body);

    try {
        if (req.method === 'POST') {
            const event = req.body;
            
            // Handle Telnyx events
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
            
            if (event.data?.event_type?.includes('call')) {
                const call = event.data.payload;
                console.log('📞 Call event:', event.data.event_type, call.from, call.to);
                
                // Store call event
                global.calls = global.calls || [];
                global.calls.unshift({
                    event: event.data.event_type,
                    from: call.from,
                    to: call.to,
                    timestamp: new Date().toISOString()
                });
                
                if (global.calls.length > 20) {
                    global.calls = global.calls.slice(0, 20);
                }
            }
            
            res.status(200).json({ 
                status: 'success',
                event_type: event.data?.event_type || 'unknown'
            });
            
        } else if (req.method === 'GET') {
            // Check if requesting messages
            if (req.url?.includes('/messages')) {
                res.status(200).json({
                    messages: global.messages || [],
                    count: (global.messages || []).length
                });
                return;
            }
            
            // Check if requesting calls
            if (req.url?.includes('/calls')) {
                res.status(200).json({
                    calls: global.calls || [],
                    count: (global.calls || []).length
                });
                return;
            }
            
            // Health check
            res.status(200).json({
                status: 'Webhook is running! 🚀',
                timestamp: new Date().toISOString(),
                endpoints: {
                    webhook: 'POST /',
                    messages: 'GET /messages',
                    calls: 'GET /calls'
                },
                stored_messages: (global.messages || []).length,
                stored_calls: (global.calls || []).length
            });
        } else {
            res.status(405).json({ error: 'Method not allowed' });
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ 
            error: 'Server error',
            message: error.message 
        });
    }
}