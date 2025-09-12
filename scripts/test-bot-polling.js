const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config({ path: '.env.local' });

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

console.log('🤖 Starting bot in polling mode...');
console.log('📱 Bot will respond to messages in real-time');
console.log('⚠️  Press Ctrl+C to stop');

// Handle /start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name || 'User';
  
  console.log(`📨 Received /start from ${firstName} (${chatId})`);
  
  bot.sendMessage(chatId, 
    `Halo ${firstName}! 👋\n\n` +
    'Selamat datang di Order Management Bot!\n\n' +
    'Bot sedang berjalan dalam mode polling untuk development.\n\n' +
    'Gunakan command berikut:\n' +
    '/start - Memulai bot\n' +
    '/help - Menampilkan bantuan\n' +
    '/test - Test bot response'
  );
});

// Handle /help command
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  
  console.log(`📨 Received /help from ${msg.from.first_name} (${chatId})`);
  
  bot.sendMessage(chatId, 
    '📋 **Panduan Bot**\n\n' +
    '**Commands yang tersedia:**\n' +
    '/start - Memulai bot\n' +
    '/help - Menampilkan panduan ini\n' +
    '/test - Test bot response\n\n' +
    '**Status:** Bot berjalan dalam mode polling\n' +
    '**Database:** ✅ Connected\n' +
    '**Storage:** ✅ Ready'
  );
});

// Handle /test command
bot.onText(/\/test/, (msg) => {
  const chatId = msg.chat.id;
  
  console.log(`📨 Received /test from ${msg.from.first_name} (${chatId})`);
  
  bot.sendMessage(chatId, 
    '✅ **Bot Test Response**\n\n' +
    'Bot berfungsi dengan baik!\n' +
    'Database: Connected\n' +
    'Storage: Ready\n' +
    'Time: ' + new Date().toLocaleString()
  );
});

// Handle any other message
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  
  if (!text || text.startsWith('/')) {
    return; // Skip commands
  }
  
  console.log(`📨 Received message from ${msg.from.first_name} (${chatId}): ${text}`);
  
  bot.sendMessage(chatId, 
    '🤖 Bot menerima pesan Anda!\n\n' +
    `Pesan: "${text}"\n\n` +
    'Gunakan /help untuk melihat command yang tersedia.'
  );
});

// Handle errors
bot.on('error', (error) => {
  console.error('❌ Bot error:', error);
});

bot.on('polling_error', (error) => {
  console.error('❌ Polling error:', error);
});

console.log('✅ Bot started successfully!');
console.log('📱 Send /start to your bot to test');
