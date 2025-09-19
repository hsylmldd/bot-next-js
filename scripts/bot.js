const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

// Handle reply keyboard button presses atau ini adalah markup keyboard
async function handleReplyKeyboardButtons(chatId, telegramId, text, role) {
  try {
    switch (text) {
      case '📋 Buat Order':
      case '📋 Order Saya':
        if (role === 'HD') {
          startCreateOrder(chatId, telegramId);
        } else {
          showMyOrders(chatId, telegramId, role);
        }
        break;
      
      case '📊 Lihat Order':
        showMyOrders(chatId, telegramId, 'HD');
        break;
      
      case '📈 Laporan':
        showReportMenu(chatId, telegramId);
        break;
      
      case '⚙️ Update Status':
        // Show update status menu for HD
        bot.sendMessage(chatId, 'Fitur update status order akan segera tersedia.', getReplyMenuKeyboard(role));
        break;
      
      case '📝 Update Progress':
        showProgressMenu(chatId, telegramId);
        break;
      
      case '📸 Upload Evidence':
        showEvidenceMenu(chatId, telegramId);
        break;
      
      case '❓ Bantuan':
        showHelpByRole(chatId, role);
        break;
      
      
      default:
        // If text doesn't match any button, show menu
        const firstName2 = await getUserName(telegramId);
        showWelcomeMessage(chatId, role, firstName2);
        break;
    }
  } catch (error) {
    console.error('Error handling reply keyboard:', error);
    bot.sendMessage(chatId, '❌ Terjadi kesalahan. Silakan coba lagi.', getReplyMenuKeyboard(role));
  }
}

// Helper function to get user name
async function getUserName(telegramId) {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    const { data: user } = await supabase
      .from('users')
      .select('name')
      .eq('telegram_id', telegramId)
      .single();
    
    return user?.name || 'User';
  } catch (error) {
    return 'User';
  }
}

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

// Store media groups temporarily to handle batch uploads
const mediaGroups = new Map();

// Handle photo uploads
bot.on('photo', (msg) => {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id.toString();
  
  console.log(`📨 Received photo from ${msg.from.first_name} (${chatId})`);
  
  // Handle media group (multiple photos sent together)
  if (msg.media_group_id) {
    handleMediaGroup(msg, telegramId);
  } else {
    // Single photo
    handleSinglePhoto(msg, telegramId);
  }
});

// Handle media group (batch photos)
async function handleMediaGroup(msg, telegramId) {
  const chatId = msg.chat.id;
  const mediaGroupId = msg.media_group_id;
  
  // Initialize or add to media group
  if (!mediaGroups.has(mediaGroupId)) {
    mediaGroups.set(mediaGroupId, {
      photos: [],
      chatId: chatId,
      telegramId: telegramId,
      timeout: null
    });
  }
  
  const group = mediaGroups.get(mediaGroupId);
  group.photos.push(msg);
  
  // Clear existing timeout
  if (group.timeout) {
    clearTimeout(group.timeout);
  }
  
  // Set timeout to process group after 1 second of no new photos
  group.timeout = setTimeout(async () => {
    await processBatchPhotos(mediaGroupId);
    mediaGroups.delete(mediaGroupId);
  }, 1000);
}

// Process batch photos
async function processBatchPhotos(mediaGroupId) {
  const group = mediaGroups.get(mediaGroupId);
  if (!group) return;
  
  const { photos, chatId, telegramId } = group;
  console.log(`Processing batch of ${photos.length} photos for media group ${mediaGroupId}`);
  
  // Process each photo in sequence to avoid race conditions
  for (const photo of photos) {
    await handleSinglePhoto(photo, telegramId);
    // Small delay between photos to ensure proper sequencing
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

// Handle single photo (extracted from original code)
async function handleSinglePhoto(msg, telegramId) {
  const chatId = msg.chat.id;
  const session = userSessions.get(chatId);
  
  if (!session || session.step !== 'photos') {
    bot.sendMessage(chatId, '❌ Tidak ada sesi upload foto yang aktif. Silakan mulai dengan /evidence terlebih dahulu.');
    return;
  }

  // Prevent duplicate processing
  const photoId = msg.photo[msg.photo.length - 1].file_unique_id;
  if (session.processedPhotos && session.processedPhotos.has(photoId)) {
    console.log('Photo already processed, skipping duplicate');
    return;
  }
  
  // Initialize processed photos set if not exists
  if (!session.processedPhotos) {
    session.processedPhotos = new Set();
  }
  
  // Mark photo as being processed
  session.processedPhotos.add(photoId);

  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Define photo types with correct field names matching database schema
    const photoTypes = {
      1: { field: 'photo_sn_ont', label: 'Foto SN ONT' },
      2: { field: 'photo_technician_customer', label: 'Foto Teknisi + Pelanggan' },
      3: { field: 'photo_customer_house', label: 'Foto Rumah Pelanggan' },
      4: { field: 'photo_odp_front', label: 'Foto Depan ODP' },
      5: { field: 'photo_odp_inside', label: 'Foto Dalam ODP' },
      6: { field: 'photo_label_dc', label: 'Foto Label DC' },
      7: { field: 'photo_test_result', label: 'Foto Test Redaman' }
    };

    // Get current photo number
    const photoNumber = session.data.uploadedPhotos + 1;
    
    // Check if we've already uploaded 7 photos
    if (photoNumber > 7) {
      bot.sendMessage(chatId, '✅ Semua 7 foto evidence sudah berhasil diupload!');
      return;
    }
    
    const currentPhoto = photoTypes[photoNumber];

    console.log(`Processing photo ${photoNumber}: ${currentPhoto.label}`); // Debug log

    // Get file from Telegram
    const fileId = msg.photo[msg.photo.length - 1].file_id;
    const file = await bot.getFile(fileId);
    const response = await axios({
      method: 'get',
      url: `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${file.file_path}`,
      responseType: 'arraybuffer'
    });

    // Prepare file for upload
    const buffer = Buffer.from(response.data);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `evidence-${session.orderId}-${currentPhoto.field}-${timestamp}.jpg`;

    console.log('Uploading file:', filename); // Debug log

    // Upload to Supabase Storage
    const { error: uploadError, data: uploadData } = await supabase.storage
      .from('evidence-photos')
      .upload(filename, buffer, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      bot.sendMessage(chatId, `❌ Gagal upload ${currentPhoto.label}. Silakan coba lagi.`);
      return;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('evidence-photos')
      .getPublicUrl(filename);

    console.log('Got public URL:', urlData.publicUrl); // Debug log

    // Update evidence record in database
    const { error: updateError } = await supabase
      .from('evidence')
      .update({
        [currentPhoto.field]: urlData.publicUrl
      })
      .eq('order_id', session.orderId);

    if (updateError) {
      console.error('Evidence update error:', updateError);
      bot.sendMessage(chatId, `❌ Gagal menyimpan ${currentPhoto.label} ke database.`);
      return;
    }

    console.log(`Updated database for ${currentPhoto.field}`); // Debug log

    // Increment counter AFTER successful save
    session.data.uploadedPhotos++;

    // Send success message
    bot.sendMessage(chatId,
      `✅ ${currentPhoto.label} Berhasil Disimpan!\n\n` +
      `📊 Progress: ${session.data.uploadedPhotos}/7 foto\n\n` +
      (session.data.uploadedPhotos < 7 
        ? `Silakan upload foto ke-${session.data.uploadedPhotos + 1}: ${photoTypes[session.data.uploadedPhotos + 1].label}`
        : '🎉 Semua evidence berhasil disimpan!')
    );

    // Close order if all photos are uploaded
    if (session.data.uploadedPhotos >= 7) {
      const { error: closeError } = await supabase
        .from('orders')
        .update({ status: 'Closed' })
        .eq('order_id', session.orderId);

      if (closeError) {
        console.error('Error closing order:', closeError);
        bot.sendMessage(chatId, '⚠️ Order berhasil diselesaikan tapi gagal update status.');
      } else {
        bot.sendMessage(chatId, '🎉 Order berhasil diselesaikan dan status telah diupdate ke "Closed"!');
      }

      // Clear session
      userSessions.delete(chatId);
    }

  } catch (error) {
    console.error('Error in handleSinglePhoto:', error);
    bot.sendMessage(chatId, '❌ Terjadi kesalahan saat memproses foto. Silakan coba lagi.');
  }
}

// Handle text messages (for session input)
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id.toString();
  const text = msg.text;

  // Skip command
  if (text && text.startsWith('/')) return;

  // Check if user has active session first
  const session = userSessions.get(chatId);
  if (session) {
    if (session.type === 'evidence_upload') {
      await handleEvidenceUploadFlow(chatId, telegramId, text, msg, session);
      return;
    }
    await handleSessionInput(chatId, telegramId, text, msg, session);
    return;
  }

  // Handle reply keyboard buttons only if no active session
  if (text && !text.startsWith('/')) {
    const role = await getUserRole(telegramId);
    if (role) {
      await handleReplyKeyboardButtons(chatId, telegramId, text, role);
      return;
    }
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
    {
      
      ...getMainMenuKeyboard(role),
      ...getReplyMenuKeyboard(role)
    }
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



// Fungsi untuk reply keyboard menu yang muncul di text input
function getReplyMenuKeyboard(role) {
  if (role === 'HD') {
    return {
      reply_markup: {
        keyboard: [
          ['📋 Buat Order', '📊 Lihat Order'],
          ['📈 Laporan', '⚙️ Update Status'],
          ['❓ Bantuan']
        ],
        resize_keyboard: true,
        one_time_keyboard: false,
        persistent: true
      }
    };
  } else {
    return {
      reply_markup: {
        keyboard: [
          ['📋 Order Saya', '📝 Update Progress'],
          ['📸 Upload Evidence', '❓ Bantuan']
          
        ],
        resize_keyboard: true,
        one_time_keyboard: false,
        persistent: true
      }
    };
  }
}

function startCreateOrder(chatId, telegramId) {
  // Set session untuk order creation
  userSessions.set(chatId, {
    type: 'create_order',
    step: 'order_id',
    data: {}
  });
   
bot.sendMessage(chatId,
  '📋 Membuat Order Baru\n\n' +
  '🆔 Silakan masukkan Order ID:'





  // bot.sendMessage(chatId, 
  //   '📋 Membuat Order Baru\n\n' +
  //   'Silakan masukkan informasi order secara lengkap:\n\n' +
  //   '1️⃣ Nama Pelanggan:',
  //   getPersistentMenuKeyboard()
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

function showProgressMenu(chatId, telegramId) {
  // Get user's assigned orders first
  getUserAssignedOrders(telegramId).then(orders => {
    if (!orders || orders.length === 0) {
      bot.sendMessage(chatId, '📝 Update Progress\n\nTidak ada order aktif yang ditugaskan kepada Anda.', getPersistentMenuKeyboard());
      return;
    }
    
    let message = '📝 Update Progress\n\nPilih order yang akan diupdate:\n\n';
    const keyboard = [];
    
    orders.forEach((order, index) => {
      message += `${index + 1}. ${order.customer_name} (${order.status})\n`;
      keyboard.push([{ 
        text: `${index + 1}. ${order.customer_name}`, 
        callback_data: `progress_order_${order.order_id}` 
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
      bot.sendMessage(chatId, '📸 Upload Evidence\n\nTidak ada order aktif yang ditugaskan kepada Anda.');
      return;
    }
    
    let message = '📸 Upload Evidence\n\nPilih order untuk memulai proses evidence close:\n\n';
    const keyboard = [];
    
    orders.forEach((order, index) => {
      message += `${index + 1}. ${order.customer_name} (${order.status})\n`;
      keyboard.push([{ 
        text: `${index + 1}. ${order.customer_name}`, 
        callback_data: `evidence_order_${order.order_id}` 
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
    '📈 Generate Laporan\n\n' +
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

async function handleSessionInput(chatId, telegramId, text, msg, session) {
  try {
    if (session.type === 'create_order') {
      await handleCreateOrderInput(chatId, telegramId, text, session);
    } else if (session.type === 'update_progress') {
      await handleUpdateProgressInput(chatId, telegramId, text, session);
    } else if (session.type === 'evidence_upload_flow') {
      await handleEvidenceUploadFlow(chatId, telegramId, text, msg, session);
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
  
  if (session.step === 'order_id') {
    // Validasi Order ID tidak duplikat
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id')
      .eq('order_id', text)
      .single();
    
    if (existingOrder) {
      bot.sendMessage(chatId, 
        '❌ Order ID sudah ada!\n\n' +
        '🆔 Silakan masukkan Order ID yang berbeda:'
      );
      return;
    }
    
    session.data.order_id = text;
    session.step = 'customer_name';
    
    bot.sendMessage(chatId, 
      '✅ Order ID: ' + text + '\n\n' +
      '1️⃣ Nama Pelanggan:'
    );
    
  } else if (session.step === 'customer_name') {
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
    
  } else if (session.step === 'transaction_type') {
    session.step = 'service_type';
    
    bot.sendMessage(chatId, 
      '✅ Type Transaksi: ' + session.data.transaction_type + '\n\n' +
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
    
  } else if (session.step === 'assign_technician') {
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
    
    let message = '✅ Jenis Layanan: ' + session.data.service_type + '\n\n';
    message += '7️⃣ Pilih Teknisi yang akan ditugaskan:\n\n';
    
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
      .eq('order_id', session.orderId)
      .eq('status', 'Pending');
    
    bot.sendMessage(chatId, 
      `✅ Progress Berhasil Diupdate!\n\n` +
      `📝 Tahapan: ${session.stage}\n` +
      `📊 Status: Selesai\n` +
      `📝 Catatan: ${text || 'Tidak ada catatan'}\n\n` +
      'Progress telah tersimpan ke database.'
    );
    
    userSessions.delete(chatId);
    
  } catch (error) {
    console.error('Error handling progress update:', error);
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
      await startEvidenceUploadFlow(chatId, telegramId, orderId);
    } else if (data.startsWith('survey_ready_')) {
      const orderId = data.split('_')[2];
      await handleSurveyResult(chatId, telegramId, orderId, 'Ready');
    } else if (data.startsWith('survey_not_ready_')) {
      const orderId = data.split('_')[3];
      await handleSurveyResult(chatId, telegramId, orderId, 'Not Ready');
    } else if (data === 'report_daily') {
      await generateDailyReport(chatId, telegramId);
    } else if (data === 'report_weekly') {
      await generateWeeklyReport(chatId, telegramId);
    } else if (data.startsWith('update_pt2_selesai_')) {
      const orderId = data.split('_')[3];
      // Update status order ke PT2 Selesai
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      await supabase
        .from('orders')
        .update({ 
          status: 'PT2 Selesai',
          pt2_completion_time: new Date().toISOString()
        })
        .eq('order_id', orderId);

      bot.sendMessage(chatId, '✅ Waktu PT2 selesai telah diupdate. TTI Comply 3x24 jam dimulai otomatis!');
      await notifyHDPT2SelesaiWithTTI(orderId);
    } else if (data.startsWith('update_lme_pt2_')) {
      const orderId = data.split('_')[3];
      // Update LME PT2 time
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      await supabase
        .from('orders')
        .update({ 
          status: 'LME PT2 Updated',
          lme_pt2_update_time: new Date().toISOString()
        })
        .eq('order_id', orderId);

      bot.sendMessage(chatId, '✅ Waktu LME PT2 telah diupdate. Teknisi dapat melanjutkan pekerjaan.');
    } else if (data.startsWith('view_order_')) {
      const orderId = data.split('_')[2];
      await showOrderDetails(chatId, orderId);
    } else {
      bot.sendMessage(chatId, 'Fitur ini sedang dalam pengembangan.');
    }
    
  } catch (error) {
    console.error('Error handling callback query:', error);
    bot.sendMessage(chatId, '❌ Terjadi kesalahan. Silakan coba lagi.');
  }
}

async function handleSTOSelection(chatId, telegramId, sto) {
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

async function handleTransactionTypeSelection(chatId, telegramId, transactionType) {
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
            { text: 'Metro', callback_data: 'service_metro' }
          ],
          [
            { text: 'Vpn Ip', callback_data: 'service_vpn ip' },
            { text: 'Ip Transit', callback_data: 'service_ip transit' }
          ],
          [
            { text: 'Siptrunk', callback_data: 'service_siptrunk' }
          ]
        ]
      }
    }
  );
}

async function handleServiceTypeSelection(chatId, telegramId, serviceType) {
  const session = userSessions.get(chatId);
  if (!session || session.type !== 'create_order') {
    bot.sendMessage(chatId, '❌ Session tidak valid. Silakan mulai ulang.');
    return;
  }
  
  session.data.service_type = serviceType;
  session.step = 'assign_technician';
  
  // Get available technicians
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
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
        order_id: session.data.order_id,
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
      `📋 Order ID: ${order.order_id}\n` +
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
        '🔔 Order Baru Ditugaskan!\n\n' +
        `📋 Order ID: ${order.order_id}\n` +
        `👤 Pelanggan: ${order.customer_name}\n` +
        `🏠 Alamat: ${order.customer_address}\n` +
        `📞 Kontak: ${order.contact}\n` +
        `🏢 STO: ${order.sto}\n` +
        `🔄 Type Transaksi: ${order.transaction_type}\n` +
        `🌐 Jenis Layanan: ${order.service_type}\n` +
        `📊 Status: Pending\n\n` +
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
      .eq('order_id', orderId)
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
    
    let message = '📝 Update Progress\n\n';
    message += `📋 Order: ${order.customer_name}\n`;
    message += `🏠 Alamat: ${order.customer_address}\n`;
    message += `📊 Status: ${getStatusEmoji(order.status)} ${order.status}\n\n`;
    
    if (progress && progress.length > 0) {
      message += '📈 Progress Terakhir:\n';
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
    
    report += `\n📋 Total Order*: ${orders.length}\n`;
    
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
    
    let report = '📈 Laporan Mingguan\n\n';
    report += `📅 Periode: ${startOfWeek.toLocaleDateString('id-ID')} - ${endOfWeek.toLocaleDateString('id-ID')}\n\n`;
    report += '📈 Statistik Order:\n';
    
    Object.entries(statusCounts).forEach(([status, count]) => {
      report += `${getStatusEmoji(status)} ${status}: ${count}\n`;
    });
    
    report += `\n📋 Total Order: ${orders.length}\n`;
    
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
      .eq('order_id', orderId)
      .single();
    
    if (error || !order) {
      bot.sendMessage(chatId, '❌ Order tidak ditemukan.');
      return;
    }
    
    bot.sendMessage(chatId, 
      '🔍 Survey Jaringan\n\n' +
      `📋 Order: ${order.customer_name}\n` +
      `🏠 Alamat: ${order.customer_address}\n\n` +
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
      .eq('order_id', orderId)
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
      '🔌 Penarikan Kabel\n\n' +
      `📋 Order: ${order.customer_name}\n` +
      `🏠 Alamat: ${order.customer_address}\n\n` +
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
      .eq('order_id', orderId)
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
      '📡 P2P (Point-to-Point)\n\n' +
      `📋 Order: ${order.customer_name}\n` +
      `🏠 Alamat: ${order.customer_address}\n\n` +
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
      .eq('order_id', orderId)
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
      '📱 Instalasi ONT\n\n' +
      `📋 Order: ${order.customer_name}\n` +
      `🏠 Alamat: ${order.customer_address}\n\n` +
      'Masukkan catatan instalasi ONT (opsional):'
    );
    
  } catch (error) {
    console.error('Error handling instalasi:', error);
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
      .select('*, users!assigned_technician(*)')
      .eq('order_id', orderId)
      .single();

    if (error || !order) {
      bot.sendMessage(chatId, '❌ Order tidak ditemukan.');
      return;
    }

    // Save progress based on result
    if (result === 'Ready') {
      // Update order status to In Progress
      await supabase
        .from('orders')
        .update({ status: 'In Progress' })
        .eq('order_id', orderId);

      // Save survey progress
      await supabase
        .from('progress')
        .insert({
          order_id: orderId,
          stage: 'Survey',
          status: 'Ready',
          timestamp: new Date().toISOString()
        });

      bot.sendMessage(chatId, 
        '✅ Survey Selesai!\n\n' +
        `📋 Order: ${order.customer_name}\n` +
        `📊 Status: Jaringan Ready\n\n` +
        'Silakan lanjutkan ke tahap penarikan kabel.'
      );

    } else {
      // Update order status to On Hold
      await supabase
        .from('orders')
        .update({ status: 'On Hold' })
        .eq('order_id', orderId);

      // Save survey progress
      await supabase
        .from('progress')
        .insert({
          order_id: orderId,
          stage: 'Survey',
          status: 'Not Ready',
          timestamp: new Date().toISOString()
        });

      bot.sendMessage(chatId, '❌ Jaringan Not Ready. Status order diupdate ke On Hold.');
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
      .eq('order_id', orderId)
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
    
    // Save notification record
    try {
      await supabase
        .from('notifications')
        .insert({
          order_id: orderId,
          type: 'network_not_ready',
          message: 'HD notified about network not ready status',
          sent_at: new Date().toISOString(),
          status: 'sent'
        });
    } catch (notifError) {
      console.log('Notification logging failed (table may not exist):', notifError.message);
    }
    
    // Notify all HD users
    for (const hd of hdUsers) {
      if (hd.telegram_id) {
        bot.sendMessage(hd.telegram_id, 
          `🚨 **NETWORK NOT READY ALERT**\n\n` +
          `📋 **Order ID**: #${order.order_id}\n` +
          `👤 **Pelanggan**: ${order.customer_name}\n` +
          `🏠 **Alamat**: ${order.customer_address}\n` +
          `🔧 **Teknisi**: ${order.users?.name || 'Unknown'}\n\n` +
          `⚠️ **Status**: On Hold - Jaringan Not Ready\n` +
          `📝 **Instruksi**: Silakan update waktu LME PT2\n\n` +
          `⏰ **Waktu Notifikasi**: ${new Date().toLocaleString('id-ID')}\n\n` +
          `🎯 **Action Required**: TTI Comply dalam 3x24 jam setelah PT2 selesai`,
          { 
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [
                  { text: ' Update LME PT2', callback_data: `update_lme_pt2_${orderId}` },
                  { text: ' Lihat Detail', callback_data: `view_order_${orderId}` }
                ]
              ]
            }
          }
        );
      }
    }
    
    console.log(`✅ Network not ready notification sent to HD for order ${orderId}`);
    
  } catch (error) {
    console.error('Error notifying HD about network not ready:', error);
  }

// ini yng upload photo dengan benar
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
}}




async function notifyHDPT2SelesaiWithTTI(orderId) {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Get order details
    const { data: order } = await supabase
      .from('orders')
      .select('*, users!assigned_technician(*)')
      .eq('order_id', orderId)
      .single();

    // Get all HD users
    const { data: hdUsers } = await supabase
      .from('users')
      .select('telegram_id, name')
      .eq('role', 'HD');

    // Notify all HD users
    for (const hd of hdUsers) {
      if (hd.telegram_id) {
        bot.sendMessage(hd.telegram_id,
          `✅ **PT2 SELESAI - TTI COMPLY DIMULAI**\n\n` +
          `📋 **Order ID**: #${order.order_id}\n` +
          `👤 **Pelanggan**: ${order.customer_name}\n` +
          `🏠 **Alamat**: ${order.customer_address}\n` +
          `🔧 **Teknisi**: ${order.users?.name || 'Unknown'}\n` +
          `📊 **Status**: PT2 Selesai\n` +
          `⏰ **Waktu PT2 Selesai**: ${new Date().toLocaleString('id-ID')}\n\n` +
          `🚀 **TTI COMPLY 3x24 JAM DIMULAI OTOMATIS!**\n` +
          `⏰ **Deadline**: ${new Date(Date.now() + 72*60*60*1000).toLocaleString('id-ID')}\n` +
          `📊 **Monitoring**: Otomatis dengan reminder berkala`,
          { parse_mode: 'Markdown' }
        );
      }
    }
    
    // Start TTI Comply countdown automatically
    await startTTIComplyCountdown(orderId);
    
    console.log(`✅ PT2 completion notification sent and TTI Comply started for order ${orderId}`);
    
  } catch (error) {
    console.error('Error notifying HD PT2 selesai with TTI:', error);
  }
}

// TTI Comply system functions
async function startTTIComplyCountdown(orderId) {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Calculate TTI Comply deadline (3x24 hours = 72 hours)
    const startTime = new Date();
    const deadlineTime = new Date(startTime.getTime() + (72 * 60 * 60 * 1000)); // 72 hours
    
    // Save TTI Comply record
    const ttiData = {
      order_id: orderId,
      start_time: startTime.toISOString(),
      deadline_time: deadlineTime.toISOString(),
      status: 'active',
      remaining_hours: 72
    };
    
    try {
      await supabase
        .from('tti_comply')
        .insert(ttiData);
    } catch (ttiError) {
      console.log('TTI Comply tracking failed (table may not exist):', ttiError.message);
    }
    
    // Schedule reminder notifications
    scheduleTTIReminders(orderId, deadlineTime);
    
    console.log(`✅ TTI Comply countdown started for order ${orderId}`);
    
  } catch (error) {
    console.error('Error starting TTI Comply countdown:', error);
  }
}

// Schedule TTI reminder notifications
function scheduleTTIReminders(orderId, deadlineTime) {
  const now = new Date();
  const timeToDeadline = deadlineTime.getTime() - now.getTime();
  
  // Reminder at 48 hours remaining (24 hours after start)
  const reminder48h = timeToDeadline - (48 * 60 * 60 * 1000);
  if (reminder48h > 0) {
    setTimeout(() => {
      sendTTIReminder(orderId, '48 jam', 'warning');
    }, reminder48h);
  }
  
  // Reminder at 24 hours remaining (48 hours after start)
  const reminder24h = timeToDeadline - (24 * 60 * 60 * 1000);
  if (reminder24h > 0) {
    setTimeout(() => {
      sendTTIReminder(orderId, '24 jam', 'urgent');
    }, reminder24h);
  }
  
  // Reminder at 6 hours remaining
  const reminder6h = timeToDeadline - (6 * 60 * 60 * 1000);
  if (reminder6h > 0) {
    setTimeout(() => {
      sendTTIReminder(orderId, '6 jam', 'critical');
    }, reminder6h);
  }
  
  // Final reminder at deadline
  if (timeToDeadline > 0) {
    setTimeout(() => {
      sendTTIReminder(orderId, '0 jam', 'expired');
    }, timeToDeadline);
  }
}

// Send TTI reminder notification
async function sendTTIReminder(orderId, remainingTime, urgencyLevel) {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Get order details
    const { data: order } = await supabase
      .from('orders')
      .select('*, users!assigned_technician(*)')
      .eq('order_id', orderId)
      .single();
    
    // Get all HD users
    const { data: hdUsers } = await supabase
      .from('users')
      .select('telegram_id, name')
      .eq('role', 'HD');
    
    // Determine message based on urgency level
    let emoji, title, priority;
    switch (urgencyLevel) {
      case 'warning':
        emoji = '⚠️';
        title = 'TTI COMPLY WARNING';
        priority = 'MEDIUM';
        break;
      case 'urgent':
        emoji = '🚨';
        title = 'TTI COMPLY URGENT';
        priority = 'HIGH';
        break;
      case 'critical':
        emoji = '🔴';
        title = 'TTI COMPLY CRITICAL';
        priority = 'CRITICAL';
        break;
      case 'expired':
        emoji = '💀';
        title = 'TTI COMPLY EXPIRED';
        priority = 'EXPIRED';
        break;
      default:
        emoji = '⏰';
        title = 'TTI COMPLY REMINDER';
        priority = 'INFO';
    }
    
    // Send reminder to all HD users
    for (const hd of hdUsers) {
      if (hd.telegram_id) {
        bot.sendMessage(hd.telegram_id, 
          `${emoji} **${title}**\n\n` +
          `📋 **Order ID**: #${order.order_id}\n` +
          `👤 **Pelanggan**: ${order.customer_name}\n` +
          `🏠 **Alamat**: ${order.customer_address}\n` +
          `🔧 **Teknisi**: ${order.users?.name || 'Unknown'}\n\n` +
          `⏳ **Sisa Waktu**: ${remainingTime}\n` +
          `⚠️ **Prioritas**: ${priority}\n\n` +
          `${urgencyLevel === 'expired' ? 
            '💀 **TTI COMPLY SUDAH EXPIRED!**\n📞 Segera ambil tindakan darurat!' :
            '🎯 **TTI harus comply sebelum deadline!**'
          }`,
          { parse_mode: 'Markdown' }
        );
      }
    }
    
    console.log(`✅ TTI reminder sent for order ${orderId} - ${remainingTime} remaining`);
    
  } catch (error) {
    console.error('Error sending TTI reminder:', error);
  }
}

// Show order details function
async function showOrderDetails(chatId, orderId) {
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
      .eq('order_id', orderId)
      .single();
    
    if (error || !order) {
      bot.sendMessage(chatId, '❌ Order tidak ditemukan.');
      return;
    }
    
    // Get progress history
    const { data: progress } = await supabase
      .from('progress')
      .select('*')
      .eq('order_id', orderId)
      .order('timestamp', { ascending: true });
    
    let progressText = '';
    if (progress && progress.length > 0) {
      progressText = '\n\n📋 **Progress History:**\n';
      progress.forEach((p, index) => {
        progressText += `${index + 1}. ${p.stage} - ${p.status}\n`;
        progressText += `   ⏰ ${new Date(p.timestamp).toLocaleString('id-ID')}\n`;
        if (p.note) progressText += `   📝 ${p.note}\n`;
      });
    }
    
    bot.sendMessage(chatId, 
      `📋 **Detail Order #${order.order_id}**\n\n` +
      `👤 **Pelanggan**: ${order.customer_name}\n` +
      `🏠 **Alamat**: ${order.customer_address}\n` +
      `📞 **Kontak**: ${order.customer_phone || 'N/A'}\n` +
      `🔧 **Teknisi**: ${order.users?.name || 'Belum ditugaskan'}\n` +
      `📊 **Status**: ${order.status}\n` +
      `⏰ **Dibuat**: ${new Date(order.created_at).toLocaleString('id-ID')}\n` +
      `🏢 **STO**: ${order.sto || 'N/A'}\n` +
      `💼 **Tipe Transaksi**: ${order.transaction_type || 'N/A'}\n` +
      `🔧 **Tipe Service**: ${order.service_type || 'N/A'}` +
      progressText,
      { parse_mode: 'Markdown' }
    );
    
  } catch (error) {
    console.error('Error showing order details:', error);
    bot.sendMessage(chatId, '❌ Terjadi kesalahan saat mengambil detail order.');
  }
}

function showHelpByRole(chatId, role) {
  let helpText = `Panduan Penggunaan Bot\n\n`;
  
  if (role === 'HD') {
    helpText += `Untuk Helpdesk (HD):\n\n` +
      `📋 Buat Order Baru - Membuat order instalasi baru\n` +
      `📊 Lihat Semua Order - Melihat semua order dalam sistem\n` +
      `📈 Generate Laporan - Membuat laporan harian/mingguan\n` +
      `⚙️ Update Status Order - Update status order (SOD, E2E, LME PT2)\n\n` +
      `Commands:\n` +
      `/start - Memulai bot\n` +
      `/help - Menampilkan panduan ini\n` +
      `/order - Membuat order baru\n` +
      `/myorders - Melihat semua order\n` +
      `/report - Generate laporan\n\n` +
      `Flow Order:\n` +
      `1. Buat order → Assign teknisi\n` +
      `2. Input SOD & E2E time\n` +
      `3. Monitor progress teknisi\n` +
      `4. Update LME PT2 jika diperlukan\n` +
      `5. Review evidence sebelum close`;
  } else {
    helpText += `Untuk Teknisi:\n\n` +
      `📋 Order Saya - Melihat order yang ditugaskan\n` +
      `📝 Update Progress - Update progress instalasi\n` +
      `📸 Upload Evidence - Upload foto dan data evidence\n\n` +
      `Commands:\n` +
      `/start - Memulai bot\n` +
      `/help - Menampilkan panduan ini\n` +
      `/myorders - Melihat order saya\n` +
      `/progress - Update progress\n` +
      `/evidence - Upload evidence\n\n` +
      `Flow Instalasi:\n` +
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

// 1. Start evidence flow
async function startEvidenceUploadFlow(chatId, telegramId, orderId) {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Get order details first
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (error || !order) {
      console.error('Error getting order:', error);
      bot.sendMessage(chatId, '❌ Order tidak ditemukan.');
      return;
    }

    // Set session with order details
    userSessions.set(chatId, {
      type: 'evidence_upload',
      step: 'odp',
      orderId,
      data: {
        order_name: order.customer_name,
        order_address: order.customer_address
      }
    });

    

    // Start evidence flow
    bot.sendMessage(chatId, 
      '📸 Upload Evidence\n\n' +
      `📋 Order: ${order.customer_name}\n` +
      `🏠 Alamat: ${order.customer_address}\n\n` +
      'Silakan masukkan nama ODP:',
    );

    

  } catch (error) {
    console.error('Error starting evidence flow:', error);
    bot.sendMessage(chatId, '❌ Terjadi kesalahan. Silakan coba lagi.');
  }
}

// 2. Handle evidence input
async function handleEvidenceUploadFlow(chatId, telegramId, text, msg, session) {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Handle ODP input
    if (session.step === 'odp') {
      session.data.odp = text;
      session.step = 'sn_ont';
      bot.sendMessage(chatId, 'Silakan masukkan SN ONT:');
      return;
    }

    // Handle SN ONT input  
    if (session.step === 'sn_ont') {
      session.data.sn_ont = text;
      session.step = 'photos';
      session.data.uploadedPhotos = 0;

      // Create initial evidence record
      const { error: createError } = await supabase
        .from('evidence')
        .insert({
          order_id: session.orderId,
          odp_name: session.data.odp,
          ont_sn: text
        });

      if (createError) {
        console.error('Error creating evidence:', createError);
        bot.sendMessage(chatId, '❌ Gagal menyimpan data awal. Silakan coba lagi.');
        return;
      }

      bot.sendMessage(chatId, 'Silakan kirim 7 foto evidence secara berurutan:\n\n1. Foto SN ONT\n2. Foto Teknisi + Pelanggan\n3. Foto Rumah Pelanggan\n4. Foto Depan ODP\n5. Foto Dalam ODP\n6. Foto Label DC\n7. Foto Test Redaman');
      return;
    }

    // Photo uploads are now handled by the main photo handler (bot.on('photo'))
    // This prevents duplicate processing
    
  } catch (error) {
    console.error('Error in evidence flow:', error);
    bot.sendMessage(chatId, '❌ Terjadi kesalahan. Silakan coba lagi.');
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
