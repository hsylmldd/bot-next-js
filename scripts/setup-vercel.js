const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Vercel deployment...');

// Create vercel.json
const vercelConfig = {
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "functions": {
    "app/api/telegram/webhook/route.ts": {
      "maxDuration": 30
    }
  },
  "crons": [
    {
      "path": "/api/cron/bot",
      "schedule": "*/5 * * * *"
    }
  ]
};

fs.writeFileSync('vercel.json', JSON.stringify(vercelConfig, null, 2));
console.log('✅ Created vercel.json');

// Create webhook API route
const webhookRoute = `import { NextRequest, NextResponse } from 'next/server';
import { bot } from '@/lib/telegram';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Process webhook update
    await bot.processUpdate(body);
    
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok' });
}`;

const webhookDir = 'app/api/telegram/webhook';
if (!fs.existsSync(webhookDir)) {
  fs.mkdirSync(webhookDir, { recursive: true });
}

fs.writeFileSync(path.join(webhookDir, 'route.ts'), webhookRoute);
console.log('✅ Created webhook API route');

// Create cron API route
const cronRoute = `import { NextRequest, NextResponse } from 'next/server';
import { bot } from '@/lib/telegram';

export async function GET(request: NextRequest) {
  try {
    // Check if request is from Vercel Cron
    const authHeader = request.headers.get('authorization');
    if (authHeader !== \`Bearer \${process.env.CRON_SECRET}\`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Run bot tasks
    await bot.processUpdates();
    
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Cron error:', error);
    return NextResponse.json({ error: 'Cron failed' }, { status: 500 });
  }
}`;

const cronDir = 'app/api/cron/bot';
if (!fs.existsSync(cronDir)) {
  fs.mkdirSync(cronDir, { recursive: true });
}

fs.writeFileSync(path.join(cronDir, 'route.ts'), cronRoute);
console.log('✅ Created cron API route');

// Create health check API route
const healthRoute = `import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    message: 'Bot is running on Vercel'
  });
}`;

const healthDir = 'app/api/health';
if (!fs.existsSync(healthDir)) {
  fs.mkdirSync(healthDir, { recursive: true });
}

fs.writeFileSync(path.join(healthDir, 'route.ts'), healthRoute);
console.log('✅ Created health check API route');

// Update lib/telegram.ts for webhook
const telegramLib = `import TelegramBot from 'node-telegram-bot-api';

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN!, { 
  polling: false // Disable polling for webhook
});

// Webhook handler
bot.on('message', (msg) => {
  console.log('📨 Received message:', msg.text);
  // Handle messages here
});

bot.on('callback_query', (callbackQuery) => {
  console.log('📨 Received callback:', callbackQuery.data);
  // Handle callbacks here
});

export { bot };`;

fs.writeFileSync('lib/telegram.ts', telegramLib);
console.log('✅ Updated lib/telegram.ts for webhook');

// Create deploy script
const deployScript = `#!/bin/bash

echo "🚀 Deploying to Vercel..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Login to Vercel
echo "🔐 Logging in to Vercel..."
vercel login

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

# Get deployment URL
DEPLOY_URL=$(vercel ls | grep -o 'https://[^[:space:]]*' | head -1)
echo "🌐 Deployment URL: $DEPLOY_URL"

# Set webhook
echo "🔗 Setting webhook..."
curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \\
  -H "Content-Type: application/json" \\
  -d "{\\"url\\": \\"$DEPLOY_URL/api/telegram/webhook\\"}"

echo "✅ Deployment complete!"
echo "🌐 Bot URL: $DEPLOY_URL"
echo "🔗 Webhook: $DEPLOY_URL/api/telegram/webhook"
echo "❤️ Health: $DEPLOY_URL/api/health"
`;

fs.writeFileSync('deploy-vercel.sh', deployScript);
fs.chmodSync('deploy-vercel.sh', '755');
console.log('✅ Created deploy-vercel.sh');

// Create environment setup script
const envScript = `#!/bin/bash

echo "🔧 Setting up Vercel environment variables..."

# Set environment variables
vercel env add TELEGRAM_BOT_TOKEN
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add CRON_SECRET

echo "✅ Environment variables set!"
echo "📋 Don't forget to set the values in Vercel dashboard"
`;

fs.writeFileSync('setup-vercel-env.sh', envScript);
fs.chmodSync('setup-vercel-env.sh', '755');
console.log('✅ Created setup-vercel-env.sh');

// Update package.json with Vercel scripts
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

packageJson.scripts = {
  ...packageJson.scripts,
  'vercel:deploy': 'vercel --prod',
  'vercel:dev': 'vercel dev',
  'vercel:env': './setup-vercel-env.sh',
  'deploy': './deploy-vercel.sh'
};

fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
console.log('✅ Updated package.json with Vercel scripts');

// Create .vercelignore
const vercelIgnore = `# Dependencies
node_modules/
npm-debug.log*

# Environment variables
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
logs/
*.log

# PM2
ecosystem.config.js
.pm2/

# Scripts
scripts/
deploy-*.sh
setup-*.sh

# Documentation
*.md
docs/

# Git
.git/
.gitignore
`;

fs.writeFileSync('.vercelignore', vercelIgnore);
console.log('✅ Created .vercelignore');

console.log('\\n🎉 Vercel setup completed!');
console.log('\\n📋 Next steps:');
console.log('1. Install Vercel CLI: npm install -g vercel');
console.log('2. Login: vercel login');
console.log('3. Set environment variables: npm run vercel:env');
console.log('4. Deploy: npm run deploy');
console.log('\\n🔧 Commands:');
console.log('- Deploy: npm run deploy');
console.log('- Dev: npm run vercel:dev');
console.log('- Env: npm run vercel:env');
console.log('\\n🚀 Bot ready for Vercel deployment!');
