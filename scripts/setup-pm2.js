const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up PM2 for 24/7 bot deployment...');

// Check if PM2 is installed
try {
  execSync('pm2 --version', { stdio: 'ignore' });
  console.log('✅ PM2 is already installed');
} catch (error) {
  console.log('📦 Installing PM2...');
  try {
    execSync('npm install -g pm2', { stdio: 'inherit' });
    console.log('✅ PM2 installed successfully');
  } catch (installError) {
    console.log('❌ Failed to install PM2. Please install manually:');
    console.log('   npm install -g pm2');
    console.log('   or');
    console.log('   sudo npm install -g pm2');
    process.exit(1);
  }
}

// Create PM2 ecosystem file
const ecosystemConfig = {
  apps: [{
    name: 'telegram-bot',
    script: 'scripts/bot-fixed-workflow.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};

// Create logs directory
if (!fs.existsSync('logs')) {
  fs.mkdirSync('logs');
  console.log('✅ Created logs directory');
}

// Write ecosystem config
fs.writeFileSync('ecosystem.config.js', `module.exports = ${JSON.stringify(ecosystemConfig, null, 2)}`);
console.log('✅ Created ecosystem.config.js');

// Create PM2 setup script
const setupScript = `#!/bin/bash

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
`;

fs.writeFileSync('setup-pm2.sh', setupScript);
fs.chmodSync('setup-pm2.sh', '755');
console.log('✅ Created setup-pm2.sh');

// Create PM2 management script
const managementScript = `#!/bin/bash

case "$1" in
    start)
        echo "🚀 Starting bot..."
        pm2 start ecosystem.config.js
        ;;
    stop)
        echo "⏹️ Stopping bot..."
        pm2 stop telegram-bot
        ;;
    restart)
        echo "🔄 Restarting bot..."
        pm2 restart telegram-bot
        ;;
    status)
        echo "📊 Bot status:"
        pm2 status
        ;;
    logs)
        echo "📱 Bot logs:"
        pm2 logs telegram-bot
        ;;
    monit)
        echo "📊 Monitoring bot..."
        pm2 monit
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|logs|monit}"
        echo ""
        echo "Commands:"
        echo "  start   - Start the bot"
        echo "  stop    - Stop the bot"
        echo "  restart - Restart the bot"
        echo "  status  - Show bot status"
        echo "  logs    - Show bot logs"
        echo "  monit   - Monitor bot resources"
        exit 1
        ;;
esac
`;

fs.writeFileSync('bot-manager.sh', managementScript);
fs.chmodSync('bot-manager.sh', '755');
console.log('✅ Created bot-manager.sh');

// Create health check script
const healthCheckScript = `const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config({ path: '.env.local' });

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });

// Send health check message
bot.sendMessage(process.env.ADMIN_CHAT_ID || '6924062588', 
  '🤖 Bot Health Check\\n\\n' +
  'Status: ✅ Running\\n' +
  'Time: ' + new Date().toLocaleString('id-ID') + '\\n' +
  'Uptime: ' + process.uptime() + ' seconds'
)
  .then(() => {
    console.log('✅ Health check sent successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Health check failed:', error.message);
    process.exit(1);
  });
`;

fs.writeFileSync('scripts/health-check.js', healthCheckScript);
console.log('✅ Created health-check.js');

// Update package.json with PM2 scripts
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

packageJson.scripts = {
  ...packageJson.scripts,
  'pm2:start': 'pm2 start ecosystem.config.js',
  'pm2:stop': 'pm2 stop telegram-bot',
  'pm2:restart': 'pm2 restart telegram-bot',
  'pm2:status': 'pm2 status',
  'pm2:logs': 'pm2 logs telegram-bot',
  'pm2:monit': 'pm2 monit',
  'pm2:setup': 'pm2 startup && pm2 save',
  'health:check': 'node scripts/health-check.js'
};

fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
console.log('✅ Updated package.json with PM2 scripts');

console.log('\\n🎉 PM2 setup completed!');
console.log('\\n📋 Next steps:');
console.log('1. Run: ./setup-pm2.sh');
console.log('2. Or run: npm run pm2:start');
console.log('3. Check status: npm run pm2:status');
console.log('4. View logs: npm run pm2:logs');
console.log('\\n🔧 Management commands:');
console.log('- Start: npm run pm2:start');
console.log('- Stop: npm run pm2:stop');
console.log('- Restart: npm run pm2:restart');
console.log('- Status: npm run pm2:status');
console.log('- Logs: npm run pm2:logs');
console.log('- Monitor: npm run pm2:monit');
console.log('- Health check: npm run health:check');
console.log('\\n🚀 Bot will now run 24/7!');
