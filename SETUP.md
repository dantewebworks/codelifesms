# 🚀 SMS Dashboard Setup

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Backend
```bash
node backend.js
```
You should see:
```
🚀 SMS Backend running on http://localhost:3000
📡 Webhook URL: https://b7926f883d32.ngrok-free.app/webhook/sms
📨 Messages API: http://localhost:3000/messages
Ready to receive SMS! 📱
```

### 3. Start ngrok (in another terminal)
```bash
ngrok http 3000
```

### 4. Update Telnyx Webhook
- Go to Telnyx Portal → Messaging → Messaging Profiles
- Set webhook URL to: `https://your-ngrok-url.ngrok.io/webhook/sms`

### 5. Open Dashboard
- Open `sms-dashboard-working.html` in your browser
- Live updates will start automatically
- Send SMS to +18137420762 to test

## Features

✅ **Live Message Updates** - Every 3 seconds
✅ **Clean Message Display** - Sender, text, timestamp
✅ **Auto-Start** - Begins loading messages automatically
✅ **Manual Controls** - Start/stop live updates
✅ **Error Handling** - Shows connection status

## Endpoints

- **Backend Health**: http://localhost:3000/
- **Messages API**: http://localhost:3000/messages
- **Webhook**: POST /webhook/sms (for Telnyx)

## Testing

1. **Test Backend**: Visit http://localhost:3000/
2. **Test Messages**: Visit http://localhost:3000/messages
3. **Send SMS**: Text +18137420762
4. **Check Dashboard**: Should appear within 3 seconds

## Troubleshooting

- **Backend not starting**: Run `npm install` first
- **No messages**: Check ngrok is running and Telnyx webhook is configured
- **Dashboard not updating**: Check browser console for errors