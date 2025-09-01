# 🚀 Ready-to-Deploy Files

Your webhook is failing because the GitHub repo has old files. Here are the EXACT files you need to upload to your GitHub repository:

## Files to Upload to GitHub:

### 1. package.json
```json
{
  "name": "telnyx-webhook-handler",
  "version": "1.0.0",
  "description": "Telnyx webhook handler for SMS and voice calls",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "node index.js"
  },
  "keywords": ["telnyx", "webhook", "sms", "voice", "vercel"],
  "author": "Your Name",
  "license": "MIT",
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5"
  },
  "engines": {
    "node": ">=14.x"
  }
}
```

### 2. vercel.json
```json
{
  "functions": {
    "api/webhook.js": {
      "maxDuration": 10
    },
    "api/messages.js": {
      "maxDuration": 5
    },
    "api/calls.js": {
      "maxDuration": 5
    }
  },
  "rewrites": [
    {
      "source": "/webhook",
      "destination": "/api/webhook"
    },
    {
      "source": "/api/messages/recent",
      "destination": "/api/messages"
    },
    {
      "source": "/api/calls/recent",
      "destination": "/api/calls"
    }
  ]
}
```

### 3. Create folder: api/
Then upload these 3 files inside the api folder:

#### api/webhook.js
#### api/messages.js  
#### api/calls.js

## Quick Steps:
1. Go to your GitHub repository: github.com/Dantedesignz/telnyx
2. Delete old files if any
3. Upload these 5 files in the correct structure
4. Go back to Vercel and click "Redeploy"

This will fix the deployment error!