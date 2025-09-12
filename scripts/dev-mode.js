const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting development mode...\n');

// Start Next.js development server
const nextServer = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true
});

nextServer.on('error', (error) => {
  console.error('❌ Failed to start Next.js server:', error);
});

nextServer.on('close', (code) => {
  console.log(`Next.js server exited with code ${code}`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down development server...');
  nextServer.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down development server...');
  nextServer.kill('SIGTERM');
  process.exit(0);
});

console.log('✅ Development server started');
console.log('📱 Bot will be available at: http://localhost:3000');
console.log('🔧 Admin dashboard: http://localhost:3000');
console.log('📊 API endpoints: http://localhost:3000/api');
console.log('\n⚠️  Note: For local development, webhook setup is not required');
console.log('   You can test the bot using polling mode or ngrok for webhook');
console.log('\nPress Ctrl+C to stop the server');
