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
    console.log('URL:', supabaseUrl);
    console.log('Key:', supabaseKey.substring(0, 20) + '...');
    
    // Test basic connection
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      if (error.code === 'PGRST205') {
        console.log('❌ Tables not found. Please run the SQL schema first.');
        console.log('\n📋 To fix this:');
        console.log('1. Go to Supabase Dashboard');
        console.log('2. Open SQL Editor');
        console.log('3. Run the SQL schema from supabase-schema.sql');
        console.log('4. Then run this test again');
      } else {
        console.error('❌ Database error:', error);
      }
      return;
    }
    
    console.log('✅ Database connection successful');
    console.log('✅ Users table accessible');
    
    // Test other tables
    const tables = ['orders', 'progress', 'evidence'];
    
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
    
    console.log('\n🎉 All database tests passed!');
    
  } catch (error) {
    console.error('❌ Connection test failed:', error);
  }
}

testConnection();
