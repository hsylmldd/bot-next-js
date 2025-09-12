const { exec } = require('child_process');
const path = require('path');

function runCommand(command, description) {
  return new Promise((resolve, reject) => {
    console.log(`\n🔄 ${description}...`);
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ ${description} failed:`, error.message);
        reject(error);
      } else {
        console.log(`✅ ${description} completed`);
        if (stdout) console.log(stdout);
        resolve(stdout);
      }
    });
  });
}

async function fixSetup() {
  console.log('🔧 Fixing setup issues...\n');
  
  try {
    // 1. Check environment first
    console.log('📋 Checking environment variables...');
    await runCommand(
      'npm run check:env',
      'Environment validation'
    );
    
    // 2. Test database connection
    await runCommand(
      'npm run test:db',
      'Database connection test'
    );
    
    // 3. Setup storage bucket
    await runCommand(
      'npm run setup:storage',
      'Storage bucket setup'
    );
    
    // 4. Create sample data
    await runCommand(
      'npm run setup:sample',
      'Sample data creation'
    );
    
    // 5. Setup bot webhook
    await runCommand(
      'npm run setup:bot',
      'Bot webhook setup'
    );
    
    console.log('\n🎉 Setup fixed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Start development server: npm run dev');
    console.log('2. Initialize services: curl http://localhost:3000/api/init');
    console.log('3. Test bot with /start command');
    
  } catch (error) {
    console.error('\n❌ Setup failed. Please check the errors above.');
    console.log('\n🔧 Manual troubleshooting:');
    console.log('1. Check if .env.local exists and has correct values');
    console.log('2. Verify Supabase project is active');
    console.log('3. Run SQL schema in Supabase dashboard');
    console.log('4. Check Telegram bot token');
  }
}

// Check if we're in the right directory
const packageJsonPath = path.join(process.cwd(), 'package.json');
const fs = require('fs');

if (!fs.existsSync(packageJsonPath)) {
  console.error('❌ Please run this script from the project root directory');
  process.exit(1);
}

fixSetup();
