# 🔗 Telnyx Webhook Setup Guide

## 📋 Quick Setup Steps

### 1. **Copy This Webhook URL:**
```
https://4c8bd6161f01.ngrok-free.app/webhook/sms
```

### 2. **Go to Telnyx Dashboard:**
- Visit: https://portal.telnyx.com/
- Sign in to your account

### 3. **Navigate to Webhooks:**
- Go to **Messaging** → **Webhooks**
- Or search for "Webhooks" in the dashboard

### 4. **Update Webhook URL:**
- Find "Webhook URL" field
- Replace with the new URL
- Save changes

## ✅ Verification

### Test the Webhook:
```bash
curl -X POST https://4c8bd6161f01.ngrok-free.app/webhook/sms \
  -H "Content-Type: application/json" \
  -d '{"test": "message"}'
```

### Check Messages:
```bash
curl https://4c8bd6161f01.ngrok-free.app/api/messages
```

## 🚨 Important Notes

- **Keep ngrok running**: The tunnel must stay active
- **Update URL if ngrok restarts**: Get new URL from ngrok dashboard
- **Test with real SMS**: Send a message to your Telnyx number

## 🔧 Troubleshooting

### If webhook doesn't work:
1. Check if ngrok is running: `ps aux | grep ngrok`
2. Verify server is running: `curl http://localhost:3000/api/messages`
3. Test webhook URL: Visit the URL in browser

### Common Issues:
- **ngrok expired**: Restart ngrok and update URL
- **Server not running**: Start with `node server.js`
- **CORS errors**: Server has CORS enabled, should work

## 📱 Your Current Setup

**The webhook URL must be exactly:** `https://4c8bd6161f01.ngrok-free.app/webhook/sms`

**Server Status:** ✅ Running on localhost:3000
**ngrok Status:** ✅ Active tunnel
**CORS:** ✅ Enabled for all origins 