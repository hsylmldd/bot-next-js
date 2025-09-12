const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config({ path: '.env.local' });

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });

async function testBotCommands() {
  try {
    console.log('Testing bot commands...');
    
    // Get bot info
    const botInfo = await bot.getMe();
    console.log('✅ Bot info retrieved:', botInfo.username);
    
    // Test webhook info
    const webhookInfo = await bot.getWebHookInfo();
    console.log('✅ Webhook info:', webhookInfo);
    
    // Test sending message (replace with your test chat ID)
    const testChatId = process.env.TEST_CHAT_ID;
    if (testChatId) {
      await bot.sendMessage(testChatId, '🤖 Bot test message - Bot is working correctly!');
      console.log('✅ Test message sent successfully');
    } else {
      console.log('⚠️ TEST_CHAT_ID not set, skipping message test');
    }
    
    console.log('\n🎉 Bot tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Bot test failed:', error.message);
  }
}

async function testWebhookEndpoint() {
  try {
    console.log('Testing webhook endpoint...');
    
    const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL;
    if (!webhookUrl) {
      console.error('❌ TELEGRAM_WEBHOOK_URL not set');
      return;
    }
    
    const response = await fetch(`${webhookUrl}/api/telegram/setup`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Webhook endpoint accessible');
      console.log('Webhook info:', data.webhookInfo);
    } else {
      console.error('❌ Webhook endpoint error:', data.error);
    }
    
  } catch (error) {
    console.error('❌ Webhook test failed:', error.message);
  }
}

async function testAPIEndpoints() {
  try {
    console.log('Testing API endpoints...');
    
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    // Test health endpoint
    try {
      const healthResponse = await fetch(`${baseUrl}/api/health`);
      if (healthResponse.ok) {
        console.log('✅ Health endpoint working');
      } else {
        console.log('⚠️ Health endpoint not available');
      }
    } catch (error) {
      console.log('⚠️ Health endpoint not available');
    }
    
    // Test init endpoint
    try {
      const initResponse = await fetch(`${baseUrl}/api/init`);
      if (initResponse.ok) {
        console.log('✅ Init endpoint working');
      } else {
        console.log('⚠️ Init endpoint error');
      }
    } catch (error) {
      console.log('⚠️ Init endpoint not available');
    }
    
    console.log('\n🎉 API tests completed!');
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
  }
}

async function runAllTests() {
  console.log('🚀 Starting comprehensive bot tests...\n');
  
  await testBotCommands();
  console.log('');
  
  await testWebhookEndpoint();
  console.log('');
  
  await testAPIEndpoints();
  
  console.log('\n✨ All tests completed!');
}

// Command line interface
const command = process.argv[2];

switch (command) {
  case 'bot':
    testBotCommands();
    break;
  case 'webhook':
    testWebhookEndpoint();
    break;
  case 'api':
    testAPIEndpoints();
    break;
  case 'all':
    runAllTests();
    break;
  default:
    console.log('Usage: node scripts/test-bot.js [bot|webhook|api|all]');
    console.log('  bot     - Test bot commands and functionality');
    console.log('  webhook - Test webhook endpoint');
    console.log('  api     - Test API endpoints');
    console.log('  all     - Run all tests');
    console.log('\nNote: Set TEST_CHAT_ID in .env to test message sending');
}
