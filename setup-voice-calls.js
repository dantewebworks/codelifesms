#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🎯 Voice Call Setup Helper');
console.log('==========================\n');

// Check if config.js exists
const configPath = path.join(__dirname, 'config.js');
if (!fs.existsSync(configPath)) {
    console.log('❌ config.js not found. Please create it first.');
    process.exit(1);
}

// Read current config
const config = require('./config.js');

console.log('📋 Current Configuration:');
console.log('========================');
console.log(`🔗 SMS Webhook URL: ${config.smsWebhookUrl}`);
console.log(`📞 Voice Webhook URL: ${config.voiceWebhookUrl}`);
console.log(`🔑 Connection ID: ${config.connectionId}`);
console.log('');

if (config.connectionId === 'your_connection_id_here') {
    console.log('⚠️  WARNING: Connection ID not configured!');
    console.log('');
    console.log('📝 To set up voice calls:');
    console.log('1. Go to https://portal.telnyx.com/');
    console.log('2. Navigate to "Call Control" → "Call Control Apps"');
    console.log('3. Create a new Call Control App with:');
    console.log(`   - Webhook URL: ${config.voiceWebhookUrl}`);
    console.log(`   - Webhook Failover URL: ${config.voiceWebhookUrl}`);
    console.log('4. Copy the Connection ID');
    console.log('5. Update config.js with your Connection ID');
    console.log('6. Restart the server: node server.js');
    console.log('');
    console.log('📖 See VOICE_CALL_SETUP.md for detailed instructions');
} else {
    console.log('✅ Connection ID is configured!');
    console.log('🎉 Voice calls should work now.');
    console.log('');
    console.log('🧪 To test:');
    console.log('1. Open http://localhost:3000/sms-dashboard-fixed.html');
    console.log('2. Go to "Send SMS" section');
    console.log('3. Fill in phone numbers');
    console.log('4. Click "Make Call"');
}

console.log('');
console.log('📞 Voice webhook endpoint is ready at:');
console.log(`   ${config.voiceWebhookUrl}`);
console.log('');
console.log('🚀 Server is running on: http://localhost:3000'); 