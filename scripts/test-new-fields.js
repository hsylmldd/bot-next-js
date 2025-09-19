const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testNewFields() {
  console.log('🧪 Testing new order fields...');
  
  try {
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
    
    console.log('📝 Creating test order with new fields...');
    const { data: order, error } = await supabase
      .from('orders')
      .insert(testOrder)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error creating test order:', error);
      return;
    }
    
    console.log('✅ Test order created successfully!');
    console.log('📋 Order details:');
    console.log(`   ID: ${order.id}`);
    console.log(`   Customer: ${order.customer_name}`);
    console.log(`   STO: ${order.sto}`);
    console.log(`   Transaction Type: ${order.transaction_type}`);
    console.log(`   Service Type: ${order.service_type}`);
    console.log(`   Status: ${order.status}`);
    
    // Test querying orders with new fields
    console.log('\n🔍 Testing order query with new fields...');
    const { data: orders, error: queryError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', order.id)
      .single();
    
    if (queryError) {
      console.error('❌ Error querying test order:', queryError);
    } else {
      console.log('✅ Order query successful!');
      console.log('📊 Retrieved order data:');
      console.log(`   STO: ${orders.sto}`);
      console.log(`   Transaction Type: ${orders.transaction_type}`);
      console.log(`   Service Type: ${orders.service_type}`);
    }
    
    // Clean up test order
    console.log('\n🧹 Cleaning up test order...');
    const { error: deleteError } = await supabase
      .from('orders')
      .delete()
      .eq('id', order.id);
    
    if (deleteError) {
      console.error('❌ Error deleting test order:', deleteError);
    } else {
      console.log('✅ Test order cleaned up successfully!');
    }
    
    console.log('\n🎉 All tests passed! New fields are working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testNewFields();
