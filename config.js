// Telnyx Configuration via environment variables
module.exports = {
    // Use environment variables to avoid committing secrets
    apiKey: process.env.TELNYX_API_KEY || '',
    connectionId: process.env.TELNYX_CONNECTION_ID || '',

    // Webhook URLs
    smsWebhookUrl: process.env.SMS_WEBHOOK_URL || '',
    voiceWebhookUrl: process.env.VOICE_WEBHOOK_URL || '',

    // Server Configuration
    port: parseInt(process.env.PORT || '3000', 10),

    // Phone Numbers (comma-separated in TELNYX_PHONE_NUMBERS)
    phoneNumbers: (process.env.TELNYX_PHONE_NUMBERS || '')
        .split(',')
        .map(n => n.trim())
        .filter(Boolean)
};
