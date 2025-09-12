#!/bin/bash

echo "🚀 Setting up PM2 for 24/7 bot deployment..."

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    npm install -g pm2
fi

# Stop existing bot if running
pm2 stop telegram-bot 2>/dev/null || true
pm2 delete telegram-bot 2>/dev/null || true

# Start bot with PM2
echo "🤖 Starting bot with PM2..."
pm2 start ecosystem.config.js

# Setup auto-start
echo "🔄 Setting up auto-start..."
pm2 startup
pm2 save

# Show status
echo "📊 Bot status:"
pm2 status

echo "✅ Bot is now running 24/7!"
echo "📱 Use 'pm2 logs telegram-bot' to view logs"
echo "🔄 Use 'pm2 restart telegram-bot' to restart"
echo "⏹️ Use 'pm2 stop telegram-bot' to stop"
