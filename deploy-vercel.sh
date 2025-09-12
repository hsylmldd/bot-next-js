#!/bin/bash

echo "🚀 Deploying to Vercel..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Login to Vercel
echo "🔐 Logging in to Vercel..."
vercel login

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

# Get deployment URL
DEPLOY_URL=$(vercel ls | grep -o 'https://[^[:space:]]*' | head -1)
echo "🌐 Deployment URL: $DEPLOY_URL"

# Set webhook
echo "🔗 Setting webhook..."
curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"$DEPLOY_URL/api/telegram/webhook\"}"

echo "✅ Deployment complete!"
echo "🌐 Bot URL: $DEPLOY_URL"
echo "🔗 Webhook: $DEPLOY_URL/api/telegram/webhook"
echo "❤️ Health: $DEPLOY_URL/api/health"
