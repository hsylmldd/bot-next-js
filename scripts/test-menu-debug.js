const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config({ path: '.env.local' });

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

// Menu states untuk setiap user
const menuStates = new Map();

console.log('🤖 Starting Menu Debug Bot...');
console.log('📱 Testing menu navigation features');

// Test menu keyboard function
function getMainMenuKeyboard(role, currentIndex = 0) {
  let menuItems = [];
  
  if (role === 'HD') {
    menuItems = [
      { text: '📋 Buat Order Baru', callback_data: 'create_order' },
      { text: '📊 Lihat Semua Order', callback_data: 'view_orders' },
      { text: '📈 Generate Laporan', callback_data: 'generate_report' },
      { text: '⚙️ Update Status Order', callback_data: 'update_status' },
      { text: '❓ Bantuan', callback_data: 'help' }
    ];
  } else {
    menuItems = [
      { text: '📋 Order Saya', callback_data: 'my_orders' },
      { text: '📝 Update Progress', callback_data: 'update_progress' },
      { text: '📸 Upload Evidence', callback_data: 'upload_evidence' },
      { text: '❓ Bantuan', callback_data: 'help' }
    ];
  }

  // Batasi currentIndex agar tidak keluar dari range
  currentIndex = Math.max(0, Math.min(currentIndex, menuItems.length - 1));
  
  // Buat keyboard dengan item yang dipilih dan navigasi
  const keyboard = [];
  
  // Tambahkan item menu yang sedang aktif
  keyboard.push([menuItems[currentIndex]]);
  
  // Tambahkan tombol navigasi
  const navigationRow = [];
  
  if (currentIndex > 0) {
    navigationRow.push({ text: '⬆️', callback_data: `nav_up_${currentIndex}` });
  }
  
  if (currentIndex < menuItems.length - 1) {
    navigationRow.push({ text: '⬇️', callback_data: `nav_down_${currentIndex}` });
  }
  
  if (navigationRow.length > 0) {
    keyboard.push(navigationRow);
  }
  
  // Tambahkan tombol "Tampilkan Semua Menu"
  keyboard.push([{ text: '📋 Tampilkan Semua Menu', callback_data: 'show_all_menu' }]);

  return {
    reply_markup: {
      inline_keyboard: keyboard
    }
  };
}

function getAllMenuKeyboard(role) {
  if (role === 'HD') {
    return {
      reply_markup: {
        inline_keyboard: [
          [{ text: '📋 Buat Order Baru', callback_data: 'create_order' }],
          [{ text: '📊 Lihat Semua Order', callback_data: 'view_orders' }],
          [{ text: '📈 Generate Laporan', callback_data: 'generate_report' }],
          [{ text: '⚙️ Update Status Order', callback_data: 'update_status' }],
          [{ text: '❓ Bantuan', callback_data: 'help' }],
          [{ text: '🔄 Kembali ke Menu Navigasi', callback_data: 'back_to_nav_menu' }]
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
          [{ text: '❓ Bantuan', callback_data: 'help' }],
          [{ text: '🔄 Kembali ke Menu Navigasi', callback_data: 'back_to_nav_menu' }]
        ]
      }
    };
  }
}

// Handle /start command - langsung tampilkan menu tanpa cek database
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name || 'User';
  
  console.log(`📨 Received /start from ${firstName} (${chatId})`);
  
  // Set default role sebagai HD untuk testing
  const role = 'HD';
  menuStates.set(chatId, { currentIndex: 0, role: role });
  
  bot.sendMessage(chatId, 
    `Halo ${firstName}! 👋\n\n` +
    `Role: 📋 Helpdesk (Test Mode)\n\n` +
    'Selamat datang di Order Management Bot!\n\n' +
    'Gunakan menu di bawah untuk mengakses fitur:\n' +
    '⬆️⬇️ Gunakan tombol panah untuk navigasi menu',
    getMainMenuKeyboard(role, 0)
  );
});

// Handle /teknisi command untuk test role teknisi
bot.onText(/\/teknisi/, (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name || 'User';
  
  console.log(`📨 Received /teknisi from ${firstName} (${chatId})`);
  
  const role = 'Teknisi';
  menuStates.set(chatId, { currentIndex: 0, role: role });
  
  bot.sendMessage(chatId, 
    `Halo ${firstName}! 👋\n\n` +
    `Role: 🔧 Teknisi (Test Mode)\n\n` +
    'Selamat datang di Order Management Bot!\n\n' +
    'Gunakan menu di bawah untuk mengakses fitur:\n' +
    '⬆️⬇️ Gunakan tombol panah untuk navigasi menu',
    getMainMenuKeyboard(role, 0)
  );
});

// Handle callback queries
bot.on('callback_query', async (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;
  
  try {
    await bot.answerCallbackQuery(callbackQuery.id);
    
    if (data.startsWith('nav_up_')) {
      // Handle navigasi up
      const currentIndex = parseInt(data.split('_')[2]);
      const menuState = menuStates.get(chatId);
      if (menuState && currentIndex > 0) {
        const newIndex = currentIndex - 1;
        menuState.currentIndex = newIndex;
        menuStates.set(chatId, menuState);
        
        // Update menu dengan posisi baru
        bot.editMessageReplyMarkup(
          getMainMenuKeyboard(menuState.role, newIndex).reply_markup,
          {
            chat_id: chatId,
            message_id: callbackQuery.message.message_id
          }
        );
      }
    } else if (data.startsWith('nav_down_')) {
      // Handle navigasi down
      const currentIndex = parseInt(data.split('_')[2]);
      const menuState = menuStates.get(chatId);
      if (menuState) {
        // Tentukan jumlah menu berdasarkan role
        const maxItems = menuState.role === 'HD' ? 5 : 4;
        if (currentIndex < maxItems - 1) {
          const newIndex = currentIndex + 1;
          menuState.currentIndex = newIndex;
          menuStates.set(chatId, menuState);
          
          // Update menu dengan posisi baru
          bot.editMessageReplyMarkup(
            getMainMenuKeyboard(menuState.role, newIndex).reply_markup,
            {
              chat_id: chatId,
              message_id: callbackQuery.message.message_id
            }
          );
        }
      }
    } else if (data === 'show_all_menu') {
      // Tampilkan semua menu sekaligus
      const menuState = menuStates.get(chatId);
      if (menuState) {
        const allMenuKeyboard = getAllMenuKeyboard(menuState.role);
        bot.editMessageReplyMarkup(
          allMenuKeyboard.reply_markup,
          {
            chat_id: chatId,
            message_id: callbackQuery.message.message_id
          }
        );
      }
    } else if (data === 'back_to_nav_menu') {
      // Kembali ke menu navigasi
      const menuState = menuStates.get(chatId);
      if (menuState) {
        bot.editMessageReplyMarkup(
          getMainMenuKeyboard(menuState.role, menuState.currentIndex).reply_markup,
          {
            chat_id: chatId,
            message_id: callbackQuery.message.message_id
          }
        );
      }
    } else {
      bot.sendMessage(chatId, `✅ Anda memilih: ${data}\n\nIni adalah mode test, fitur belum diimplementasi.`);
    }
    
  } catch (error) {
    console.error('Error handling callback query:', error);
    bot.sendMessage(chatId, '❌ Terjadi kesalahan. Silakan coba lagi.');
  }
});

bot.on('error', (error) => {
  console.error('Bot error:', error);
});

bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

console.log('✅ Menu Debug Bot started successfully!');
console.log('📱 Send /start untuk test menu HD');
console.log('📱 Send /teknisi untuk test menu Teknisi');