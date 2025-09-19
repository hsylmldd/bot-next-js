const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkOrdersTable() {
  console.log('🔍 Checking orders table...');
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing Supabase environment variables');
    return;
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    console.log('📋 Step 1: Testing simple select query...');
    
    // Test simple select
    const { data: selectTest, error: selectError } = await supabase
      .from('orders')
      .select('*')
      .limit(1);
    
    if (selectError) {
      console.error('❌ Error in select query:', selectError);
      console.log('💡 This suggests the orders table structure has issues');
      
      // Try to get any data from orders table
      console.log('📋 Step 2: Trying to get table info differently...');
      
      const { data: anyData, error: anyError } = await supabase
        .from('orders')
        .select()
        .limit(1);
      
      if (anyError) {
        console.error('❌ Cannot access orders table at all:', anyError);
        console.log('🔧 Possible solutions:');
        console.log('   1. Check if orders table exists in Supabase Dashboard');
        console.log('   2. Verify table permissions');
        console.log('   3. Re-run migration script');
      } else {
        console.log('✅ Can access orders table:', anyData);
      }
    } else {
      console.log('✅ Select query successful:', selectTest);
    }

    console.log('📋 Step 3: Testing insert with order_id...');
    
    // Test creating a new order with order_id
    const testOrderId = `TEST-${Date.now()}`;
    const { data: insertTest, error: insertError } = await supabase
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
    
    if (insertError) {
      console.error('❌ Error inserting test order:', insertError);
      
      // Try with minimal data
      console.log('📋 Step 4: Trying minimal insert...');
      const { data: minimalTest, error: minimalError } = await supabase
        .from('orders')
        .insert({
          order_id: `MIN-${Date.now()}`,
          customer_name: 'Test',
          customer_address: 'Test'
        })
        .select();
      
      if (minimalError) {
        console.error('❌ Even minimal insert failed:', minimalError);
      } else {
        console.log('✅ Minimal insert successful:', minimalTest);
        
        // Clean up
        await supabase
          .from('orders')
          .delete()
          .eq('order_id', `MIN-${Date.now()}`);
      }
    } else {
      console.log('✅ Insert test successful:', insertTest);
      
      // Clean up test order
      await supabase
        .from('orders')
        .delete()
        .eq('order_id', testOrderId);
      
      console.log('🧹 Test order cleaned up');
    }

    console.log('🎉 Orders table check completed!');
    
  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

checkOrdersTable();