# Telnyx Webhook Update Instructions

## 🔗 **New Webhook URLs:**

**SMS Webhook:** `https://bf1ebb14bbd8.ngrok-free.app/webhook/sms`
**Voice Webhook:** `https://bf1ebb14bbd8.ngrok-free.app/webhook/voice`

## 📋 **Step-by-Step Instructions:**

### **1. SMS Webhook Setup:**
1. Go to https://portal.telnyx.com/
2. Navigate to **"Messaging"** → **"Messaging Profiles"**
3. Click on your messaging profile
4. Scroll to **"Webhook Settings"**
5. Update the following:
   - **Webhook URL**: `https://bf1ebb14bbd8.ngrok-free.app/webhook/sms`
   - **Webhook Failover URL**: `https://bf1ebb14bbd8.ngrok-free.app/webhook/sms`
6. Click **"Save"**

### **2. Voice Webhook Setup:**
1. Go to **"Call Control"** → **"Call Control Apps"**
2. Click on your Call Control App (Connection ID: `2755830656318571902`)
3. Update the following:
   - **Webhook URL**: `https://bf1ebb14bbd8.ngrok-free.app/webhook/voice`
   - **Webhook Failover URL**: `https://bf1ebb14bbd8.ngrok-free.app/webhook/voice`
4. Click **"Save"**

## 🧪 **Test Incoming Messages:**

After updating the webhooks, you can test by:

1. **Send an SMS** to your Telnyx number (`+18137420762`)
2. **Check the dashboard** - the message should appear in "Incoming Messages"
3. **Check the terminal** - you should see webhook logs

## 🔍 **Verify Webhook is Working:**

The webhook endpoint is already tested and working. You should see logs like:
```
📨 Incoming webhook received: {
  "sms_id": "...",
  "direction": "inbound",
  "from": "+1234567890",
  "to": "+18137420762",
  "body": "Your message here"
}
```

## 🚨 **Important Notes:**

- **No need to open ngrok website** - the tunnel runs in the background
- **Webhook URLs change** when you restart the app (ngrok generates new URLs)
- **Always update Telnyx** with the new URLs when they change
- **Check terminal logs** to see incoming webhook activity

## 🎯 **Quick Status Check:**

Run this command to see current webhook status:
```bash
npm run status
```

This will show:
- ✅ Backend status
- ✅ Ngrok status and current URL
- 📋 Current webhook configuration 