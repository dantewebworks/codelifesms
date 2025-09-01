const express = require('express');
const cors = require('cors');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: true, // Allow all origins including file://
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
}));

// Additional CORS headers for file:// protocol
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

app.use(express.json());

// Serve the main dashboard (must come before static middleware)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'sms-dashboard-fixed.html'));
});

app.use(express.static('public'));

// Add CORS preflight handling
app.options('*', cors());

// Store data in memory (in production, use a database)
let apiKey = '';
let phoneNumbers = [];
let incomingMessages = [];
let bulkCSVData = [];

// Business hours configuration
const BUSINESS_HOURS = {
    start: 9, // 9 AM
    end: 17,  // 5 PM
    timezone: 'America/New_York' // EST
};

// Check if current time is within business hours
function isBusinessHours() {
    const now = new Date();
    const estTime = new Date(now.toLocaleString("en-US", {timeZone: BUSINESS_HOURS.timezone}));
    const currentHour = estTime.getHours();
    return currentHour >= BUSINESS_HOURS.start && currentHour < BUSINESS_HOURS.end;
}

// Get next business day start time
function getNextBusinessDay() {
    const now = new Date();
    const estTime = new Date(now.toLocaleString("en-US", {timeZone: BUSINESS_HOURS.timezone}));
    const tomorrow = new Date(estTime);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(BUSINESS_HOURS.start, 0, 0, 0);
    return tomorrow;
}

// Format time for display
function formatTime(date) {
    return date.toLocaleString("en-US", {
        timeZone: BUSINESS_HOURS.timezone,
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short'
    });
}

// Middleware to check business hours for SMS endpoints
function checkBusinessHours(req, res, next) {
    if (!isBusinessHours()) {
        const nextBusinessDay = getNextBusinessDay();
        return res.status(403).json({
            success: false,
            error: `SMS sending is only available during business hours (9AM-5PM EST). Next business day starts: ${formatTime(nextBusinessDay)}`
        });
    }
    next();
}

// Configure multer for CSV uploads (Bulk SMS)
const csvUpload = multer({ 
    dest: 'uploads/',
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
            cb(null, true);
        } else {
            cb(new Error('Only CSV files are allowed!'), false);
        }
    }
});

// Configure multer for MMS uploads (images, documents, etc.)
const mmsUpload = multer({ 
    dest: 'uploads/',
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
        files: 1
    },
    fileFilter: (req, file, cb) => {
        // Allow images, PDFs, documents, and text files
        const allowedMimeTypes = [
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain', 'text/csv'
        ];
        
        if (allowedMimeTypes.includes(file.mimetype) || file.originalname.match(/\.(jpg|jpeg|png|gif|webp|pdf|doc|docx|txt|csv)$/i)) {
            cb(null, true);
        } else {
            cb(new Error('File type not supported. Allowed: Images, PDF, Word docs, Text files'), false);
        }
    }
});

// ==================== API ENDPOINTS ====================

// Test API connection
app.post('/api/test-connection', async (req, res) => {
    try {
        const { apiKey: key } = req.body;
        if (!key) {
            return res.status(400).json({ success: false, error: 'API key required' });
        }

        console.log('🔑 Testing API connection with key:', key.substring(0, 10) + '...');
        
        // Test Telnyx API connection
        const response = await fetch('https://api.telnyx.com/v2/phone_numbers', {
            headers: {
                'Authorization': `Bearer ${key.trim()}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        console.log('📡 API Response status:', response.status);
        console.log('📡 API Response headers:', Object.fromEntries(response.headers.entries()));

        if (response.ok) {
            const data = await response.json();
            console.log('✅ API connection successful, found', data.data?.length || 0, 'phone numbers');
            
            apiKey = key;
            phoneNumbers = data.data || [];
            
            res.json({
                success: true,
                message: 'API connection successful',
                phoneNumbers: phoneNumbers.map(p => ({
                    id: p.id,
                    phone_number: p.phone_number,
                    status: p.status
                }))
            });
        } else {
            const errorText = await response.text();
            console.log('❌ API connection failed:', errorText);
            
            res.status(401).json({
                success: false,
                error: 'API connection failed',
                details: errorText
            });
        }
    } catch (error) {
        console.error('API test error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error',
            details: error.message
        });
    }
});

// Get phone numbers
app.get('/api/phone-numbers', (req, res) => {
    res.json({
        success: true,
        phoneNumbers: phoneNumbers.map(p => ({
            id: p.id,
            phone_number: p.phone_number,
            status: p.status
        }))
    });
});

        // Send SMS
app.post('/api/send-sms', checkBusinessHours, async (req, res) => {
            try {
                console.log('📱 SMS request received:', req.body);
                
                const { to, from, message } = req.body;
                
                if (!apiKey) {
                    console.log('❌ No API key configured');
                    return res.status(400).json({ success: false, error: 'API key not configured' });
                }

                if (!to || !from || !message) {
                    console.log('❌ Missing fields:', { to: !!to, from: !!from, message: !!message });
                    return res.status(400).json({ success: false, error: 'Missing required fields' });
                }

                        // Format phone numbers to ensure they have + prefix
                const formatPhoneNumber = (phone) => {
                    let formatted = phone.trim();
                    if (!formatted.startsWith('+')) {
                        formatted = '+' + formatted;
                    }
                    return formatted;
                };

                const formattedTo = formatPhoneNumber(to);
                const formattedFrom = formatPhoneNumber(from);

                console.log('📡 Sending SMS to Telnyx API...');
                console.log('📡 Request payload:', { to: formattedTo, from: formattedFrom, text: message });
                
                const response = await fetch('https://api.telnyx.com/v2/messages', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiKey.trim()}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        to: formattedTo,
                        from: formattedFrom,
                        text: message
                    })
                });

                console.log('📡 Telnyx API response status:', response.status);
                
                const result = await response.json();
                console.log('📡 Telnyx API response:', result);

                if (response.ok) {
                    console.log('✅ SMS sent successfully to Telnyx');
                    
                    // Store the outgoing message locally
                    const outgoingMessage = {
                        id: Date.now(),
                        timestamp: new Date().toISOString(),
                        from: formattedFrom,
                        to: formattedTo,
                        text: message,
                        status: 'sent',
                        direction: 'outbound'
                    };
                    
                    incomingMessages.unshift(outgoingMessage);
                    console.log('📨 Outgoing message stored:', outgoingMessage);
                    console.log('📨 Total messages stored:', incomingMessages.length);
                    
                    res.json({
                        success: true,
                        message: 'SMS sent successfully',
                        data: result
                    });
                } else {
                    console.log('❌ Telnyx API error:', result);
                    res.status(response.status).json({
                        success: false,
                        error: 'Failed to send SMS',
                        details: result
                    });
                }
    } catch (error) {
        console.error('Send SMS error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error',
            details: error.message
        });
    }
});

// Upload and process CSV
app.post('/api/upload-csv', csvUpload.single('csvFile'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No file uploaded' });
        }

        const results = [];
        const filePath = req.file.path;

        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => {
                // Clean up uploaded file
                fs.unlinkSync(filePath);

                // Process and validate CSV data
                const processedData = processCSVData(results);
                
                if (processedData.success) {
                    bulkCSVData = processedData.data;
                    res.json({
                        success: true,
                        message: `CSV processed successfully: ${bulkCSVData.length} contacts`,
                        data: bulkCSVData,
                        preview: bulkCSVData.slice(0, 5),
                        detectedColumns: processedData.detectedColumns,
                        availableVariables: processedData.availableVariables
                    });
                } else {
                    res.status(400).json({
                        success: false,
                        error: processedData.error
                    });
                }
            })
            .on('error', (error) => {
                // Clean up uploaded file
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
                res.status(500).json({
                    success: false,
                    error: 'Error processing CSV file',
                    details: error.message
                });
            });

    } catch (error) {
        console.error('CSV upload error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error',
            details: error.message
        });
    }
});

// Send bulk SMS
app.post('/api/send-bulk-sms', async (req, res) => {
    try {
        const { fromNumber, template, delay = 1000 } = req.body;

        if (!apiKey) {
            return res.status(400).json({ success: false, error: 'API key not configured' });
        }

        if (bulkCSVData.length === 0) {
            return res.status(400).json({ success: false, error: 'No CSV data loaded' });
        }

        if (!fromNumber) {
            return res.status(400).json({ success: false, error: 'From number required' });
        }

        const results = [];
        let successCount = 0;
        let errorCount = 0;

        // Process each row
        for (let i = 0; i < bulkCSVData.length; i++) {
            const row = bulkCSVData[i];
            const phoneColumn = findPhoneColumn(row);
            
            if (!phoneColumn) {
                errorCount++;
                results.push({
                    phone: 'N/A',
                    status: 'error',
                    message: 'No phone number found'
                });
                continue;
            }

            const phone = row[phoneColumn];
            if (!phone) {
                errorCount++;
                results.push({
                    phone: 'N/A',
                    status: 'error',
                    message: 'Empty phone number'
                });
                continue;
            }

            // Prepare message
            let message = '';
            if (template) {
                message = processTemplate(template, row);
            } else {
                const messageColumn = findMessageColumn(row);
                message = row[messageColumn] || '';
            }

            if (!message.trim()) {
                errorCount++;
                results.push({
                    phone: phone,
                    status: 'error',
                    message: 'No message content'
                });
                continue;
            }

                            try {
                    // Format phone numbers
                    const formatPhoneNumber = (phone) => {
                        let formatted = phone.trim();
                        if (!formatted.startsWith('+')) {
                            formatted = '+' + formatted;
                        }
                        return formatted;
                    };

                    const formattedTo = formatPhoneNumber(phone);
                    const formattedFrom = formatPhoneNumber(fromNumber);

                    // Send SMS
                    const response = await fetch('https://api.telnyx.com/v2/messages', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${apiKey.trim()}`,
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        body: JSON.stringify({
                            to: formattedTo,
                            from: formattedFrom,
                            text: message
                        })
                    });

                const result = await response.json();

                if (response.ok) {
                    successCount++;
                    results.push({
                        phone: phone,
                        status: 'success',
                        message: 'SMS sent successfully',
                        data: result
                    });
                } else {
                    errorCount++;
                    results.push({
                        phone: phone,
                        status: 'error',
                        message: 'Failed to send SMS',
                        details: result
                    });
                }

                // Add delay between messages
                if (i < bulkCSVData.length - 1 && delay > 0) {
                    await new Promise(resolve => setTimeout(resolve, delay));
                }

            } catch (error) {
                errorCount++;
                results.push({
                    phone: phone,
                    status: 'error',
                    message: 'Network error',
                    details: error.message
                });
            }
        }

        res.json({
            success: true,
            message: `Bulk SMS completed: ${successCount} success, ${errorCount} errors`,
            results: results,
            summary: {
                total: bulkCSVData.length,
                success: successCount,
                errors: errorCount
            }
        });

    } catch (error) {
        console.error('Bulk SMS error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error',
            details: error.message
        });
    }
});

        // Webhook for incoming messages
        app.post('/webhook/sms', (req, res) => {
            try {
                const webhookData = req.body;
                console.log('📨 Incoming webhook received:', JSON.stringify(webhookData, null, 2));

                // Check if this is an incoming message webhook (not outgoing)
                const eventType = webhookData.data?.event_type;
                const direction = webhookData.data?.payload?.direction || webhookData.direction;
                
                // Skip outgoing message webhooks (message.sent, message.finalized, etc.)
                if (eventType && (eventType === 'message.sent' || eventType === 'message.finalized' || eventType === 'message.delivered')) {
                    console.log('📤 Skipping outgoing message webhook:', eventType);
                    res.status(200).json({ success: true, message: 'Outgoing message webhook ignored' });
                    return;
                }
                
                // Skip if direction is outbound
                if (direction === 'outbound') {
                    console.log('📤 Skipping outbound message webhook');
                    res.status(200).json({ success: true, message: 'Outbound message webhook ignored' });
                    return;
                }

                // Extract message data from Telnyx webhook format
                let message = {
                    id: Date.now(),
                    timestamp: new Date().toISOString(),
                    from: 'Unknown',
                    to: 'Unknown',
                    text: 'No text',
                    status: 'received'
                };

                console.log('🔍 Starting webhook parsing...');
                console.log('🔍 Webhook data keys:', Object.keys(webhookData));
                
                // Enhanced webhook parsing for different Telnyx formats
                if (webhookData.data) {
                    const data = webhookData.data;
                    console.log('🔍 Data keys:', Object.keys(data));
                    
                    // Format 1: Standard Telnyx webhook with payload
                    if (data.payload) {
                        console.log('🔍 Using Format 1: Standard Telnyx webhook with payload');
                        console.log('🔍 Payload keys:', Object.keys(data.payload));
                        
                        // Handle from field (could be object with phone_number or direct string)
                        if (data.payload.from && typeof data.payload.from === 'object' && data.payload.from.phone_number) {
                            message.from = data.payload.from.phone_number;
                        } else {
                            message.from = data.payload.from || 'Unknown';
                        }
                        
                        // Handle to field (could be array of objects or direct string)
                        if (Array.isArray(data.payload.to)) {
                            // If it's an array, take the first phone_number
                            message.to = data.payload.to[0]?.phone_number || data.payload.to[0] || 'Unknown';
                        } else if (data.payload.to && typeof data.payload.to === 'object' && data.payload.to.phone_number) {
                            message.to = data.payload.to.phone_number;
                        } else {
                            message.to = data.payload.to || 'Unknown';
                        }
                        
                        message.text = data.payload.text || data.payload.body || data.payload.message || 'No text';
                        console.log('🔍 Extracted from payload:', { from: message.from, to: message.to, text: message.text });
                    }
                    // Format 2: Direct message format
                    else if (data.record_type === 'message') {
                        console.log('🔍 Using Format 2: Direct message format');
                        
                        // Handle from field
                        if (data.from && typeof data.from === 'object' && data.from.phone_number) {
                            message.from = data.from.phone_number;
                        } else {
                            message.from = data.from || 'Unknown';
                        }
                        
                        // Handle to field
                        if (Array.isArray(data.to)) {
                            message.to = data.to[0]?.phone_number || data.to[0] || 'Unknown';
                        } else if (data.to && typeof data.to === 'object' && data.to.phone_number) {
                            message.to = data.to.phone_number;
                        } else {
                            message.to = data.to || 'Unknown';
                        }
                        
                        message.text = data.text || data.body || data.message || 'No text';
                        console.log('🔍 Extracted from direct format:', { from: message.from, to: message.to, text: message.text });
                    }
                    // Format 3: Simple data format
                    else {
                        console.log('🔍 Using Format 3: Simple data format');
                        
                        // Handle from field
                        if (data.from && typeof data.from === 'object' && data.from.phone_number) {
                            message.from = data.from.phone_number;
                        } else {
                            message.from = data.from || 'Unknown';
                        }
                        
                        // Handle to field
                        if (Array.isArray(data.to)) {
                            message.to = data.to[0]?.phone_number || data.to[0] || 'Unknown';
                        } else if (data.to && typeof data.to === 'object' && data.to.phone_number) {
                            message.to = data.to.phone_number;
                        } else {
                            message.to = data.to || 'Unknown';
                        }
                        
                        message.text = data.text || data.body || data.message || 'No text';
                        console.log('🔍 Extracted from simple format:', { from: message.from, to: message.to, text: message.text });
                    }
                }
                // Format 4: Direct root level
                else {
                    console.log('🔍 Using Format 4: Direct root level');
                    
                    // Handle from field
                    if (webhookData.from && typeof webhookData.from === 'object' && webhookData.from.phone_number) {
                        message.from = webhookData.from.phone_number;
                    } else {
                        message.from = webhookData.from || 'Unknown';
                    }
                    
                    // Handle to field
                    if (Array.isArray(webhookData.to)) {
                        message.to = webhookData.to[0]?.phone_number || webhookData.to[0] || 'Unknown';
                    } else if (webhookData.to && typeof webhookData.to === 'object' && webhookData.to.phone_number) {
                        message.to = webhookData.to.phone_number;
                    } else {
                        message.to = webhookData.to || 'Unknown';
                    }
                    
                    message.text = webhookData.text || webhookData.body || webhookData.message || 'No text';
                    console.log('🔍 Extracted from root level:', { from: message.from, to: message.to, text: message.text });
                }

                // Additional Telnyx specific formats
                if (message.text === 'No text') {
                    // Try Telnyx specific message format
                    if (webhookData.data?.payload?.message) {
                        message.text = webhookData.data.payload.message;
                        console.log('🔍 Found text in data.payload.message:', message.text);
                    }
                    // Try Telnyx content format
                    else if (webhookData.data?.payload?.content) {
                        message.text = webhookData.data.payload.content;
                        console.log('🔍 Found text in data.payload.content:', message.text);
                    }
                    // Try Telnyx message_body format
                    else if (webhookData.data?.payload?.message_body) {
                        message.text = webhookData.data.payload.message_body;
                        console.log('🔍 Found text in data.payload.message_body:', message.text);
                    }
                    // Try Telnyx sms format
                    else if (webhookData.data?.payload?.sms) {
                        message.text = webhookData.data.payload.sms;
                        console.log('🔍 Found text in data.payload.sms:', message.text);
                    }
                }

                // Try to find text in any possible location
                if (message.text === 'No text') {
                    console.log('🔍 Text not found, searching deeper...');
                    
                    // Log the entire webhook structure for debugging
                    console.log('🔍 FULL WEBHOOK STRUCTURE:');
                    console.log(JSON.stringify(webhookData, null, 2));
                    
                    // Search recursively for text content
                    const findText = (obj, path = '') => {
                        if (typeof obj === 'string' && obj.length > 0 && obj !== 'Unknown') {
                            console.log(`🔍 Found potential text at ${path}:`, obj);
                            return obj;
                        }
                        if (typeof obj === 'object' && obj !== null) {
                            for (const [key, value] of Object.entries(obj)) {
                                const newPath = path ? `${path}.${key}` : key;
                                const result = findText(value, newPath);
                                if (result) return result;
                            }
                        }
                        return null;
                    };
                    
                    const foundText = findText(webhookData);
                    if (foundText) {
                        message.text = foundText;
                        console.log('🔍 Found text in webhook:', foundText);
                    }
                }

                // Clean up phone numbers (remove any non-numeric characters except +)
                if (message.from && message.from !== 'Unknown' && typeof message.from === 'string') {
                    message.from = message.from.replace(/[^\d+]/g, '');
                    if (!message.from.startsWith('+')) {
                        message.from = '+' + message.from;
                    }
                }
                
                if (message.to && message.to !== 'Unknown') {
                    // Handle case where to is an array (Telnyx format)
                    if (Array.isArray(message.to)) {
                        message.to = message.to[0]?.phone_number || message.to[0] || 'Unknown';
                    }
                    
                    // Now clean up the phone number if it's a string
                    if (typeof message.to === 'string') {
                        message.to = message.to.replace(/[^\d+]/g, '');
                        if (!message.to.startsWith('+')) {
                            message.to = '+' + message.to;
                        }
                    }
                }

                // Add direction field for incoming messages
                message.direction = 'inbound';
                
                console.log('📨 Processed message:', message);

                incomingMessages.unshift(message); // Add to beginning
                if (incomingMessages.length > 100) {
                    incomingMessages = incomingMessages.slice(0, 100); // Keep only last 100
                }

                console.log('📨 Total messages stored:', incomingMessages.length);

                res.status(200).json({ success: true });
            } catch (error) {
                console.error('Webhook error:', error);
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // Voice webhook for call events
        app.post('/webhook/voice', (req, res) => {
            try {
                const webhookData = req.body;
                console.log('📞 Voice webhook received:', JSON.stringify(webhookData, null, 2));

                // Handle different voice call events
                const eventType = webhookData.data?.event_type;
                
                if (eventType) {
                    console.log('📞 Voice event type:', eventType);
                    
                    // Handle call events
                    switch (eventType) {
                        case 'call.initiated':
                            console.log('📞 Call initiated');
                            break;
                        case 'call.answered':
                            console.log('📞 Call answered');
                            break;
                        case 'call.hangup':
                            console.log('📞 Call ended');
                            break;
                        case 'call.recording.saved':
                            console.log('📞 Call recording saved');
                            break;
                        default:
                            console.log('📞 Unhandled voice event:', eventType);
                    }
                }

                res.status(200).json({ success: true });
            } catch (error) {
                console.error('Voice webhook error:', error);
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // Send DTMF tones during a call
        app.post('/api/send-dtmf', async (req, res) => {
            try {
                const { call_control_id, digits } = req.body;
                
                if (!call_control_id || !digits) {
                    return res.status(400).json({ 
                        success: false, 
                        error: 'Missing call_control_id or digits' 
                    });
                }

                console.log('📞 Sending DTMF:', { call_control_id, digits });

                const response = await fetch(`https://api.telnyx.com/v2/calls/${call_control_id}/actions/send_dtmf`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiKey.trim()}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        digits: digits
                    })
                });

                const result = await response.json();

                if (response.ok) {
                    console.log('✅ DTMF sent successfully');
                    res.json({ success: true, message: 'DTMF sent' });
                } else {
                    console.log('❌ DTMF send failed:', result);
                    res.status(response.status).json({
                        success: false,
                        error: 'Failed to send DTMF',
                        details: result
                    });
                }
            } catch (error) {
                console.error('DTMF error:', error);
                res.status(500).json({
                    success: false,
                    error: 'Server error',
                    details: error.message
                });
            }
        });

        // Hangup a call
        app.post('/api/hangup-call', async (req, res) => {
            try {
                const { call_control_id } = req.body;
                
                if (!call_control_id) {
                    return res.status(400).json({ 
                        success: false, 
                        error: 'Missing call_control_id' 
                    });
                }

                console.log('📞 Hanging up call:', call_control_id);

                const response = await fetch(`https://api.telnyx.com/v2/calls/${call_control_id}/actions/hangup`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiKey.trim()}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                });

                const result = await response.json();

                if (response.ok) {
                    console.log('✅ Call hung up successfully');
                    res.json({ success: true, message: 'Call ended' });
                } else {
                    console.log('❌ Hangup failed:', result);
                    res.status(response.status).json({
                        success: false,
                        error: 'Failed to hangup call',
                        details: result
                    });
                }
            } catch (error) {
                console.error('Hangup error:', error);
                res.status(500).json({
                    success: false,
                    error: 'Server error',
                    details: error.message
                });
            }
        });

        // Get all messages (incoming and outgoing)
app.get('/api/messages', (req, res) => {
    console.log('📨 GET /api/messages requested');
    console.log('📨 CORS headers:', req.headers);
    
    res.json({
        success: true,
        messages: incomingMessages,
        total: incomingMessages.length,
        timestamp: new Date().toISOString()
    });
});

// Get incoming messages only
app.get('/api/incoming-messages', (req, res) => {
    console.log('📥 GET /api/incoming-messages requested');
    
    const incomingOnly = incomingMessages.filter(msg => msg.direction === 'inbound');
    
    res.json({
        success: true,
        messages: incomingOnly,
        total: incomingOnly.length,
        timestamp: new Date().toISOString()
    });
});

// Check business hours status
app.get('/api/business-hours-status', (req, res) => {
    const status = {
        isBusinessHours: isBusinessHours(),
        currentTime: new Date().toLocaleString("en-US", {timeZone: BUSINESS_HOURS.timezone}),
        businessHours: {
            start: BUSINESS_HOURS.start,
            end: BUSINESS_HOURS.end,
            timezone: BUSINESS_HOURS.timezone
        }
    };
    
    if (!status.isBusinessHours) {
        status.nextBusinessDay = formatTime(getNextBusinessDay());
    }
    
    res.json(status);
});

// Get sent messages only
app.get('/api/sent-messages', (req, res) => {
    console.log('📤 GET /api/sent-messages requested');
    
    const sentOnly = incomingMessages.filter(msg => msg.direction === 'outbound');
    
    res.json({
        success: true,
        messages: sentOnly,
        total: sentOnly.length,
        timestamp: new Date().toISOString()
    });
});

// Test endpoint for CORS
app.get('/api/test', (req, res) => {
    console.log('🧪 GET /api/test requested');
    res.json({
        success: true,
        message: 'CORS test successful',
        timestamp: new Date().toISOString()
    });
});

        // Test endpoint to add a sample message
        app.post('/api/test-message', (req, res) => {
            const testMessage = {
                id: Date.now(),
                timestamp: new Date().toISOString(),
                from: '+18133038643',
                to: '+18137420762',
                text: 'This is a test message from the server',
                status: 'received',
                direction: 'inbound'
            };

            incomingMessages.unshift(testMessage);
            console.log('🧪 Test message added:', testMessage);

            res.json({
                success: true,
                message: 'Test message added',
                totalMessages: incomingMessages.length
            });
        });

        // Test endpoint to add a message with clear text
        app.post('/api/test-clear-text', (req, res) => {
            const testMessage = {
                id: Date.now(),
                timestamp: new Date().toISOString(),
                from: '+18133038643',
                to: '+18137420762',
                text: 'CLEAR TEXT TEST MESSAGE - THIS SHOULD BE VISIBLE!',
                status: 'received',
                direction: 'inbound'
            };

            incomingMessages.unshift(testMessage);
            console.log('🧪 Clear text test message added:', testMessage);

            res.json({
                success: true,
                message: 'Clear text test message added',
                totalMessages: incomingMessages.length
            });
        });

        // Test endpoint to simulate Telnyx webhook
        app.post('/api/test-telnyx-webhook', (req, res) => {
            // Simulate the exact webhook that Telnyx would send
            const telnyxWebhook = {
                data: {
                    event_type: 'message.received',
                    payload: {
                        from: { phone_number: '+18133038643' },
                        to: { phone_number: '+18137420762' },
                        text: 'TEST MESSAGE FROM TELNYX WEBHOOK'
                    }
                }
            };

            // Process it through the webhook endpoint
            const originalReq = req;
            const originalRes = res;
            
            // Create a mock request to the webhook endpoint
            const mockReq = {
                body: telnyxWebhook
            };
            
            const mockRes = {
                status: (code) => ({
                    json: (data) => {
                        console.log('🧪 Telnyx webhook test processed:', data);
                        originalRes.json({
                            success: true,
                            message: 'Telnyx webhook test completed',
                            webhookData: telnyxWebhook
                        });
                    }
                })
            };

            // Call the webhook handler directly
            app._router.stack.forEach(layer => {
                if (layer.route && layer.route.path === '/webhook/sms') {
                    layer.route.stack.forEach(stack => {
                        if (stack.method === 'post') {
                            stack.handle(mockReq, mockRes);
                        }
                    });
                }
                    });
    });

// Send MMS (Multimedia Message)
app.post('/api/send-mms', checkBusinessHours, mmsUpload.single('file'), async (req, res) => {
    try {
        console.log('📷 MMS request received:', req.body);
        
        const { to, from, message } = req.body;
        const file = req.file;
        
        if (!apiKey) {
            console.log('❌ No API key configured');
            return res.status(400).json({ success: false, error: 'API key not configured' });
        }

        if (!to || !from) {
            console.log('❌ Missing fields:', { to: !!to, from: !!from });
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }

        if (!file) {
            console.log('❌ No file uploaded');
            return res.status(400).json({ success: false, error: 'No file uploaded' });
        }

        // Check file size (Telnyx has a 5MB limit for MMS)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            console.log('❌ File too large:', file.size, 'bytes');
            // Clean up uploaded file
            if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
            return res.status(400).json({ 
                success: false, 
                error: `File too large. Maximum size is 5MB. Your file is ${(file.size / 1024 / 1024).toFixed(1)}MB` 
            });
        }

        // Format phone numbers
        const formatPhoneNumber = (phone) => {
            let formatted = phone.trim();
            if (!formatted.startsWith('+')) {
                formatted = '+' + formatted;
            }
            return formatted;
        };

        const formattedTo = formatPhoneNumber(to);
        const formattedFrom = formatPhoneNumber(from);

        // Read file and convert to base64
        const fileBuffer = fs.readFileSync(file.path);
        const base64Data = fileBuffer.toString('base64');
        const mimeType = file.mimetype;

        console.log('📡 Sending MMS to Telnyx API...');
        console.log('📡 File info:', { 
            originalName: file.originalname, 
            mimeType: mimeType, 
            size: file.size 
        });
        
        // For MMS, we need to use the correct Telnyx MMS format
        // Telnyx MMS requires specific media format
        const requestBody = {
            to: [formattedTo],
            from: formattedFrom,
            text: message || '',
            media: [{
                content: base64Data,
                content_type: mimeType,
                filename: file.originalname
            }]
        };

        console.log('📡 Request body:', JSON.stringify(requestBody, null, 2));

        // Send as MMS with actual file content
        const response = await fetch('https://api.telnyx.com/v2/messages', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey.trim()}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        console.log('📡 Telnyx API response status:', response.status);
        
        const result = await response.json();
        console.log('📡 Telnyx API response:', result);

        if (response.ok) {
            console.log('✅ MMS sent successfully to Telnyx');
            
            // Store the outgoing MMS locally
            const outgoingMessage = {
                id: Date.now(),
                timestamp: new Date().toISOString(),
                from: formattedFrom,
                to: formattedTo,
                text: message || '',
                status: 'sent',
                direction: 'outbound',
                type: 'mms',
                media: [{
                    filename: file.originalname,
                    content_type: mimeType,
                    size: file.size
                }]
            };
            
            incomingMessages.unshift(outgoingMessage);
            console.log('📨 Outgoing MMS stored:', outgoingMessage);
            console.log('📨 Total messages stored:', incomingMessages.length);
            
            // Clean up uploaded file
            fs.unlinkSync(file.path);
            
            res.json({
                success: true,
                message: 'MMS sent successfully',
                data: result
            });
        } else {
            console.log('❌ Telnyx API error:', result);
            // Clean up uploaded file
            if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
            
            // Provide more specific error messages
            let errorMessage = 'Failed to send MMS';
            if (result.errors && result.errors.length > 0) {
                const error = result.errors[0];
                if (error.detail) {
                    errorMessage = error.detail;
                } else if (error.title) {
                    errorMessage = error.title;
                }
            }
            
            res.status(response.status).json({
                success: false,
                error: errorMessage,
                details: result
            });
        }
    } catch (error) {
        console.error('Send MMS error:', error);
        // Clean up uploaded file if it exists
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({
            success: false,
            error: 'Server error',
            details: error.message
        });
    }
});

// Make a call
app.post('/api/make-call', async (req, res) => {
    try {
        console.log('📞 Call request received:', req.body);
        
        const { to, from } = req.body;
        
        if (!apiKey) {
            console.log('❌ No API key configured');
            return res.status(400).json({ success: false, error: 'API key not configured' });
        }

        if (!to || !from) {
            console.log('❌ Missing fields:', { to: !!to, from: !!from });
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }

        // Format phone numbers
        const formatPhoneNumber = (phone) => {
            let formatted = phone.trim();
            if (!formatted.startsWith('+')) {
                formatted = '+' + formatted;
            }
            return formatted;
        };

        const formattedTo = formatPhoneNumber(to);
        const formattedFrom = formatPhoneNumber(from);

        console.log('📡 Making call via Telnyx API...');
        console.log('📡 Call details:', { to: formattedTo, from: formattedFrom });
        
        const response = await fetch('https://api.telnyx.com/v2/calls', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey.trim()}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                to: formattedTo,
                from: formattedFrom,
                connection_id: require('./config').connectionId
            })
        });

        console.log('📡 Telnyx API response status:', response.status);
        
        const result = await response.json();
        console.log('📡 Telnyx API response:', result);

        if (response.ok) {
            console.log('✅ Call initiated successfully');
            res.json({
                success: true,
                message: 'Call initiated successfully',
                data: result
            });
        } else {
            console.log('❌ Telnyx API error:', result);
            res.status(response.status).json({
                success: false,
                error: 'Failed to make call',
                details: result
            });
        }
    } catch (error) {
        console.error('Make call error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error',
            details: error.message
        });
    }
});

// Phone number validation endpoint
app.post('/api/validate-number', async (req, res) => {
    try {
        const { phoneNumber } = req.body;
        
        if (!phoneNumber) {
            return res.status(400).json({
                success: false,
                error: 'Phone number is required'
            });
        }

        if (!apiKey) {
            return res.status(400).json({
                success: false,
                error: 'API key not configured. Please configure your Telnyx API key first.'
            });
        }

        console.log('🔍 Validating phone number:', phoneNumber);

        const response = await fetch(`https://api.telnyx.com/v2/number_lookup/${encodeURIComponent(phoneNumber)}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            let errorMessage = 'Unknown error';
            try {
                const errorData = await response.json();
                errorMessage = errorData.errors?.[0]?.detail || 'API error';
            } catch (parseError) {
                // If JSON parsing fails, try to get text response
                try {
                    const errorText = await response.text();
                    if (errorText.includes('<html>') || errorText.includes('<!DOCTYPE')) {
                        errorMessage = 'Received HTML response instead of JSON. Check API key and endpoint.';
                    } else {
                        errorMessage = errorText || 'Unknown error';
                    }
                } catch (textError) {
                    errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                }
            }
            
            console.error('❌ Telnyx API error:', errorMessage);
            return res.status(response.status).json({
                success: false,
                error: `Telnyx API error: ${errorMessage}`
            });
        }

        const data = await response.json();
        console.log('✅ Number validation result:', data);

        // Extract relevant information
        const result = {
            phoneNumber: phoneNumber,
            carrier: data.data?.carrier?.name || 'Unknown',
            type: data.data?.carrier?.type || 'Unknown',
            countryCode: data.data?.country_code || 'Unknown',
            portability: data.data?.portability || 'Unknown',
            valid: data.data?.valid || false,
            timestamp: new Date().toISOString()
        };

        res.json({
            success: true,
            result: result
        });

    } catch (error) {
        console.error('❌ Error validating phone number:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to validate phone number'
        });
    }
});

// Single phone number validation endpoint (Telnyx)
app.post('/api/validate-number', async (req, res) => {
    try {
        const { phoneNumber } = req.body;
        
        if (!phoneNumber) {
            return res.status(400).json({
                success: false,
                error: 'Phone number is required'
            });
        }

        // Get API key from request body or use stored one
        const { apiKey: requestApiKey } = req.body;
        const keyToUse = requestApiKey || apiKey;
        
        if (!keyToUse) {
            return res.status(400).json({
                success: false,
                error: 'API key not provided. Please provide your Telnyx API key in the request.'
            });
        }

        console.log(`🔍 Validating single phone number: ${phoneNumber}`);

        // Add small delay to prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, 300)); // 0.3 second delay

        const response = await fetch(`https://api.telnyx.com/v2/number_lookup/${encodeURIComponent(phoneNumber)}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${keyToUse}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            res.json({
                success: true,
                phoneNumber: phoneNumber,
                carrier: data.data?.carrier?.name || 'Unknown',
                type: data.data?.carrier?.type || 'Unknown',
                countryCode: data.data?.country_code || 'Unknown',
                portability: data.data?.portability || 'Unknown',
                valid: data.data?.valid || false,
                api: 'telnyx',
                timestamp: new Date().toISOString()
            });
        } else {
            const errorData = await response.json();
            res.status(response.status).json({
                success: false,
                error: errorData.errors?.[0]?.detail || 'API error',
                api: 'telnyx'
            });
        }

    } catch (error) {
        console.error('❌ Error in single phone number validation:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to validate phone number'
        });
    }
});

// Single phone number validation endpoint (Twilio)
app.post('/api/validate-number-twilio', async (req, res) => {
    try {
        const { phoneNumber } = req.body;
        
        if (!phoneNumber) {
            return res.status(400).json({
                success: false,
                error: 'Phone number is required'
            });
        }

        // Get Twilio credentials from request body
        const { accountSid, authToken } = req.body;
        
        if (!accountSid || !authToken) {
            return res.status(400).json({
                success: false,
                error: 'Twilio Account SID and Auth Token are required'
            });
        }

        console.log(`🔍 Validating single phone number with Twilio: ${phoneNumber}`);

        // Add longer delay for trial accounts to prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay for trial accounts

        // Create Basic Auth header for Twilio
        const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

        const response = await fetch(`https://lookups.twilio.com/v2/PhoneNumbers/${encodeURIComponent(phoneNumber)}?Fields=line_type_intelligence,validation`, {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            
            // Map Twilio response to our format
            const lineType = data.line_type_intelligence || {};
            const carrier = lineType.carrier_name || data.carrier?.name || 'Unknown';
            const type = lineType.type || data.carrier?.type || 'Unknown';

            res.json({
                success: true,
                result: {
                    phoneNumber: phoneNumber,
                    carrier: carrier,
                    type: type,
                    countryCode: data.country_code || 'Unknown',
                    valid: true, // Twilio Lookups v2 request succeeded
                    timestamp: new Date().toISOString()
                },
                api: 'twilio'
            });
        } else {
            const errorData = await response.json();
            const errorMessage = errorData.message || 'Twilio API error';
            
            // Check for rate limit errors
            if (errorMessage.includes('rate limit') || errorMessage.includes('maximum rate limit') || response.status === 429) {
                console.log('⚠️ Twilio rate limit reached for single validation');
                res.status(429).json({
                    success: false,
                    error: `Rate limit reached: ${errorMessage}. Please wait a moment and try again.`,
                    api: 'twilio',
                    rateLimited: true
                });
            } else {
                res.status(response.status).json({
                    success: false,
                    error: errorMessage,
                    api: 'twilio'
                });
            }
        }

    } catch (error) {
        console.error('❌ Error in Twilio phone number validation:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to validate phone number with Twilio'
        });
    }
});

// Bulk phone number validation endpoint
app.post('/api/validate-numbers-bulk', async (req, res) => {
    try {
        const { phoneNumbers } = req.body;
        
        if (!phoneNumbers || !Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Phone numbers array is required'
            });
        }

        if (phoneNumbers.length > 1000) {
            return res.status(400).json({
                success: false,
                error: 'Maximum 1000 phone numbers allowed per request'
            });
        }

        // Get API key from request body or use stored one
        const { apiKey: requestApiKey } = req.body;
        const keyToUse = requestApiKey || apiKey;
        
        if (!keyToUse) {
            return res.status(400).json({
                success: false,
                error: 'API key not provided. Please provide your Telnyx API key in the request.'
            });
        }

        console.log(`🔍 Validating ${phoneNumbers.length} phone numbers`);

        const results = [];
        const errors = [];

        // Process numbers in batches to avoid rate limiting
        for (let i = 0; i < phoneNumbers.length; i++) {
            const phoneNumber = phoneNumbers[i];
            
            try {
                const response = await fetch(`https://api.telnyx.com/v2/number_lookup/${encodeURIComponent(phoneNumber)}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${keyToUse}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    results.push({
                        phoneNumber: phoneNumber,
                        carrier: data.data?.carrier?.name || 'Unknown',
                        type: data.data?.carrier?.type || 'Unknown',
                        countryCode: data.data?.country_code || 'Unknown',
                        portability: data.data?.portability || 'Unknown',
                        valid: data.data?.valid || false,
                        status: 'success'
                    });
                } else {
                    const errorData = await response.json();
                    errors.push({
                        phoneNumber: phoneNumber,
                        error: errorData.errors?.[0]?.detail || 'API error',
                        status: 'error'
                    });
                }

                // Add delay between requests to respect rate limits
                if (i < phoneNumbers.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }

            } catch (error) {
                errors.push({
                    phoneNumber: phoneNumber,
                    error: 'Network error',
                    status: 'error'
                });
            }
        }

        console.log(`✅ Bulk validation complete. Success: ${results.length}, Errors: ${errors.length}`);

        // Group results by type for CSV export
        const groupedResults = {};
        results.forEach(result => {
            const type = result.type || 'Unknown';
            if (!groupedResults[type]) {
                groupedResults[type] = [];
            }
            groupedResults[type].push(result);
        });

        res.json({
            success: true,
            results: results,
            errors: errors,
            groupedResults: groupedResults,
            summary: {
                total: phoneNumbers.length,
                successful: results.length,
                failed: errors.length
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Error in bulk phone number validation:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to validate phone numbers'
        });
    }
});

// AbstractAPI phone number validation endpoint
app.post('/api/validate-number-abstract', async (req, res) => {
    try {
        const { phoneNumber, apiKey: abstractApiKey } = req.body;
        
        if (!phoneNumber) {
            return res.status(400).json({
                success: false,
                error: 'Phone number is required'
            });
        }

        // Use provided API key or fallback to default
        const apiKeyToUse = abstractApiKey || '2f1d13a22122441c858a6101c287742c';

        console.log('🔍 Validating phone number with AbstractAPI:', phoneNumber);

        const response = await fetch(`https://phonevalidation.abstractapi.com/v1/?api_key=${apiKeyToUse}&phone=${encodeURIComponent(phoneNumber)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('📡 AbstractAPI Response status:', response.status);
        console.log('📡 AbstractAPI Response headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
            let errorMessage = 'Unknown error';
            try {
                const errorData = await response.json();
                errorMessage = errorData.error?.message || 'API error';
            } catch (parseError) {
                try {
                    const errorText = await response.text();
                    console.log('📡 AbstractAPI Error response text:', errorText.substring(0, 200));
                    if (errorText.includes('<html>') || errorText.includes('<!DOCTYPE')) {
                        errorMessage = 'Received HTML response instead of JSON. Check API endpoint and key.';
                    } else {
                        errorMessage = errorText || 'Unknown error';
                    }
                } catch (textError) {
                    errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                }
            }
            
            console.error('❌ AbstractAPI error:', errorMessage);
            return res.status(response.status).json({
                success: false,
                error: `AbstractAPI error: ${errorMessage}`
            });
        }

        let data;
        try {
            data = await response.json();
        } catch (parseError) {
            console.error('❌ Failed to parse AbstractAPI response as JSON:', parseError);
            const errorText = await response.text();
            console.log('📡 AbstractAPI Response text:', errorText.substring(0, 200));
            return res.status(500).json({
                success: false,
                error: 'AbstractAPI returned invalid JSON response'
            });
        }

        console.log('✅ AbstractAPI validation result:', data);

        // Extract relevant information from AbstractAPI response
        const result = {
            phoneNumber: phoneNumber,
            carrier: data.carrier || 'Unknown',
            type: data.type || 'Unknown',
            countryCode: data.country?.code || 'Unknown',
            countryName: data.country?.name || 'Unknown',
            valid: data.valid || false,
            format: data.format?.international || phoneNumber,
            location: data.location || 'Unknown',
            timestamp: new Date().toISOString()
        };

        res.json({
            success: true,
            result: result,
            api: 'abstract'
        });

    } catch (error) {
        console.error('❌ Error validating phone number with AbstractAPI:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to validate phone number with AbstractAPI'
        });
    }
});

// Bulk phone number validation endpoint (Twilio)
app.post('/api/validate-numbers-bulk-twilio', async (req, res) => {
    try {
        const { phoneNumbers } = req.body;
        
        if (!phoneNumbers || !Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Phone numbers array is required'
            });
        }

        // Auto-split large batches for trial accounts (reduced for stricter rate limits)
        const maxBatchSize = 10; // Reduced from 25 for trial accounts
        const batches = [];
        
        // Split phone numbers into chunks of maxBatchSize
        for (let i = 0; i < phoneNumbers.length; i += maxBatchSize) {
            batches.push(phoneNumbers.slice(i, i + maxBatchSize));
        }
        
        console.log(`📦 Split ${phoneNumbers.length} numbers into ${batches.length} batches of max ${maxBatchSize}`);

        // Get Twilio credentials from request body
        const { accountSid, authToken } = req.body;
        
        if (!accountSid || !authToken) {
            return res.status(400).json({
                success: false,
                error: 'Twilio Account SID and Auth Token are required'
            });
        }

        console.log(`🔍 Validating ${phoneNumbers.length} phone numbers with Twilio in ${batches.length} batches`);

        const results = [];
        const errors = [];

        // Create Basic Auth header for Twilio
        const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

        // Process each batch sequentially
        for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
            const currentBatch = batches[batchIndex];
            console.log(`📦 Processing batch ${batchIndex + 1}/${batches.length} with ${currentBatch.length} numbers`);
            
            // Process numbers in current batch
            for (let i = 0; i < currentBatch.length; i++) {
                const phoneNumber = currentBatch[i];
                
                try {
                const response = await fetch(`https://lookups.twilio.com/v2/PhoneNumbers/${encodeURIComponent(phoneNumber)}?Fields=line_type_intelligence,validation`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Basic ${auth}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    
                    // Map Twilio response to our format
                    const lineType = data.line_type_intelligence || {};
                    const carrier = lineType.carrier_name || data.carrier?.name || 'Unknown';
                    const type = lineType.type || data.carrier?.type || 'Unknown';

                    results.push({
                        phoneNumber: phoneNumber,
                        carrier: carrier,
                        type: type,
                        countryCode: data.country_code || 'Unknown',
                        valid: true, // Twilio Lookups v2 request succeeded
                        status: 'success'
                    });
                } else {
                    const errorData = await response.json();
                    const errorMessage = errorData.message || 'Twilio API error';
                    
                    // Check for rate limit errors
                    if (errorMessage.includes('rate limit') || errorMessage.includes('maximum rate limit') || response.status === 429) {
                        console.log(`⚠️ Rate limit hit at batch ${batchIndex + 1}, number ${i + 1}/${currentBatch.length}. Stopping validation.`);
                        errors.push({
                            phoneNumber: phoneNumber,
                            error: `Rate limit reached: ${errorMessage}`,
                            status: 'rate_limited'
                        });
                        
                        // Add remaining numbers in current batch as rate limited
                        for (let j = i + 1; j < currentBatch.length; j++) {
                            errors.push({
                                phoneNumber: currentBatch[j],
                                error: 'Rate limit reached - validation stopped',
                                status: 'rate_limited'
                            });
                        }
                        
                        // Add remaining batches as rate limited
                        for (let b = batchIndex + 1; b < batches.length; b++) {
                            batches[b].forEach(num => {
                                errors.push({
                                    phoneNumber: num,
                                    error: 'Rate limit reached - validation stopped',
                                    status: 'rate_limited'
                                });
                            });
                        }
                        break; // Stop processing
                    }
                    
                    errors.push({
                        phoneNumber: phoneNumber,
                        error: errorMessage,
                        status: 'error'
                    });
                }

                // Add delay between requests to respect rate limits (increased for trial accounts)
                if (i < currentBatch.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second delay for trial accounts
                }

                } catch (error) {
                    errors.push({
                        phoneNumber: phoneNumber,
                        error: 'Network error',
                        status: 'error'
                    });
                }
            }
            
            // Add delay between batches to prevent rate limiting
            if (batchIndex < batches.length - 1) {
                console.log(`⏳ Waiting 30 seconds before next batch...`);
                await new Promise(resolve => setTimeout(resolve, 30000)); // 30 second delay between batches
            }
        }

        console.log(`✅ Twilio bulk validation complete. Success: ${results.length}, Errors: ${errors.length}`);

        // Group results by type for CSV export
        const groupedResults = {};
        results.forEach(result => {
            const type = result.type || 'Unknown';
            if (!groupedResults[type]) {
                groupedResults[type] = [];
            }
            groupedResults[type].push(result);
        });

        res.json({
            success: true,
            results: results,
            errors: errors,
            groupedResults: groupedResults,
            summary: {
                total: phoneNumbers.length,
                successful: results.length,
                failed: errors.length
            },
            api: 'twilio',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Error in Twilio bulk phone number validation:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to validate phone numbers with Twilio'
        });
    }
});

// Bulk phone number validation with AbstractAPI
app.post('/api/validate-numbers-bulk-abstract', async (req, res) => {
    try {
        const { phoneNumbers, apiKey: abstractApiKey } = req.body;
        
        if (!phoneNumbers || !Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Phone numbers array is required'
            });
        }

        if (phoneNumbers.length > 1000) {
            return res.status(400).json({
                success: false,
                error: 'Maximum 1000 phone numbers allowed per request'
            });
        }

        // Use provided API key or fallback to default
        const apiKeyToUse = abstractApiKey || '2f1d13a22122441c858a6101c287742c';

        console.log(`🔍 Validating ${phoneNumbers.length} phone numbers with AbstractAPI`);

        const results = [];
        const errors = [];

        // Process numbers in batches to avoid rate limiting
        for (let i = 0; i < phoneNumbers.length; i++) {
            const phoneNumber = phoneNumbers[i];
            
            try {
                const response = await fetch(`https://phonevalidation.abstractapi.com/v1/?api_key=${apiKeyToUse}&phone=${encodeURIComponent(phoneNumber)}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    results.push({
                        phoneNumber: phoneNumber,
                        carrier: data.carrier || 'Unknown',
                        type: data.type || 'Unknown',
                        countryCode: data.country?.code || 'Unknown',
                        countryName: data.country?.name || 'Unknown',
                        valid: data.valid || false,
                        format: data.format?.international || phoneNumber,
                        location: data.location || 'Unknown',
                        status: 'success'
                    });
                } else {
                    const errorData = await response.json();
                    errors.push({
                        phoneNumber: phoneNumber,
                        error: errorData.error?.message || 'API error',
                        status: 'error'
                    });
                }

                // Add delay between requests to respect rate limits
                if (i < phoneNumbers.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 200));
                }

            } catch (error) {
                errors.push({
                    phoneNumber: phoneNumber,
                    error: 'Network error',
                    status: 'error'
                });
            }
        }

        console.log(`✅ AbstractAPI bulk validation complete. Success: ${results.length}, Errors: ${errors.length}`);

        res.json({
            success: true,
            results: results,
            errors: errors,
            summary: {
                total: phoneNumbers.length,
                successful: results.length,
                failed: errors.length
            },
            api: 'abstract',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Error in bulk phone number validation with AbstractAPI:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to validate phone numbers with AbstractAPI'
        });
    }
});

// Make voice call endpoint
app.post('/api/make-call', async (req, res) => {
    try {
        const { from, to, audioUrl, apiKey: requestApiKey } = req.body;
        
        if (!from || !to) {
            return res.status(400).json({
                success: false,
                error: 'From number and to number are required'
            });
        }

        const apiKeyToUse = requestApiKey || apiKey;

        if (!apiKeyToUse) {
            return res.status(400).json({
                success: false,
                error: 'API key not configured. Please configure your Telnyx API key first.'
            });
        }

        console.log(`📞 Making voice call from ${from} to ${to} with audio: ${audioUrl}`);

        // Format phone numbers to E.164
        const formatE164 = (phone) => {
            if (!phone) return null;
            let cleaned = phone.replace(/[^\d]/g, '');
            if (cleaned.length === 10) cleaned = '1' + cleaned; // Add US country code
            return '+' + cleaned;
        };

        const formattedFrom = formatE164(from);
        const formattedTo = formatE164(to);

        // Prepare call payload
        const callPayload = {
            from: formattedFrom,
            to: formattedTo,
            connection_id: require('./config').connectionId,
            webhook_url: 'https://codelife-sms-app-48d5c9e059b8.herokuapp.com/webhook/voice',
            webhook_events: ['call.initiated', 'call.answered', 'call.hangup', 'call.failed']
        };

        // Add audio_url only if provided
        if (audioUrl && audioUrl.trim()) {
            callPayload.audio_url = audioUrl;
        }

        // Create Telnyx Voice API call
        const response = await fetch('https://api.telnyx.com/v2/calls', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKeyToUse}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(callPayload)
        });

        console.log('📡 Telnyx Voice API response status:', response.status);
        
        const result = await response.json();
        console.log('📡 Telnyx Voice API response:', result);

        if (response.ok) {
            console.log('✅ Call initiated successfully');
            res.json({
                success: true,
                callId: result.data.id,
                message: 'Call initiated successfully',
                data: result
            });
        } else {
            console.log('❌ Telnyx Voice API error:', result);
            res.status(response.status).json({
                success: false,
                error: result.errors?.[0]?.detail || 'Failed to make call',
                details: result
            });
        }
    } catch (error) {
        console.error('Make call error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error',
            details: error.message
        });
    }
});

// WebRTC token endpoint
app.post('/api/webrtc-token', async (req, res) => {
    try {
        const { apiKey } = req.body;
        
        if (!apiKey) {
            return res.status(400).json({
                success: false,
                error: 'API key is required'
            });
        }

        console.log('🔑 Generating WebRTC token...');

        // Generate a Telnyx WebRTC token
        const token = await generateTelnyxWebRTCToken(apiKey);

        res.json({
            success: true,
            token: token
        });

    } catch (error) {
        console.error('WebRTC token error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate WebRTC token',
            details: error.message
        });
    }
});

// Generate Telnyx WebRTC token
async function generateTelnyxWebRTCToken(apiKey) {
    try {
        // Create a JWT token for WebRTC
        const jwt = require('jsonwebtoken');
        
        const payload = {
            iss: 'telnyx',
            sub: 'webrtc',
            exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour expiration
            iat: Math.floor(Date.now() / 1000)
        };

        // For now, we'll use a simple token generation
        // In production, you should use Telnyx's token generation service
        const token = jwt.sign(payload, apiKey, { algorithm: 'HS256' });
        
        return token;
    } catch (error) {
        console.error('Token generation error:', error);
        throw new Error('Failed to generate WebRTC token');
    }
}

// Voice webhook endpoint
app.post('/webhook/voice', (req, res) => {
    try {
        const event = req.body;
        console.log('📞 Voice webhook received:', event);

        // Handle different voice events
        switch (event.event_type) {
            case 'call.initiated':
                console.log('📞 Call initiated:', event.data.id);
                break;
            case 'call.answered':
                console.log('📞 Call answered:', event.data.id);
                break;
            case 'call.hangup':
                console.log('📞 Call completed:', event.data.id);
                break;
            case 'call.failed':
                console.log('📞 Call failed:', event.data.id);
                break;
            default:
                console.log('📞 Unknown voice event:', event.event_type);
        }

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Voice webhook error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// CSV Export endpoint
app.post('/api/export-csv', (req, res) => {
    try {
        const { groupedResults, api } = req.body;
        
        if (!groupedResults || typeof groupedResults !== 'object') {
            return res.status(400).json({
                success: false,
                error: 'Grouped results are required'
            });
        }

        const csvFiles = [];
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

        // Create CSV for each type
        Object.keys(groupedResults).forEach(type => {
            const numbers = groupedResults[type];
            if (numbers.length > 0) {
                // Create CSV content
                const headers = ['Phone Number', 'Type', 'Carrier', 'Country Code', 'Valid', 'Timestamp'];
                const csvContent = [
                    headers.join(','),
                    ...numbers.map(num => [
                        num.phoneNumber,
                        num.type || 'Unknown',
                        num.carrier || 'Unknown',
                        num.countryCode || 'Unknown',
                        num.valid ? 'Yes' : 'No',
                        num.timestamp || new Date().toISOString()
                    ].join(','))
                ].join('\n');

                const fileName = `${type}_numbers_${api}_${timestamp}.csv`;
                csvFiles.push({
                    type: type,
                    fileName: fileName,
                    count: numbers.length,
                    downloadUrl: `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`
                });
            }
        });

        res.json({
            success: true,
            csvFiles: csvFiles,
            totalTypes: csvFiles.length
        });

    } catch (error) {
        console.error('❌ Error generating CSV export:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate CSV export'
        });
    }
});

// Clear data
app.post('/api/clear-data', (req, res) => {
    const { type } = req.body;
    
    if (type === 'bulk') {
        bulkCSVData = [];
    } else if (type === 'messages') {
        incomingMessages = [];
    } else if (type === 'all') {
        bulkCSVData = [];
        incomingMessages = [];
    }

    res.json({
        success: true,
        message: `Cleared ${type} data`
    });
});

// Direct messages endpoint for compatibility
app.get('/messages', (req, res) => {
    console.log('📨 GET /messages requested (direct endpoint)');
    
    res.json({
        success: true,
        messages: incomingMessages,
        total: incomingMessages.length,
        timestamp: new Date().toISOString()
    });
});

app.post('/messages', (req, res) => {
    console.log('📨 POST /messages requested (direct endpoint)');
    
    res.json({
        success: true,
        messages: incomingMessages,
        total: incomingMessages.length,
        timestamp: new Date().toISOString()
    });
});

// ==================== HELPER FUNCTIONS ====================

function processCSVData(data) {
    if (data.length === 0) {
        return { success: false, error: 'CSV file is empty' };
    }

    const headers = Object.keys(data[0]);
    const phoneColumn = findPhoneColumnInHeaders(headers);
    
    if (!phoneColumn) {
        return { 
            success: false, 
            error: `No phone number column found. Available columns: ${headers.join(', ')}` 
        };
    }

    // Detect column types
    const detectedColumns = detectColumnTypes(headers);
    const availableVariables = headers.map(h => `{{${h}}}`);

    return {
        success: true,
        data: data,
        detectedColumns: detectedColumns,
        availableVariables: availableVariables
    };
}

function findPhoneColumnInHeaders(headers) {
    const phoneVariations = ['phone', 'phonenumber', 'phone_number', 'mobile', 'cell', 'number', 'telephone', 'contact'];
    
    for (const header of headers) {
        const lowerHeader = header.toLowerCase();
        if (phoneVariations.some(variant => lowerHeader.includes(variant))) {
            return header;
        }
    }
    
    return null;
}

function findPhoneColumn(row) {
    const headers = Object.keys(row);
    return findPhoneColumnInHeaders(headers);
}

function findMessageColumn(row) {
    const headers = Object.keys(row);
    const messageVariations = ['message', 'text', 'sms', 'content', 'body'];
    
    for (const header of headers) {
        const lowerHeader = header.toLowerCase();
        if (messageVariations.some(variant => lowerHeader.includes(variant))) {
            return header;
        }
    }
    
    return null;
}

function detectColumnTypes(headers) {
    const columnMapping = {
        phone: ['phone', 'phonenumber', 'phone_number', 'mobile', 'cell', 'number', 'telephone', 'contact'],
        name: ['name', 'firstname', 'first_name', 'fullname', 'full_name', 'customer_name', 'client_name'],
        email: ['email', 'e-mail', 'email_address', 'e_mail'],
        address: ['address', 'street', 'street_address', 'location', 'city', 'state', 'zip', 'postal_code'],
        company: ['company', 'business', 'business_name', 'organization', 'org', 'employer'],
        message: ['message', 'text', 'sms', 'content', 'body'],
        custom: ['custom', 'notes', 'comment', 'description', 'info', 'additional']
    };

    const detected = {};
    
    for (const [type, variations] of Object.entries(columnMapping)) {
        for (const header of headers) {
            const lowerHeader = header.toLowerCase();
            if (variations.some(variant => lowerHeader.includes(variant))) {
                detected[type] = header;
                break;
            }
        }
    }

    return detected;
}

function processTemplate(template, row) {
    let message = template;
    const headers = Object.keys(row);
    
    // Replace all column variables
    headers.forEach(header => {
        const regex = new RegExp(`\\{\\{${header}\\}\\}`, 'g');
        message = message.replace(regex, row[header] || '');
    });
    
    return message;
}

// ==================== SERVER START ====================

app.listen(PORT, () => {
    console.log(`🚀 CodeLife SMS Backend running on port ${PORT}`);
    console.log(`📁 Static files served from: ${path.join(__dirname, 'public')}`);
    console.log(`🔗 API endpoints available at: http://localhost:${PORT}/api/`);
});

module.exports = app;