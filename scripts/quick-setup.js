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

async function quickSetup() {
  console.log('🚀 Starting quick setup for Telegram Order Bot...\n');
  
  try {
    // 1. Setup environment
    await runCommand(
      'npm run setup:env',
      'Environment setup'
    );
    
    // 2. Check environment
    await runCommand(
      'npm run check:env',
      'Environment validation'
    );
    
    // 3. Test database connection
    await runCommand(
      'npm run test:db',
      'Database connection test'
    );
    
    // 4. Setup storage bucket
    await runCommand(
      'npm run setup:storage',
      'Storage bucket setup'
    );
    
    // 5. Create sample data
    await runCommand(
      'npm run setup:sample',
      'Sample data creation'
    );
    
    // 6. Setup bot webhook
    await runCommand(
      'npm run setup:bot',
      'Bot webhook setup'
    );
    
    console.log('\n🎉 Quick setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Start development server: npm run dev');
    console.log('2. Initialize services: curl http://localhost:3000/api/init');
    console.log('3. Test bot with /start command');
    console.log('4. Access admin dashboard: http://localhost:3000');
    
  } catch (error) {
    console.error('\n❌ Quick setup failed. Please check the errors above.');
    console.log('\n🔧 Manual setup steps:');
    console.log('1. Copy env.example to .env.local');
    console.log('2. Update environment variables');
    console.log('3. Run individual setup commands');
    process.exit(1);
  }
}

// Check if we're in the right directory
const packageJsonPath = path.join(process.cwd(), 'package.json');
const fs = require('fs');

if (!fs.existsSync(packageJsonPath)) {
  console.error('❌ Please run this script from the project root directory');
  process.exit(1);
}

quickSetup();
