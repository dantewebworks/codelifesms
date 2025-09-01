#!/bin/bash

echo "🚀 Starting Webhook Setup..."

# Configure ngrok with your token
echo "🔑 Configuring ngrok..."
ngrok config add-authtoken 30qPM9sWAO44TZ0UbtOekh5ADtG_3CFpAiJ3GAcWEZtRAs96w

echo "✅ ngrok configured!"
echo ""
echo "📋 Next steps:"
echo "1. Run: node webhook-server.js (in one terminal)"
echo "2. Run: ngrok http 3000 (in another terminal)"
echo "3. Copy the ngrok URL and update your dashboard"
echo ""
echo "🎯 Or run these commands manually:"
echo "Terminal 1: node webhook-server.js"
echo "Terminal 2: ngrok http 3000"