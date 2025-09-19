const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function migrateDatabase() {
  console.log('🔄 Starting database migration...');
  
  try {
    // Test if fields already exist by trying to select them
    console.log('🔍 Checking if new fields already exist...');
    const { data: testData, error: testError } = await supabase
      .from('orders')
      .select('sto, transaction_type, service_type')
      .limit(1);
    
    if (testError && testError.code === 'PGRST116') {
      console.log('❌ Fields do not exist, migration needed');
      console.log('⚠️  Please run the following SQL commands in your Supabase SQL editor:');
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
      console.log('📋 After running these SQL commands, run this script again to test the migration.');
    } else if (testError) {
      console.error('❌ Error checking fields:', testError);
    } else {
      console.log('✅ Fields already exist! Migration not needed.');
      console.log('🧪 Testing new fields...');
      
      // Test creating an order with new fields
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
      } else {
        console.log('✅ Test order created successfully!');
        console.log(`📋 Order ID: ${order.id}`);
        console.log(`🏢 STO: ${order.sto}`);
        console.log(`🔄 Transaction Type: ${order.transaction_type}`);
        console.log(`🌐 Service Type: ${order.service_type}`);
        
        // Clean up test order
        await supabase.from('orders').delete().eq('id', order.id);
        console.log('🧹 Test order cleaned up');
      }
    }
    
  } catch (error) {
    console.error('❌ Migration error:', error);
  }
}

// Run the migration
migrateDatabase();
