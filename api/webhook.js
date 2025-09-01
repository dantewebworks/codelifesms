// Vercel Serverless Function for Telnyx Webhook
export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    console.log('📥 Webhook received:', req.method, req.url);

    try {
        if (req.method === 'POST') {
            const event = req.body;
            console.log('📨 Event received:', event);
            
            // Handle Telnyx SMS events
            if (event.data?.event_type === 'message.received') {
                const msg = event.data.payload;
                console.log('📱 SMS received from:', msg.from.phone_number);
                
                // Store message (in production, use a database)
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
            
            return res.status(200).json({ 
                status: 'success',
                event_type: event.data?.event_type || 'unknown'
            });
            
        } else if (req.method === 'GET') {
            // Health check
            return res.status(200).json({
                status: 'Webhook is running! 🚀',
                timestamp: new Date().toISOString(),
                stored_messages: (global.messages || []).length
            });
        }
        
        return res.status(405).json({ error: 'Method not allowed' });
        
    } catch (error) {
        console.error('❌ Webhook error:', error);
        return res.status(500).json({ 
            error: 'Internal server error',
            message: error.message
        });
    }
}