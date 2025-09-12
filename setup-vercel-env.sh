#!/bin/bash

echo "🔧 Setting up Vercel environment variables..."

# Set environment variables
vercel env add TELEGRAM_BOT_TOKEN
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add CRON_SECRET

echo "✅ Environment variables set!"
echo "📋 Don't forget to set the values in Vercel dashboard"
