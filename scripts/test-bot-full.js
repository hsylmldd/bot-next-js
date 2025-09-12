const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config({ path: '.env.local' });

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

console.log('🤖 Starting Order Management Bot in polling mode...');
console.log('📱 Bot will respond to messages in real-time');
console.log('⚠️  Press Ctrl+C to stop');

// Handle /start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name || 'User';
  const telegramId = msg.from.id.toString();
  
  console.log(`📨 Received /start from ${firstName} (${chatId})`);
  
  // Check if user is registered
  checkUserRegistration(chatId, telegramId, firstName, msg.from.last_name || '');
});

// Handle /help command
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id.toString();
  
  console.log(`📨 Received /help from ${msg.from.first_name} (${chatId})`);
  
  // Get user role and show appropriate help
  getUserRole(telegramId).then(role => {
    if (role) {
      showHelpByRole(chatId, role);
    } else {
      bot.sendMessage(chatId, '❌ Anda belum terdaftar. Gunakan /start untuk mendaftar.');
    }
  });
});

// Handle /order command (HD only)
bot.onText(/\/order/, (msg) => {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id.toString();
  
  console.log(`📨 Received /order from ${msg.from.first_name} (${chatId})`);
  
  getUserRole(telegramId).then(role => {
    if (role === 'HD') {
      startCreateOrder(chatId);
    } else {
      bot.sendMessage(chatId, '❌ Hanya Helpdesk yang dapat membuat order.');
    }
  });
});

// Handle /myorders command
bot.onText(/\/myorders/, (msg) => {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id.toString();
  
  console.log(`📨 Received /myorders from ${msg.from.first_name} (${chatId})`);
  
  getUserRole(telegramId).then(role => {
    if (role) {
      showMyOrders(chatId, role);
    } else {
      bot.sendMessage(chatId, '❌ Anda belum terdaftar. Gunakan /start untuk mendaftar.');
    }
  });
});

// Handle /progress command (Teknisi only)
bot.onText(/\/progress/, (msg) => {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id.toString();
  
  console.log(`📨 Received /progress from ${msg.from.first_name} (${chatId})`);
  
  getUserRole(telegramId).then(role => {
    if (role === 'Teknisi') {
      showProgressMenu(chatId);
    } else {
      bot.sendMessage(chatId, '❌ Hanya Teknisi yang dapat update progress.');
    }
  });
});

// Handle /evidence command (Teknisi only)
bot.onText(/\/evidence/, (msg) => {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id.toString();
  
  console.log(`📨 Received /evidence from ${msg.from.first_name} (${chatId})`);
  
  getUserRole(telegramId).then(role => {
    if (role === 'Teknisi') {
      showEvidenceMenu(chatId);
    } else {
      bot.sendMessage(chatId, '❌ Hanya Teknisi yang dapat upload evidence.');
    }
  });
});

// Handle /report command (HD only)
bot.onText(/\/report/, (msg) => {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id.toString();
  
  console.log(`📨 Received /report from ${msg.from.first_name} (${chatId})`);
  
  getUserRole(telegramId).then(role => {
    if (role === 'HD') {
      showReportMenu(chatId);
    } else {
      bot.sendMessage(chatId, '❌ Hanya Helpdesk yang dapat generate laporan.');
    }
  });
});

// Handle callback queries
bot.on('callback_query', (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;
  const telegramId = callbackQuery.from.id.toString();
  
  console.log(`📨 Received callback: ${data} from ${callbackQuery.from.first_name}`);
  
  handleCallbackQuery(callbackQuery);
});

// Handle photo uploads
bot.on('photo', (msg) => {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id.toString();
  
  console.log(`📨 Received photo from ${msg.from.first_name} (${chatId})`);
  
  // Handle evidence photo upload
  handlePhotoUpload(msg, telegramId);
});

// Helper functions
async function checkUserRegistration(chatId, telegramId, firstName, lastName) {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', telegramId)
      .single();
    
    if (error || !user) {
      // User not registered, show registration options
      bot.sendMessage(chatId, 
        `Halo ${firstName}! 👋\n\n` +
        'Selamat datang di Order Management Bot!\n\n' +
        'Anda belum terdaftar dalam sistem.\n' +
        'Silakan pilih role Anda:',
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: '📋 Daftar sebagai HD (Helpdesk)', callback_data: 'register_hd' }],
              [{ text: '🔧 Daftar sebagai Teknisi', callback_data: 'register_teknis' }]
            ]
          }
        }
      );
    } else {
      // User is registered, show welcome message
      showWelcomeMessage(chatId, user.role, user.name);
    }
  } catch (error) {
    console.error('Error checking user registration:', error);
    bot.sendMessage(chatId, '❌ Terjadi kesalahan. Silakan coba lagi.');
  }
}

async function getUserRole(telegramId) {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    const { data: user, error } = await supabase
      .from('users')
      .select('role')
      .eq('telegram_id', telegramId)
      .single();
    
    if (error || !user) return null;
    return user.role;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
}

function showWelcomeMessage(chatId, role, name) {
  const roleEmoji = role === 'HD' ? '📋' : '🔧';
  const roleName = role === 'HD' ? 'Helpdesk' : 'Teknisi';
  
  bot.sendMessage(chatId, 
    `Halo ${name}! 👋\n\n` +
    `Role: ${roleEmoji} ${roleName}\n\n` +
    'Selamat datang kembali di Order Management Bot!\n\n' +
    'Gunakan menu di bawah untuk mengakses fitur:',
    getMainMenuKeyboard(role)
  );
}

function getMainMenuKeyboard(role) {
  if (role === 'HD') {
    return {
      reply_markup: {
        inline_keyboard: [
          [{ text: '📋 Buat Order Baru', callback_data: 'create_order' }],
          [{ text: '📊 Lihat Semua Order', callback_data: 'view_orders' }],
          [{ text: '📈 Generate Laporan', callback_data: 'generate_report' }],
          [{ text: '⚙️ Update Status Order', callback_data: 'update_status' }],
          [{ text: '❓ Bantuan', callback_data: 'help' }]
        ]
      }
    };
  } else {
    return {
      reply_markup: {
        inline_keyboard: [
          [{ text: '📋 Order Saya', callback_data: 'my_orders' }],
          [{ text: '📝 Update Progress', callback_data: 'update_progress' }],
          [{ text: '📸 Upload Evidence', callback_data: 'upload_evidence' }],
          [{ text: '❓ Bantuan', callback_data: 'help' }]
        ]
      }
    };
  }
}

function showHelpByRole(chatId, role) {
  let helpText = `**Panduan Penggunaan Bot**\n\n`;
  
  if (role === 'HD') {
    helpText += `**Untuk Helpdesk (HD):**\n\n` +
      `📋 **Buat Order Baru** - Membuat order instalasi baru\n` +
      `📊 **Lihat Semua Order** - Melihat semua order dalam sistem\n` +
      `📈 **Generate Laporan** - Membuat laporan harian/mingguan\n` +
      `⚙️ **Update Status Order** - Update status order (SOD, E2E, LME PT2)\n\n` +
      `**Commands:**\n` +
      `/start - Memulai bot\n` +
      `/help - Menampilkan panduan ini\n` +
      `/order - Membuat order baru\n` +
      `/myorders - Melihat semua order\n` +
      `/report - Generate laporan\n\n` +
      `**Flow Order:**\n` +
      `1. Buat order → Assign teknisi\n` +
      `2. Input SOD & E2E time\n` +
      `3. Monitor progress teknisi\n` +
      `4. Update LME PT2 jika diperlukan\n` +
      `5. Review evidence sebelum close`;
  } else {
    helpText += `**Untuk Teknisi:**\n\n` +
      `📋 **Order Saya** - Melihat order yang ditugaskan\n` +
      `📝 **Update Progress** - Update progress instalasi\n` +
      `📸 **Upload Evidence** - Upload foto dan data evidence\n\n` +
      `**Commands:**\n` +
      `/start - Memulai bot\n` +
      `/help - Menampilkan panduan ini\n` +
      `/myorders - Melihat order saya\n` +
      `/progress - Update progress\n` +
      `/evidence - Upload evidence\n\n` +
      `**Flow Instalasi:**\n` +
      `1. Terima notifikasi order baru\n` +
      `2. Survey jaringan (Ready/Not Ready)\n` +
      `3. Penarikan kabel\n` +
      `4. P2P (Point-to-Point)\n` +
      `5. Instalasi ONT\n` +
      `6. Upload semua evidence\n` +
      `7. Order otomatis close jika evidence lengkap`;
  }
  
  bot.sendMessage(chatId, helpText);
}

function startCreateOrder(chatId) {
  bot.sendMessage(chatId, 
    '📋 **Membuat Order Baru**\n\n' +
    'Silakan masukkan nama pelanggan:'
  );
}

function showMyOrders(chatId, role) {
  bot.sendMessage(chatId, 
    '📋 **Daftar Order**\n\n' +
    'Fitur ini akan menampilkan order sesuai role Anda.\n' +
    'HD: Semua order\n' +
    'Teknisi: Order yang ditugaskan'
  );
}

function showProgressMenu(chatId) {
  bot.sendMessage(chatId, 
    '📝 **Update Progress**\n\n' +
    'Pilih tahapan yang akan diupdate:',
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔍 Survey', callback_data: 'progress_survey' }],
          [{ text: '🔌 Penarikan Kabel', callback_data: 'progress_penarikan' }],
          [{ text: '📡 P2P', callback_data: 'progress_p2p' }],
          [{ text: '📱 Instalasi ONT', callback_data: 'progress_instalasi' }]
        ]
      }
    }
  );
}

function showEvidenceMenu(chatId) {
  bot.sendMessage(chatId, 
    '📸 **Upload Evidence**\n\n' +
    'Pilih jenis evidence yang akan diupload:',
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: '📝 Input Data ODP & SN', callback_data: 'evidence_data' }],
          [{ text: '📸 Foto SN ONT', callback_data: 'evidence_photo_sn' }],
          [{ text: '👥 Foto Teknisi + Pelanggan', callback_data: 'evidence_photo_tech' }],
          [{ text: '🏠 Foto Rumah Pelanggan', callback_data: 'evidence_photo_house' }],
          [{ text: '📦 Foto Depan ODP', callback_data: 'evidence_photo_odp_front' }],
          [{ text: '🔧 Foto Dalam ODP', callback_data: 'evidence_photo_odp_inside' }],
          [{ text: '🏷️ Foto Label DC', callback_data: 'evidence_photo_label' }],
          [{ text: '📊 Foto Test Redaman', callback_data: 'evidence_photo_test' }]
        ]
      }
    }
  );
}

function showReportMenu(chatId) {
  bot.sendMessage(chatId, 
    '📈 **Generate Laporan**\n\n' +
    'Pilih jenis laporan:',
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: '📊 Laporan Harian', callback_data: 'report_daily' }],
          [{ text: '📈 Laporan Mingguan', callback_data: 'report_weekly' }]
        ]
      }
    }
  );
}

async function handleCallbackQuery(callbackQuery) {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;
  const telegramId = callbackQuery.from.id.toString();
  
  try {
    await bot.answerCallbackQuery(callbackQuery.id);
    
    if (data === 'register_hd') {
      await registerUser(telegramId, callbackQuery.from.first_name, 'HD');
      bot.sendMessage(chatId, 
        '✅ **Registrasi Berhasil!**\n\n' +
        'Anda telah terdaftar sebagai **HD (Helpdesk)**.\n\n' +
        'Selamat datang di Order Management Bot!'
      );
      showWelcomeMessage(chatId, 'HD', callbackQuery.from.first_name);
    } else if (data === 'register_teknis') {
      await registerUser(telegramId, callbackQuery.from.first_name, 'Teknisi');
      bot.sendMessage(chatId, 
        '✅ **Registrasi Berhasil!**\n\n' +
        'Anda telah terdaftar sebagai **Teknisi**.\n\n' +
        'Selamat datang di Order Management Bot!'
      );
      showWelcomeMessage(chatId, 'Teknisi', callbackQuery.from.first_name);
    } else if (data === 'create_order') {
      startCreateOrder(chatId);
    } else if (data === 'view_orders') {
      showMyOrders(chatId, 'HD');
    } else if (data === 'generate_report') {
      showReportMenu(chatId);
    } else if (data === 'my_orders') {
      showMyOrders(chatId, 'Teknisi');
    } else if (data === 'update_progress') {
      showProgressMenu(chatId);
    } else if (data === 'upload_evidence') {
      showEvidenceMenu(chatId);
    } else if (data === 'help') {
      getUserRole(telegramId).then(role => {
        if (role) {
          showHelpByRole(chatId, role);
        }
      });
    } else {
      bot.sendMessage(chatId, 'Fitur ini sedang dalam pengembangan.');
    }
    
  } catch (error) {
    console.error('Error handling callback query:', error);
    bot.sendMessage(chatId, '❌ Terjadi kesalahan. Silakan coba lagi.');
  }
}

async function registerUser(telegramId, firstName, role) {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    const { error } = await supabase
      .from('users')
      .insert({
        telegram_id: telegramId,
        name: firstName,
        role: role
      });
    
    if (error) {
      console.error('Error registering user:', error);
    }
  } catch (error) {
    console.error('Error registering user:', error);
  }
}

function handlePhotoUpload(msg, telegramId) {
  const chatId = msg.chat.id;
  
  bot.sendMessage(chatId, 
    '📸 **Foto Diterima!**\n\n' +
    'Fitur upload evidence sedang dalam pengembangan.\n' +
    'Foto akan disimpan ke Supabase Storage.'
  );
}

// Handle errors
bot.on('error', (error) => {
  console.error('❌ Bot error:', error);
});

bot.on('polling_error', (error) => {
  console.error('❌ Polling error:', error);
});

console.log('✅ Bot started successfully!');
console.log('📱 Send /start to your bot to test');
console.log('🔧 Bot features:');
console.log('   - User registration (HD/Teknisi)');
console.log('   - Role-based commands');
console.log('   - Inline keyboards');
console.log('   - Database integration');
console.log('   - Evidence upload (coming soon)');
