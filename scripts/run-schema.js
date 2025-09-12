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

async function runSchema() {
  try {
    console.log('Running database schema...');
    
    // Check if tables exist first
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (!usersError) {
      console.log('✅ Database tables already exist');
      return;
    }
    
    if (usersError.code !== 'PGRST205') {
      console.error('Unexpected error:', usersError);
      return;
    }
    
    console.log('❌ Tables not found. Please run the SQL schema manually.');
    console.log('\n📋 Manual steps:');
    console.log('1. Go to Supabase Dashboard');
    console.log('2. Open SQL Editor');
    console.log('3. Copy the content from supabase-schema.sql');
    console.log('4. Run the SQL script');
    console.log('5. Come back and run: npm run setup:db');
    
    console.log('\n📄 SQL Schema to run:');
    console.log('=====================================');
    
    const fs = require('fs');
    const schemaPath = require('path').join(process.cwd(), 'supabase-schema.sql');
    
    if (fs.existsSync(schemaPath)) {
      const schemaContent = fs.readFileSync(schemaPath, 'utf8');
      console.log(schemaContent);
    } else {
      console.log('supabase-schema.sql file not found');
    }
    
  } catch (error) {
    console.error('Schema setup failed:', error);
  }
}

runSchema();
