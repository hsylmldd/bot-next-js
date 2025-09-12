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

async function setupDatabase() {
  try {
    console.log('Setting up database tables...');
    
    // Check if tables exist
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (usersError && usersError.code === 'PGRST205') {
      console.log('❌ Database tables not found. Please run the SQL schema first.');
      console.log('\n📋 Steps to fix:');
      console.log('1. Go to your Supabase dashboard');
      console.log('2. Open SQL Editor');
      console.log('3. Copy and paste the content from supabase-schema.sql');
      console.log('4. Run the SQL script');
      console.log('5. Come back and run this script again');
      return;
    }
    
    if (usersError) {
      console.error('Error checking users table:', usersError);
      return;
    }
    
    console.log('✅ Database tables exist');
    
    // Test all tables
    const tables = ['users', 'orders', 'progress', 'evidence'];
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('count')
        .limit(1);
      
      if (error) {
        console.error(`❌ Error accessing ${table} table:`, error);
      } else {
        console.log(`✅ ${table} table accessible`);
      }
    }
    
    console.log('\n🎉 Database setup completed successfully!');
    
  } catch (error) {
    console.error('Database setup failed:', error);
  }
}

async function createSampleData() {
  try {
    console.log('Creating sample data...');
    
    // Check if sample data already exists
    const { data: existingUsers } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (existingUsers && existingUsers.length > 0) {
      console.log('✅ Sample data already exists');
      return;
    }
    
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
  case 'setup':
    setupDatabase();
    break;
  case 'sample':
    createSampleData();
    break;
  default:
    console.log('Usage: node scripts/setup-database.js [setup|sample]');
    console.log('  setup  - Check database tables and setup');
    console.log('  sample - Create sample data');
}
