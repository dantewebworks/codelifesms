# 🔍 Debug Incoming Messages

## Step-by-Step Debugging

### 1. Check Backend is Running
Visit: http://localhost:3000/
Should show: `{"status": "SMS Backend is running! 🚀", ...}`

### 2. Check Messages Endpoint
Visit: http://localhost:3000/messages
Should show: `{"messages": [], "count": 0, ...}`

### 3. Add Test Message
Visit: http://localhost:3000/test-message
Should add a test message to the backend

### 4. Check ngrok is Running
Run: `ngrok http 3000`
Copy the HTTPS URL (like `https://abc123.ngrok-free.app`)

### 5. Check Telnyx Webhook Configuration
1. Go to portal.telnyx.com
2. Messaging → Messaging Profiles
3. Webhook URL should be: `https://your-ngrok-url.ngrok.io/webhook/sms`
4. Make sure it's saved and enabled

### 6. Test Webhook Directly
Send a POST request to test:
```bash
curl -X POST https://your-ngrok-url.ngrok.io/webhook/sms \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "event_type": "message.received",
      "payload": {
        "id": "test123",
        "from": {"phone_number": "+1234567890"},
        "to": [{"phone_number": "+18137420762"}],
        "text": "Test message from curl"
      }
    }
  }'
```

### 7. Check Backend Console
When you send SMS to +18137420762, you should see:
```
📥 Incoming webhook: {...}
📱 New SMS stored: {
  from: '+1234567890',
  to: '+18137420762', 
  text: 'Your message here',
  total: 1
}
```

### 8. Check Dashboard
- Click "Test Backend" - should show success
- Click "Refresh Messages" - should show the message
- Auto-refresh should be running every 5 seconds

## Common Issues

**Issue 1: ngrok URL Changed**
- ngrok URLs change when you restart
- Update Telnyx webhook with new URL

**Issue 2: Webhook Not Configured**
- Check Telnyx Portal webhook settings
- Make sure URL ends with `/webhook/sms`

**Issue 3: Backend Not Receiving**
- Check backend console for incoming requests
- Test with curl command above

**Issue 4: Dashboard Not Fetching**
- Check browser console for errors
- Click "Test Backend" to verify connection