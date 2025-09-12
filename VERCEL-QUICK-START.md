# 🚀 VERCEL QUICK START

## ✅ **Setup Vercel Sudah Selesai!**

Bot Anda sudah siap untuk di-deploy ke Vercel. Berikut adalah langkah-langkahnya:

### **1. 🔧 Install Vercel CLI:**
```bash
npm install -g vercel
```

### **2. 🔐 Login ke Vercel:**
```bash
vercel login
```

### **3. 🌐 Deploy ke Vercel:**
```bash
npm run deploy
```

### **4. 🔗 Set Webhook:**
```bash
# Set webhook URL ke Vercel
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-app.vercel.app/api/telegram/webhook"}'
```

## 📋 **Files yang Sudah Dibuat:**

### **1. vercel.json:**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "functions": {
    "app/api/telegram/webhook/route.ts": {
      "maxDuration": 30
    }
  },
  "crons": [
    {
      "path": "/api/cron/bot",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

### **2. API Routes:**
- **Webhook**: `app/api/telegram/webhook/route.ts`
- **Cron**: `app/api/cron/bot/route.ts`
- **Health**: `app/api/health/route.ts`

### **3. Scripts:**
- **Deploy**: `deploy-vercel.sh`
- **Env Setup**: `setup-vercel-env.sh`

## 🔧 **Environment Variables:**

### **Set di Vercel Dashboard:**
```
TELEGRAM_BOT_TOKEN=your_bot_token
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key
CRON_SECRET=your_cron_secret
```

### **Atau dengan CLI:**
```bash
npm run vercel:env
```

## 🚀 **Deployment Commands:**

### **1. Deploy:**
```bash
npm run deploy
```

### **2. Dev Mode:**
```bash
npm run vercel:dev
```

### **3. Set Environment:**
```bash
npm run vercel:env
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
```bash
# Check webhook
curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo

# Reset webhook
curl -X POST "https://api.telegram.org/bot<TOKEN>/deleteWebhook"
```

### **2. Function Timeout:**
```bash
# Check logs
vercel logs

# Update vercel.json
# Increase maxDuration
```

### **3. Environment Variables:**
```bash
# Check env vars
vercel env ls

# Add missing vars
vercel env add VARIABLE_NAME
```

## 📊 **Monitoring:**

### **1. Vercel Dashboard:**
- Monitor deployments
- View logs
- Check function performance

### **2. Health Check:**
```bash
curl https://your-app.vercel.app/api/health
```

### **3. Bot Logs:**
```bash
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

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Deploy
npm run deploy

# 4. Set webhook
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -d '{"url": "https://your-app.vercel.app/api/telegram/webhook"}'
```

## 🎉 **Bot Features:**

- ✅ **24/7 Operation**: Bot berjalan di Vercel
- ✅ **Auto-scaling**: Handle traffic spikes
- ✅ **Global CDN**: Fast response times
- ✅ **Easy deployment**: Git-based deployment
- ✅ **Built-in monitoring**: Logs and analytics
- ✅ **Free tier**: Good for development

**Bot siap deploy ke Vercel!** 🎉

**Pilih Vercel untuk deployment yang mudah dan scalable!** 🚀
