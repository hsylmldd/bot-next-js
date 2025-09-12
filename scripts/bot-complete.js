const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

// User sessions untuk menyimpan state
const userSessions = new Map();

console.log('🤖 Starting Complete Order Management Bot...');
console.log('📱 Bot will handle all features properly');
console.log('⚠️  Press Ctrl+C to stop');

// Handle /start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name || 'User';
  const telegramId = msg.from.id.toString();
  
  console.log(`📨 Received /start from ${firstName} (${chatId})`);
  
  // Clear any existing session
  userSessions.delete(chatId);
  
  // Check if user is registered
  checkUserRegistration(chatId, telegramId, firstName, msg.from.last_name || '');
});

// Handle /help command
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id.toString();
  
  console.log(`📨 Received /help from ${msg.from.first_name} (${chatId})`);
  
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
      startCreateOrder(chatId, telegramId);
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
      showMyOrders(chatId, telegramId, role);
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
      showProgressMenu(chatId, telegramId);
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
      showEvidenceMenu(chatId, telegramId);
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
      showReportMenu(chatId, telegramId);
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
  
  handlePhotoUpload(msg, telegramId);
});

// Handle text messages (for session input)
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id.toString();
  const text = msg.text;
  
  // Skip if it's a command
  if (text && text.startsWith('/')) {
    return;
  }
  
  // Handle session input
  const session = userSessions.get(chatId);
  if (session) {
    handleSessionInput(chatId, telegramId, text, session);
  }
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

function startCreateOrder(chatId, telegramId) {
  // Set session untuk order creation
  userSessions.set(chatId, {
    type: 'create_order',
    step: 'customer_name',
    data: {}
  });
  
  bot.sendMessage(chatId, 
    '📋 **Membuat Order Baru**\n\n' +
    'Silakan masukkan nama pelanggan:'
  );
}

async function showMyOrders(chatId, telegramId, role) {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    let query = supabase.from('orders').select('*');
    
    if (role === 'Teknisi') {
      // Get user ID first
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('telegram_id', telegramId)
        .single();
      
      if (user) {
        query = query.eq('assigned_technician', user.id);
      }
    }
    
    const { data: orders, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching orders:', error);
      bot.sendMessage(chatId, '❌ Terjadi kesalahan saat mengambil data order.');
      return;
    }
    
    if (!orders || orders.length === 0) {
      bot.sendMessage(chatId, '📋 **Daftar Order**\n\nTidak ada order yang ditemukan.');
      return;
    }
    
    let message = '📋 **Daftar Order**\n\n';
    orders.forEach((order, index) => {
      const statusEmoji = getStatusEmoji(order.status);
      message += `${index + 1}. **${order.customer_name}**\n`;
      message += `   Status: ${statusEmoji} ${order.status}\n`;
      message += `   Alamat: ${order.customer_address}\n`;
      message += `   Kontak: ${order.contact}\n`;
      message += `   Dibuat: ${new Date(order.created_at).toLocaleDateString('id-ID')}\n\n`;
    });
    
    bot.sendMessage(chatId, message);
    
  } catch (error) {
    console.error('Error showing orders:', error);
    bot.sendMessage(chatId, '❌ Terjadi kesalahan saat mengambil data order.');
  }
}

function showProgressMenu(chatId, telegramId) {
  // Get user's assigned orders first
  getUserAssignedOrders(telegramId).then(orders => {
    if (!orders || orders.length === 0) {
      bot.sendMessage(chatId, '📝 **Update Progress**\n\nTidak ada order yang ditugaskan kepada Anda.');
      return;
    }
    
    let message = '📝 **Update Progress**\n\nPilih order yang akan diupdate:\n\n';
    const keyboard = [];
    
    orders.forEach((order, index) => {
      message += `${index + 1}. **${order.customer_name}** (${order.status})\n`;
      keyboard.push([{ 
        text: `${index + 1}. ${order.customer_name}`, 
        callback_data: `progress_order_${order.id}` 
      }]);
    });
    
    bot.sendMessage(chatId, message, {
      reply_markup: {
        inline_keyboard: keyboard
      }
    });
  });
}

function showEvidenceMenu(chatId, telegramId) {
  // Get user's assigned orders first
  getUserAssignedOrders(telegramId).then(orders => {
    if (!orders || orders.length === 0) {
      bot.sendMessage(chatId, '📸 **Upload Evidence**\n\nTidak ada order yang ditugaskan kepada Anda.');
      return;
    }
    
    let message = '📸 **Upload Evidence**\n\nPilih order untuk upload evidence:\n\n';
    const keyboard = [];
    
    orders.forEach((order, index) => {
      message += `${index + 1}. **${order.customer_name}** (${order.status})\n`;
      keyboard.push([{ 
        text: `${index + 1}. ${order.customer_name}`, 
        callback_data: `evidence_order_${order.id}` 
      }]);
    });
    
    bot.sendMessage(chatId, message, {
      reply_markup: {
        inline_keyboard: keyboard
      }
    });
  });
}

function showReportMenu(chatId, telegramId) {
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

async function getUserAssignedOrders(telegramId) {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Get user ID first
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('telegram_id', telegramId)
      .single();
    
    if (!user) return [];
    
    // Get assigned orders
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .eq('assigned_technician', user.id)
      .in('status', ['Pending', 'In Progress', 'On Hold'])
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching assigned orders:', error);
      return [];
    }
    
    return orders || [];
  } catch (error) {
    console.error('Error getting assigned orders:', error);
    return [];
  }
}

function getStatusEmoji(status) {
  const statusEmojis = {
    'Pending': '⏳',
    'In Progress': '🔄',
    'On Hold': '⏸️',
    'Completed': '✅',
    'Closed': '🔒'
  };
  return statusEmojis[status] || '❓';
}

function getProgressStatusEmoji(status) {
  const statusEmojis = {
    'Ready': '✅',
    'Not Ready': '❌',
    'Selesai': '✅',
    'In Progress': '🔄'
  };
  return statusEmojis[status] || '❓';
}

async function handleSessionInput(chatId, telegramId, text, session) {
  try {
    if (session.type === 'create_order') {
      await handleCreateOrderInput(chatId, telegramId, text, session);
    } else if (session.type === 'update_progress') {
      await handleUpdateProgressInput(chatId, telegramId, text, session);
    } else if (session.type === 'evidence_data') {
      await handleEvidenceDataInput(chatId, telegramId, text, session);
    }
  } catch (error) {
    console.error('Error handling session input:', error);
    bot.sendMessage(chatId, '❌ Terjadi kesalahan. Silakan coba lagi.');
  }
}

async function handleCreateOrderInput(chatId, telegramId, text, session) {
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  if (session.step === 'customer_name') {
    session.data.customer_name = text;
    session.step = 'customer_address';
    
    bot.sendMessage(chatId, 
      '✅ Nama pelanggan: **' + text + '**\n\n' +
      'Silakan masukkan alamat pelanggan:'
    );
    
  } else if (session.step === 'customer_address') {
    session.data.customer_address = text;
    session.step = 'customer_contact';
    
    bot.sendMessage(chatId, 
      '✅ Alamat pelanggan: **' + text + '**\n\n' +
      'Silakan masukkan kontak pelanggan:'
    );
    
  } else if (session.step === 'customer_contact') {
    session.data.contact = text;
    session.step = 'assign_technician';
    
    // Get available technicians
    const { data: technicians, error } = await supabase
      .from('users')
      .select('id, name')
      .eq('role', 'Teknisi');
    
    if (error || !technicians || technicians.length === 0) {
      bot.sendMessage(chatId, '❌ Tidak ada teknisi yang tersedia. Silakan hubungi admin.');
      userSessions.delete(chatId);
      return;
    }
    
    let message = '✅ Kontak pelanggan: **' + text + '**\n\n';
    message += 'Pilih teknisi yang akan ditugaskan:\n\n';
    
    const keyboard = [];
    technicians.forEach((tech, index) => {
      message += `${index + 1}. ${tech.name}\n`;
      keyboard.push([{ 
        text: `${index + 1}. ${tech.name}`, 
        callback_data: `assign_tech_${tech.id}` 
      }]);
    });
    
    bot.sendMessage(chatId, message, {
      reply_markup: {
        inline_keyboard: keyboard
      }
    });
  }
}

async function handleUpdateProgressInput(chatId, telegramId, text, session) {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Save progress to database
    const { error } = await supabase
      .from('progress')
      .insert({
        order_id: session.orderId,
        stage: session.stage,
        status: 'Selesai',
        note: text || null,
        timestamp: new Date().toISOString()
      });
    
    if (error) {
      console.error('Error saving progress:', error);
      bot.sendMessage(chatId, '❌ Gagal menyimpan progress. Silakan coba lagi.');
      return;
    }
    
    // Update order status to In Progress if it's still Pending
    await supabase
      .from('orders')
      .update({ status: 'In Progress' })
      .eq('id', session.orderId)
      .eq('status', 'Pending');
    
    bot.sendMessage(chatId, 
      `✅ **Progress Berhasil Diupdate!**\n\n` +
      `📝 **Tahapan**: ${session.stage}\n` +
      `📊 **Status**: Selesai\n` +
      `📝 **Catatan**: ${text || 'Tidak ada catatan'}\n\n` +
      'Progress telah tersimpan ke database.'
    );
    
    userSessions.delete(chatId);
    
  } catch (error) {
    console.error('Error handling progress update:', error);
    bot.sendMessage(chatId, '❌ Terjadi kesalahan. Silakan coba lagi.');
  }
}

async function handleEvidenceDataInput(chatId, telegramId, text, session) {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    if (session.step === 'odp_name') {
      session.data.odp_name = text;
      session.step = 'ont_sn';
      
      bot.sendMessage(chatId, 
        '✅ Nama ODP: **' + text + '**\n\n' +
        'Silakan masukkan SN ONT:'
      );
      
    } else if (session.step === 'ont_sn') {
      session.data.ont_sn = text;
      
      // Save evidence data to database
      const { error } = await supabase
        .from('evidence')
        .upsert({
          order_id: session.orderId,
          odp_name: session.data.odp_name,
          ont_sn: session.data.ont_sn,
          uploaded_at: new Date().toISOString()
        });
      
      if (error) {
        console.error('Error saving evidence data:', error);
        bot.sendMessage(chatId, '❌ Gagal menyimpan data evidence. Silakan coba lagi.');
        return;
      }
      
      bot.sendMessage(chatId, 
        '✅ **Data Evidence Berhasil Disimpan!**\n\n' +
        `📝 **Nama ODP**: ${session.data.odp_name}\n` +
        `📱 **SN ONT**: ${session.data.ont_sn}\n\n` +
        'Data telah tersimpan ke database.\n' +
        'Silakan lanjutkan upload foto evidence lainnya.'
      );
      
      userSessions.delete(chatId);
    }
    
  } catch (error) {
    console.error('Error handling evidence data input:', error);
    bot.sendMessage(chatId, '❌ Terjadi kesalahan. Silakan coba lagi.');
  }
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
      startCreateOrder(chatId, telegramId);
    } else if (data === 'view_orders') {
      showMyOrders(chatId, telegramId, 'HD');
    } else if (data === 'generate_report') {
      showReportMenu(chatId, telegramId);
    } else if (data === 'my_orders') {
      showMyOrders(chatId, telegramId, 'Teknisi');
    } else if (data === 'update_progress') {
      showProgressMenu(chatId, telegramId);
    } else if (data === 'upload_evidence') {
      showEvidenceMenu(chatId, telegramId);
    } else if (data === 'help') {
      getUserRole(telegramId).then(role => {
        if (role) {
          showHelpByRole(chatId, role);
        }
      });
    } else if (data.startsWith('assign_tech_')) {
      const techId = data.split('_')[2];
      await assignTechnician(chatId, telegramId, techId);
    } else if (data.startsWith('progress_order_')) {
      const orderId = data.split('_')[2];
      await showProgressStages(chatId, telegramId, orderId);
    } else if (data.startsWith('progress_survey_')) {
      const orderId = data.split('_')[2];
      await handleProgressSurvey(chatId, telegramId, orderId);
    } else if (data.startsWith('progress_penarikan_')) {
      const orderId = data.split('_')[2];
      await handleProgressPenarikan(chatId, telegramId, orderId);
    } else if (data.startsWith('progress_p2p_')) {
      const orderId = data.split('_')[2];
      await handleProgressP2P(chatId, telegramId, orderId);
    } else if (data.startsWith('progress_instalasi_')) {
      const orderId = data.split('_')[2];
      await handleProgressInstalasi(chatId, telegramId, orderId);
    } else if (data.startsWith('evidence_order_')) {
      const orderId = data.split('_')[2];
      await showEvidenceTypes(chatId, telegramId, orderId);
    } else if (data.startsWith('evidence_data_')) {
      const orderId = data.split('_')[2];
      await handleEvidenceData(chatId, telegramId, orderId);
    } else if (data.startsWith('evidence_photo_')) {
      const orderId = data.split('_')[2];
      const photoType = data.split('_')[3];
      await handleEvidencePhoto(chatId, telegramId, orderId, photoType);
    } else if (data.startsWith('survey_ready_')) {
      const orderId = data.split('_')[2];
      await handleSurveyResult(chatId, telegramId, orderId, 'Ready');
    } else if (data.startsWith('survey_not_ready_')) {
      const orderId = data.split('_')[2];
      await handleSurveyResult(chatId, telegramId, orderId, 'Not Ready');
    } else if (data === 'report_daily') {
      await generateDailyReport(chatId, telegramId);
    } else if (data === 'report_weekly') {
      await generateWeeklyReport(chatId, telegramId);
    } else {
      bot.sendMessage(chatId, 'Fitur ini sedang dalam pengembangan.');
    }
    
  } catch (error) {
    console.error('Error handling callback query:', error);
    bot.sendMessage(chatId, '❌ Terjadi kesalahan. Silakan coba lagi.');
  }
}

async function assignTechnician(chatId, telegramId, techId) {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    const session = userSessions.get(chatId);
    if (!session || session.type !== 'create_order') {
      bot.sendMessage(chatId, '❌ Session tidak valid. Silakan mulai ulang.');
      return;
    }
    
    // Get technician name
    const { data: tech } = await supabase
      .from('users')
      .select('name')
      .eq('id', techId)
      .single();
    
    // Create order
    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        customer_name: session.data.customer_name,
        customer_address: session.data.customer_address,
        contact: session.data.contact,
        assigned_technician: techId,
        status: 'Pending'
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating order:', error);
      bot.sendMessage(chatId, '❌ Gagal membuat order. Silakan coba lagi.');
      return;
    }
    
    // Clear session
    userSessions.delete(chatId);
    
    // Send success message
    bot.sendMessage(chatId, 
      '✅ **Order Berhasil Dibuat!**\n\n' +
      `📋 **Order ID**: ${order.id}\n` +
      `👤 **Pelanggan**: ${order.customer_name}\n` +
      `🏠 **Alamat**: ${order.customer_address}\n` +
      `📞 **Kontak**: ${order.contact}\n` +
      `🔧 **Teknisi**: ${tech.name}\n` +
      `📊 **Status**: Pending\n\n` +
      'Teknisi akan mendapat notifikasi order baru.'
    );
    
    // Notify technician
    await notifyTechnician(techId, order);
    
  } catch (error) {
    console.error('Error assigning technician:', error);
    bot.sendMessage(chatId, '❌ Terjadi kesalahan. Silakan coba lagi.');
  }
}

async function notifyTechnician(techId, order) {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Get technician telegram ID
    const { data: tech } = await supabase
      .from('users')
      .select('telegram_id, name')
      .eq('id', techId)
      .single();
    
    if (tech && tech.telegram_id) {
      bot.sendMessage(tech.telegram_id, 
        '🔔 **Order Baru Ditugaskan!**\n\n' +
        `📋 **Order ID**: ${order.id}\n` +
        `👤 **Pelanggan**: ${order.customer_name}\n` +
        `🏠 **Alamat**: ${order.customer_address}\n` +
        `📞 **Kontak**: ${order.contact}\n` +
        `📊 **Status**: Pending\n\n` +
        'Silakan mulai dengan melakukan survey jaringan.'
      );
    }
  } catch (error) {
    console.error('Error notifying technician:', error);
  }
}

async function showProgressStages(chatId, telegramId, orderId) {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Get order details
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();
    
    if (error || !order) {
      bot.sendMessage(chatId, '❌ Order tidak ditemukan.');
      return;
    }
    
    // Get existing progress
    const { data: progress, error: progressError } = await supabase
      .from('progress')
      .select('*')
      .eq('order_id', orderId)
      .order('timestamp', { ascending: false });
    
    if (progressError) {
      console.error('Error fetching progress:', progressError);
    }
    
    let message = '📝 **Update Progress**\n\n';
    message += `📋 **Order**: ${order.customer_name}\n`;
    message += `🏠 **Alamat**: ${order.customer_address}\n`;
    message += `📊 **Status**: ${getStatusEmoji(order.status)} ${order.status}\n\n`;
    
    if (progress && progress.length > 0) {
      message += '📈 **Progress Terakhir:**\n';
      progress.slice(0, 3).forEach(p => {
        message += `• ${p.stage}: ${getProgressStatusEmoji(p.status)} ${p.status}\n`;
      });
      message += '\n';
    }
    
    message += 'Pilih tahapan progress:';
    
    bot.sendMessage(chatId, message, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔍 Survey', callback_data: `progress_survey_${orderId}` }],
          [{ text: '🔌 Penarikan Kabel', callback_data: `progress_penarikan_${orderId}` }],
          [{ text: '📡 P2P', callback_data: `progress_p2p_${orderId}` }],
          [{ text: '📱 Instalasi ONT', callback_data: `progress_instalasi_${orderId}` }]
        ]
      }
    });
    
  } catch (error) {
    console.error('Error showing progress stages:', error);
    bot.sendMessage(chatId, '❌ Terjadi kesalahan. Silakan coba lagi.');
  }
}

async function showEvidenceTypes(chatId, telegramId, orderId) {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Get order details
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();
    
    if (error || !order) {
      bot.sendMessage(chatId, '❌ Order tidak ditemukan.');
      return;
    }
    
    // Get existing evidence
    const { data: existingEvidence, error: evidenceError } = await supabase
      .from('evidence')
      .select('*')
      .eq('order_id', orderId)
      .single();
    
    if (evidenceError && evidenceError.code !== 'PGRST116') {
      console.error('Error checking existing evidence:', evidenceError);
    }
    
    let message = '📸 **Upload Evidence**\n\n';
    message += `📋 **Order**: ${order.customer_name}\n`;
    message += `🏠 **Alamat**: ${order.customer_address}\n\n`;
    
    if (existingEvidence) {
      message += '📊 **Status Evidence:**\n';
      const evidenceStatus = [
        { key: 'odp_name', label: 'Nama ODP', value: existingEvidence.odp_name },
        { key: 'ont_sn', label: 'SN ONT', value: existingEvidence.ont_sn },
        { key: 'photo_sn_ont', label: 'Foto SN ONT', value: existingEvidence.photo_sn_ont },
        { key: 'photo_technician_customer', label: 'Foto Teknisi + Pelanggan', value: existingEvidence.photo_technician_customer },
        { key: 'photo_customer_house', label: 'Foto Rumah Pelanggan', value: existingEvidence.photo_customer_house },
        { key: 'photo_odp_front', label: 'Foto Depan ODP', value: existingEvidence.photo_odp_front },
        { key: 'photo_odp_inside', label: 'Foto Dalam ODP', value: existingEvidence.photo_odp_inside },
        { key: 'photo_label_dc', label: 'Foto Label DC', value: existingEvidence.photo_label_dc },
        { key: 'photo_test_result', label: 'Foto Test Redaman', value: existingEvidence.photo_test_result }
      ];
      
      evidenceStatus.forEach(item => {
        const status = item.value ? '✅' : '❌';
        message += `${status} ${item.label}\n`;
      });
      message += '\n';
    }
    
    message += 'Pilih jenis evidence:';
    
    const keyboard = [
      [{ text: '📝 Input Data ODP & SN', callback_data: `evidence_data_${orderId}` }],
      [{ text: '📸 Foto SN ONT', callback_data: `evidence_photo_sn_${orderId}` }],
      [{ text: '👥 Foto Teknisi + Pelanggan', callback_data: `evidence_photo_tech_${orderId}` }],
      [{ text: '🏠 Foto Rumah Pelanggan', callback_data: `evidence_photo_house_${orderId}` }],
      [{ text: '📦 Foto Depan ODP', callback_data: `evidence_photo_odp_front_${orderId}` }],
      [{ text: '🔧 Foto Dalam ODP', callback_data: `evidence_photo_odp_inside_${orderId}` }],
      [{ text: '🏷️ Foto Label DC', callback_data: `evidence_photo_label_${orderId}` }],
      [{ text: '📊 Foto Test Redaman', callback_data: `evidence_photo_test_${orderId}` }]
    ];
    
    bot.sendMessage(chatId, message, {
      reply_markup: {
        inline_keyboard: keyboard
      }
    });
    
  } catch (error) {
    console.error('Error showing evidence types:', error);
    bot.sendMessage(chatId, '❌ Terjadi kesalahan. Silakan coba lagi.');
  }
}

async function generateDailyReport(chatId, telegramId) {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .gte('created_at', startOfDay.toISOString())
      .lt('created_at', endOfDay.toISOString());
    
    if (error) {
      console.error('Error generating daily report:', error);
      bot.sendMessage(chatId, '❌ Gagal generate laporan harian.');
      return;
    }
    
    const statusCounts = {};
    orders.forEach(order => {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
    });
    
    let report = '📊 **Laporan Harian**\n\n';
    report += `📅 Tanggal: ${today.toLocaleDateString('id-ID')}\n\n`;
    report += '📈 **Statistik Order:**\n';
    
    Object.entries(statusCounts).forEach(([status, count]) => {
      report += `${getStatusEmoji(status)} ${status}: ${count}\n`;
    });
    
    report += `\n📋 **Total Order**: ${orders.length}\n`;
    
    bot.sendMessage(chatId, report);
    
  } catch (error) {
    console.error('Error generating daily report:', error);
    bot.sendMessage(chatId, '❌ Terjadi kesalahan saat generate laporan.');
  }
}

async function generateWeeklyReport(chatId, telegramId) {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    const today = new Date();
    const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
    const endOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + 7);
    
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .gte('created_at', startOfWeek.toISOString())
      .lt('created_at', endOfWeek.toISOString());
    
    if (error) {
      console.error('Error generating weekly report:', error);
      bot.sendMessage(chatId, '❌ Gagal generate laporan mingguan.');
      return;
    }
    
    const statusCounts = {};
    orders.forEach(order => {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
    });
    
    let report = '📈 **Laporan Mingguan**\n\n';
    report += `📅 Periode: ${startOfWeek.toLocaleDateString('id-ID')} - ${endOfWeek.toLocaleDateString('id-ID')}\n\n`;
    report += '📈 **Statistik Order:**\n';
    
    Object.entries(statusCounts).forEach(([status, count]) => {
      report += `${getStatusEmoji(status)} ${status}: ${count}\n`;
    });
    
    report += `\n📋 **Total Order**: ${orders.length}\n`;
    
    bot.sendMessage(chatId, report);
    
  } catch (error) {
    console.error('Error generating weekly report:', error);
    bot.sendMessage(chatId, '❌ Terjadi kesalahan saat generate laporan.');
  }
}

// Progress handling functions
async function handleProgressSurvey(chatId, telegramId, orderId) {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Get order details
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();
    
    if (error || !order) {
      bot.sendMessage(chatId, '❌ Order tidak ditemukan.');
      return;
    }
    
    bot.sendMessage(chatId, 
      '🔍 **Survey Jaringan**\n\n' +
      `📋 **Order**: ${order.customer_name}\n` +
      `🏠 **Alamat**: ${order.customer_address}\n\n` +
      'Pilih hasil survey:',
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '✅ Jaringan Ready', callback_data: `survey_ready_${orderId}` }],
            [{ text: '❌ Jaringan Not Ready', callback_data: `survey_not_ready_${orderId}` }]
          ]
        }
      }
    );
    
  } catch (error) {
    console.error('Error handling survey:', error);
    bot.sendMessage(chatId, '❌ Terjadi kesalahan. Silakan coba lagi.');
  }
}

async function handleProgressPenarikan(chatId, telegramId, orderId) {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Get order details
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();
    
    if (error || !order) {
      bot.sendMessage(chatId, '❌ Order tidak ditemukan.');
      return;
    }
    
    // Set session for progress update
    userSessions.set(chatId, {
      type: 'update_progress',
      step: 'penarikan_note',
      orderId: orderId,
      stage: 'Penarikan',
      data: {}
    });
    
    bot.sendMessage(chatId, 
      '🔌 **Penarikan Kabel**\n\n' +
      `📋 **Order**: ${order.customer_name}\n` +
      `🏠 **Alamat**: ${order.customer_address}\n\n` +
      'Masukkan catatan penarikan kabel (opsional):'
    );
    
  } catch (error) {
    console.error('Error handling penarikan:', error);
    bot.sendMessage(chatId, '❌ Terjadi kesalahan. Silakan coba lagi.');
  }
}

async function handleProgressP2P(chatId, telegramId, orderId) {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Get order details
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();
    
    if (error || !order) {
      bot.sendMessage(chatId, '❌ Order tidak ditemukan.');
      return;
    }
    
    // Set session for progress update
    userSessions.set(chatId, {
      type: 'update_progress',
      step: 'p2p_note',
      orderId: orderId,
      stage: 'P2P',
      data: {}
    });
    
    bot.sendMessage(chatId, 
      '📡 **P2P (Point-to-Point)**\n\n' +
      `📋 **Order**: ${order.customer_name}\n` +
      `🏠 **Alamat**: ${order.customer_address}\n\n` +
      'Masukkan catatan P2P (opsional):'
    );
    
  } catch (error) {
    console.error('Error handling P2P:', error);
    bot.sendMessage(chatId, '❌ Terjadi kesalahan. Silakan coba lagi.');
  }
}

async function handleProgressInstalasi(chatId, telegramId, orderId) {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Get order details
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();
    
    if (error || !order) {
      bot.sendMessage(chatId, '❌ Order tidak ditemukan.');
      return;
    }
    
    // Set session for progress update
    userSessions.set(chatId, {
      type: 'update_progress',
      step: 'instalasi_note',
      orderId: orderId,
      stage: 'Instalasi',
      data: {}
    });
    
    bot.sendMessage(chatId, 
      '📱 **Instalasi ONT**\n\n' +
      `📋 **Order**: ${order.customer_name}\n` +
      `🏠 **Alamat**: ${order.customer_address}\n\n` +
      'Masukkan catatan instalasi ONT (opsional):'
    );
    
  } catch (error) {
    console.error('Error handling instalasi:', error);
    bot.sendMessage(chatId, '❌ Terjadi kesalahan. Silakan coba lagi.');
  }
}

async function handleEvidenceData(chatId, telegramId, orderId) {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Get order details
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();
    
    if (error || !order) {
      bot.sendMessage(chatId, '❌ Order tidak ditemukan.');
      return;
    }
    
    // Check if evidence already exists
    const { data: existingEvidence, error: evidenceError } = await supabase
      .from('evidence')
      .select('*')
      .eq('order_id', orderId)
      .single();
    
    if (evidenceError && evidenceError.code !== 'PGRST116') {
      console.error('Error checking existing evidence:', evidenceError);
      bot.sendMessage(chatId, '❌ Terjadi kesalahan. Silakan coba lagi.');
      return;
    }
    
    if (existingEvidence) {
      bot.sendMessage(chatId, 
        '📝 **Data Evidence Sudah Ada**\n\n' +
        `📋 **Order**: ${order.customer_name}\n` +
        `🏠 **Alamat**: ${order.customer_address}\n\n` +
        `📝 **Nama ODP**: ${existingEvidence.odp_name || 'Belum diisi'}\n` +
        `📱 **SN ONT**: ${existingEvidence.ont_sn || 'Belum diisi'}\n\n` +
        'Apakah Anda ingin mengupdate data evidence?',
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: '✅ Update Data', callback_data: `evidence_data_${orderId}` }],
              [{ text: '📸 Upload Foto', callback_data: `evidence_order_${orderId}` }]
            ]
          }
        }
      );
      return;
    }
    
    // Set session for evidence data input
    userSessions.set(chatId, {
      type: 'evidence_data',
      step: 'odp_name',
      orderId: orderId,
      data: {}
    });
    
    bot.sendMessage(chatId, 
      '📝 **Input Data Evidence**\n\n' +
      `📋 **Order**: ${order.customer_name}\n` +
      `🏠 **Alamat**: ${order.customer_address}\n\n` +
      'Masukkan nama ODP:'
    );
    
  } catch (error) {
    console.error('Error handling evidence data:', error);
    bot.sendMessage(chatId, '❌ Terjadi kesalahan. Silakan coba lagi.');
  }
}

async function handleEvidencePhoto(chatId, telegramId, orderId, photoType) {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Get order details
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();
    
    if (error || !order) {
      bot.sendMessage(chatId, '❌ Order tidak ditemukan.');
      return;
    }
    
    // Check if evidence already exists for this photo type
    const { data: existingEvidence, error: evidenceError } = await supabase
      .from('evidence')
      .select('*')
      .eq('order_id', orderId)
      .single();
    
    if (evidenceError && evidenceError.code !== 'PGRST116') {
      console.error('Error checking existing evidence:', evidenceError);
      bot.sendMessage(chatId, '❌ Terjadi kesalahan. Silakan coba lagi.');
      return;
    }
    
    const photoTypeNames = {
      'sn': 'Foto SN ONT',
      'tech': 'Foto Teknisi + Pelanggan',
      'house': 'Foto Rumah Pelanggan',
      'odp_front': 'Foto Depan ODP',
      'odp_inside': 'Foto Dalam ODP',
      'label': 'Foto Label DC',
      'test': 'Foto Test Redaman'
    };
    
    const photoFieldMap = {
      'sn': 'photo_sn_ont',
      'tech': 'photo_technician_customer',
      'house': 'photo_customer_house',
      'odp_front': 'photo_odp_front',
      'odp_inside': 'photo_odp_inside',
      'label': 'photo_label_dc',
      'test': 'photo_test_result'
    };
    
    const photoField = photoFieldMap[photoType];
    const hasExistingPhoto = existingEvidence && existingEvidence[photoField];
    
    // Set session for evidence photo upload
    userSessions.set(chatId, {
      type: 'evidence_photo',
      orderId: orderId,
      photoType: photoType,
      data: {}
    });
    
    let message = `📸 **Upload ${photoTypeNames[photoType] || 'Foto'}**\n\n`;
    message += `📋 **Order**: ${order.customer_name}\n`;
    message += `🏠 **Alamat**: ${order.customer_address}\n\n`;
    
    if (hasExistingPhoto) {
      message += `⚠️ **Foto sudah ada sebelumnya**\n`;
      message += `🔗 **URL Lama**: ${existingEvidence[photoField]}\n\n`;
      message += 'Kirim foto baru untuk mengganti foto yang sudah ada:';
    } else {
      message += 'Silakan kirim foto yang diminta:';
    }
    
    bot.sendMessage(chatId, message);
    
  } catch (error) {
    console.error('Error handling evidence photo:', error);
    bot.sendMessage(chatId, '❌ Terjadi kesalahan. Silakan coba lagi.');
  }
}

async function handleSurveyResult(chatId, telegramId, orderId, result) {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Get order details
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();
    
    if (error || !order) {
      bot.sendMessage(chatId, '❌ Order tidak ditemukan.');
      return;
    }
    
    // Save survey progress
    const { error: progressError } = await supabase
      .from('progress')
      .insert({
        order_id: orderId,
        stage: 'Survey',
        status: result,
        note: null,
        timestamp: new Date().toISOString()
      });
    
    if (progressError) {
      console.error('Error saving survey progress:', progressError);
      bot.sendMessage(chatId, '❌ Gagal menyimpan hasil survey. Silakan coba lagi.');
      return;
    }
    
    if (result === 'Ready') {
      // Update order status to In Progress
      await supabase
        .from('orders')
        .update({ status: 'In Progress' })
        .eq('id', orderId);
      
      bot.sendMessage(chatId, 
        `✅ **Survey Selesai!**\n\n` +
        `📋 **Order**: ${order.customer_name}\n` +
        `🏠 **Alamat**: ${order.customer_address}\n` +
        `🔍 **Hasil Survey**: ✅ Jaringan Ready\n\n` +
        'Order status telah diupdate ke **In Progress**.\n' +
        'Silakan lanjutkan ke tahapan berikutnya.'
      );
      
    } else {
      // Update order status to On Hold
      await supabase
        .from('orders')
        .update({ status: 'On Hold' })
        .eq('id', orderId);
      
      bot.sendMessage(chatId, 
        `❌ **Survey Selesai!**\n\n` +
        `📋 **Order**: ${order.customer_name}\n` +
        `🏠 **Alamat**: ${order.customer_address}\n` +
        `🔍 **Hasil Survey**: ❌ Jaringan Not Ready\n\n` +
        'Order status telah diupdate ke **On Hold**.\n' +
        'HD akan mendapat notifikasi untuk update LME PT2.'
      );
      
      // Notify HD about network not ready
      await notifyHDAboutNetworkNotReady(orderId);
    }
    
  } catch (error) {
    console.error('Error handling survey result:', error);
    bot.sendMessage(chatId, '❌ Terjadi kesalahan. Silakan coba lagi.');
  }
}

async function notifyHDAboutNetworkNotReady(orderId) {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Get order details
    const { data: order, error } = await supabase
      .from('orders')
      .select('*, users!assigned_technician(*)')
      .eq('id', orderId)
      .single();
    
    if (error || !order) {
      console.error('Error getting order for HD notification:', error);
      return;
    }
    
    // Get all HD users
    const { data: hdUsers, error: hdError } = await supabase
      .from('users')
      .select('telegram_id, name')
      .eq('role', 'HD');
    
    if (hdError || !hdUsers) {
      console.error('Error getting HD users:', hdError);
      return;
    }
    
    // Notify all HD users
    for (const hd of hdUsers) {
      if (hd.telegram_id) {
        bot.sendMessage(hd.telegram_id, 
          `🚨 **Notifikasi: Jaringan Not Ready**\n\n` +
          `📋 **Order ID**: ${order.id}\n` +
          `👤 **Pelanggan**: ${order.customer_name}\n` +
          `🏠 **Alamat**: ${order.customer_address}\n` +
          `🔧 **Teknisi**: ${order.users.name}\n` +
          `📊 **Status**: On Hold\n\n` +
          'Silakan update LME PT2 untuk order ini.'
        );
      }
    }
    
  } catch (error) {
    console.error('Error notifying HD about network not ready:', error);
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

async function handlePhotoUpload(msg, telegramId) {
  const chatId = msg.chat.id;
  
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Check if user is in evidence photo session
    const session = userSessions.get(chatId);
    if (!session || session.type !== 'evidence_photo') {
      bot.sendMessage(chatId, 
        '📸 **Foto Diterima!**\n\n' +
        'Silakan pilih jenis evidence terlebih dahulu dengan menggunakan menu /evidence'
      );
      return;
    }
    
    // Get the highest quality photo
    const photo = msg.photo[msg.photo.length - 1];
    const fileId = photo.file_id;
    
    // Get file info from Telegram
    const fileInfo = await bot.getFile(fileId);
    const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${fileInfo.file_path}`;
    
    // Download photo using axios
    const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data);
    
    // Generate unique filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `evidence-${session.orderId}-${session.photoType}-${timestamp}-${fileId}.jpg`;
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('evidence-photos')
      .upload(filename, buffer, {
        contentType: 'image/jpeg',
        upsert: false
      });
    
    if (error) {
      console.error('Error uploading photo to Supabase:', error);
      bot.sendMessage(chatId, '❌ Gagal mengupload foto. Silakan coba lagi.');
      return;
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('evidence-photos')
      .getPublicUrl(filename);
    
    // Update evidence record in database
    const photoFieldMap = {
      'sn': 'photo_sn_ont',
      'tech': 'photo_technician_customer',
      'house': 'photo_customer_house',
      'odp_front': 'photo_odp_front',
      'odp_inside': 'photo_odp_inside',
      'label': 'photo_label_dc',
      'test': 'photo_test_result'
    };
    
    const photoField = photoFieldMap[session.photoType];
    if (photoField) {
      const { error: updateError } = await supabase
        .from('evidence')
        .upsert({
          order_id: session.orderId,
          [photoField]: urlData.publicUrl,
          uploaded_at: new Date().toISOString()
        });
      
      if (updateError) {
        console.error('Error updating evidence record:', updateError);
      }
    }
    
    const photoTypeNames = {
      'sn': 'Foto SN ONT',
      'tech': 'Foto Teknisi + Pelanggan',
      'house': 'Foto Rumah Pelanggan',
      'odp_front': 'Foto Depan ODP',
      'odp_inside': 'Foto Dalam ODP',
      'label': 'Foto Label DC',
      'test': 'Foto Test Redaman'
    };
    
    bot.sendMessage(chatId, 
      `✅ **${photoTypeNames[session.photoType] || 'Foto'} Berhasil Diupload!**\n\n` +
      `📸 **File**: ${filename}\n` +
      `🔗 **URL**: ${urlData.publicUrl}\n\n` +
      'Foto telah tersimpan ke Supabase Storage dan database.\n' +
      'Silakan lanjutkan upload foto evidence lainnya atau gunakan menu /evidence untuk memilih jenis foto lain.'
    );
    
    // Clear session after successful upload
    userSessions.delete(chatId);
    
  } catch (error) {
    console.error('Error handling photo upload:', error);
    bot.sendMessage(chatId, 
      '❌ Terjadi kesalahan saat mengupload foto.\n' +
      'Silakan coba lagi atau hubungi admin.'
    );
  }
}

// Handle errors
bot.on('error', (error) => {
  console.error('❌ Bot error:', error);
});

bot.on('polling_error', (error) => {
  console.error('❌ Polling error:', error);
});

console.log('✅ Complete bot started successfully!');
console.log('📱 Send /start to your bot to test');
console.log('🔧 Bot features:');
console.log('   - Complete user registration');
console.log('   - Full order creation flow');
console.log('   - Progress tracking');
console.log('   - Evidence upload (basic)');
console.log('   - Report generation');
console.log('   - Database integration');
console.log('   - Session management');
console.log('   - Technician notifications');
