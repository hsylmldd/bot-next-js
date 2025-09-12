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

async function checkSchema() {
  try {
    console.log('Checking database schema...');
    
    // Check if we can access the database at all
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (error) {
      console.error('❌ Cannot access information_schema:', error);
      return;
    }
    
    console.log('✅ Can access database');
    console.log('📋 Tables found in public schema:');
    
    if (data && data.length > 0) {
      data.forEach(table => {
        console.log(`   - ${table.table_name}`);
      });
    } else {
      console.log('   No tables found');
    }
    
    // Check specific tables
    const expectedTables = ['users', 'orders', 'progress', 'evidence'];
    
    console.log('\n🔍 Checking expected tables:');
    for (const tableName of expectedTables) {
      const { data, error } = await supabase
        .from(tableName)
        .select('count')
        .limit(1);
      
      if (error) {
        console.log(`   ❌ ${tableName}: ${error.message}`);
      } else {
        console.log(`   ✅ ${tableName}: accessible`);
      }
    }
    
    // Check storage buckets
    console.log('\n📦 Checking storage buckets:');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.log(`   ❌ Storage error: ${bucketsError.message}`);
    } else {
      console.log('   ✅ Storage accessible');
      if (buckets && buckets.length > 0) {
        buckets.forEach(bucket => {
          console.log(`   - ${bucket.id} (${bucket.public ? 'public' : 'private'})`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Schema check failed:', error);
  }
}

checkSchema();
