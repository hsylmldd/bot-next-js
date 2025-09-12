# 🚀 DEPLOYMENT KE VERCEL

## 📋 **Panduan Deploy Bot ke Vercel:**

### **1. 🔧 Persiapan Vercel**

#### **A. Install Vercel CLI:**
```bash
npm install -g vercel
```

#### **B. Login ke Vercel:**
```bash
vercel login
```

#### **C. Link Project:**
```bash
vercel link
```

### **2. 📁 Setup Project untuk Vercel**

#### **A. Buat vercel.json:**
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
  "env": {
    "TELEGRAM_BOT_TOKEN": "@telegram_bot_token",
    "NEXT_PUBLIC_SUPABASE_URL": "@next_public_supabase_url",
    "SUPABASE_SERVICE_ROLE_KEY": "@supabase_service_role_key"
  }
}
```

#### **B. Update package.json:**
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "bot": "node scripts/bot-fixed-workflow.js"
  }
}
```

### **3. 🌐 Setup Webhook untuk Vercel**

#### **A. Buat API Route untuk Webhook:**
```typescript
// app/api/telegram/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { bot } from '@/lib/telegram';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Process webhook update
    await bot.processUpdate(body);
    
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok' });
}
```

#### **B. Update Telegram Bot untuk Webhook:**
```javascript
// lib/telegram.js
const TelegramBot = require('node-telegram-bot-api');

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { 
  polling: false // Disable polling for webhook
});

// Webhook handler
bot.on('message', (msg) => {
  // Handle messages
});

bot.on('callback_query', (callbackQuery) => {
  // Handle callbacks
});

module.exports = { bot };
```

### **4. 🚀 Deploy ke Vercel**

#### **A. Deploy:**
```bash
vercel --prod
```

#### **B. Set Environment Variables:**
```bash
vercel env add TELEGRAM_BOT_TOKEN
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY
```

#### **C. Set Webhook URL:**
```bash
# Set webhook URL ke Vercel
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-app.vercel.app/api/telegram/webhook"}'
```

### **5. 🔄 Setup Cron Job untuk Bot**

#### **A. Buat API Route untuk Cron:**
```typescript
// app/api/cron/bot/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { bot } from '@/lib/telegram';

export async function GET(request: NextRequest) {
  try {
    // Check if request is from Vercel Cron
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Run bot tasks
    await bot.processUpdates();
    
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Cron error:', error);
    return NextResponse.json({ error: 'Cron failed' }, { status: 500 });
  }
}
```

#### **B. Setup Vercel Cron:**
```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/bot",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

### **6. 📱 Alternative: Serverless Bot**

#### **A. Buat Serverless Bot:**
```javascript
// lib/serverless-bot.js
const TelegramBot = require('node-telegram-bot-api');

class ServerlessBot {
  constructor() {
    this.bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { 
      polling: false 
    });
    this.setupHandlers();
  }

  setupHandlers() {
    this.bot.on('message', (msg) => {
      this.handleMessage(msg);
    });

    this.bot.on('callback_query', (callbackQuery) => {
      this.handleCallback(callbackQuery);
    });
  }

  async handleWebhook(update) {
    try {
      await this.bot.processUpdate(update);
      return { success: true };
    } catch (error) {
      console.error('Webhook error:', error);
      return { success: false, error: error.message };
    }
  }

  // ... other methods
}

module.exports = ServerlessBot;
```

### **7. 🔧 Setup Environment Variables**

#### **A. Di Vercel Dashboard:**
```
TELEGRAM_BOT_TOKEN=your_bot_token
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key
CRON_SECRET=your_cron_secret
```

#### **B. Atau dengan CLI:**
```bash
vercel env add TELEGRAM_BOT_TOKEN
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add CRON_SECRET
```

### **8. 📊 Monitoring dan Logs**

#### **A. Vercel Dashboard:**
- Monitor deployments
- View logs
- Check function performance

#### **B. Health Check:**
```typescript
// app/api/health/route.ts
export async function GET() {
  return Response.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
}
```

### **9. 🚀 Deploy Script**

#### **A. Buat deploy.sh:**
```bash
#!/bin/bash

echo "🚀 Deploying to Vercel..."

# Build project
npm run build

# Deploy to Vercel
vercel --prod

# Set webhook
echo "🔗 Setting webhook..."
curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"https://your-app.vercel.app/api/telegram/webhook\"}"

echo "✅ Deployment complete!"
```

#### **B. Make executable:**
```bash
chmod +x deploy.sh
```

### **10. 📋 Checklist Deployment:**

- [ ] Install Vercel CLI
- [ ] Login ke Vercel
- [ ] Setup vercel.json
- [ ] Update API routes
- [ ] Set environment variables
- [ ] Deploy ke Vercel
- [ ] Set webhook URL
- [ ] Test bot functionality
- [ ] Setup monitoring

### **11. 💰 Cost Vercel:**

- **Hobby Plan**: $0/bulan (100GB bandwidth)
- **Pro Plan**: $20/bulan (1TB bandwidth)
- **Enterprise**: Custom pricing

### **12. 🎯 Advantages Vercel:**

- ✅ **Serverless**: No server management
- ✅ **Auto-scaling**: Handle traffic spikes
- ✅ **Global CDN**: Fast response times
- ✅ **Easy deployment**: Git-based deployment
- ✅ **Built-in monitoring**: Logs and analytics
- ✅ **Free tier**: Good for development

### **13. ⚠️ Limitations Vercel:**

- ❌ **Function timeout**: 10s (Hobby), 60s (Pro)
- ❌ **Cold starts**: First request might be slow
- ❌ **No persistent storage**: Use external database
- ❌ **No background tasks**: Use cron jobs

## 🚀 **Quick Start:**

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel --prod

# 4. Set webhook
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -d "url=https://your-app.vercel.app/api/telegram/webhook"
```

**Bot siap deploy ke Vercel!** 🎉

**Pilih metode yang sesuai dengan kebutuhan Anda!** 🔧
