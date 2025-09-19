const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

async function setupWebhook() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const WEBHOOK_URL = 'https://bot-next-glopmspff-hsylmldds-projects.vercel.app/api/telegram/webhook';
  
  if (!botToken) {
    console.error('❌ TELEGRAM_BOT_TOKEN not found in .env.local');
    return;
  }
  
  console.log('🔧 Setting up Telegram webhook...');
  console.log(`📡 Webhook URL: ${WEBHOOK_URL}`);
  
  try {
    // Set webhook
    const response = await axios.post(`https://api.telegram.org/bot${botToken}/setWebhook`, {
      url: WEBHOOK_URL
    });
    
    if (response.data.ok) {
      console.log('✅ Webhook set successfully!');
      console.log('🎉 Bot will now run automatically 24/7');
      console.log('📱 Test by sending /start to your bot');
    } else {
      console.error('❌ Failed to set webhook:', response.data);
    }
    
    // Get webhook info
    const infoResponse = await axios.get(`https://api.telegram.org/bot${botToken}/getWebhookInfo`);
    console.log('\n📊 Webhook Info:');
    console.log(JSON.stringify(infoResponse.data.result, null, 2));
    
  } catch (error) {
    console.error('❌ Error setting webhook:', error.message);
  }
}

setupWebhook();
