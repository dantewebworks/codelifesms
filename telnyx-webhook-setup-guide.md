# Telnyx Webhook Setup Guide 🔗

## 🎯 **Current Webhook URLs:**

**SMS Webhook:** `https://codelife-sms-app-48d5c9e059b8.herokuapp.com/webhook/sms`  
**Voice Webhook:** `https://codelife-sms-app-48d5c9e059b8.herokuapp.com/webhook/voice`

## 📋 **Step-by-Step Instructions:**

### **1. Update SMS Webhook Settings:**

1. **Go to Telnyx Portal:** https://portal.telnyx.com/
2. **Navigate to:** "Messaging" → "Messaging Profiles"
3. **Click on your messaging profile**
4. **Scroll to "Webhook Settings"**
5. **Update the following:**
   - **Webhook URL:** `https://codelife-sms-app-48d5c9e059b8.herokuapp.com/webhook/sms`
   - **Webhook Failover URL:** `https://codelife-sms-app-48d5c9e059b8.herokuapp.com/webhook/sms`
6. **Click "Save"**

### **2. Update Voice Webhook Settings:**

1. **Go to:** "Call Control" → "Call Control Apps"
2. **Click on your Call Control App** (Connection ID: `2755830656318571902`)
3. **Update the following:**
   - **Webhook URL:** `https://codelife-sms-app-48d5c9e059b8.herokuapp.com/webhook/voice`
   - **Webhook Failover URL:** `https://codelife-sms-app-48d5c9e059b8.herokuapp.com/webhook/voice`
4. **Click "Save"**

## 🧪 **Testing Your Webhooks:**

### **Test SMS Webhook:**
1. **Send an SMS** to your Telnyx number (`+18137420762`)
2. **Check your dashboard** - the message should appear in "Incoming Messages"
3. **Check Heroku logs:** `heroku logs --tail`

### **Test Voice Webhook:**
1. **Make a call** using the phone interface
2. **Check Heroku logs** for voice webhook events
3. **Verify call events** are being received

## 🔧 **Dashboard Features:**

Your updated dashboard now includes:

✅ **Editable Webhook URL** - You can change it to any URL you want  
✅ **Test Webhook Button** - Test if your webhook URL is accessible  
✅ **Copy Webhook URL** - Copy the URL to clipboard for easy pasting  
✅ **Real-time Status** - Shows current webhook URL in system status  
✅ **Persistent Storage** - Webhook URL is saved and restored on page reload  

## 🚨 **Troubleshooting:**

### **If you're not receiving incoming messages:**

1. **Check webhook URL** - Make sure it matches exactly
2. **Test webhook** - Use the "Test Webhook" button in your dashboard
3. **Check Heroku logs:** `heroku logs --tail`
4. **Verify Telnyx settings** - Ensure webhook is enabled and active
5. **Test with curl:**
   ```bash
   curl -X POST https://codelife-sms-app-48d5c9e059b8.herokuapp.com/webhook/sms \
     -H "Content-Type: application/json" \
     -d '{"test": "webhook"}'
   ```

### **Common Issues:**

- **404 Error:** Webhook URL is incorrect
- **500 Error:** Server error, check Heroku logs
- **No messages:** Webhook not configured in Telnyx
- **CORS Error:** Browser security issue (use Heroku URL directly)

## 🎯 **Quick Actions:**

1. **Copy webhook URL:** Click "Copy Webhook URL" in dashboard
2. **Paste in Telnyx:** Paste the URL in Telnyx webhook settings
3. **Test immediately:** Send a test SMS to verify
4. **Monitor logs:** Watch Heroku logs for webhook activity

## ✅ **Success Indicators:**

- ✅ Incoming messages appear in dashboard
- ✅ Webhook test returns success
- ✅ Heroku logs show webhook activity
- ✅ Voice calls work properly
- ✅ No more ngrok dependency

Your webhooks are now fully configured for 24/7 operation! 🌟 