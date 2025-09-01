# 24/7 SMS App Deployment Guide

## 🎯 **Goal: Keep Your SMS App Running Even When Laptop is Off**

## 🚀 **Option 1: Heroku Deployment (Recommended - Free)**

### **Step 1: Install Heroku CLI**
```bash
# macOS
brew install heroku/brew/heroku

# Or download from: https://devcenter.heroku.com/articles/heroku-cli
```

### **Step 2: Login to Heroku**
```bash
heroku login
```

### **Step 3: Create Heroku App**
```bash
# Navigate to your project
cd /Users/danteactiveleads/Desktop/CodeLifeSMS

# Create Heroku app
heroku create your-sms-app-name

# Add git remote
git init
git add .
git commit -m "Initial deployment"
git push heroku main
```

### **Step 4: Set Environment Variables**
```bash
heroku config:set TELNYX_API_KEY="{{TELNYX_API_KEY}}"
heroku config:set TELNYX_CONNECTION_ID="{{TELNYX_CONNECTION_ID}}"
```

### **Step 5: Update Telnyx Webhooks**
Your app will be available at: `https://your-sms-app-name.herokuapp.com`

Update Telnyx webhooks to:
- **SMS Webhook**: `https://your-sms-app-name.herokuapp.com/webhook/sms`
- **Voice Webhook**: `https://your-sms-app-name.herokuapp.com/webhook/voice`

### **Step 6: Access Your App**
- **Dashboard**: `https://your-sms-app-name.herokuapp.com/sms-dashboard-fixed.html`
- **API**: `https://your-sms-app-name.herokuapp.com/api/`

## 🌐 **Option 2: Railway Deployment (Free)**

### **Step 1: Connect GitHub**
1. Go to [railway.app](https://railway.app)
2. Connect your GitHub account
3. Import your repository

### **Step 2: Deploy**
1. Railway will automatically detect Node.js
2. Deploy with one click
3. Get your custom URL

### **Step 3: Update Webhooks**
Use the Railway-provided URL for your webhooks.

## ☁️ **Option 3: Render Deployment (Free)**

### **Step 1: Connect Repository**
1. Go to [render.com](https://render.com)
2. Connect GitHub
3. Create new Web Service

### **Step 2: Configure**
- **Build Command**: `npm install`
- **Start Command**: `node server.js`
- **Environment**: Node

### **Step 3: Deploy**
1. Click deploy
2. Get your custom URL
3. Update Telnyx webhooks

## 🖥️ **Option 4: Keep Laptop Running (Local)**

### **Prevent Sleep/Hibernation**
```bash
# Prevent sleep
sudo pmset -c sleep 0
sudo pmset -c hibernatemode 0
sudo pmset -c displaysleep 0

# Check current settings
pmset -g
```

### **Run as Background Service**
```bash
# Install PM2 globally
npm install -g pm2

# Start your app with PM2
pm2 start server.js --name "sms-app"

# Save PM2 configuration
pm2 save

# Set PM2 to start on boot
pm2 startup
```

### **Keep Terminal Open**
```bash
# Use screen or tmux
brew install screen

# Start a screen session
screen -S sms-app

# Run your app
npm start

# Detach from screen (Ctrl+A, then D)
# Reattach later: screen -r sms-app
```

## 🔧 **Option 5: VPS/Server (Paid)**

### **DigitalOcean ($5/month)**
1. Create Ubuntu droplet
2. Install Node.js, PM2, nginx
3. Deploy your app
4. Set up SSL certificates
5. Configure custom domain

### **AWS EC2 (Free Tier)**
1. Launch t2.micro instance
2. Install dependencies
3. Deploy application
4. Set up security groups
5. Configure domain

## 📱 **After Deployment**

### **Update Telnyx Webhooks**
1. Go to [portal.telnyx.com](https://portal.telnyx.com)
2. **Messaging** → **Messaging Profiles**
   - Webhook URL: `https://your-app-url.com/webhook/sms`
3. **Call Control** → **Call Control Apps**
   - Webhook URL: `https://your-app-url.com/webhook/voice`

### **Test Your App**
1. Send SMS to your number
2. Check incoming messages
3. Test voice calls
4. Verify webhook logs

## 🎉 **Benefits of Cloud Deployment**

### **✅ Always Running**
- 24/7 uptime
- No laptop dependency
- Automatic restarts

### **✅ Professional Features**
- Custom domain support
- SSL certificates
- CDN and caching
- Monitoring and logs

### **✅ Scalability**
- Handle more traffic
- Multiple users
- Backup and recovery

## 🚨 **Important Notes**

### **Free Tier Limitations**
- **Heroku**: Sleeps after 30 minutes of inactivity
- **Railway**: Limited bandwidth
- **Render**: Sleeps after 15 minutes

### **Paid Options**
- **Heroku**: $7/month for always-on
- **Railway**: $5/month for always-on
- **Render**: $7/month for always-on

### **Local Development**
- Keep local setup for development
- Use cloud for production
- Sync changes via Git

## 🎯 **Recommended Approach**

1. **Start with Heroku** (free, easy)
2. **Test thoroughly** with your Telnyx setup
3. **Upgrade to paid** if you need 24/7 uptime
4. **Consider VPS** for full control

Your SMS app will receive messages even when your laptop is off! 🚀📱 