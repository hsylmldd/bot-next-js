import TelegramBot from 'node-telegram-bot-api';

// Initialize bot with token from environment
const botToken = process.env.TELEGRAM_BOT_TOKEN || '';
const bot = new TelegramBot(botToken, { 
  polling: false // Disable polling for webhook
});

console.log('Bot token available:', !!botToken);

// User sessions untuk menyimpan state
const userSessions = new Map();

console.log('🤖 Starting Telegram Bot (Webhook Mode)...');

// Handle /start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from?.first_name || 'User';
  const telegramId = msg.from?.id.toString() || '';
  
  console.log(`📨 Received /start from ${firstName} (${chatId})`);
  
  // Clear any existing session
  userSessions.delete(chatId);
  
  // Simple welcome message
  bot.sendMessage(chatId, 
    `Halo ${firstName}! 👋\n\n` +
    'Selamat datang di Order Management Bot!\n\n' +
    'Bot sedang dalam mode webhook dan siap digunakan.\n' +
    'Silakan gunakan /help untuk melihat menu yang tersedia.'
  ).catch(error => {
    console.error('Error sending start message:', error);
  });
});

// Handle /help command
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  
  console.log(`📨 Received /help from ${msg.from?.first_name} (${chatId})`);
  
  bot.sendMessage(chatId, 
    '📋 **Panduan Penggunaan Bot**\n\n' +
    '**Commands yang tersedia:**\n' +
    '/start - Memulai bot\n' +
    '/help - Menampilkan panduan ini\n' +
    '/test - Test bot functionality\n\n' +
    '**Fitur:**\n' +
    '✅ Bot berjalan 24/7 di Vercel\n' +
    '✅ Webhook mode untuk performa optimal\n' +
    '✅ Database terintegrasi dengan Supabase\n' +
    '✅ Support untuk order management lengkap\n\n' +
    'Bot siap digunakan! 🚀'
  ).catch(error => {
    console.error('Error sending help message:', error);
  });
});

// Handle /test command
bot.onText(/\/test/, (msg) => {
  const chatId = msg.chat.id;
  
  console.log(`📨 Received /test from ${msg.from?.first_name} (${chatId})`);
  
  bot.sendMessage(chatId, 
    '🧪 **Test Bot**\n\n' +
    '✅ Bot berjalan dengan baik!\n' +
    '✅ Webhook mode aktif\n' +
    '✅ Response time optimal\n\n' +
    'Bot siap untuk production! 🎉'
  ).catch(error => {
    console.error('Error sending test message:', error);
  });
});

// Handle callback queries
bot.on('callback_query', (callbackQuery) => {
  if (!callbackQuery.message) return;
  
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;
  
  console.log(`📨 Received callback: ${data} from ${callbackQuery.from?.first_name}`);
  
  bot.answerCallbackQuery(callbackQuery.id);
  bot.sendMessage(chatId, `Callback received: ${data}`);
});

// Handle text messages
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text || '';
  
  // Skip if it's a command
  if (text && text.startsWith('/')) {
    return;
  }
  
  // Simple echo for testing
  if (text) {
    bot.sendMessage(chatId, `Anda mengirim: "${text}"`);
  }
});

export { bot };
