const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config({ path: '.env.local' });

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });

async function checkBotStatus() {
  try {
    console.log('🤖 Checking bot status...');
    
    // Get bot info
    const botInfo = await bot.getMe();
    console.log('✅ Bot info retrieved:');
    console.log(`   Name: ${botInfo.first_name}`);
    console.log(`   Username: @${botInfo.username}`);
    console.log(`   ID: ${botInfo.id}`);
    
    // Get webhook info
    const webhookInfo = await bot.getWebHookInfo();
    console.log('\n📡 Webhook info:');
    console.log(`   URL: ${webhookInfo.url || 'Not set'}`);
    console.log(`   Pending updates: ${webhookInfo.pending_update_count}`);
    
    if (webhookInfo.url) {
      console.log('✅ Webhook is set');
    } else {
      console.log('⚠️  Webhook is not set - bot will not receive messages');
      console.log('\n💡 Solutions:');
      console.log('1. Use polling mode: npm run test:bot-polling');
      console.log('2. Setup ngrok: npm run setup:ngrok');
      console.log('3. Deploy to production with HTTPS URL');
    }
    
    console.log('\n📱 Test commands:');
    console.log('1. Send /start to your bot');
    console.log('2. If no response, try polling mode');
    console.log('3. Check bot logs for errors');
    
  } catch (error) {
    console.error('❌ Bot status check failed:', error.message);
    
    if (error.message.includes('401')) {
      console.log('\n💡 Bot token is invalid or expired');
      console.log('1. Check TELEGRAM_BOT_TOKEN in .env.local');
      console.log('2. Get new token from @BotFather');
    }
  }
}

checkBotStatus();
