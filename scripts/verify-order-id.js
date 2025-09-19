const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function verifyOrderId() {
  console.log('🔍 Verifying order_id column...');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    console.log('📋 Step 1: Testing select with order_id...');
    
    const { data: selectTest, error: selectError } = await supabase
      .from('orders')
      .select('order_id, customer_name, created_at')
      .limit(5);
    
    if (selectError) {
      console.error('❌ Error selecting order_id:', selectError);
      return;
    }
    
    console.log('✅ Select successful:');
    console.table(selectTest);

    console.log('📋 Step 2: Testing insert with order_id...');
    
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
      console.error('❌ Error inserting with order_id:', insertError);
    } else {
      console.log('✅ Insert successful:', insertTest);
      
      // Clean up test record
      await supabase
        .from('orders')
        .delete()
        .eq('order_id', testOrderId);
      
      console.log('🧹 Test record cleaned up');
    }

    console.log('📋 Step 3: Testing query by order_id...');
    
    const { data: queryTest, error: queryError } = await supabase
      .from('orders')
      .select('*')
      .eq('order_id', selectTest[0]?.order_id)
      .single();
    
    if (queryError) {
      console.error('❌ Error querying by order_id:', queryError);
    } else {
      console.log('✅ Query by order_id successful:', queryTest.customer_name);
    }

    console.log('🎉 order_id column verification completed!');
    console.log('💡 Bot should now work properly for creating new orders');
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

verifyOrderId();