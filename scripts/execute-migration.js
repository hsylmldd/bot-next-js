const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function executeMigration() {
  console.log('🔄 Executing database migration...');
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing Supabase environment variables');
    return;
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    console.log('📋 Step 1: Dropping foreign key constraints...');
    
    // Drop foreign key constraints
    await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE progress DROP CONSTRAINT IF EXISTS progress_order_id_fkey;'
    });
    
    await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE evidence DROP CONSTRAINT IF EXISTS evidence_order_id_fkey;'
    });
    
    console.log('✅ Foreign key constraints dropped');

    console.log('📋 Step 2: Backing up existing data...');
    
    // Get existing orders data
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*');
    
    if (ordersError) {
      console.error('❌ Error getting orders:', ordersError);
      return;
    }
    
    console.log(`📊 Found ${orders.length} orders to migrate`);

    console.log('📋 Step 3: Recreating orders table...');
    
    // Drop and recreate orders table
    await supabase.rpc('exec_sql', {
      sql: 'DROP TABLE IF EXISTS orders CASCADE;'
    });
    
    await supabase.rpc('exec_sql', {
      sql: `CREATE TABLE orders (
        order_id VARCHAR(255) PRIMARY KEY,
        customer_name VARCHAR(255) NOT NULL,
        customer_address TEXT NOT NULL,
        customer_phone VARCHAR(50),
        contact VARCHAR(255),
        sto VARCHAR(100),
        transaction_type VARCHAR(100),
        service_type VARCHAR(100),
        assigned_technician UUID REFERENCES users(id),
        status VARCHAR(50) DEFAULT 'Pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        pt2_completion_time TIMESTAMP WITH TIME ZONE,
        lme_pt2_update_time TIMESTAMP WITH TIME ZONE
      );`
    });
    
    console.log('✅ Orders table recreated with order_id as primary key');

    console.log('📋 Step 4: Restoring data with new structure...');
    
    // Restore orders data with order_id
    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];
      const orderIdManual = `ORD-${String(i + 1).padStart(4, '0')}`;
      
      await supabase
        .from('orders')
        .insert({
          order_id: orderIdManual,
          customer_name: order.customer_name,
          customer_address: order.customer_address,
          customer_phone: order.customer_phone,
          contact: order.contact,
          sto: order.sto,
          transaction_type: order.transaction_type,
          service_type: order.service_type,
          assigned_technician: order.assigned_technician,
          status: order.status,
          created_at: order.created_at,
          updated_at: order.updated_at,
          pt2_completion_time: order.pt2_completion_time,
          lme_pt2_update_time: order.lme_pt2_update_time
        });
      
      console.log(`✅ Migrated order ${i + 1}/${orders.length}: ${order.customer_name} -> ${orderIdManual}`);
    }

    console.log('📋 Step 5: Updating progress and evidence tables...');
    
    // Update progress table structure
    await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE progress ALTER COLUMN order_id TYPE VARCHAR(255);'
    });
    
    // Update evidence table structure  
    await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE evidence ALTER COLUMN order_id TYPE VARCHAR(255);'
    });
    
    console.log('✅ Progress and evidence tables updated');

    console.log('📋 Step 6: Adding foreign key constraints...');
    
    // Add foreign key constraints
    await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE progress ADD CONSTRAINT progress_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE;'
    });
    
    await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE evidence ADD CONSTRAINT evidence_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE;'
    });
    
    console.log('✅ Foreign key constraints added');

    console.log('📋 Step 7: Creating indexes...');
    
    // Create indexes
    await supabase.rpc('exec_sql', {
      sql: 'CREATE INDEX idx_orders_order_id ON orders(order_id);'
    });
    
    console.log('✅ Indexes created');

    console.log('🎉 Migration completed successfully!');
    console.log('📊 Summary:');
    console.log(`   - Migrated ${orders.length} orders`);
    console.log('   - Updated progress and evidence table structures');
    console.log('   - Added proper foreign key constraints');
    console.log('   - Created necessary indexes');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.log('💡 You may need to run the SQL commands manually in Supabase dashboard');
  }
}

executeMigration();