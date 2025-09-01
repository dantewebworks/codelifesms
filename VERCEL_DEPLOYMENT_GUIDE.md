# 🚀 Complete Vercel Webhook Deployment Guide

## Step-by-Step Instructions

### 📁 Step 1: Prepare Your Files

1. **Create a new folder** on your computer called `telnyx-webhook`
2. **Copy these files** into that folder:
   ```
   telnyx-webhook/
   ├── api/
   │   ├── webhook.js
   │   ├── messages.js
   │   └── calls.js
   ├── vercel.json
   ├── package.json
   └── README.md
   ```

### 🌐 Step 2: Deploy to Vercel

1. **Go to [vercel.com](https://vercel.com)** and sign in with your account
2. **Click "New Project"** (big button on your dashboard)
3. **Choose "Import Git Repository"** or **"Upload Files"**
4. **If uploading files:**
   - Click "Browse" and select your `telnyx-webhook` folder
   - Or drag and drop the folder onto the page
5. **If using Git:**
   - Push your files to a GitHub repository first
   - Import from GitHub
6. **Configure the project:**
   - Project Name: `telnyx-webhook` (or any name you prefer)
   - Framework Preset: Leave as "Other"
   - Root Directory: `./` (default)
7. **Click "Deploy"**
8. **Wait for deployment** (usually takes 1-2 minutes)

### 🔗 Step 3: Get Your Webhook URL

After deployment completes, you'll see:
```
✅ Your project is deployed!
https://your-project-name.vercel.app
```

Your webhook endpoints will be:
- **Main webhook**: `https://your-project-name.vercel.app/webhook`
- **Messages API**: `https://your-project-name.vercel.app/api/messages/recent`
- **Health check**: `https://your-project-name.vercel.app/webhook` (GET request)

### 🧪 Step 4: Test Your Webhook

1. **Open your webhook URL** in a browser: `https://your-project-name.vercel.app/webhook`
2. **You should see**: `{"status":"Webhook is running","timestamp":"...","message":"Telnyx webhook endpoint is active"}`
3. **If you see this, your webhook is working!** ✅

### 📱 Step 5: Configure Telnyx Portal

#### For SMS Messages:
1. **Go to [Telnyx Portal](https://portal.telnyx.com)**
2. **Navigate to**: Messaging → Messaging Profiles
3. **Select your messaging profile** (or create one)
4. **Set Webhook URL**: `https://your-project-name.vercel.app/webhook`
5. **Set HTTP Method**: POST
6. **Enable**: "Send webhooks"
7. **Click "Save"**

#### For Voice Calls:
1. **Go to**: Voice → Call Control Applications
2. **Select your application** (or create one)
3. **Set Webhook URL**: `https://your-project-name.vercel.app/webhook`
4. **Click "Save"**

### 🎯 Step 6: Update Your SMS Dashboard

1. **Open** `sms-dashboard-working.html`
2. **Go to API Settings**
3. **Enter your webhook URL**: `https://your-project-name.vercel.app/webhook`
4. **Click "Save Settings"**
5. **Click "Test Webhook"** to verify connection

### 🧪 Step 7: Test Everything

1. **Send an SMS** to one of your Telnyx phone numbers
2. **Check your dashboard** - the message should appear in "Recent Incoming Messages"
3. **Make a call** to your Telnyx number to test call webhooks

## 🔧 Troubleshooting

### Webhook Not Receiving Messages?
- ✅ Check your Telnyx messaging profile webhook URL
- ✅ Ensure the URL ends with `/webhook`
- ✅ Verify your phone number is assigned to the messaging profile
- ✅ Check Vercel function logs in your Vercel dashboard

### Dashboard Not Showing Messages?
- ✅ Make sure webhook URL is saved in API settings
- ✅ Click "Test Webhook" to verify connection
- ✅ Check browser console for errors
- ✅ Try clicking "Refresh Messages"

### Deployment Issues?
- ✅ Make sure all files are in the correct folder structure
- ✅ Check that `api/` folder contains all three .js files
- ✅ Verify `vercel.json` and `package.json` are in the root

## 📋 What Each File Does

- **`api/webhook.js`**: Main webhook handler for Telnyx events
- **`api/messages.js`**: API endpoint to get recent SMS messages
- **`api/calls.js`**: API endpoint to get recent call events
- **`vercel.json`**: Vercel configuration and URL routing
- **`package.json`**: Node.js project configuration

## 🎉 Success Checklist

- ✅ Webhook deployed to Vercel
- ✅ Webhook URL returns status when visited
- ✅ Telnyx messaging profile configured with webhook URL
- ✅ SMS dashboard updated with webhook URL
- ✅ Test SMS received and displayed in dashboard
- ✅ Incoming messages refresh automatically

## 🔒 Security Notes

This is a basic implementation suitable for development and testing. For production use, consider:

- Adding Telnyx webhook signature verification
- Using a proper database instead of in-memory storage
- Adding authentication for API endpoints
- Implementing rate limiting
- Adding error logging and monitoring

## 🆘 Need Help?

If you encounter issues:
1. Check the Vercel function logs in your Vercel dashboard
2. Test the webhook URL directly in your browser
3. Verify your Telnyx configuration matches exactly
4. Check browser console for JavaScript errors

Your webhook is now ready to receive incoming SMS messages and call events! 🎉