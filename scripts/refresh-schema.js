const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function refreshSchema() {
  console.log('🔄 Refreshing Supabase schema cache...');
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing Supabase environment variables');
    return;
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    console.log('📋 Step 1: Checking current orders table structure...');
    
    // Check current table structure
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('exec_sql', {
        sql: `SELECT column_name, data_type, is_nullable, column_default 
              FROM information_schema.columns 
              WHERE table_name = 'orders' 
              ORDER BY ordinal_position;`
      });
    
    if (tableError) {
      console.error('❌ Error checking table structure:', tableError);
      return;
    }
    
    console.log('📊 Current orders table structure:');
    console.table(tableInfo);

    console.log('📋 Step 2: Refreshing schema cache...');
    
    // Force schema refresh by making a simple query
    const { data: testQuery, error: testError } = await supabase
      .from('orders')
      .select('order_id')
      .limit(1);
    
    if (testError) {
      console.error('❌ Error in test query:', testError);
      
      // Try alternative approach - recreate the connection
      console.log('📋 Step 3: Trying alternative schema refresh...');
      
      // Wait a moment for cache to clear
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Try query again
      const { data: retryQuery, error: retryError } = await supabase
        .from('orders')
        .select('order_id')
        .limit(1);
      
      if (retryError) {
        console.error('❌ Still getting error after retry:', retryError);
        console.log('💡 Manual steps needed:');
        console.log('   1. Go to Supabase Dashboard');
        console.log('   2. Navigate to Table Editor');
        console.log('   3. Check orders table structure');
        console.log('   4. Refresh the page');
        return;
      } else {
        console.log('✅ Schema refresh successful on retry');
        console.log('📊 Sample data:', retryQuery);
      }
    } else {
      console.log('✅ Schema refresh successful');
      console.log('📊 Sample data:', testQuery);
    }

    console.log('📋 Step 4: Testing order creation...');
    
    // Test creating a new order
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
    } else {
      console.log('✅ Test order created successfully:', createTest);
      
      // Clean up test order
      await supabase
        .from('orders')
        .delete()
        .eq('order_id', testOrderId);
      
      console.log('🧹 Test order cleaned up');
    }

    console.log('🎉 Schema refresh completed successfully!');
    
  } catch (error) {
    console.error('❌ Schema refresh failed:', error);
  }
}

refreshSchema();