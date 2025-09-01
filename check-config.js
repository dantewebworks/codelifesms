#!/usr/bin/env node

const config = require('./config.js');

console.log('🔍 Configuration Check');
console.log('=====================\n');

// Check Connection ID
if (config.connectionId === 'your_connection_id_here') {
    console.log('❌ Connection ID not configured');
    console.log('   Please update config.js with your Telnyx Connection ID\n');
} else {
    console.log('✅ Connection ID configured');
    console.log(`   ID: ${config.connectionId.substring(0, 20)}...\n`);
}

// Check Webhook URLs
console.log('🔗 Webhook URLs:');
console.log(`   SMS: ${config.smsWebhookUrl}`);
console.log(`   Voice: ${config.voiceWebhookUrl}\n`);

// Check Phone Numbers
console.log('📱 Phone Numbers:');
config.phoneNumbers.forEach(phone => {
    console.log(`   ${phone}`);
});

console.log('\n📋 Next Steps:');
if (config.connectionId === 'your_connection_id_here') {
    console.log('1. Get Connection ID from Telnyx Call Control App');
    console.log('2. Update config.js');
    console.log('3. Restart server: node server.js');
    console.log('4. Test voice calls in the dashboard');
} else {
    console.log('✅ Configuration looks good!');
    console.log('🎉 Voice calls should work now.');
    console.log('🧪 Test by clicking "Make Call" in the dashboard');
} 