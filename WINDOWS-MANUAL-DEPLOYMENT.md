# 🖥️ WINDOWS MANUAL DEPLOYMENT

## ✅ **Deployment Manual ke Vercel dari Windows**

Karena ada masalah dengan PowerShell scripts, berikut adalah panduan manual:

### **1. 🔧 Install Vercel CLI:**
```cmd
npm install -g vercel
```

### **2. 🔐 Login ke Vercel:**
```cmd
vercel login
```

### **3. 🌐 Deploy ke Vercel:**
```cmd
vercel --prod
```

### **4. 🔗 Set Environment Variables:**

#### **A. Di Vercel Dashboard:**
1. Buka https://vercel.com/dashboard
2. Pilih project Anda
3. Go to Settings > Environment Variables
4. Add variables:
   - `TELEGRAM_BOT_TOKEN` = your_bot_token
   - `NEXT_PUBLIC_SUPABASE_URL` = your_supabase_url
   - `SUPABASE_SERVICE_ROLE_KEY` = your_service_key
   - `CRON_SECRET` = your_cron_secret

#### **B. Atau dengan CLI:**
```cmd
vercel env add TELEGRAM_BOT_TOKEN
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add CRON_SECRET
```

### **5. 🔗 Set Webhook:**
```cmd
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" -H "Content-Type: application/json" -d "{\"url\": \"https://your-app.vercel.app/api/telegram/webhook\"}"
```

## 📋 **Files yang Sudah Dibuat:**

### **1. Vercel Configuration:**
- ✅ `vercel.json` - Konfigurasi Vercel
- ✅ `app/api/telegram/webhook/route.ts` - Webhook API
- ✅ `app/api/cron/bot/route.ts` - Cron job API
- ✅ `app/api/health/route.ts` - Health check API

### **2. PowerShell Scripts:**
- ✅ `deploy-vercel.ps1` - Script deployment
- ✅ `setup-vercel-env-basic.ps1` - Script environment

## 🚀 **Deployment Commands:**

### **1. Deploy Langsung:**
```cmd
vercel --prod
```

### **2. Dev Mode:**
```cmd
vercel dev
```

### **3. Check Status:**
```cmd
vercel ls
```

### **4. View Logs:**
```cmd
vercel logs
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
```cmd
# Check webhook
curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo

# Reset webhook
curl -X POST "https://api.telegram.org/bot<TOKEN>/deleteWebhook"
```

### **2. Function Timeout:**
```cmd
# Check logs
vercel logs

# Update vercel.json
# Increase maxDuration
```

### **3. Environment Variables:**
```cmd
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
```cmd
curl https://your-app.vercel.app/api/health
```

### **3. Bot Logs:**
```cmd
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

```cmd
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel --prod

# 4. Set environment variables
vercel env add TELEGRAM_BOT_TOKEN
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add CRON_SECRET

# 5. Set webhook
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" -H "Content-Type: application/json" -d "{\"url\": \"https://your-app.vercel.app/api/telegram/webhook\"}"
```

## 🎉 **Bot Features:**

- ✅ **24/7 Operation**: Bot berjalan di Vercel
- ✅ **Auto-scaling**: Handle traffic spikes
- ✅ **Global CDN**: Fast response times
- ✅ **Easy deployment**: Git-based deployment
- ✅ **Built-in monitoring**: Logs and analytics
- ✅ **Free tier**: Good for development
- ✅ **Windows Support**: Manual deployment

## 📋 **Deployment Checklist:**

- [ ] Install Vercel CLI
- [ ] Login ke Vercel
- [ ] Deploy ke Vercel
- [ ] Set environment variables
- [ ] Set webhook URL
- [ ] Test bot functionality
- [ ] Setup monitoring

**Bot siap deploy ke Vercel dari Windows!** 🎉

**Gunakan manual deployment untuk hasil yang terjamin!** 🚀
