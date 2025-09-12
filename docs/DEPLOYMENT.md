# Deployment Guide

## Prerequisites

Before deploying the Telegram Order Management Bot, ensure you have:

1. **Supabase Account** - For database and authentication
2. **Google Cloud Account** - For Google Drive API access
3. **Telegram Bot Token** - From @BotFather
4. **Domain/URL** - For webhook (can use ngrok for development)

## Step-by-Step Deployment

### 1. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to Settings → Database
3. Copy your project URL and anon key
4. Go to Settings → API
5. Copy your service role key
6. Run the SQL schema from `supabase-schema.sql` in the SQL Editor

### 2. Supabase Storage Setup

1. Storage bucket 'evidence-photos' akan dibuat otomatis melalui SQL schema
2. Tidak perlu konfigurasi tambahan untuk file storage
3. Foto akan disimpan di Supabase Storage dengan public access

### 3. Telegram Bot Setup

1. Message @BotFather on Telegram
2. Create a new bot with `/newbot`
3. Follow the instructions to set name and username
4. Copy the bot token
5. Set bot commands with `/setcommands`:

```
start - Start the bot
help - Show help information
order - Create new order (HD only)
myorders - View my orders
report - Generate reports (HD only)
```

### 4. Environment Variables

Create a `.env.local` file with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_WEBHOOK_URL=https://your-domain.com

# File Storage Configuration
# Foto akan disimpan di Supabase Storage bucket 'evidence-photos'
# Tidak perlu konfigurasi tambahan

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 5. Local Development

1. Install dependencies:
```bash
npm install
```

2. Run development server:
```bash
npm run dev
```

3. Test database connection:
```bash
node scripts/test-db.js test
```

4. Create sample data:
```bash
node scripts/test-db.js sample
```

5. Setup webhook:
```bash
node scripts/setup-bot.js setup
```

6. Initialize services:
Visit `http://localhost:3000/api/init`

### 6. Production Deployment

#### Option A: Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy
5. Update webhook URL in environment variables
6. Setup webhook: `https://your-app.vercel.app/api/telegram/setup`
7. Initialize services: `https://your-app.vercel.app/api/init`

#### Option B: Railway

1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy
4. Setup webhook and initialize services

#### Option C: DigitalOcean App Platform

1. Create a new app in DigitalOcean
2. Connect your GitHub repository
3. Set environment variables
4. Deploy
5. Setup webhook and initialize services

#### Option D: Self-hosted (VPS)

1. Set up a VPS with Node.js 18+
2. Clone your repository
3. Install dependencies: `npm install`
4. Build the app: `npm run build`
5. Set up PM2 or similar process manager
6. Configure reverse proxy (nginx)
7. Set up SSL certificate
8. Configure environment variables
9. Setup webhook and initialize services

### 7. Post-Deployment Setup

1. **Setup Webhook:**
```bash
curl -X POST https://your-domain.com/api/telegram/setup
```

2. **Initialize Services:**
```bash
curl https://your-domain.com/api/init
```

3. **Test Bot:**
   - Send `/start` to your bot
   - Check if webhook is receiving updates
   - Test order creation flow

4. **Create Admin Users:**
   - Access admin dashboard at `https://your-domain.com`
   - Add HD and Teknisi users
   - Test the complete flow

### 8. Monitoring & Maintenance

#### Health Checks

Create a health check endpoint:

```javascript
// app/api/health/route.ts
export async function GET() {
  return NextResponse.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString()
  })
}
```

#### Logging

Monitor these logs:
- Webhook errors
- Database connection issues
- Google Drive API errors
- SLA monitoring alerts

#### Backup

Set up regular backups for:
- Supabase database
- Google Drive photos
- Environment variables

### 9. Troubleshooting

#### Common Issues

**Webhook not working:**
- Check bot token
- Verify webhook URL is accessible
- Check SSL certificate

**Database connection failed:**
- Verify Supabase credentials
- Check RLS policies
- Test with `scripts/test-db.js`

**File upload fails:**
- Check Google Drive API setup
- Verify refresh token
- Check folder permissions

**SLA monitoring not working:**
- Ensure `/api/init` was called
- Check cron jobs are running
- Monitor server logs

#### Debug Commands

```bash
# Check webhook status
curl https://your-domain.com/api/telegram/setup

# Test database
node scripts/test-db.js test

# Get bot info
node scripts/setup-bot.js info

# Check health
curl https://your-domain.com/api/health
```

### 10. Security Considerations

1. **Environment Variables:**
   - Never commit `.env` files
   - Use secure storage for production secrets
   - Rotate keys regularly

2. **Database Security:**
   - Enable RLS policies
   - Use service role key only for server-side operations
   - Monitor database access

3. **API Security:**
   - Validate webhook signatures
   - Implement rate limiting
   - Use HTTPS everywhere

4. **File Storage:**
   - Secure Google Drive folder
   - Validate file types and sizes
   - Implement access controls

### 11. Scaling Considerations

- **Database:** Supabase handles scaling automatically
- **File Storage:** Google Drive has generous limits
- **Bot:** Telegram handles message delivery
- **Server:** Use horizontal scaling for high traffic

### 12. Maintenance Schedule

- **Daily:** Monitor SLA alerts and failed orders
- **Weekly:** Review reports and user activity
- **Monthly:** Update dependencies and security patches
- **Quarterly:** Review and optimize performance

## Support

For deployment issues:
1. Check the troubleshooting section
2. Review logs and error messages
3. Test individual components
4. Contact support team if needed
