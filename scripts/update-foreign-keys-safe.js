const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function updateForeignKeys() {
  console.log('🔧 Updating foreign key relationships...');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    console.log('📋 Step 1: Checking current data...');
    
    // Check orders table structure
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, order_id, customer_name')
      .limit(5);
    
    if (ordersError) {
      console.error('❌ Error checking orders:', ordersError);
      return;
    }
    
    console.log('✅ Orders table accessible');
    console.log('Sample orders:', orders);
    
    // Check progress table
    const { data: progress, error: progressError } = await supabase
      .from('progress')
      .select('id, order_id, stage, status')
      .limit(5);
    
    if (progressError) {
      console.error('❌ Error checking progress:', progressError);
      return;
    }
    
    console.log('✅ Progress table accessible');
    console.log('Sample progress:', progress);
    
    // Check evidence table
    const { data: evidence, error: evidenceError } = await supabase
      .from('evidence')
      .select('id, order_id, odp_name')
      .limit(5);
    
    if (evidenceError) {
      console.error('❌ Error checking evidence:', evidenceError);
      return;
    }
    
    console.log('✅ Evidence table accessible');
    console.log('Sample evidence:', evidence);

    console.log('📋 Step 2: Mapping order IDs...');
    
    // Get all orders to create mapping
    const { data: allOrders, error: allOrdersError } = await supabase
      .from('orders')
      .select('id, order_id');
    
    if (allOrdersError) {
      console.error('❌ Error getting all orders:', allOrdersError);
      return;
    }
    
    // Create mapping from UUID id to order_id
    const orderMapping = {};
    allOrders.forEach(order => {
      orderMapping[order.id] = order.order_id;
    });
    
    console.log(`📊 Created mapping for ${allOrders.length} orders`);

    console.log('📋 Step 3: Updating progress records...');
    
    // Get all progress records
    const { data: allProgress, error: allProgressError } = await supabase
      .from('progress')
      .select('*');
    
    if (allProgressError) {
      console.error('❌ Error getting progress records:', allProgressError);
      return;
    }
    
    console.log(`📊 Found ${allProgress.length} progress records to update`);
    
    // Update each progress record
    for (let i = 0; i < allProgress.length; i++) {
      const progressRecord = allProgress[i];
      const newOrderId = orderMapping[progressRecord.order_id];
      
      if (newOrderId) {
        const { error: updateError } = await supabase
          .from('progress')
          .update({ order_id: newOrderId })
          .eq('id', progressRecord.id);
        
        if (updateError) {
          console.error(`❌ Error updating progress ${i + 1}:`, updateError);
        } else {
          console.log(`✅ Updated progress ${i + 1}/${allProgress.length}: ${progressRecord.order_id} -> ${newOrderId}`);
        }
      } else {
        console.log(`⚠️  No mapping found for progress record ${i + 1}: ${progressRecord.order_id}`);
      }
    }

    console.log('📋 Step 4: Updating evidence records...');
    
    // Get all evidence records
    const { data: allEvidence, error: allEvidenceError } = await supabase
      .from('evidence')
      .select('*');
    
    if (allEvidenceError) {
      console.error('❌ Error getting evidence records:', allEvidenceError);
      return;
    }
    
    console.log(`📊 Found ${allEvidence.length} evidence records to update`);
    
    // Update each evidence record
    for (let i = 0; i < allEvidence.length; i++) {
      const evidenceRecord = allEvidence[i];
      const newOrderId = orderMapping[evidenceRecord.order_id];
      
      if (newOrderId) {
        const { error: updateError } = await supabase
          .from('evidence')
          .update({ order_id: newOrderId })
          .eq('id', evidenceRecord.id);
        
        if (updateError) {
          console.error(`❌ Error updating evidence ${i + 1}:`, updateError);
        } else {
          console.log(`✅ Updated evidence ${i + 1}/${allEvidence.length}: ${evidenceRecord.order_id} -> ${newOrderId}`);
        }
      } else {
        console.log(`⚠️  No mapping found for evidence record ${i + 1}: ${evidenceRecord.order_id}`);
      }
    }

    console.log('📋 Step 5: Testing relationships...');
    
    // Test join between orders and progress
    const { data: testProgress, error: testProgressError } = await supabase
      .from('progress')
      .select(`
        order_id,
        stage,
        status,
        orders!inner(order_id, customer_name)
      `)
      .limit(3);
    
    if (testProgressError) {
      console.error('❌ Error testing progress join:', testProgressError);
      console.log('💡 Foreign key constraints might need to be updated manually');
    } else {
      console.log('✅ Progress join test successful:', testProgress);
    }
    
    // Test join between orders and evidence
    const { data: testEvidence, error: testEvidenceError } = await supabase
      .from('evidence')
      .select(`
        order_id,
        odp_name,
        orders!inner(order_id, customer_name)
      `)
      .limit(3);
    
    if (testEvidenceError) {
      console.error('❌ Error testing evidence join:', testEvidenceError);
      console.log('💡 Foreign key constraints might need to be updated manually');
    } else {
      console.log('✅ Evidence join test successful:', testEvidence);
    }

    console.log('🎉 Foreign key update process completed!');
    console.log('📝 Next steps:');
    console.log('   1. Run the SQL script update-foreign-keys.sql in Supabase Dashboard');
    console.log('   2. Update foreign key constraints manually');
    console.log('   3. Test bot functionality');
    
  } catch (error) {
    console.error('❌ Process failed:', error);
    console.log('💡 Please run the SQL script manually instead');
  }
}

updateForeignKeys();