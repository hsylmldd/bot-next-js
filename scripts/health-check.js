const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config({ path: '.env.local' });

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });

// Send health check message
bot.sendMessage(process.env.ADMIN_CHAT_ID || '6924062588', 
  '🤖 Bot Health Check\n\n' +
  'Status: ✅ Running\n' +
  'Time: ' + new Date().toLocaleString('id-ID') + '\n' +
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
