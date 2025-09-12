# 🖥️ WINDOWS VERCEL DEPLOYMENT

## ✅ **Setup Vercel untuk Windows Sudah Selesai!**

Bot Anda sudah siap untuk di-deploy ke Vercel dari Windows. Berikut adalah langkah-langkahnya:

### **1. 🔧 Install Vercel CLI:**
```powershell
npm install -g vercel
```

### **2. 🔐 Login ke Vercel:**
```powershell
vercel login
```

### **3. 🌐 Deploy ke Vercel:**
```powershell
npm run deploy
```

### **4. 🔗 Set Webhook:**
```powershell
# Set webhook URL ke Vercel
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" -H "Content-Type: application/json" -d '{"url": "https://your-app.vercel.app/api/telegram/webhook"}'
```

## 📋 **Files yang Sudah Dibuat:**

### **1. PowerShell Scripts:**
- ✅ `deploy-vercel.ps1` - Script deployment untuk Windows
- ✅ `setup-vercel-env.ps1` - Script setup environment untuk Windows

### **2. Vercel Configuration:**
- ✅ `vercel.json` - Konfigurasi Vercel
- ✅ `app/api/telegram/webhook/route.ts` - Webhook API
- ✅ `app/api/cron/bot/route.ts` - Cron job API
- ✅ `app/api/health/route.ts` - Health check API

### **3. Updated Scripts:**
- ✅ `npm run deploy` - Deploy ke Vercel (Windows)
- ✅ `npm run vercel:env` - Set environment (Windows)
- ✅ `npm run vercel:dev` - Dev mode
- ✅ `npm run vercel:deploy` - Deploy langsung

## 🔧 **Environment Variables:**

### **Set di Vercel Dashboard:**
```
TELEGRAM_BOT_TOKEN=your_bot_token
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key
CRON_SECRET=your_cron_secret
```

### **Atau dengan CLI:**
```powershell
npm run vercel:env
```

## 🚀 **Deployment Commands:**

### **1. Deploy:**
```powershell
npm run deploy
```

### **2. Dev Mode:**
```powershell
npm run vercel:dev
```

### **3. Set Environment:**
```powershell
npm run vercel:env
```

### **4. Deploy Langsung:**
```powershell
npm run vercel:deploy
```

## 📱 **Test Bot:**

### **1. Health Check:**
```
https://your-app.vercel.app/api/health
```

### **2. Webhook:**
```
https://your-app.vercel.app/api/telegram/webhook
```

### **3. Bot Commands:**
- Send `/start` to your bot
- Test workflow

## 🔄 **Webhook vs Polling:**

### **Webhook (Vercel):**
- ✅ **Serverless**: No server management
- ✅ **Auto-scaling**: Handle traffic spikes
- ✅ **Global CDN**: Fast response times
- ❌ **Function timeout**: 10s (Hobby), 60s (Pro)
- ❌ **Cold starts**: First request might be slow

### **Polling (PM2):**
- ✅ **Always running**: No cold starts
- ✅ **No timeout**: Can run indefinitely
- ✅ **Real-time**: Immediate response
- ❌ **Server management**: Need to manage server
- ❌ **Cost**: Server costs

## 💰 **Vercel Pricing:**

### **Hobby Plan (Free):**
- 100GB bandwidth
- 10s function timeout
- Unlimited deployments
- Perfect for development

### **Pro Plan ($20/month):**
- 1TB bandwidth
- 60s function timeout
- Advanced analytics
- Perfect for production

## 🛠️ **Troubleshooting:**

### **1. Bot Tidak Responsif:**
```powershell
# Check webhook
curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo

# Reset webhook
curl -X POST "https://api.telegram.org/bot<TOKEN>/deleteWebhook"
```

### **2. Function Timeout:**
```powershell
# Check logs
vercel logs

# Update vercel.json
# Increase maxDuration
```

### **3. Environment Variables:**
```powershell
# Check env vars
vercel env ls

# Add missing vars
vercel env add VARIABLE_NAME
```

### **4. PowerShell Execution Policy:**
```powershell
# If script blocked, run:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## 📊 **Monitoring:**

### **1. Vercel Dashboard:**
- Monitor deployments
- View logs
- Check function performance

### **2. Health Check:**
```powershell
curl https://your-app.vercel.app/api/health
```

### **3. Bot Logs:**
```powershell
vercel logs
```

## 🎯 **Recommended Setup:**

### **Untuk Development:**
- **Vercel Hobby**: Free tier
- **Webhook**: For testing
- **Local development**: PM2

### **Untuk Production:**
- **Vercel Pro**: $20/month
- **Webhook**: For production
- **Monitoring**: Vercel dashboard

## 🚀 **Quick Deploy:**

```powershell
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Deploy
npm run deploy

# 4. Set webhook
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" -H "Content-Type: application/json" -d '{"url": "https://your-app.vercel.app/api/telegram/webhook"}'
```

## 🎉 **Bot Features:**

- ✅ **24/7 Operation**: Bot berjalan di Vercel
- ✅ **Auto-scaling**: Handle traffic spikes
- ✅ **Global CDN**: Fast response times
- ✅ **Easy deployment**: Git-based deployment
- ✅ **Built-in monitoring**: Logs and analytics
- ✅ **Free tier**: Good for development
- ✅ **Windows Support**: PowerShell scripts

## 📋 **Deployment Checklist:**

- [ ] Install Vercel CLI
- [ ] Login ke Vercel
- [ ] Set environment variables
- [ ] Deploy ke Vercel
- [ ] Set webhook URL
- [ ] Test bot functionality
- [ ] Setup monitoring

**Bot siap deploy ke Vercel dari Windows!** 🎉

**Gunakan PowerShell scripts untuk deployment yang mudah!** 🚀
