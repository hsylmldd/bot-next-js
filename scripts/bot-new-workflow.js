const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

// User sessions untuk menyimpan state
const userSessions = new Map();

console.log('🤖 Starting New Workflow Order Management Bot...');
console.log('📱 Bot will handle new workflow properly');
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
          [{ text: '❓ Bantuan', callback_data: 'help' }]
        ]
      }
    };
  } else {
    return {
      reply_markup: {
        inline_keyboard: [
          [{ text: '📋 Order Saya', callback_data: 'my_orders' }],
          [{ text: '❓ Bantuan', callback_data: 'help' }]
        ]
      }
    };
  }
}

async function startCreateOrder(chatId, telegramId) {
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
    const keyboard = [];
    
    orders.forEach((order, index) => {
      const statusEmoji = getStatusEmoji(order.status);
      message += `${index + 1}. **${order.customer_name}**\n`;
      message += `   Status: ${statusEmoji} ${order.status}\n`;
      message += `   Alamat: ${order.customer_address}\n`;
      message += `   Kontak: ${order.contact}\n`;
      message += `   Dibuat: ${new Date(order.created_at).toLocaleDateString('id-ID')}\n\n`;
      
      if (role === 'Teknisi' && order.status !== 'Closed') {
        keyboard.push([{ 
          text: `${index + 1}. ${order.customer_name}`, 
          callback_data: `work_order_${order.id}` 
        }]);
      }
    });
    
    if (keyboard.length > 0) {
      bot.sendMessage(chatId, message, {
        reply_markup: {
          inline_keyboard: keyboard
        }
      });
    } else {
      bot.sendMessage(chatId, message);
    }
    
  } catch (error) {
    console.error('Error showing orders:', error);
    bot.sendMessage(chatId, '❌ Terjadi kesalahan saat mengambil data order.');
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

async function handleSessionInput(chatId, telegramId, text, session) {
  try {
    if (session.type === 'create_order') {
      await handleCreateOrderInput(chatId, telegramId, text, session);
    } else if (session.type === 'survey') {
      await handleSurveyInput(chatId, telegramId, text, session);
    } else if (session.type === 'time_tracking') {
      await handleTimeTrackingInput(chatId, telegramId, text, session);
    } else if (session.type === 'evidence_close') {
      await handleEvidenceCloseInput(chatId, telegramId, text, session);
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

async function handleSurveyInput(chatId, telegramId, text, session) {
  // Handle survey input (jaringan ready/tidak)
  bot.sendMessage(chatId, '✅ Survey berhasil dicatat!');
  userSessions.delete(chatId);
}

async function handleTimeTrackingInput(chatId, telegramId, text, session) {
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  try {
    // Validate time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(text)) {
      bot.sendMessage(chatId, 
        '❌ Format waktu tidak valid!\n\n' +
        'Silakan masukkan waktu dalam format HH:MM (contoh: 14:30):'
      );
      return;
    }
    
    // Get order details
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', session.orderId)
      .single();
    
    if (error || !order) {
      bot.sendMessage(chatId, '❌ Order tidak ditemukan.');
      userSessions.delete(chatId);
      return;
    }
    
    const timeTypeNames = {
      'penarikan': 'Penarikan Kabel',
      'p2p': 'P2P (Point-to-Point)'
    };
    
    // Save progress
    const { error: progressError } = await supabase
      .from('progress')
      .insert({
        order_id: session.orderId,
        stage: timeTypeNames[session.timeType],
        status: 'Selesai',
        note: `Waktu selesai: ${text}`,
        timestamp: new Date().toISOString()
      });
    
    if (progressError) {
      console.error('Error saving time progress:', progressError);
      bot.sendMessage(chatId, '❌ Gagal menyimpan waktu. Silakan coba lagi.');
      return;
    }
    
    // Determine next step
    if (session.timeType === 'penarikan') {
      // After penarikan, ask for P2P time
      session.timeType = 'p2p';
      bot.sendMessage(chatId, 
        `✅ **Waktu ${timeTypeNames[session.timeType]} Berhasil Dicatat!**\n\n` +
        `📋 **Order**: ${order.customer_name}\n` +
        `🏠 **Alamat**: ${order.customer_address}\n` +
        `⏰ **Waktu Penarikan**: ${text}\n\n` +
        'Silakan masukkan waktu selesai P2P (format: HH:MM):'
      );
    } else if (session.timeType === 'p2p') {
      // After P2P, automatically start evidence close
      bot.sendMessage(chatId, 
        `✅ **Waktu ${timeTypeNames[session.timeType]} Berhasil Dicatat!**\n\n` +
        `📋 **Order**: ${order.customer_name}\n` +
        `🏠 **Alamat**: ${order.customer_address}\n` +
        `⏰ **Waktu P2P**: ${text}\n\n` +
        '🎉 **Semua waktu tracking selesai!**\n\n' +
        'Sekarang lanjut ke Evidence Close...'
      );
      
      // Clear time tracking session
      userSessions.delete(chatId);
      
      // Automatically start evidence close
      setTimeout(() => {
        startEvidenceClose(chatId, telegramId, session.orderId);
      }, 2000);
    }
    
  } catch (error) {
    console.error('Error handling time tracking input:', error);
    bot.sendMessage(chatId, '❌ Terjadi kesalahan. Silakan coba lagi.');
  }
}

async function handleEvidenceCloseInput(chatId, telegramId, text, session) {
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
    session.step = 'photo_upload';
    
    // Get order details for display
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', session.orderId)
      .single();
    
    if (error || !order) {
      bot.sendMessage(chatId, '❌ Order tidak ditemukan.');
      userSessions.delete(chatId);
      return;
    }
    
    session.data.customer_name = order.customer_name;
    session.data.customer_address = order.customer_address;
    
    bot.sendMessage(chatId, 
      '✅ SN ONT: **' + text + '**\n\n' +
      '📸 **Evidence Close - Upload 7 Foto**\n\n' +
      `📋 **Order**: ${order.customer_name}\n` +
      `🏠 **Alamat**: ${order.customer_address}\n` +
      `📝 **Nama ODP**: ${session.data.odp_name}\n` +
      `📱 **SN ONT**: ${session.data.ont_sn}\n\n` +
      '**Silakan upload foto ke-1: Foto SN ONT**'
    );
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
    } else if (data === 'my_orders') {
      showMyOrders(chatId, telegramId, 'Teknisi');
    } else if (data.startsWith('assign_tech_')) {
      const techId = data.split('_')[2];
      await assignTechnician(chatId, telegramId, techId);
    } else if (data.startsWith('work_order_')) {
      const orderId = data.split('_')[2];
      await showWorkOrderMenu(chatId, telegramId, orderId);
    } else if (data.startsWith('survey_')) {
      const orderId = data.split('_')[1];
      const result = data.split('_')[2];
      await handleSurveyResult(chatId, telegramId, orderId, result);
    } else if (data.startsWith('time_')) {
      const orderId = data.split('_')[1];
      const timeType = data.split('_')[2];
      await handleTimeTracking(chatId, telegramId, orderId, timeType);
    } else if (data.startsWith('evidence_close_')) {
      const orderId = data.split('_')[2];
      await startEvidenceClose(chatId, telegramId, orderId);
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

async function showWorkOrderMenu(chatId, telegramId, orderId) {
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
    
    let message = '🔧 **Work Order**\n\n';
    message += `📋 **Order**: ${order.customer_name}\n`;
    message += `🏠 **Alamat**: ${order.customer_address}\n`;
    message += `📞 **Kontak**: ${order.contact}\n`;
    message += `📊 **Status**: ${getStatusEmoji(order.status)} ${order.status}\n\n`;
    
    // Check progress
    const { data: progress, error: progressError } = await supabase
      .from('progress')
      .select('*')
      .eq('order_id', orderId)
      .order('timestamp', { ascending: false });
    
    if (progressError) {
      console.error('Error fetching progress:', progressError);
    }
    
    if (progress && progress.length > 0) {
      message += '📈 **Progress Terakhir:**\n';
      progress.slice(0, 3).forEach(p => {
        message += `• ${p.stage}: ${getProgressStatusEmoji(p.status)} ${p.status}\n`;
      });
      message += '\n';
    }
    
    // Determine next action based on status
    const keyboard = [];
    
    if (order.status === 'Pending') {
      message += '🔍 **Langkah Selanjutnya: Survey Jaringan**\n\n';
      message += 'Pilih hasil survey:';
      keyboard.push(
        [{ text: '✅ Jaringan Ready', callback_data: `survey_${orderId}_ready` }],
        [{ text: '❌ Jaringan Not Ready', callback_data: `survey_${orderId}_not_ready` }]
      );
    } else if (order.status === 'In Progress') {
      message += '⏰ **Langkah Selanjutnya: Tracking Waktu**\n\n';
      message += 'Silakan mulai dengan input waktu penarikan kabel:';
      
      // Automatically start time tracking for penarikan
      setTimeout(() => {
        handleTimeTracking(chatId, telegramId, orderId, 'penarikan');
      }, 1000);
    } else if (order.status === 'On Hold') {
      message += '⏸️ **Order dalam status On Hold**\n\n';
      message += 'Menunggu jaringan siap dari HD.';
    }
    
    bot.sendMessage(chatId, message, {
      reply_markup: {
        inline_keyboard: keyboard
      }
    });
    
  } catch (error) {
    console.error('Error showing work order menu:', error);
    bot.sendMessage(chatId, '❌ Terjadi kesalahan. Silakan coba lagi.');
  }
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
    
    if (result === 'ready') {
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
        'Sekarang lanjut ke tracking waktu...'
      );
      
      // Automatically start time tracking for penarikan
      setTimeout(() => {
        handleTimeTracking(chatId, telegramId, orderId, 'penarikan');
      }, 2000);
      
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

async function handleTimeTracking(chatId, telegramId, orderId, timeType) {
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
    
    const timeTypeNames = {
      'penarikan': 'Penarikan Kabel',
      'p2p': 'P2P (Point-to-Point)'
    };
    
    // Set session for time tracking
    userSessions.set(chatId, {
      type: 'time_tracking',
      orderId: orderId,
      timeType: timeType,
      data: {}
    });
    
    bot.sendMessage(chatId, 
      `⏰ **Tracking Waktu ${timeTypeNames[timeType]}**\n\n` +
      `📋 **Order**: ${order.customer_name}\n` +
      `🏠 **Alamat**: ${order.customer_address}\n\n` +
      'Masukkan waktu selesai (format: HH:MM):'
    );
    
  } catch (error) {
    console.error('Error handling time tracking:', error);
    bot.sendMessage(chatId, '❌ Terjadi kesalahan. Silakan coba lagi.');
  }
}

async function startEvidenceClose(chatId, telegramId, orderId) {
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
    
    // Set session for evidence close
    userSessions.set(chatId, {
      type: 'evidence_close',
      step: 'odp_name',
      orderId: orderId,
      data: {}
    });
    
    bot.sendMessage(chatId, 
      '📸 **Evidence Close**\n\n' +
      `📋 **Order**: ${order.customer_name}\n` +
      `🏠 **Alamat**: ${order.customer_address}\n\n` +
      'Masukkan nama ODP:'
    );
    
  } catch (error) {
    console.error('Error starting evidence close:', error);
    bot.sendMessage(chatId, '❌ Terjadi kesalahan. Silakan coba lagi.');
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
    
    // Check if user is in evidence close session
    const session = userSessions.get(chatId);
    if (!session || session.type !== 'evidence_close') {
      bot.sendMessage(chatId, 
        '📸 **Foto Diterima!**\n\n' +
        'Silakan pilih order dan mulai evidence close terlebih dahulu.'
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
    const filename = `evidence-${session.orderId}-${session.data.photoCount || 1}-${timestamp}-${fileId}.jpg`;
    
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
    
    // Store photo URL in session
    if (!session.data.photos) {
      session.data.photos = [];
    }
    session.data.photos.push(urlData.publicUrl);
    session.data.photoCount = (session.data.photoCount || 0) + 1;
    
    const photoTypeNames = [
      'Foto SN ONT',
      'Foto Teknisi + Pelanggan',
      'Foto Rumah Pelanggan',
      'Foto Depan ODP',
      'Foto Dalam ODP',
      'Foto Label DC',
      'Foto Test Redaman'
    ];
    
    const currentPhotoIndex = session.data.photoCount - 1;
    const currentPhotoName = photoTypeNames[currentPhotoIndex] || `Foto ${session.data.photoCount}`;
    
    if (session.data.photoCount < 7) {
      const nextPhotoIndex = session.data.photoCount;
      const nextPhotoName = photoTypeNames[nextPhotoIndex] || `Foto ${session.data.photoCount + 1}`;
      
      bot.sendMessage(chatId, 
        `✅ **${currentPhotoName} Berhasil Disimpan!**\n\n` +
        `📸 **File**: ${filename}\n` +
        `🔗 **URL**: ${urlData.publicUrl}\n\n` +
        `📊 **Progress**: ${session.data.photoCount}/7 foto\n\n` +
        `**Silakan upload foto ke-${session.data.photoCount + 1}: ${nextPhotoName}**`
      );
    } else {
      // All photos uploaded, save to database and close order
      await completeEvidenceClose(chatId, telegramId, session);
    }
    
  } catch (error) {
    console.error('Error handling photo upload:', error);
    bot.sendMessage(chatId, 
      '❌ Terjadi kesalahan saat mengupload foto.\n' +
      'Silakan coba lagi atau hubungi admin.'
    );
  }
}

async function completeEvidenceClose(chatId, telegramId, session) {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Save evidence to database
    const { error: evidenceError } = await supabase
      .from('evidence')
      .upsert({
        order_id: session.orderId,
        odp_name: session.data.odp_name,
        ont_sn: session.data.ont_sn,
        photo_sn_ont: session.data.photos[0],
        photo_technician_customer: session.data.photos[1],
        photo_customer_house: session.data.photos[2],
        photo_odp_front: session.data.photos[3],
        photo_odp_inside: session.data.photos[4],
        photo_label_dc: session.data.photos[5],
        photo_test_result: session.data.photos[6],
        uploaded_at: new Date().toISOString()
      });
    
    if (evidenceError) {
      console.error('Error saving evidence:', evidenceError);
      bot.sendMessage(chatId, '❌ Gagal menyimpan evidence. Silakan coba lagi.');
      return;
    }
    
    // Update order status to Closed
    const { error: orderError } = await supabase
      .from('orders')
      .update({ status: 'Closed' })
      .eq('id', session.orderId);
    
    if (orderError) {
      console.error('Error updating order status:', orderError);
    }
    
    // Add final progress
    await supabase
      .from('progress')
      .insert({
        order_id: session.orderId,
        stage: 'Evidence Close',
        status: 'Selesai',
        note: 'Semua evidence berhasil diupload',
        timestamp: new Date().toISOString()
      });
    
    // Clear session
    userSessions.delete(chatId);
    
    bot.sendMessage(chatId, 
     'Evidence Close Berhasil Diselesaikan!\n\n' +
      `Order: ${session.data.customer_name || 'Order'}\n` +
      ` Alamat: ${session.data.customer_address || 'Alamat'}\n` +
      `Nama ODP: ${session.data.odp_name}\n` +
      `SN ONT: ${session.data.ont_sn}\n` +
      `Total Foto: 7/7 ✅\n\n` +
      'Status Order: CLOSED\n' +
      '✅ Order telah ditutup dan dihapus dari daftar order Anda\n' +
      '📊 Progress telah diupdate ke database\n' +
      '🎯 Semua evidence telah tersimpan dengan lengkap'
    );
    
  } catch (error) {
    console.error('Error completing evidence close:', error);
    bot.sendMessage(chatId, '❌ Terjadi kesalahan. Silakan coba lagi.');
  }
}

function showHelpByRole(chatId, role) {
  let helpText = `**Panduan Penggunaan Bot**\n\n`;
  
  if (role === 'HD') {
    helpText += `**Untuk Helpdesk (HD):**\n\n` +
      `📋 **Buat Order Baru** - Membuat order instalasi baru\n` +
      `📊 **Lihat Semua Order** - Melihat semua order dalam sistem\n\n` +
      `**Commands:**\n` +
      `/start - Memulai bot\n` +
      `/help - Menampilkan panduan ini\n` +
      `/order - Membuat order baru\n` +
      `/myorders - Melihat semua order\n\n` +
      `**Flow Order:**\n` +
      `1. Buat order → Assign teknisi\n` +
      `2. Monitor progress teknisi\n` +
      `3. Terima notifikasi jika jaringan tidak ready`;
  } else {
    helpText += `**Untuk Teknisi:**\n\n` +
      `📋 **Order Saya** - Melihat order yang ditugaskan\n\n` +
      `**Commands:**\n` +
      `/start - Memulai bot\n` +
      `/help - Menampilkan panduan ini\n` +
      `/myorders - Melihat order saya\n\n` +
      `**Flow Instalasi:**\n` +
      `1. Terima notifikasi order baru\n` +
      `2. Survey jaringan (Ready/Not Ready)\n` +
      `3. Jika Ready: Tracking waktu penarikan & P2P\n` +
      `4. Evidence close: Input data + upload 7 foto\n` +
      `5. Order otomatis close jika evidence lengkap`;
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

// Handle errors
bot.on('error', (error) => {
  console.error('❌ Bot error:', error);
});

bot.on('polling_error', (error) => {
  console.error('❌ Polling error:', error);
});

console.log('✅ New workflow bot started successfully!');
console.log('📱 Send /start to your bot to test');
console.log('🔧 Bot features:');
console.log('   - New workflow: Survey → Time Tracking → Evidence Close');
console.log('   - Evidence close with 7 photos');
console.log('   - Auto close order when evidence complete');
console.log('   - Database integration');
console.log('   - Session management');
console.log('   - Technician notifications');
