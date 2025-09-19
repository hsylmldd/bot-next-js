import TelegramBot from 'node-telegram-bot-api';
import { createClient } from '@supabase/supabase-js';

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN || '', { 
  polling: false // Disable polling for webhook
});

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// User sessions untuk menyimpan state
const userSessions = new Map();

console.log('🤖 Starting Telegram Bot (Webhook Mode)...');

// Handle /start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from?.first_name || 'User';
  const telegramId = msg.from?.id.toString() || '';
  
  console.log(`📨 Received /start from ${firstName} (${chatId})`);
  
  // Clear any existing session
  userSessions.delete(chatId);
  
  // Check if user is registered
  checkUserRegistration(chatId, telegramId, firstName, msg.from?.last_name || '');
});

// Handle /help command
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  const telegramId = msg.from?.id.toString() || '';
  
  console.log(`📨 Received /help from ${msg.from?.first_name} (${chatId})`);
  
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
  const telegramId = msg.from?.id.toString() || '';
  
  console.log(`📨 Received /order from ${msg.from?.first_name} (${chatId})`);
  
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
  const telegramId = msg.from?.id.toString() || '';
  
  console.log(`📨 Received /myorders from ${msg.from?.first_name} (${chatId})`);
  
  getUserRole(telegramId).then(role => {
    if (role) {
      showMyOrders(chatId, telegramId, role);
    } else {
      bot.sendMessage(chatId, '❌ Anda belum terdaftar. Gunakan /start untuk mendaftar.');
    }
  });
});

// Handle callback queries
bot.on('callback_query', (callbackQuery) => {
  if (!callbackQuery.message) return;
  
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;
  const telegramId = callbackQuery.from?.id.toString() || '';
  
  console.log(`📨 Received callback: ${data} from ${callbackQuery.from?.first_name}`);
  
  handleCallbackQuery(callbackQuery);
});

// Handle text messages (for session input)
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const telegramId = msg.from?.id.toString() || '';
  const text = msg.text || '';
  
  // Skip if it's a command
  if (text && text.startsWith('/')) {
    return;
  }
  
  // Handle session input
  const session = userSessions.get(chatId);
  if (session && text) {
    handleSessionInput(chatId, telegramId, text, session);
  }
});

// Helper functions
async function checkUserRegistration(chatId: number, telegramId: string, firstName: string, lastName: string) {
  try {
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

async function getUserRole(telegramId: string) {
  try {
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

function showWelcomeMessage(chatId: number, role: string, name: string) {
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

function getMainMenuKeyboard(role: string) {
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

function startCreateOrder(chatId: number, telegramId: string) {
  // Set session untuk order creation
  userSessions.set(chatId, {
    type: 'create_order',
    step: 'customer_name',
    data: {}
  });
  
  bot.sendMessage(chatId, 
    '📋 Membuat Order Baru\n\n' +
    'Silakan masukkan informasi order secara lengkap:\n\n' +
    '1️⃣ Nama Pelanggan:'
  );
}

async function showMyOrders(chatId: number, telegramId: string, role: string) {
  try {
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
      bot.sendMessage(chatId, '📋 Daftar Order\n\nTidak ada order yang ditemukan.');
      return;
    }
    
    let message = '📋 Daftar Order\n\n';
    orders.forEach((order, index) => {
      const statusEmoji = getStatusEmoji(order.status);
      message += `${index + 1}. ${order.customer_name}\n`;
      message += `   Status: ${statusEmoji} ${order.status}\n`;
      message += `   Alamat: ${order.customer_address}\n`;
      message += `   Kontak: ${order.contact}\n`;
      message += `   STO: ${order.sto || 'Belum diisi'}\n`;
      message += `   Type: ${order.transaction_type || 'Belum diisi'}\n`;
      message += `   Layanan: ${order.service_type || 'Belum diisi'}\n`;
      message += `   Dibuat: ${new Date(order.created_at).toLocaleDateString('id-ID')}\n\n`;
    });
    
    bot.sendMessage(chatId, message);
    
  } catch (error) {
    console.error('Error showing orders:', error);
    bot.sendMessage(chatId, '❌ Terjadi kesalahan saat mengambil data order.');
  }
}

function getStatusEmoji(status: string) {
  const statusEmojis: { [key: string]: string } = {
    'Pending': '⏳',
    'In Progress': '🔄',
    'On Hold': '⏸️',
    'Completed': '✅',
    'Closed': '🔒'
  };
  return statusEmojis[status] || '❓';
}

async function handleSessionInput(chatId: number, telegramId: string, text: string, session: any) {
  try {
    if (session.type === 'create_order') {
      await handleCreateOrderInput(chatId, telegramId, text, session);
    }
  } catch (error) {
    console.error('Error handling session input:', error);
    bot.sendMessage(chatId, '❌ Terjadi kesalahan. Silakan coba lagi.');
  }
}

async function handleCreateOrderInput(chatId: number, telegramId: string, text: string, session: any) {
  if (session.step === 'customer_name') {
    session.data.customer_name = text;
    session.step = 'customer_address';
    
    bot.sendMessage(chatId, 
      '✅ Nama pelanggan: ' + text + '\n\n' +
      '2️⃣ Alamat Pelanggan:'
    );
    
  } else if (session.step === 'customer_address') {
    session.data.customer_address = text;
    session.step = 'customer_contact';
    
    bot.sendMessage(chatId, 
      '✅ Alamat pelanggan: ' + text + '\n\n' +
      '3️⃣ Kontak Pelanggan:'
    );
    
  } else if (session.step === 'customer_contact') {
    session.data.contact = text;
    session.step = 'sto_selection';
    
    bot.sendMessage(chatId, 
      '✅ Kontak pelanggan: ' + text + '\n\n' +
      '4️⃣ Pilih STO:',
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: 'CBB', callback_data: 'sto_CBB' },
              { text: 'CWA', callback_data: 'sto_CWA' },
              { text: 'GAN', callback_data: 'sto_GAN' },
              { text: 'JTN', callback_data: 'sto_JTN' }
            ],
            [
              { text: 'KLD', callback_data: 'sto_KLD' },
              { text: 'KRG', callback_data: 'sto_KRG' },
              { text: 'PDK', callback_data: 'sto_PDK' },
              { text: 'PGB', callback_data: 'sto_PGB' }
            ],
            [
              { text: 'PGG', callback_data: 'sto_PGG' },
              { text: 'PSR', callback_data: 'sto_PSR' },
              { text: 'RMG', callback_data: 'sto_RMG' },
              { text: 'BIN', callback_data: 'sto_BIN' }
            ],
            [
              { text: 'CPE', callback_data: 'sto_CPE' },
              { text: 'JAG', callback_data: 'sto_JAG' },
              { text: 'KAL', callback_data: 'sto_KAL' },
              { text: 'KBY', callback_data: 'sto_KBY' }
            ],
            [
              { text: 'KMG', callback_data: 'sto_KMG' },
              { text: 'PSM', callback_data: 'sto_PSM' },
              { text: 'TBE', callback_data: 'sto_TBE' },
              { text: 'NAS', callback_data: 'sto_NAS' }
            ]
          ]
        }
      }
    );
  }
}

async function handleCallbackQuery(callbackQuery: any) {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;
  const telegramId = callbackQuery.from.id.toString();
  
  try {
    await bot.answerCallbackQuery(callbackQuery.id);
    
    if (data === 'register_hd') {
      await registerUser(telegramId, callbackQuery.from.first_name, 'HD');
      bot.sendMessage(chatId, 
        '✅ Registrasi Berhasil!\n\n' +
        'Anda telah terdaftar sebagai HD (Helpdesk).\n\n' +
        'Selamat datang di Order Management Bot!'
      );
      showWelcomeMessage(chatId, 'HD', callbackQuery.from.first_name);
    } else if (data === 'register_teknis') {
      await registerUser(telegramId, callbackQuery.from.first_name, 'Teknisi');
      bot.sendMessage(chatId, 
        '✅ Registrasi Berhasil!\n\n' +
        'Anda telah terdaftar sebagai Teknisi.\n\n' +
        'Selamat datang di Order Management Bot!'
      );
      showWelcomeMessage(chatId, 'Teknisi', callbackQuery.from.first_name);
    } else if (data === 'create_order') {
      startCreateOrder(chatId, telegramId);
    } else if (data === 'view_orders') {
      showMyOrders(chatId, telegramId, 'HD');
    } else if (data === 'my_orders') {
      showMyOrders(chatId, telegramId, 'Teknisi');
    } else if (data === 'help') {
      getUserRole(telegramId).then(role => {
        if (role) {
          showHelpByRole(chatId, role);
        }
      });
    } else if (data.startsWith('sto_')) {
      const sto = data.split('_')[1];
      await handleSTOSelection(chatId, telegramId, sto);
    } else if (data.startsWith('transaction_')) {
      const transactionType = data.split('_')[1];
      await handleTransactionTypeSelection(chatId, telegramId, transactionType);
    } else if (data.startsWith('service_')) {
      const serviceType = data.split('_')[1];
      await handleServiceTypeSelection(chatId, telegramId, serviceType);
    } else if (data.startsWith('assign_tech_')) {
      const techId = data.split('_')[2];
      await assignTechnician(chatId, telegramId, techId);
    } else {
      bot.sendMessage(chatId, 'Fitur ini sedang dalam pengembangan.');
    }
    
  } catch (error) {
    console.error('Error handling callback query:', error);
    bot.sendMessage(chatId, '❌ Terjadi kesalahan. Silakan coba lagi.');
  }
}

async function handleSTOSelection(chatId: number, telegramId: string, sto: string) {
  const session = userSessions.get(chatId);
  if (!session || session.type !== 'create_order') {
    bot.sendMessage(chatId, '❌ Session tidak valid. Silakan mulai ulang.');
    return;
  }
  
  session.data.sto = sto;
  session.step = 'transaction_type';
  
  bot.sendMessage(chatId, 
    '✅ STO: ' + sto + '\n\n' +
    '5️⃣ Pilih Type Transaksi:',
    {
      reply_markup: {
        inline_keyboard: [
          [
            { text: 'Disconnect', callback_data: 'transaction_Disconnect' },
            { text: 'modify', callback_data: 'transaction_modify' }
          ],
          [
            { text: 'new install existing', callback_data: 'transaction_new install existing' },
            { text: 'new install jt', callback_data: 'transaction_new install jt' }
          ],
          [
            { text: 'new install', callback_data: 'transaction_new install' },
            { text: 'PDA', callback_data: 'transaction_PDA' }
          ]
        ]
      }
    }
  );
}

async function handleTransactionTypeSelection(chatId: number, telegramId: string, transactionType: string) {
  const session = userSessions.get(chatId);
  if (!session || session.type !== 'create_order') {
    bot.sendMessage(chatId, '❌ Session tidak valid. Silakan mulai ulang.');
    return;
  }
  
  session.data.transaction_type = transactionType;
  session.step = 'service_type';
  
  bot.sendMessage(chatId, 
    '✅ Type Transaksi: ' + transactionType + '\n\n' +
    '6️⃣ Pilih Jenis Layanan:',
    {
      reply_markup: {
        inline_keyboard: [
          [
            { text: 'Astinet', callback_data: 'service_Astinet' },
            { text: 'metro', callback_data: 'service_metro' }
          ],
          [
            { text: 'vpn ip', callback_data: 'service_vpn ip' },
            { text: 'ip transit', callback_data: 'service_ip transit' }
          ],
          [
            { text: 'siptrunk', callback_data: 'service_siptrunk' }
          ]
        ]
      }
    }
  );
}

async function handleServiceTypeSelection(chatId: number, telegramId: string, serviceType: string) {
  const session = userSessions.get(chatId);
  if (!session || session.type !== 'create_order') {
    bot.sendMessage(chatId, '❌ Session tidak valid. Silakan mulai ulang.');
    return;
  }
  
  session.data.service_type = serviceType;
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
  
  let message = '✅ Jenis Layanan: ' + serviceType + '\n\n';
  message += '7️⃣ Pilih Teknisi yang akan ditugaskan:\n\n';
  
  const keyboard: any[] = [];
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

async function assignTechnician(chatId: number, telegramId: string, techId: string) {
  try {
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
    
    if (!tech) {
      bot.sendMessage(chatId, '❌ Teknisi tidak ditemukan. Silakan coba lagi.');
      return;
    }
    
    // Create order
    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        customer_name: session.data.customer_name,
        customer_address: session.data.customer_address,
        contact: session.data.contact,
        sto: session.data.sto,
        transaction_type: session.data.transaction_type,
        service_type: session.data.service_type,
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
      '✅ Order Berhasil Dibuat!\n\n' +
      `📋 Order ID: ${order.id}\n` +
      `👤 Pelanggan: ${order.customer_name}\n` +
      `🏠 Alamat: ${order.customer_address}\n` +
      `📞 Kontak: ${order.contact}\n` +
      `🏢 STO: ${order.sto}\n` +
      `🔄 Type Transaksi: ${order.transaction_type}\n` +
      `🌐 Jenis Layanan: ${order.service_type}\n` +
      `🔧 Teknisi: ${tech.name}\n` +
      `📊 Status: Pending\n\n` +
      'Teknisi akan mendapat notifikasi order baru.'
    );
    
  } catch (error) {
    console.error('Error assigning technician:', error);
    bot.sendMessage(chatId, '❌ Terjadi kesalahan. Silakan coba lagi.');
  }
}

function showHelpByRole(chatId: number, role: string) {
  let helpText = `Panduan Penggunaan Bot\n\n`;
  
  if (role === 'HD') {
    helpText += `Untuk Helpdesk (HD):\n\n` +
      `📋 Buat Order Baru - Membuat order instalasi baru\n` +
      `📊 Lihat Semua Order - Melihat semua order dalam sistem\n\n` +
      `Commands:\n` +
      `/start - Memulai bot\n` +
      `/help - Menampilkan panduan ini\n` +
      `/order - Membuat order baru\n` +
      `/myorders - Melihat semua order\n\n` +
      `Flow Order:\n` +
      `1. Buat order → Assign teknisi\n` +
      `2. Input semua informasi lengkap\n` +
      `3. Monitor progress teknisi`;
  } else {
    helpText += `Untuk Teknisi:\n\n` +
      `📋 Order Saya - Melihat order yang ditugaskan\n\n` +
      `Commands:\n` +
      `/start - Memulai bot\n` +
      `/help - Menampilkan panduan ini\n` +
      `/myorders - Melihat order saya\n\n` +
      `Flow Instalasi:\n` +
      `1. Terima notifikasi order baru\n` +
      `2. Lihat detail order\n` +
      `3. Update progress sesuai kebutuhan`;
  }
  
  bot.sendMessage(chatId, helpText);
}

async function registerUser(telegramId: string, firstName: string, role: string) {
  try {
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

export { bot };
