# 🚀 Vercel Deployment Guide

## 📋 Prerequisites

1. **GitHub Account** (free)
2. **Vercel Account** (free)
3. **Node.js** installed locally (for testing)

## 🔐 Vercel Login Information

### Option 1: GitHub OAuth (Recommended)
1. Go to [vercel.com](https://vercel.com)
2. Click "Continue with GitHub"
3. Authorize Vercel to access your GitHub account
4. No additional login credentials needed

### Option 2: Email/Password
- **Email**: Use your GitHub email or any email
- **Password**: Create a Vercel account password
- **URL**: [vercel.com/signup](https://vercel.com/signup)

## 🚀 Deployment Steps

### Step 1: Prepare Your Project
```bash
# Make sure all files are in your project directory
ls -la
# Should show: index.html, webhook-server.js, package.json, vercel.json, etc.
```

### Step 2: Deploy to Vercel

#### Method A: Vercel CLI (Recommended)
```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy from your project directory
vercel

# Follow the prompts:
# - Set up and deploy? → Yes
# - Which scope? → Your account
# - Link to existing project? → No
# - Project name? → codelife-sms-webhook (or any name)
# - Directory? → ./ (current directory)
```

#### Method B: GitHub Integration
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Vercel will auto-detect it's a Node.js project
6. Click "Deploy"

### Step 3: Get Your Webhook URL
After deployment, Vercel will give you a URL like:
```
https://your-project-name.vercel.app
```

Your webhook URL will be:
```
https://your-project-name.vercel.app/webhook/sms
```

## 🔧 Configuration

### Update Your Application
Once deployed, update your `index.html` with the new webhook URL:

1. Open `index.html`
2. Find the webhook URL field
3. Replace `http://localhost:3001/webhook/sms` with your Vercel URL
4. Save the file

### Telynx Dashboard Setup
1. Log into your Telynx dashboard
2. Go to webhook settings
3. Enter your Vercel webhook URL:
   ```
   https://your-project-name.vercel.app/webhook/sms
   ```
4. Save the configuration

## 📊 Verify Deployment

### Check Your Webhook Server
Visit your Vercel URL to see the dashboard:
```
https://your-project-name.vercel.app
```

You should see:
- ✅ Webhook server status
- 📡 Your webhook URL
- 📊 Available endpoints
- 🔧 Setup instructions

### Test the Webhook
You can test the webhook with curl:
```bash
curl -X POST https://your-project-name.vercel.app/webhook/sms \
  -H "Content-Type: application/json" \
  -d '{"from":"+1234567890","message":"Test message"}'
```

## 🔄 Updates and Redeployment

### Automatic Updates
If you used GitHub integration, Vercel will automatically redeploy when you push changes to your repository.

### Manual Updates
```bash
# Make changes to your code
# Then redeploy
vercel --prod
```

## 🛠️ Troubleshooting

### Common Issues:

1. **Deployment fails:**
   - Check that `package.json` exists
   - Verify `vercel.json` is correct
   - Ensure all dependencies are listed

2. **Webhook not receiving messages:**
   - Verify the URL in Telynx dashboard
   - Check Vercel function logs
   - Test with curl first

3. **CORS errors:**
   - The server includes CORS headers
   - Make sure you're using HTTPS URLs

### Check Logs
```bash
# View deployment logs
vercel logs

# View function logs
vercel logs --follow
```

## 🔐 Security Notes

- Vercel provides HTTPS by default
- Your webhook URL is public but secure
- API keys are stored in browser localStorage
- Consider using environment variables for sensitive data

## 📞 Support

If you need help:
1. Check Vercel documentation: [vercel.com/docs](https://vercel.com/docs)
2. View your project logs in Vercel dashboard
3. Test locally first with `npm start`

---

**🎉 Your webhook server is now live on Vercel!** 