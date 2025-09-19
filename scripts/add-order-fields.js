const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addOrderFields() {
  console.log('🔄 Adding new fields to orders table...');
  
  try {
    // Add STO field
    console.log('📝 Adding STO field...');
    const { error: stoError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE orders 
        ADD COLUMN IF NOT EXISTS sto VARCHAR(10) CHECK (sto IN ('CBB', 'CWA', 'GAN', 'JTN', 'KLD', 'KRG', 'PDK', 'PGB', 'PGG', 'PSR', 'RMG', 'BIN', 'CPE', 'JAG', 'KAL', 'KBY', 'KMG', 'PSM', 'TBE', 'NAS'));
      `
    });
    
    if (stoError) {
      console.error('❌ Error adding STO field:', stoError);
    } else {
      console.log('✅ STO field added successfully');
    }

    // Add transaction_type field
    console.log('📝 Adding transaction_type field...');
    const { error: transactionError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE orders 
        ADD COLUMN IF NOT EXISTS transaction_type VARCHAR(50) CHECK (transaction_type IN ('Disconnect', 'modify', 'new install existing', 'new install jt', 'new install', 'PDA'));
      `
    });
    
    if (transactionError) {
      console.error('❌ Error adding transaction_type field:', transactionError);
    } else {
      console.log('✅ transaction_type field added successfully');
    }

    // Add service_type field
    console.log('📝 Adding service_type field...');
    const { error: serviceError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE orders 
        ADD COLUMN IF NOT EXISTS service_type VARCHAR(50) CHECK (service_type IN ('Astinet', 'metro', 'vpn ip', 'ip transit', 'siptrunk'));
      `
    });
    
    if (serviceError) {
      console.error('❌ Error adding service_type field:', serviceError);
    } else {
      console.log('✅ service_type field added successfully');
    }

    console.log('🎉 All new fields added successfully!');
    console.log('📋 New fields:');
    console.log('   - sto: STO location (CBB, CWA, GAN, etc.)');
    console.log('   - transaction_type: Type of transaction (Disconnect, modify, etc.)');
    console.log('   - service_type: Type of service (Astinet, metro, etc.)');

  } catch (error) {
    console.error('❌ Error adding fields:', error);
  }
}

// Run the migration
addOrderFields();
