const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config({ path: '.env.local' });

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });

async function setupWebhook() {
  try {
    const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL;
    
    if (!webhookUrl) {
      console.error('TELEGRAM_WEBHOOK_URL not set in environment variables');
      return;
    }
    
    console.log('Setting up webhook...');
    await bot.setWebHook(`${webhookUrl}/api/telegram/webhook`);
    
    const webhookInfo = await bot.getWebHookInfo();
    console.log('Webhook setup successful:', webhookInfo);
    
  } catch (error) {
    console.error('Error setting up webhook:', error);
  }
}

async function deleteWebhook() {
  try {
    console.log('Deleting webhook...');
    await bot.deleteWebHook();
    console.log('Webhook deleted successfully');
  } catch (error) {
    console.error('Error deleting webhook:', error);
  }
}

async function getBotInfo() {
  try {
    const botInfo = await bot.getMe();
    console.log('Bot info:', botInfo);
  } catch (error) {
    console.error('Error getting bot info:', error);
  }
}

// Command line interface
const command = process.argv[2];

switch (command) {
  case 'setup':
    setupWebhook();
    break;
  case 'delete':
    deleteWebhook();
    break;
  case 'info':
    getBotInfo();
    break;
  default:
    console.log('Usage: node scripts/setup-bot.js [setup|delete|info]');
    console.log('  setup  - Set up webhook');
    console.log('  delete - Delete webhook');
    console.log('  info   - Get bot information');
}
