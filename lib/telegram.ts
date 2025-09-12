import TelegramBot from 'node-telegram-bot-api';

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN!, { 
  polling: false // Disable polling for webhook
});

// Webhook handler
bot.on('message', (msg) => {
  console.log('📨 Received message:', msg.text);
  // Handle messages here
});

bot.on('callback_query', (callbackQuery) => {
  console.log('📨 Received callback:', callbackQuery.data);
  // Handle callbacks here
});

export { bot };