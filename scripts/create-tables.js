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

async function createTables() {
  try {
    console.log('Creating database tables...');
    
    // Create users table
    console.log('Creating users table...');
    const { error: usersError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS users (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          telegram_id VARCHAR(255) UNIQUE NOT NULL,
          role VARCHAR(20) CHECK (role IN ('HD', 'Teknisi')) NOT NULL,
          name VARCHAR(255) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (usersError) {
      console.error('Error creating users table:', usersError);
    } else {
      console.log('✅ Users table created');
    }
    
    // Create orders table
    console.log('Creating orders table...');
    const { error: ordersError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS orders (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          customer_name VARCHAR(255) NOT NULL,
          customer_address TEXT NOT NULL,
          contact VARCHAR(255) NOT NULL,
          assigned_technician UUID REFERENCES users(id) ON DELETE SET NULL,
          status VARCHAR(20) CHECK (status IN ('Pending', 'In Progress', 'On Hold', 'Completed', 'Closed')) DEFAULT 'Pending',
          sod_time TIMESTAMP WITH TIME ZONE,
          e2e_time TIMESTAMP WITH TIME ZONE,
          lme_pt2_start TIMESTAMP WITH TIME ZONE,
          lme_pt2_end TIMESTAMP WITH TIME ZONE,
          sla_deadline TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (ordersError) {
      console.error('Error creating orders table:', ordersError);
    } else {
      console.log('✅ Orders table created');
    }
    
    // Create progress table
    console.log('Creating progress table...');
    const { error: progressError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS progress (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
          stage VARCHAR(20) CHECK (stage IN ('Survey', 'Penarikan', 'P2P', 'Instalasi', 'Catatan')) NOT NULL,
          status VARCHAR(20) CHECK (status IN ('Ready', 'Not Ready', 'Selesai')) NOT NULL,
          note TEXT,
          timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (progressError) {
      console.error('Error creating progress table:', progressError);
    } else {
      console.log('✅ Progress table created');
    }
    
    // Create evidence table
    console.log('Creating evidence table...');
    const { error: evidenceError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS evidence (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
          odp_name VARCHAR(255),
          ont_sn VARCHAR(255),
          photo_sn_ont TEXT,
          photo_technician_customer TEXT,
          photo_customer_house TEXT,
          photo_odp_front TEXT,
          photo_odp_inside TEXT,
          photo_label_dc TEXT,
          photo_test_result TEXT,
          uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (evidenceError) {
      console.error('Error creating evidence table:', evidenceError);
    } else {
      console.log('✅ Evidence table created');
    }
    
    console.log('\n🎉 All tables created successfully!');
    
    // Test the tables
    console.log('\nTesting table access...');
    const { data: users, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Error testing tables:', testError);
    } else {
      console.log('✅ Tables are accessible');
    }
    
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    console.log('\n💡 Alternative: Run the SQL schema manually in Supabase Dashboard');
  }
}

createTables();
