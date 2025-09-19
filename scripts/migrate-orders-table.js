const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function migrateOrdersTable() {
  try {
    console.log('🔧 Migrating orders table structure...');
    console.log('📍 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Found' : 'Not found');
    console.log('🔑 Service Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Found' : 'Not found');

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ Missing environment variables');
      return;
    }

    console.log('⚠️  IMPORTANT: This will modify your database structure!');
    console.log('📝 Please run these SQL commands in your Supabase SQL Editor:');
    console.log('');
    console.log('-- Step 1: Drop existing foreign key constraints');
    console.log('ALTER TABLE progress DROP CONSTRAINT IF EXISTS progress_order_id_fkey;');
    console.log('ALTER TABLE evidence DROP CONSTRAINT IF EXISTS evidence_order_id_fkey;');
    console.log('');
    console.log('-- Step 2: Backup existing data (optional but recommended)');
    console.log('CREATE TABLE orders_backup AS SELECT * FROM orders;');
    console.log('');
    console.log('-- Step 3: Drop and recreate orders table with new structure');
    console.log('DROP TABLE orders CASCADE;');
    console.log('');
    console.log('CREATE TABLE orders (');
    console.log('    order_id VARCHAR(255) PRIMARY KEY,');
    console.log('    customer_name VARCHAR(255) NOT NULL,');
    console.log('    customer_address TEXT NOT NULL,');
    console.log('    contact VARCHAR(255) NOT NULL,');
    console.log('    sto VARCHAR(10) CHECK (sto IN (\'CBB\', \'CWA\', \'GAN\', \'JTN\', \'KLD\', \'KRG\', \'PDK\', \'PGB\', \'PGG\', \'PSR\', \'RMG\', \'BIN\', \'CPE\', \'JAG\', \'KAL\', \'KBY\', \'KMG\', \'PSM\', \'TBE\', \'NAS\')),');
    console.log('    transaction_type VARCHAR(50) CHECK (transaction_type IN (\'Disconnect\', \'modify\', \'new install existing\', \'new install jt\', \'new install\', \'PDA\')),');
    console.log('    service_type VARCHAR(50) CHECK (service_type IN (\'Astinet\', \'metro\', \'vpn ip\', \'ip transit\', \'siptrunk\')),');
    console.log('    assigned_technician UUID REFERENCES users(id) ON DELETE SET NULL,');
    console.log('    status VARCHAR(20) CHECK (status IN (\'Pending\', \'In Progress\', \'On Hold\', \'Completed\', \'Closed\')) DEFAULT \'Pending\',');
    console.log('    sod_time TIMESTAMP WITH TIME ZONE,');
    console.log('    e2e_time TIMESTAMP WITH TIME ZONE,');
    console.log('    lme_pt2_start TIMESTAMP WITH TIME ZONE,');
    console.log('    lme_pt2_end TIMESTAMP WITH TIME ZONE,');
    console.log('    sla_deadline TIMESTAMP WITH TIME ZONE,');
    console.log('    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),');
    console.log('    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()');
    console.log(');');
    console.log('');
    console.log('-- Step 4: Update progress table to use VARCHAR order_id');
    console.log('ALTER TABLE progress ALTER COLUMN order_id TYPE VARCHAR(255);');
    console.log('ALTER TABLE progress ADD CONSTRAINT progress_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE;');
    console.log('');
    console.log('-- Step 5: Update evidence table to use VARCHAR order_id');
    console.log('ALTER TABLE evidence ALTER COLUMN order_id TYPE VARCHAR(255);');
    console.log('ALTER TABLE evidence ADD CONSTRAINT evidence_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE;');
    console.log('');
    console.log('-- Step 6: Create indexes for performance');
    console.log('CREATE INDEX idx_orders_order_id ON orders(order_id);');
    console.log('CREATE INDEX idx_orders_status ON orders(status);');
    console.log('CREATE INDEX idx_orders_assigned_technician ON orders(assigned_technician);');
    console.log('');
    console.log('✅ After running these SQL commands, your database will be ready for manual Order ID input!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

migrateOrdersTable();