const fs = require('fs');
const path = require('path');

function debugEnvironment() {
  console.log('🔍 Debugging environment variables...\n');
  
  // Check if .env.local exists
  const envLocalPath = path.join(process.cwd(), '.env.local');
  const envExamplePath = path.join(process.cwd(), 'env.example');
  
  console.log('📁 File checks:');
  console.log(`   .env.local exists: ${fs.existsSync(envLocalPath) ? '✅' : '❌'}`);
  console.log(`   env.example exists: ${fs.existsSync(envExamplePath) ? '✅' : '❌'}`);
  
  if (fs.existsSync(envLocalPath)) {
    console.log('\n📋 .env.local content:');
    const envContent = fs.readFileSync(envLocalPath, 'utf8');
    const lines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
    
    lines.forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        const displayValue = value.length > 20 ? value.substring(0, 20) + '...' : value;
        console.log(`   ${key}: ${displayValue}`);
      }
    });
  }
  
  // Test dotenv loading
  console.log('\n🔧 Testing dotenv loading:');
  try {
    require('dotenv').config({ path: '.env.local' });
    
    const requiredVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'TELEGRAM_BOT_TOKEN',
      'TELEGRAM_WEBHOOK_URL'
    ];
    
    requiredVars.forEach(varName => {
      const value = process.env[varName];
      const status = value ? '✅' : '❌';
      const displayValue = value ? (value.length > 20 ? value.substring(0, 20) + '...' : value) : 'Not set';
      console.log(`   ${varName}: ${status} ${displayValue}`);
    });
    
  } catch (error) {
    console.error('❌ Error loading environment:', error.message);
  }
  
  // Check current working directory
  console.log('\n📂 Current working directory:');
  console.log(`   ${process.cwd()}`);
  
  // Check if we're in the right directory
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  console.log(`   package.json exists: ${fs.existsSync(packageJsonPath) ? '✅' : '❌'}`);
  
  console.log('\n💡 Troubleshooting tips:');
  console.log('1. Make sure you\'re in the project root directory');
  console.log('2. Run: npm run setup:env');
  console.log('3. Check if .env.local has correct values');
  console.log('4. Verify Supabase project is active');
}

debugEnvironment();
