# CodeLife SMS Platform

A comprehensive SMS and voice call management platform built with Node.js, Express, and Telnyx API.

## 🚀 Features

- **SMS Management**: Send individual and bulk SMS messages
- **Voice Calls**: Make voice calls with WebRTC integration
- **Message History**: View incoming and sent messages
- **Conversation View**: Continue conversations with contacts
- **Webhook Integration**: Real-time message and call updates
- **Auto-Startup**: Everything works with one command

## 📋 Prerequisites

- Node.js (v14 or higher)
- ngrok (for webhook tunneling)
- Telnyx account with API key and phone numbers

## 🛠️ Installation

1. **Clone or download the project**
   ```bash
   cd CodeLifeSMS
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install ngrok** (if not already installed)
   ```bash
   # macOS
   brew install ngrok
   
   # Or download from https://ngrok.com/download
   ```

## ⚙️ Configuration

The platform automatically saves your settings. Configure sensitive values via environment variables (never commit secrets):

- **Telnyx API Key**: set via `TELNYX_API_KEY`
- **Connection ID**: set via `TELNYX_CONNECTION_ID`
- **Phone Numbers**: set via `TELNYX_PHONE_NUMBERS` (comma-separated)
- **Backend Port**: set via `PORT` (default: `3000`)

## 🚀 Quick Start

### One-Command Startup
```bash
npm start
```

This will:
- ✅ Start the backend server
- ✅ Start ngrok tunnel
- ✅ Update webhook URLs automatically
- ✅ Open the dashboard in your browser
- ✅ Save all settings for next time

### Manual Commands
```bash
# Start all services
node startup.js start

# Check status
node startup.js status

# View configuration
node startup.js config

# Reset to defaults
node startup.js reset
```

## 📱 Usage

### Dashboard Access
- **Local**: `http://localhost:3000/sms-dashboard-fixed.html`
- **File Protocol**: `file:///path/to/sms-dashboard-fixed.html`

### Features

#### 1. Send SMS
- Select "From" phone number
- Enter recipient number
- Type message and send

#### 2. Bulk SMS
- Upload CSV file with phone numbers
- Send to multiple recipients at once

#### 3. Message History
- **Incoming Messages**: View received messages
- **Sent Messages**: View sent messages with conversation view

#### 4. Voice Calls
- Click "Make Call" on any contact
- WebRTC interface opens for voice communication
- Full call controls (mute, hangup, DTMF)

#### 5. Conversation View
- Click "View Chat" in sent messages
- See full conversation history
- Continue texting from the chat interface

## 🔧 Configuration Files

### startup-config.json
Automatically created and updated with your settings:
```json
{
  "backend": {
    "port": 3000,
    "autoStart": true
  },
  "ngrok": {
    "autoStart": true,
    "port": 3000,
    "region": "us"
  },
  "telnyx": {
    "apiKey": "your-api-key",
    "connectionId": "your-connection-id",
    "phoneNumbers": ["+1234567890"]
  },
  "webhooks": {
    "smsWebhookUrl": "https://your-ngrok-url.ngrok-free.app/webhook/sms",
    "voiceWebhookUrl": "https://your-ngrok-url.ngrok-free.app/webhook/voice"
  }
}
```

### config.js
Automatically updated with webhook URLs:
```javascript
module.exports = {
  apiKey: 'your-api-key',
  connectionId: 'your-connection-id',
  smsWebhookUrl: 'https://your-ngrok-url.ngrok-free.app/webhook/sms',
  voiceWebhookUrl: 'https://your-ngrok-url.ngrok-free.app/webhook/voice',
  port: 3000,
  phoneNumbers: ['+1234567890']
};
```

## 🌐 Webhook Setup

The platform automatically configures webhooks:

1. **SMS Webhook**: `/webhook/sms` - Receives incoming SMS
2. **Voice Webhook**: `/webhook/voice` - Receives call events

### Telnyx Webhook Configuration
In your Telnyx dashboard, set webhook URLs to:
- **SMS**: `https://your-ngrok-url.ngrok-free.app/webhook/sms`
- **Voice**: `https://your-ngrok-url.ngrok-free.app/webhook/voice`

## 📊 API Endpoints

### SMS Endpoints
- `POST /api/send-sms` - Send individual SMS
- `POST /api/send-mms` - Send MMS with media
- `GET /api/messages` - Get all messages
- `GET /api/incoming-messages` - Get incoming messages
- `GET /api/sent-messages` - Get sent messages

### Voice Endpoints
- `POST /api/make-call` - Initiate voice call
- `POST /api/send-dtmf` - Send DTMF tones
- `POST /api/hangup-call` - End call

### Utility Endpoints
- `GET /api/test` - Test API connection
- `GET /api/test-connection` - Test Telnyx connection
- `POST /api/clear-data` - Clear message history

## 🔄 Auto-Startup Features

### What Happens on Startup
1. **Kills existing processes** - Cleans up any running instances
2. **Starts backend server** - Node.js Express server
3. **Starts ngrok tunnel** - Creates public URL for webhooks
4. **Updates webhook URLs** - Automatically configures Telnyx webhooks
5. **Opens dashboard** - Launches browser to the dashboard
6. **Saves configuration** - Remembers all settings for next time

### Graceful Shutdown
Press `Ctrl+C` to stop all services cleanly.

## 🛠️ Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Kill existing processes
pkill -f "node server.js"
lsof -ti:3000 | xargs kill -9
```

#### 2. Ngrok Not Working
```bash
# Check ngrok installation
ngrok version

# Start manually
ngrok http 3000
```

#### 3. Webhook Not Receiving
- Check ngrok URL is correct
- Verify webhook URLs in Telnyx dashboard
- Check firewall settings

#### 4. Voice Calls Not Working
- Ensure Telnyx Call Control App is configured
- Check connection ID is correct
- Verify webhook URLs are set

### Status Check
```bash
npm run status
```

This shows:
- ✅ Backend status
- ✅ Ngrok status and URLs
- 📋 Current configuration

## 📁 File Structure

```
CodeLifeSMS/
├── server.js                 # Main backend server
├── startup.js               # Auto-startup manager
├── config.js                # Configuration file
├── package.json             # Dependencies and scripts
├── startup-config.json      # Saved settings
├── public/                  # Static files
│   ├── index.html          # Main dashboard
│   └── sms-dashboard-fixed.html
├── phone-interface-webrtc.html  # Voice call interface
└── README.md               # This file
```

## 🔐 Security

- API keys are stored locally
- Webhook URLs are automatically generated
- No sensitive data is logged
- All communications use HTTPS

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Run `npm run status` to check system health
3. Review the configuration with `npm run config`

## 🎉 Ready to Use!

Your CodeLife SMS Platform is now fully configured and ready to use. Just run:

```bash
npm start
```

Everything will start automatically and work exactly as you've configured it! 🚀📱