const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testConnection() {
  try {
    console.log('Testing Supabase connection...');
    
    // Test users table
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(5);
    
    if (usersError) {
      console.error('Error querying users:', usersError);
      return;
    }
    
    console.log('✅ Users table accessible');
    console.log('Users found:', users?.length || 0);
    
    // Test orders table
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .limit(5);
    
    if (ordersError) {
      console.error('Error querying orders:', ordersError);
      return;
    }
    
    console.log('✅ Orders table accessible');
    console.log('Orders found:', orders?.length || 0);
    
    // Test progress table
    const { data: progress, error: progressError } = await supabase
      .from('progress')
      .select('*')
      .limit(5);
    
    if (progressError) {
      console.error('Error querying progress:', progressError);
      return;
    }
    
    console.log('✅ Progress table accessible');
    console.log('Progress records found:', progress?.length || 0);
    
    // Test evidence table
    const { data: evidence, error: evidenceError } = await supabase
      .from('evidence')
      .select('*')
      .limit(5);
    
    if (evidenceError) {
      console.error('Error querying evidence:', evidenceError);
      return;
    }
    
    console.log('✅ Evidence table accessible');
    console.log('Evidence records found:', evidence?.length || 0);
    
    console.log('\n🎉 All database tests passed!');
    
  } catch (error) {
    console.error('Database test failed:', error);
  }
}

async function createSampleData() {
  try {
    console.log('Creating sample data...');
    
    // Create sample users
    const { data: hdUser, error: hdError } = await supabase
      .from('users')
      .insert({
        telegram_id: '123456789',
        name: 'Admin Helpdesk',
        role: 'HD'
      })
      .select()
      .single();
    
    if (hdError) {
      console.error('Error creating HD user:', hdError);
      return;
    }
    
    const { data: techUser, error: techError } = await supabase
      .from('users')
      .insert({
        telegram_id: '987654321',
        name: 'Teknisi 1',
        role: 'Teknisi'
      })
      .select()
      .single();
    
    if (techError) {
      console.error('Error creating Teknisi user:', techError);
      return;
    }
    
    console.log('✅ Sample users created');
    console.log('HD User ID:', hdUser.id);
    console.log('Teknisi User ID:', techUser.id);
    
    // Create sample order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_name: 'John Doe',
        customer_address: 'Jl. Contoh No. 123, Jakarta',
        contact: '081234567890',
        assigned_technician: techUser.id,
        status: 'Pending'
      })
      .select()
      .single();
    
    if (orderError) {
      console.error('Error creating order:', orderError);
      return;
    }
    
    console.log('✅ Sample order created');
    console.log('Order ID:', order.id);
    
    console.log('\n🎉 Sample data created successfully!');
    
  } catch (error) {
    console.error('Error creating sample data:', error);
  }
}

// Command line interface
const command = process.argv[2];

switch (command) {
  case 'test':
    testConnection();
    break;
  case 'sample':
    createSampleData();
    break;
  default:
    console.log('Usage: node scripts/test-db.js [test|sample]');
    console.log('  test   - Test database connection and tables');
    console.log('  sample - Create sample data for testing');
}
