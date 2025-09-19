const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function addOrderIdSafe() {
  console.log('🔧 Adding order_id column safely...');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    console.log('📋 Step 1: Getting all existing orders...');
    
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, customer_name, created_at')
      .order('created_at');
    
    if (ordersError) {
      console.error('❌ Error getting orders:', ordersError);
      return;
    }
    
    console.log(`📊 Found ${orders.length} orders to process`);

    console.log('📋 Step 2: Adding order_id values to existing records...');
    
    // Update each record individually to add order_id
    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];
      const orderIdValue = `ORD-${String(i + 1).padStart(4, '0')}`;
      
      // Add order_id to the record by updating it
      const { error: updateError } = await supabase
        .from('orders')
        .update({ order_id: orderIdValue })
        .eq('id', order.id);
      
      if (updateError) {
        console.error(`❌ Error updating order ${i + 1}:`, updateError);
        
        // If update fails, it might be because the column doesn't exist
        // Let's try a different approach
        console.log('💡 Trying alternative approach...');
        break;
      } else {
        console.log(`✅ Updated ${i + 1}/${orders.length}: ${order.customer_name} -> ${orderIdValue}`);
      }
    }

    console.log('📋 Step 3: Testing order_id functionality...');
    
    // Test if we can query by order_id
    const { data: testQuery, error: testError } = await supabase
      .from('orders')
      .select('order_id, customer_name')
      .eq('order_id', 'ORD-0001')
      .single();
    
    if (testError) {
      console.error('❌ Error testing order_id:', testError);
      console.log('💡 The order_id column might not exist yet');
      console.log('🔧 Please run the SQL script manually in Supabase Dashboard');
    } else {
      console.log('✅ order_id test successful:', testQuery);
    }

    console.log('📋 Step 4: Testing new order creation...');
    
    const testOrderId = `TEST-${Date.now()}`;
    const { data: createTest, error: createError } = await supabase
      .from('orders')
      .insert({
        order_id: testOrderId,
        customer_name: 'Test Customer',
        customer_address: 'Test Address',
        sto: 'TEST',
        transaction_type: 'Test',
        service_type: 'Test'
      })
      .select();
    
    if (createError) {
      console.error('❌ Error creating test order:', createError);
      console.log('💡 Bot will still have issues creating new orders');
    } else {
      console.log('✅ Test order creation successful:', createTest);
      
      // Clean up
      await supabase
        .from('orders')
        .delete()
        .eq('order_id', testOrderId);
      
      console.log('🧹 Test order cleaned up');
    }

    console.log('🎉 Process completed!');
    
  } catch (error) {
    console.error('❌ Process failed:', error);
    console.log('💡 Please try the manual SQL approach instead');
  }
}

addOrderIdSafe();