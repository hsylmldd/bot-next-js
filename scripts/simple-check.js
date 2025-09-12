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

async function simpleCheck() {
  try {
    console.log('🔍 Simple database check...');
    console.log('URL:', supabaseUrl);
    console.log('Key:', supabaseKey.substring(0, 20) + '...');
    
    // Try to access each table directly
    const tables = ['users', 'orders', 'progress', 'evidence'];
    
    for (const table of tables) {
      console.log(`\n📋 Checking ${table} table...`);
      
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`   ❌ ${table}: ${error.message}`);
      } else {
        console.log(`   ✅ ${table}: accessible (${data ? data.length : 0} records)`);
      }
    }
    
    // Check storage
    console.log('\n📦 Checking storage...');
    try {
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
    } catch (storageError) {
      console.log(`   ❌ Storage error: ${storageError.message}`);
    }
    
  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

simpleCheck();
