# Troubleshooting Guide

## 🚨 Common Issues & Solutions

### 1. Database Tables Not Found

**Error:** `Could not find the table 'public.users' in the schema cache`

**Solution:**
```bash
# 1. Go to Supabase Dashboard
# 2. Open SQL Editor
# 3. Copy content from supabase-schema.sql
# 4. Run the SQL script
# 5. Test database connection
npm run setup:db
```

### 2. Storage Bucket Mime Type Error

**Error:** `mime type text/plain is not supported`

**Solution:**
```bash
# Fixed in latest version
npm run setup:storage
```

### 3. Webhook HTTPS Error

**Error:** `An HTTPS URL must be provided for webhook`

**Solutions:**

#### Option A: Use ngrok (Recommended for development)
```bash
# 1. Install ngrok
# Download from: https://ngrok.com/download

# 2. Start ngrok tunnel
npm run setup:ngrok

# 3. Update webhook (ngrok will show the URL)
npm run setup:bot

# 4. Start development server
npm run dev
```

#### Option B: Skip webhook for local development
```bash
# Just start the development server
npm run dev:mode
```

### 4. Environment Variables Not Found

**Error:** `Missing Supabase credentials in environment variables`

**Solution:**
```bash
# 1. Setup environment
npm run setup:env

# 2. Check environment
npm run check:env

# 3. Debug if needed
npm run debug-env
```

### 5. Next.js Config Warnings

**Warning:** `Invalid next.config.js options detected`

**Solution:**
```bash
# Fixed in latest version
# The config file has been updated
```

## 🔧 Step-by-Step Setup

### For Local Development (No Webhook)

```bash
# 1. Setup environment
npm run setup:env

# 2. Setup database (run SQL schema first)
npm run setup:db

# 3. Setup storage
npm run setup:storage

# 4. Create sample data
npm run setup:sample

# 5. Start development server
npm run dev:mode
```

### For Webhook Development (with ngrok)

```bash
# 1. Setup environment
npm run setup:env

# 2. Setup database (run SQL schema first)
npm run setup:db

# 3. Setup storage
npm run setup:storage

# 4. Create sample data
npm run setup:sample

# 5. Start ngrok tunnel
npm run setup:ngrok

# 6. Setup webhook (in another terminal)
npm run setup:bot

# 7. Start development server
npm run dev
```

## 📋 Manual Database Setup

If automated setup fails:

1. **Go to Supabase Dashboard**
2. **Open SQL Editor**
3. **Copy and paste this SQL:**

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    telegram_id VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(20) CHECK (role IN ('HD', 'Teknisi')) NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table
CREATE TABLE orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    customer_address TEXT NOT NULL,
    contact VARCHAR(255) NOT NULL,
    assigned_technician UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(20) CHECK (status IN ('Pending', 'In Progress', 'On Hold', 'Completed', 'Closed')) DEFAULT 'Pending',
    sod_time TIMESTAMP WITH TIME ZONE,
    e2e_time TIMESTAMP WITH TIME ZONE,
    lme_pt2_start TIMESTAMP WITH TIME ZONE,
    lme_pt2_end TIMESTAMP WITH TIME ZONE,
    sla_deadline TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create progress table
CREATE TABLE progress (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    stage VARCHAR(20) CHECK (stage IN ('Survey', 'Penarikan', 'P2P', 'Instalasi', 'Catatan')) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('Ready', 'Not Ready', 'Selesai')) NOT NULL,
    note TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create evidence table
CREATE TABLE evidence (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    odp_name VARCHAR(255),
    ont_sn VARCHAR(255),
    photo_sn_ont TEXT,
    photo_technician_customer TEXT,
    photo_customer_house TEXT,
    photo_odp_front TEXT,
    photo_odp_inside TEXT,
    photo_label_dc TEXT,
    photo_test_result TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create storage bucket for evidence photos
INSERT INTO storage.buckets (id, name, public) VALUES ('evidence-photos', 'evidence-photos', true);

-- Set up storage policies
CREATE POLICY "Public read access for evidence photos" ON storage.objects
FOR SELECT USING (bucket_id = 'evidence-photos');

CREATE POLICY "Authenticated users can upload evidence photos" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'evidence-photos');

CREATE POLICY "Authenticated users can update evidence photos" ON storage.objects
FOR UPDATE USING (bucket_id = 'evidence-photos');
```

4. **Run the SQL script**
5. **Test database connection:**
```bash
npm run setup:db
```

## 🚀 Production Deployment

### Vercel Deployment

1. **Push to GitHub**
2. **Connect to Vercel**
3. **Set environment variables:**
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_WEBHOOK_URL` (your domain)
   - `NEXT_PUBLIC_APP_URL` (your domain)

4. **Deploy**
5. **Setup webhook:**
```bash
curl -X POST https://your-domain.com/api/telegram/setup
```

6. **Initialize services:**
```bash
curl https://your-domain.com/api/init
```

## 🔍 Debug Commands

```bash
# Debug environment variables
npm run debug-env

# Check database connection
npm run setup:db

# Test storage
npm run setup:storage

# Check bot info
npm run setup:bot
```

## 📞 Getting Help

If you're still having issues:

1. **Check the logs** for specific error messages
2. **Verify Supabase project** is active and accessible
3. **Check Telegram bot token** is correct
4. **Ensure all environment variables** are set correctly
5. **Run debug commands** to identify the issue

---

**Need more help?** Check the main README.md or create an issue in the repository.
