const fs = require('fs');
const path = require('path');

function setupEnvironment() {
  try {
    console.log('Setting up environment file...');
    
    const envExamplePath = path.join(process.cwd(), 'env.example');
    const envLocalPath = path.join(process.cwd(), '.env.local');
    
    // Check if env.example exists
    if (!fs.existsSync(envExamplePath)) {
      console.error('❌ env.example file not found');
      return;
    }
    
    // Check if .env.local already exists
    if (fs.existsSync(envLocalPath)) {
      console.log('⚠️ .env.local already exists');
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      rl.question('Do you want to overwrite it? (y/N): ', (answer) => {
        if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
          copyEnvFile();
        } else {
          console.log('Environment setup cancelled');
        }
        rl.close();
      });
    } else {
      copyEnvFile();
    }
    
    function copyEnvFile() {
      try {
        const envContent = fs.readFileSync(envExamplePath, 'utf8');
        fs.writeFileSync(envLocalPath, envContent);
        console.log('✅ .env.local created successfully');
        console.log('📝 Please review and update the values if needed');
      } catch (error) {
        console.error('❌ Error creating .env.local:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  }
}

function checkEnvironment() {
  try {
    console.log('Checking environment variables...');
    
    require('dotenv').config({ path: '.env.local' });
    
    const requiredVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'TELEGRAM_BOT_TOKEN',
      'TELEGRAM_WEBHOOK_URL'
    ];
    
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length === 0) {
      console.log('✅ All required environment variables are set');
      console.log('📋 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
      console.log('🤖 Bot Token:', process.env.TELEGRAM_BOT_TOKEN ? 'Set' : 'Missing');
      console.log('🔗 Webhook URL:', process.env.TELEGRAM_WEBHOOK_URL);
    } else {
      console.log('❌ Missing environment variables:');
      missingVars.forEach(varName => {
        console.log(`   - ${varName}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Environment check failed:', error.message);
  }
}

// Command line interface
const command = process.argv[2];

switch (command) {
  case 'setup':
    setupEnvironment();
    break;
  case 'check':
    checkEnvironment();
    break;
  default:
    console.log('Usage: node scripts/setup-env.js [setup|check]');
    console.log('  setup - Create .env.local from env.example');
    console.log('  check - Check if environment variables are set');
}
