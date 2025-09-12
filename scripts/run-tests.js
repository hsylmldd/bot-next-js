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

async function runAllTests() {
  console.log('🚀 Starting comprehensive test suite...\n');
  
  try {
    // Test database connection
    await runCommand(
      'node scripts/test-db.js test',
      'Database connection test'
    );
    
    // Test bot functionality
    await runCommand(
      'node scripts/test-bot.js bot',
      'Bot functionality test'
    );
    
    // Test webhook endpoint
    await runCommand(
      'node scripts/test-bot.js webhook',
      'Webhook endpoint test'
    );
    
    // Test API endpoints
    await runCommand(
      'node scripts/test-bot.js api',
      'API endpoints test'
    );
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Setup webhook: node scripts/setup-bot.js setup');
    console.log('2. Initialize services: curl https://your-domain.com/api/init');
    console.log('3. Test bot with /start command');
    
  } catch (error) {
    console.error('\n❌ Some tests failed. Please check the errors above.');
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

runAllTests();
