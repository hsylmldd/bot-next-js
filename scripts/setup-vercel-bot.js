const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupVercelBot() {
  console.log('🚀 Setting up Vercel Bot...');
  
  try {
    // 1. Check if new fields exist
    console.log('🔍 Checking database fields...');
    const { data: testData, error: testError } = await supabase
      .from('orders')
      .select('sto, transaction_type, service_type')
      .limit(1);
    
    if (testError && testError.code === '42703') {
      console.log('❌ Database fields missing!');
      console.log('📋 Please run these SQL commands in your Supabase SQL Editor:');
      console.log('');
      console.log('-- Add STO field');
      console.log("ALTER TABLE orders ADD COLUMN sto VARCHAR(10) CHECK (sto IN ('CBB', 'CWA', 'GAN', 'JTN', 'KLD', 'KRG', 'PDK', 'PGB', 'PGG', 'PSR', 'RMG', 'BIN', 'CPE', 'JAG', 'KAL', 'KBY', 'KMG', 'PSM', 'TBE', 'NAS'));");
      console.log('');
      console.log('-- Add transaction_type field');
      console.log("ALTER TABLE orders ADD COLUMN transaction_type VARCHAR(50) CHECK (transaction_type IN ('Disconnect', 'modify', 'new install existing', 'new install jt', 'new install', 'PDA'));");
      console.log('');
      console.log('-- Add service_type field');
      console.log("ALTER TABLE orders ADD COLUMN service_type VARCHAR(50) CHECK (service_type IN ('Astinet', 'metro', 'vpn ip', 'ip transit', 'siptrunk'));");
      console.log('');
      console.log('⚠️  After running these SQL commands, run this script again.');
      return;
    } else if (testError) {
      console.error('❌ Error checking fields:', testError);
      return;
    } else {
      console.log('✅ Database fields are ready!');
    }
    
    // 2. Test creating an order with new fields
    console.log('🧪 Testing order creation...');
    const testOrder = {
      customer_name: 'Test Customer',
      customer_address: 'Test Address',
      contact: '08123456789',
      sto: 'CBB',
      transaction_type: 'new install',
      service_type: 'metro',
      status: 'Pending'
    };
    
    const { data: order, error: createError } = await supabase
      .from('orders')
      .insert(testOrder)
      .select()
      .single();
    
    if (createError) {
      console.error('❌ Error creating test order:', createError);
      return;
    }
    
    console.log('✅ Test order created successfully!');
    console.log(`📋 Order ID: ${order.id}`);
    console.log(`🏢 STO: ${order.sto}`);
    console.log(`🔄 Transaction Type: ${order.transaction_type}`);
    console.log(`🌐 Service Type: ${order.service_type}`);
    
    // Clean up test order
    await supabase.from('orders').delete().eq('id', order.id);
    console.log('🧹 Test order cleaned up');
    
    // 3. Check environment variables
    console.log('🔧 Checking environment variables...');
    const requiredEnvVars = [
      'TELEGRAM_BOT_TOKEN',
      'NEXT_PUBLIC_SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY'
    ];
    
    let envVarsOk = true;
    requiredEnvVars.forEach(envVar => {
      if (!process.env[envVar]) {
        console.log(`❌ Missing: ${envVar}`);
        envVarsOk = false;
      } else {
        console.log(`✅ Found: ${envVar}`);
      }
    });
    
    if (!envVarsOk) {
      console.log('⚠️  Please set missing environment variables in Vercel dashboard');
      return;
    }
    
    // 4. Instructions for webhook setup
    console.log('\n🎯 Next Steps:');
    console.log('1. Deploy to Vercel: npm run deploy');
    console.log('2. Set webhook URL in Telegram:');
    console.log(`   curl -X POST "https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/setWebhook" \\`);
    console.log('     -H "Content-Type: application/json" \\');
    console.log('     -d \'{"url": "https://your-app.vercel.app/api/telegram/webhook"}\'');
    console.log('');
    console.log('3. Test bot by sending /start to your bot');
    console.log('');
    console.log('🎉 Bot setup complete!');
    
  } catch (error) {
    console.error('❌ Setup error:', error);
  }
}

// Run the setup
setupVercelBot();
