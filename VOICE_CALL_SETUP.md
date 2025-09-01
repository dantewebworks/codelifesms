# Voice Call Setup Guide

## Step 1: Create a Call Control App in Telnyx

1. **Log into your Telnyx Portal** at https://portal.telnyx.com/

2. **Navigate to Call Control Apps**
   - Go to "Call Control" → "Call Control Apps"
   - Click "Create Call Control App"

3. **Configure the Call Control App**
   - **Name**: `CodeLife Voice App` (or any name you prefer)
   - **Webhook URL**: `https://6c8d8e0ed63d.ngrok-free.app/webhook/voice`
   - **Webhook Failover URL**: `https://6c8d8e0ed63d.ngrok-free.app/webhook/voice`
   - **Save the Call Control App**

4. **Copy the Connection ID**
   - After creating the app, you'll get a Connection ID
   - It looks like: `1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef`
   - Copy this ID - you'll need it for the next step

## Step 2: Update Your Server Configuration

Once you have the Connection ID, you need to update the server.js file:

1. **Open server.js**
2. **Find line ~980** where it says: `connection_id: 'your_connection_id'`
3. **Replace 'your_connection_id'** with your actual Connection ID

## Step 3: Add Voice Webhook Endpoint

The server needs a webhook endpoint to handle voice call events. This will be added automatically when you update the connection_id.

## Step 4: Test the Voice Call Feature

1. **Restart your server**: `node server.js`
2. **Open the dashboard**: `http://localhost:3000/sms-dashboard-fixed.html`
3. **Go to the "Send SMS" section**
4. **Fill in the phone numbers**
5. **Click "Make Call"** instead of "Send SMS"

## Troubleshooting

- **Error 422**: Make sure your Connection ID is correct
- **Webhook not working**: Ensure ngrok is running and the URL is accessible
- **Call not connecting**: Check that your phone numbers are in the correct format (+1XXXXXXXXXX)

## Important Notes

- Voice calls require a Call Control App (different from Messaging Profile)
- The webhook URL for voice calls is different from SMS webhooks
- Make sure your ngrok URL is accessible from the internet
- Voice calls may incur additional charges beyond SMS costs 