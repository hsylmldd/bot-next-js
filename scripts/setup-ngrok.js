const { exec } = require('child_process');
const fs = require('fs');
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

async function setupNgrok() {
  try {
    console.log('🚀 Setting up ngrok for webhook development...\n');
    
    // Check if ngrok is installed
    try {
      await runCommand('ngrok version', 'Checking ngrok installation');
    } catch (error) {
      console.log('❌ ngrok is not installed');
      console.log('\n📋 To install ngrok:');
      console.log('1. Download from: https://ngrok.com/download');
      console.log('2. Or install via npm: npm install -g ngrok');
      console.log('3. Or install via chocolatey: choco install ngrok');
      console.log('4. Or install via brew: brew install ngrok');
      return;
    }
    
    // Start ngrok tunnel
    console.log('\n🌐 Starting ngrok tunnel on port 3000...');
    console.log('⚠️  Keep this terminal open to maintain the tunnel');
    
    const ngrokProcess = exec('ngrok http 3000', (error, stdout, stderr) => {
      if (error) {
        console.error('❌ ngrok failed:', error.message);
      }
    });
    
    ngrokProcess.stdout.on('data', (data) => {
      console.log(data);
      
      // Extract ngrok URL from output
      const urlMatch = data.match(/https:\/\/[a-z0-9-]+\.ngrok\.io/);
      if (urlMatch) {
        const ngrokUrl = urlMatch[0];
        console.log(`\n🎉 ngrok tunnel established: ${ngrokUrl}`);
        console.log(`\n📋 Next steps:`);
        console.log(`1. Update TELEGRAM_WEBHOOK_URL in .env.local to: ${ngrokUrl}`);
        console.log(`2. Run: npm run setup:bot`);
        console.log(`3. Start your Next.js server: npm run dev`);
        console.log(`4. Test your bot!`);
        
        // Update .env.local file
        updateEnvFile(ngrokUrl);
      }
    });
    
    ngrokProcess.stderr.on('data', (data) => {
      console.error('ngrok error:', data);
    });
    
    // Handle cleanup
    process.on('SIGINT', () => {
      console.log('\n🛑 Stopping ngrok tunnel...');
      ngrokProcess.kill();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ ngrok setup failed:', error.message);
  }
}

function updateEnvFile(ngrokUrl) {
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, 'utf8');
      
      // Update TELEGRAM_WEBHOOK_URL
      envContent = envContent.replace(
        /TELEGRAM_WEBHOOK_URL=.*/,
        `TELEGRAM_WEBHOOK_URL=${ngrokUrl}`
      );
      
      fs.writeFileSync(envPath, envContent);
      console.log(`\n✅ Updated .env.local with ngrok URL`);
    }
  } catch (error) {
    console.error('❌ Failed to update .env.local:', error.message);
  }
}

// Command line interface
const command = process.argv[2];

switch (command) {
  case 'start':
    setupNgrok();
    break;
  default:
    console.log('Usage: node scripts/setup-ngrok.js start');
    console.log('  start - Start ngrok tunnel for webhook development');
    console.log('\nNote: This requires ngrok to be installed');
    console.log('Download from: https://ngrok.com/download');
}
