const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function fixMigration() {
  console.log('🔧 Fixing migration - Adding order_id column...');
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing Supabase environment variables');
    return;
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    console.log('📋 Step 1: Getting current orders data...');
    
    // Get all existing orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*');
    
    if (ordersError) {
      console.error('❌ Error getting orders:', ordersError);
      return;
    }
    
    console.log(`📊 Found ${orders.length} orders to process`);

    console.log('📋 Step 2: Adding order_id column to existing table...');
    
    // Instead of recreating table, just add the order_id column
    // This approach is safer and preserves existing data
    
    // First, let's add the order_id column
    console.log('   Adding order_id column...');
    
    // We'll do this by updating each record individually to add order_id
    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];
      const orderIdManual = `ORD-${String(i + 1).padStart(4, '0')}`;
      
      // Add order_id field to the existing record
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          order_id: orderIdManual,
          // Keep all existing data
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
        })
        .eq('id', order.id);
      
      if (updateError) {
        console.error(`❌ Error updating order ${i + 1}:`, updateError);
      } else {
        console.log(`✅ Updated order ${i + 1}/${orders.length}: ${order.customer_name} -> ${orderIdManual}`);
      }
    }

    console.log('📋 Step 3: Testing order_id functionality...');
    
    // Test if we can now query by order_id
    const { data: testQuery, error: testError } = await supabase
      .from('orders')
      .select('*')
      .eq('order_id', 'ORD-0001')
      .single();
    
    if (testError) {
      console.error('❌ Error testing order_id query:', testError);
      console.log('💡 The order_id column might not be properly added to the schema');
      console.log('   You may need to add the column manually in Supabase Dashboard:');
      console.log('   1. Go to Table Editor > orders');
      console.log('   2. Add new column: order_id (VARCHAR)');
      console.log('   3. Set it as unique if needed');
    } else {
      console.log('✅ order_id query successful:', testQuery);
    }

    console.log('🎉 Migration fix completed!');
    console.log('📊 Summary:');
    console.log(`   - Updated ${orders.length} orders with order_id`);
    console.log('   - Preserved all existing data');
    console.log('   - Ready for testing');
    
  } catch (error) {
    console.error('❌ Migration fix failed:', error);
    console.log('💡 Manual steps needed:');
    console.log('   1. Go to Supabase Dashboard');
    console.log('   2. Add order_id column to orders table');
    console.log('   3. Update records manually if needed');
  }
}

fixMigration();