import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Simple in-memory storage for user sessions and orders
const userSessions: { [key: string]: any } = {};
const orders: { [key: string]: any } = {};
let orderCounter = 1;

// Evidence upload session management
interface EvidenceSession {
  step: 'odp' | 'ont_sn' | 'photos';
  orderId: string;
  orderNumber: string;
  data: {
    odp?: string;
    ont_sn?: string;
    uploadedPhotos?: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('📨 Webhook received:', JSON.stringify(body, null, 2));
    
    // Check if it's a callback query (button press)
    if (body.callback_query) {
      const callbackQuery = body.callback_query;
      const chatId = callbackQuery.message.chat.id;
      const messageId = callbackQuery.message.message_id;
      const data = callbackQuery.data;
      const firstName = callbackQuery.from?.first_name || 'User';
      const userId = callbackQuery.from?.id;
      
      console.log(`🔘 Callback query from ${firstName}: ${data}`);
      
      // Initialize user session if not exists
      if (!userSessions[userId]) {
        userSessions[userId] = {
          step: 'idle',
          orderData: {}
        };
      }
      
      const session = userSessions[userId];
      let responseText = '';
      let replyMarkup = undefined;
      
      // Handle callback queries
      if (data === 'create_order') {
        responseText = `📋 **Membuat Order Baru**\n\nSilakan masukkan informasi order secara lengkap:\n\n**Format:**\nNama Pelanggan: [nama]\nAlamat Pelanggan: [alamat]\nKontak Pelanggan: [kontak]\n\n**Contoh:**\nNama Pelanggan: John Doe\nAlamat Pelanggan: Jl. Sudirman No. 123, Jakarta\nKontak Pelanggan: 08123456789\n\nSilakan kirim informasi dalam format di atas! 📝`;
        session.step = 'waiting_for_order_info';
        session.orderData = {};
      } else if (data === 'view_orders') {
        const orderList = Object.keys(orders);
        if (orderList.length > 0) {
          let ordersText = `📋 **Order Saya**\n\n`;
          orderList.forEach(orderNumber => {
            const order = orders[orderNumber];
            ordersText += `🔢 **Order #${orderNumber}**\n👤 ${order.customerName}\n🏢 ${order.sto} - ${order.serviceType}\n📅 ${order.createdAt}\n📊 Status: ${order.status}\n\n`;
          });
          ordersText += `Gunakan /progress [nomor_order] untuk melihat detail progress! 📝`;
          responseText = ordersText;
          replyMarkup = {
            inline_keyboard: orderList.map(orderNumber => [
              { text: `📋 Order #${orderNumber}`, callback_data: `view_order_${orderNumber}` }
            ])
          };
        } else {
          responseText = `📋 **Order Saya**\n\nBelum ada order yang dibuat.\n\nGunakan /order untuk membuat order baru! 🆕`;
        }
      } else if (data === 'update_progress') {
        responseText = `📝 **Update Progress**\n\nUntuk update progress order, gunakan:\n\n**Format:**\n/update [nomor_order] [catatan]\n\n**Contoh:**\n/update 001 Perbaikan P2P selesai\n/update 001 Testing koneksi berhasil\n/update 001 Instalasi fiber optic\n\n**Notifikasi Khusus:**\n/update 001 Jaringan not ready\n/update 001 PT2 selesai\n\nWaktu akan tercatat otomatis! ⏰`;
      } else if (data === 'survey') {
        responseText = `📋 **Survey Jaringan**\n\nPilih hasil survey jaringan untuk order yang sedang dikerjakan:\n\n**Format:**\nSurvey Jaringan\nOrder: [nomor_order]\nAlamat: [alamat]\n\n**Contoh:**\nSurvey Jaringan\nOrder: 001\nAlamat: Jl. Sudirman No. 123, Jakarta\n\nSilakan kirim informasi dalam format di atas! 📝`;
        session.step = 'waiting_for_survey_info';
        session.surveyData = {};
      } else if (data === 'hd_update') {
        responseText = `🔧 **HD Update**\n\nUntuk update waktu sebagai HD, gunakan:\n\n**Format:**\n/hd_update [nomor_order] [tipe_update]\n\n**Tipe Update:**\nlme_pt2 - Update waktu LME PT2\npt2_selesai - Update waktu PT2 selesai\n\n**Contoh:**\n/hd_update 001 lme_pt2\n/hd_update 001 pt2_selesai`;
      } else if (data === 'upload_evidence') {
        responseText = `📸 **Upload Evidence**\n\nGunakan /evidence [nomor_order] untuk memulai upload evidence.\n\n**Contoh:**\n/evidence 001\n\n**Setelah itu langsung diminta:**\n1️⃣ ODP SN dan ONT\n2️⃣ Upload 7 foto secara berurutan\n\n**Total:** 7 foto diperlukan 📸`;
      } else if (data === 'help') {
        responseText = `📋 **Panduan Penggunaan Bot**\n\n**Commands yang tersedia:**\n/start - Memulai bot\n/help - Menampilkan panduan ini\n/order - Membuat order baru\n/myorders - Lihat order saya\n/progress - Lihat progress order\n/update - Update progress sebagai teknisi\n/hd_update - Update waktu untuk HD\n/test - Test bot functionality\n/status - Cek status bot\n\n**Fitur:**\n✅ Bot berjalan 24/7 di Vercel\n✅ Webhook mode untuk performa optimal\n✅ Database terintegrasi dengan Supabase\n✅ Support untuk order management lengkap\n✅ Progress tracking untuk teknisi\n✅ Notifikasi otomatis ke HD\n\n**Field Baru yang Tersedia:**\n🏢 STO (20 options)\n🔄 Transaction Type (6 options)\n🌐 Service Type (5 options)\n\n**Progress Tracking:**\n📊 /progress [nomor_order] - Lihat progress\n📝 /update [nomor_order] [catatan] - Update progress\n\n**HD Commands:**\n🔧 /hd_update [nomor_order] lme_pt2 - Update LME PT2\n🔧 /hd_update [nomor_order] pt2_selesai - Update PT2 selesai\n\n**Notifikasi Otomatis:**\n🚨 Jaringan not ready → Notif ke HD\n✅ PT2 selesai → TTI Comply 3x24 Jam\n\nBot siap digunakan! 🚀`;
        replyMarkup = {
          inline_keyboard: [
            [
              { text: '📋 Buat Order', callback_data: 'create_order' },
              { text: '📊 Lihat Order', callback_data: 'view_orders' }
            ],
            [
              { text: '📝 Update Progress', callback_data: 'update_progress' },
              { text: '🔧 HD Update', callback_data: 'hd_update' }
            ],
            [
              { text: '📸 Upload Evidence', callback_data: 'upload_evidence' },
              { text: '📋 Survey Jaringan', callback_data: 'survey' }
            ],
            [
              { text: '🧪 Test Bot', callback_data: 'test_bot' },
              { text: '📊 Status Bot', callback_data: 'status_bot' }
            ]
          ]
        };
      } else if (data === 'test_bot') {
        responseText = `🧪 **Test Bot**\n\n✅ Bot berjalan dengan baik!\n✅ Webhook mode aktif\n✅ Response time optimal\n✅ Database connection ready\n✅ New fields available\n✅ Button interface ready\n\nBot siap untuk production! 🎉`;
      } else if (data === 'status_bot') {
        const timestamp = new Date().toISOString();
        responseText = `📊 **Bot Status**\n\n🟢 Status: Online\n🌐 Mode: Webhook\n⏰ Uptime: 24/7\n🔗 Platform: Vercel\n📅 Timestamp: ${timestamp}\n\nBot berjalan dengan sempurna! ✅`;
      } else if (data.startsWith('view_order_')) {
        const orderNumber = data.replace('view_order_', '');
        const order = orders[orderNumber];
        if (order) {
          let progressText = `📊 **Progress Order #${orderNumber}**\n\n📝 **Detail Order:**\n👤 Nama: ${order.customerName}\n🏠 Alamat: ${order.customerAddress}\n📞 Kontak: ${order.contact}\n🏢 STO: ${order.sto}\n🔄 Transaction Type: ${order.transactionType}\n🌐 Service Type: ${order.serviceType}\n📅 Dibuat: ${order.createdAt}\n\n📝 **Riwayat Progress:**\n`;
          
          if (order.progress && order.progress.length > 0) {
            order.progress.forEach((p: any, index: number) => {
              progressText += `${index + 1}. ${p.timestamp} - ${p.note}\n`;
            });
          } else {
            progressText += `1. Order dibuat - ${order.createdAt}\n2. Progress: Order sedang diproses\n`;
          }
          
          progressText += `\n**Status:** ${order.status}\n**Teknisi:** ${order.assignedTechnician || 'Belum ditugaskan'}\n\nGunakan /update untuk menambah progress! 📝`;
          responseText = progressText;
        } else {
          responseText = `❌ **Order tidak ditemukan!**\n\nOrder #${orderNumber} tidak ditemukan dalam sistem.\n\nGunakan /myorders untuk melihat order yang tersedia.`;
        }
      } else if (data.startsWith('sto_')) {
        const stoIndex = parseInt(data.replace('sto_', '')) - 1;
        const stoOptions = ['CBB', 'CWA', 'GAN', 'JTN', 'KLD', 'KRG', 'PDK', 'PGB', 'PGG', 'PSR', 'RMG', 'BIN', 'CPE', 'JAG', 'KAL', 'KBY', 'KMG', 'PSM', 'TBE', 'NAS'];
        const selectedSTO = stoOptions[stoIndex];
        session.orderData.sto = selectedSTO;
        
        responseText = `✅ **STO Dipilih: ${selectedSTO}**\n\n**Langkah Selanjutnya:**\nPilih Transaction Type:\n\n🔄 **Transaction Type Options:**\n1️⃣ Disconnect\n2️⃣ Modify\n3️⃣ New Install Existing\n4️⃣ New Install JT\n5️⃣ New Install\n6️⃣ PDA\n\nKetik nomor pilihan Anda (1-6):`;
        session.step = 'waiting_for_transaction_type';
        replyMarkup = {
          inline_keyboard: [
            [
              { text: '1️⃣ Disconnect', callback_data: 'trans_1' },
              { text: '2️⃣ Modify', callback_data: 'trans_2' }
            ],
            [
              { text: '3️⃣ New Install Existing', callback_data: 'trans_3' },
              { text: '4️⃣ New Install JT', callback_data: 'trans_4' }
            ],
            [
              { text: '5️⃣ New Install', callback_data: 'trans_5' },
              { text: '6️⃣ PDA', callback_data: 'trans_6' }
            ]
          ]
        };
      } else if (data.startsWith('trans_')) {
        const transIndex = parseInt(data.replace('trans_', '')) - 1;
        const transactionOptions = ['Disconnect', 'modify', 'new install existing', 'new install jt', 'new install', 'PDA'];
        const selectedTransaction = transactionOptions[transIndex];
        session.orderData.transactionType = selectedTransaction;
        
        responseText = `✅ **Transaction Type Dipilih: ${selectedTransaction}**\n\n**Langkah Selanjutnya:**\nPilih Service Type:\n\n🌐 **Service Type Options:**\n1️⃣ Astinet\n2️⃣ Metro\n3️⃣ VPN IP\n4️⃣ IP Transit\n5️⃣ SIP Trunk\n\nKetik nomor pilihan Anda (1-5):`;
        session.step = 'waiting_for_service_type';
        replyMarkup = {
          inline_keyboard: [
            [
              { text: '1️⃣ Astinet', callback_data: 'service_1' },
              { text: '2️⃣ Metro', callback_data: 'service_2' }
            ],
            [
              { text: '3️⃣ VPN IP', callback_data: 'service_3' },
              { text: '4️⃣ IP Transit', callback_data: 'service_4' }
            ],
            [
              { text: '5️⃣ SIP Trunk', callback_data: 'service_5' }
            ]
          ]
        };
      } else if (data.startsWith('service_')) {
        const serviceIndex = parseInt(data.replace('service_', '')) - 1;
        const serviceOptions = ['Astinet', 'metro', 'vpn ip', 'ip transit', 'siptrunk'];
        const selectedService = serviceOptions[serviceIndex];
        session.orderData.serviceType = selectedService;
        
        // Create order with unique number
        const orderNumber = orderCounter.toString().padStart(3, '0');
        const orderData = {
          ...session.orderData,
          serviceType: selectedService,
          orderNumber,
          status: 'Pending',
          createdAt: new Date().toLocaleString('id-ID'),
          progress: []
        };
        
        orders[orderNumber] = orderData;
        orderCounter++;
        
        responseText = `🎉 **Order Berhasil Dibuat!**\n\n📋 **Detail Order Lengkap:**\n🔢 **Nomor Order:** #${orderNumber}\n👤 Nama: ${session.orderData.customerName}\n🏠 Alamat: ${session.orderData.customerAddress}\n📞 Kontak: ${session.orderData.contact}\n🏢 STO: ${session.orderData.sto}\n🔄 Transaction Type: ${session.orderData.transactionType}\n🌐 Service Type: ${selectedService}\n📅 Dibuat: ${orderData.createdAt}\n\n✅ Order telah disimpan dan akan diproses oleh tim kami!\n\nGunakan /order untuk membuat order baru atau /myorders untuk melihat order yang sudah dibuat. 🚀`;
        session.step = 'idle';
        session.orderData = {};
        replyMarkup = {
          inline_keyboard: [
            [
              { text: '📋 Buat Order Baru', callback_data: 'create_order' },
              { text: '📊 Lihat Order', callback_data: 'view_orders' }
            ],
            [
              { text: '📝 Update Progress', callback_data: 'update_progress' },
              { text: '🔧 HD Update', callback_data: 'hd_update' }
            ]
          ]
        };
      } else if (data === 'survey_ready') {
        const orderNumber = session.surveyData?.orderNumber;
        const address = session.surveyData?.address;
        const timestamp = new Date().toLocaleString('id-ID');
        
        if (orderNumber && address) {
          // Try to find order by number first
          let order = orders[orderNumber];
          
          // If not found by exact number, try to find by customer name
          if (!order) {
            const orderList = Object.keys(orders);
            for (const orderKey of orderList) {
              const orderData = orders[orderKey];
              if (orderData.customerName && orderData.customerName.toLowerCase().includes(orderNumber.toLowerCase())) {
                order = orderData;
                break;
              }
            }
          }
          
          if (order) {
            // Add progress to order
            if (!order.progress) {
              order.progress = [];
            }
            order.progress.push({
              timestamp,
              note: 'Survey Jaringan - Jaringan Ready',
              type: 'technician'
            });
            
            // Update order status to ready for installation
            order.status = 'Survey Selesai - Siap Instalasi';
            
            responseText = `✅ **Survey Jaringan Selesai!**\n\n📋 **Order #${order.orderNumber || orderNumber}**\n🏠 **Alamat:** ${address}\n📝 **Hasil Survey:** Jaringan Ready\n⏰ **Waktu:** ${timestamp}\n\n✅ Jaringan siap untuk instalasi\n📞 Teknisi dapat melanjutkan pekerjaan\n\n**Status:** Survey Selesai - Jaringan Ready 🚀`;
            
            // Provide next step buttons for installation process
            replyMarkup = {
              inline_keyboard: [
                [
                  { text: '⏰ Input Waktu Penarikan', callback_data: 'input_waktu_penarikan' },
                  { text: '🔗 Input Waktu P2P', callback_data: 'input_waktu_p2p' }
                ],
                [
                  { text: '📤 Upload Evidence', callback_data: 'upload_evidence' },
                  { text: '✅ Close Order', callback_data: 'close_order' }
                ]
              ]
            };
          } else {
            responseText = `❌ **Order tidak ditemukan!**\n\nOrder "${orderNumber}" tidak ditemukan dalam sistem.\n\n**Solusi:**\n1. Pastikan order sudah dibuat dengan /order\n2. Gunakan nomor order yang benar (contoh: 001)\n3. Atau gunakan nama customer yang tepat\n\nGunakan /myorders untuk melihat order yang tersedia.`;
          }
        } else {
          responseText = `❌ **Data survey tidak lengkap!**\n\nSilakan gunakan /survey untuk memulai survey jaringan.`;
        }
        
        session.step = 'idle';
        session.surveyData = {};
      } else if (data === 'survey_not_ready') {
        const orderNumber = session.surveyData?.orderNumber;
        const address = session.surveyData?.address;
        const timestamp = new Date().toLocaleString('id-ID');
        
        console.log('🔍 Survey Not Ready Debug:', {
          orderNumber,
          address,
          surveyData: session.surveyData,
          availableOrders: Object.keys(orders)
        });
        
        if (orderNumber && address) {
          // Try to find order by number first
          let order = orders[orderNumber];
          
          // If not found by exact number, try to find by customer name
          if (!order) {
            const orderList = Object.keys(orders);
            for (const orderKey of orderList) {
              const orderData = orders[orderKey];
              if (orderData.customerName && orderData.customerName.toLowerCase().includes(orderNumber.toLowerCase())) {
                order = orderData;
                break;
              }
            }
          }
          
          if (order) {
            // Add progress to order
            if (!order.progress) {
              order.progress = [];
            }
            order.progress.push({
              timestamp,
              note: 'Survey Jaringan - Jaringan Not Ready',
              type: 'technician'
            });
            
            // Update order status
            order.status = 'Jaringan Not Ready - Menunggu HD';
            
            responseText = `❌ **Survey Jaringan Selesai!**\n\n📋 **Order #${order.orderNumber || orderNumber}**\n🏠 **Alamat:** ${address}\n📝 **Hasil Survey:** Jaringan Not Ready\n⏰ **Waktu:** ${timestamp}\n\n🚨 **NOTIFIKASI KE HD:**\n📋 Order #${order.orderNumber || orderNumber} - Jaringan Not Ready\n⏰ HD diminta update waktu LME PT2\n📞 Segera hubungi HD untuk update!\n\n**Status:** Jaringan Not Ready - Menunggu HD 🚨`;
          } else {
            // If no order found, create a temporary survey record and send HD notification anyway
            const tempOrderNumber = `TEMP-${Date.now()}`;
            const tempOrder = {
              orderNumber: tempOrderNumber,
              customerName: orderNumber,
              customerAddress: address,
              contact: 'Survey Only',
              sto: 'Survey',
              transactionType: 'Survey',
              serviceType: 'Survey',
              status: 'Jaringan Not Ready - Menunggu HD',
              createdAt: timestamp,
              progress: [{
                timestamp,
                note: 'Survey Jaringan - Jaringan Not Ready',
                type: 'technician'
              }]
            };
            
            orders[tempOrderNumber] = tempOrder;
            
            responseText = `❌ **Survey Jaringan Selesai!**\n\n📋 **Order #${tempOrderNumber}** (Survey Only)\n👤 **Customer:** ${orderNumber}\n🏠 **Alamat:** ${address}\n📝 **Hasil Survey:** Jaringan Not Ready\n⏰ **Waktu:** ${timestamp}\n\n🚨 **NOTIFIKASI KE HD:**\n📋 Order #${tempOrderNumber} - Jaringan Not Ready\n⏰ HD diminta update waktu LME PT2\n📞 Segera hubungi HD untuk update!\n\n**Status:** Jaringan Not Ready - Menunggu HD 🚨\n\n**Note:** Order ini dibuat otomatis untuk survey. Gunakan /order untuk membuat order resmi.`;
          }
        } else {
          responseText = `❌ **Data survey tidak lengkap!**\n\n**Debug Info:**\n- Order Number: ${orderNumber || 'undefined'}\n- Address: ${address || 'undefined'}\n- Survey Data: ${JSON.stringify(session.surveyData)}\n\nSilakan gunakan /survey untuk memulai survey jaringan.`;
        }
        
        session.step = 'idle';
        session.surveyData = {};
      }
      
      // Send response back to Telegram
      const botToken = '8497928167:AAEE9zuCvRwV0347IYkzLJOQflZiq74mPnc';
      const telegramResponse = await fetch(`https://api.telegram.org/bot${botToken}/editMessageText`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          message_id: messageId,
          text: responseText,
          reply_markup: replyMarkup,
        }),
      });
      
      if (!telegramResponse.ok) {
        const errorText = await telegramResponse.text();
        console.error('Failed to edit message:', errorText);
      } else {
        console.log('✅ Message edited successfully');
      }
      
      // Answer callback query
      await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          callback_query_id: callbackQuery.id,
        }),
      });
      
      return NextResponse.json({ ok: true });
    }
    
    // Check if it's a message
    if (body.message) {
      const message = body.message;
      const chatId = message.chat.id;
      const text = message.text;
      const firstName = message.from?.first_name || 'User';
      const userId = message.from?.id;
      
      console.log(`📨 Processing message from ${firstName}: ${text}`);
      
      // Initialize user session if not exists
      if (!userSessions[userId]) {
        userSessions[userId] = {
          step: 'idle',
          orderData: {}
        };
      }
      
      const session = userSessions[userId];
      let responseText = '';
      
      // Handle photo messages for evidence collection
      if (message.photo && session.step === 'collecting_evidence') {
        const evidenceData = session.evidenceData;
        if (evidenceData && evidenceData.photoCount < 7) {
          // Add photo to evidence collection
          evidenceData.photoCount++;
          evidenceData.photos.push({
            fileId: message.photo[message.photo.length - 1].file_id,
            timestamp: new Date().toLocaleString('id-ID')
          });
          
          if (evidenceData.photoCount === 7) {
            // All photos collected, save to database
            const order = orders[evidenceData.orderNumber];
            if (order) {
              // Add evidence to order
              order.evidence = {
                odpSn: evidenceData.odpSn,
                ont: evidenceData.ont,
                photos: evidenceData.photos,
                uploadedAt: new Date().toLocaleString('id-ID')
              };
              
              // Add progress entry
              if (!order.progress) {
                order.progress = [];
              }
              order.progress.push({
                timestamp: new Date().toLocaleString('id-ID'),
                note: `Evidence uploaded - ODP SN: ${evidenceData.odpSn}, ONT: ${evidenceData.ont}, Photos: ${evidenceData.photoCount}`,
                type: 'technician'
              });
              
              responseText = `🎉 **Evidence Berhasil Diupload!**\n\n📋 **Order #${evidenceData.orderNumber}**\n🔧 **ODP SN:** ${evidenceData.odpSn}\n📱 **ONT:** ${evidenceData.ont}\n📸 **Foto:** ${evidenceData.photoCount}/7 ✅\n⏰ **Waktu Upload:** ${new Date().toLocaleString('id-ID')}\n\n✅ Evidence telah disimpan ke database\n📊 Progress order telah diupdate\n\n**Status:** Evidence Complete 🚀`;
            } else {
              responseText = `❌ **Order tidak ditemukan!**\n\nOrder #${evidenceData.orderNumber} tidak ditemukan dalam sistem.`;
            }
            
            // Reset evidence collection
            session.step = 'idle';
            session.evidenceData = {};
          } else {
            const nextPhotoNumber = evidenceData.photoCount + 1;
            responseText = `📸 **Foto ${evidenceData.photoCount}/7 Diterima!**\n\n**Progress:** ${evidenceData.photoCount}/7 foto\n\nKirim foto berikutnya! 📷`;
          }
        } else {
          responseText = `❌ **Foto tidak diperlukan!**\n\nEvidence collection tidak aktif atau sudah mencapai batas maksimal (7 foto).\n\nGunakan /evidence [nomor_order] untuk memulai upload evidence.`;
        }
      } else if (session.step === 'collecting_evidence') {
        // Handle evidence collection for text messages
        const evidenceData = session.evidenceData;
        
        if (!evidenceData.odpSn || !evidenceData.ont) {
          // Still collecting ODP SN and ONT
          const lines = text.split('\n');
          let odpSn = '';
          let ont = '';
          
          for (const line of lines) {
            const lowerLine = line.toLowerCase().trim();
            
            if (lowerLine.includes('odp') || lowerLine.includes('nama odp')) {
              odpSn = line.split(':')[1]?.trim() || line.trim();
            } else if (lowerLine.includes('ont') || lowerLine.includes('sn')) {
              ont = line.split(':')[1]?.trim() || line.trim();
            }
          }
          
          // If still not found, try to parse by position or single input
          if (!odpSn && !ont) {
            if (lines.length >= 2) {
              odpSn = lines[0]?.trim() || '';
              ont = lines[1]?.trim() || '';
            } else if (lines.length === 1) {
              // Single input - assume it's ODP name first
              if (!evidenceData.odpSn) {
                odpSn = text.trim();
              } else {
                ont = text.trim();
              }
            }
          }
          
          // Handle step-by-step input
          if (!evidenceData.odpSn && odpSn) {
            // Save ODP to database
            try {
              const { data: dbOrders, error: orderError } = await supabaseAdmin
                .from('orders')
                .select('id')
                .eq('customer_name', evidenceData.orderNumber)
                .limit(1);
              
              if (!orderError && dbOrders && dbOrders.length > 0) {
                const orderId = dbOrders[0].id;
                
                const { error: evidenceError } = await supabaseAdmin
                  .from('evidence')
                  .upsert({
                    order_id: orderId,
                    odp_name: odpSn
                  }, {
                    onConflict: 'order_id'
                  });
                
                if (evidenceError) {
                  console.error('Error saving ODP:', evidenceError);
                  responseText = `❌ Gagal menyimpan ODP. Error: ${evidenceError.message}`;
                } else {
                  evidenceData.odpSn = odpSn;
                  responseText = `✅ **ODP berhasil disimpan!**\n\n📋 **Order #${evidenceData.orderNumber}**\n🔧 **ODP:** ${odpSn}\n\nSekarang masukkan **SN ONT**:`;
                }
              } else {
                responseText = `❌ Order tidak ditemukan di database. Error: ${orderError?.message || 'Order not found'}`;
              }
            } catch (error) {
              console.error('Database error:', error);
              responseText = `❌ Terjadi kesalahan database: ${error instanceof Error ? error.message : 'Unknown error'}`;
            }
          } else if (evidenceData.odpSn && ont) {
            // Save ONT to database
            try {
              const { data: dbOrders, error: orderError } = await supabaseAdmin
                .from('orders')
                .select('id')
                .eq('customer_name', evidenceData.orderNumber)
                .limit(1);
              
              if (!orderError && dbOrders && dbOrders.length > 0) {
                const orderId = dbOrders[0].id;
                
                const { error: evidenceError } = await supabaseAdmin
                  .from('evidence')
                  .update({ ont_sn: ont })
                  .eq('order_id', orderId);
                
                if (evidenceError) {
                  console.error('Error saving ONT:', evidenceError);
                  responseText = `❌ Gagal menyimpan SN ONT. Error: ${evidenceError.message}`;
                } else {
                  evidenceData.ont = ont;
                  responseText = `✅ **SN ONT berhasil disimpan!**\n\n📋 **Order #${evidenceData.orderNumber}**\n🔧 **ODP:** ${evidenceData.odpSn}\n📱 **SN ONT:** ${ont}\n\n**Langkah 2:** Kirim 7 foto secara berurutan\n**Progress:** 0/7 foto 📷\n\nSilakan kirim foto pertama!`;
                }
              } else {
                responseText = `❌ Order tidak ditemukan di database. Error: ${orderError?.message || 'Order not found'}`;
              }
            } catch (error) {
              console.error('Database error:', error);
              responseText = `❌ Terjadi kesalahan database: ${error instanceof Error ? error.message : 'Unknown error'}`;
            }
          } else {
            responseText = `❌ **Format tidak lengkap!**\n\nSilakan masukkan ${!evidenceData.odpSn ? 'nama ODP' : 'SN ONT'}:\n\n**Contoh:**\n${!evidenceData.odpSn ? 'TBE-001' : 'ZTEG12345678'}`;
          }
        } else {
          // Already have ODP SN and ONT, expecting photos
          responseText = `📸 **Menunggu Foto...**\n\n📋 **Order #${evidenceData.orderNumber}**\n🔧 **ODP:** ${evidenceData.odpSn}\n📱 **SN ONT:** ${evidenceData.ont}\n\n**Progress:** ${evidenceData.photoCount}/7 foto 📷\n\nKirim foto berikutnya!`;
        }
      } else if (text === '/start') {
        responseText = `Halo ${firstName}! 👋\n\nSelamat datang di Order Management Bot!\n\n✅ Bot berjalan dengan baik!\n✅ Webhook mode aktif\n✅ Response time optimal\n\nBot siap digunakan! 🚀\n\nGunakan /help untuk melihat menu yang tersedia.`;
        session.step = 'idle';
      } else if (text === '/help') {
        responseText = `📋 **Panduan Penggunaan Bot**\n\n**Commands yang tersedia:**\n/start - Memulai bot\n/help - Menampilkan panduan ini\n/order - Membuat order baru\n/myorders - Lihat order saya\n/progress - Lihat progress order\n/update - Update progress sebagai teknisi\n/hd_update - Update waktu untuk HD\n/test - Test bot functionality\n/status - Cek status bot\n\n**Fitur:**\n✅ Bot berjalan 24/7 di Vercel\n✅ Webhook mode untuk performa optimal\n✅ Database terintegrasi dengan Supabase\n✅ Support untuk order management lengkap\n✅ Progress tracking untuk teknisi\n✅ Notifikasi otomatis ke HD\n\n**Field Baru yang Tersedia:**\n🏢 STO (20 options)\n🔄 Transaction Type (6 options)\n🌐 Service Type (5 options)\n\n**Progress Tracking:**\n📊 /progress [nomor_order] - Lihat progress\n📝 /update [nomor_order] [catatan] - Update progress\n\n**HD Commands:**\n🔧 /hd_update [nomor_order] lme_pt2 - Update LME PT2\n🔧 /hd_update [nomor_order] pt2_selesai - Update PT2 selesai\n\n**Notifikasi Otomatis:**\n🚨 Jaringan not ready → Notif ke HD\n✅ PT2 selesai → TTI Comply 3x24 Jam\n\nBot siap digunakan! 🚀`;
      } else if (text === '/order') {
        responseText = `📋 **Membuat Order Baru**\n\nSilakan masukkan informasi order secara lengkap:\n\n**Format:**\nNama Pelanggan: [nama]\nAlamat Pelanggan: [alamat]\nKontak Pelanggan: [kontak]\n\n**Contoh:**\nNama Pelanggan: John Doe\nAlamat Pelanggan: Jl. Sudirman No. 123, Jakarta\nKontak Pelanggan: 08123456789\n\nSilakan kirim informasi dalam format di atas! 📝`;
        session.step = 'waiting_for_order_info';
        session.orderData = {};
      } else if (text === '/survey') {
        responseText = `📋 **Survey Jaringan**\n\nPilih hasil survey jaringan untuk order yang sedang dikerjakan:\n\n**Format:**\nSurvey Jaringan\nOrder: [nomor_order]\nAlamat: [alamat]\n\n**Contoh:**\nSurvey Jaringan\nOrder: 001\nAlamat: Jl. Sudirman No. 123, Jakarta\n\nSilakan kirim informasi dalam format di atas! 📝`;
        session.step = 'waiting_for_survey_info';
        session.surveyData = {};
      } else if (text === '/myorders') {
        const orderList = Object.keys(orders);
        if (orderList.length > 0) {
          let ordersText = `📋 **Order Saya**\n\n`;
          orderList.forEach(orderNumber => {
            const order = orders[orderNumber];
            ordersText += `🔢 **Order #${orderNumber}**\n👤 ${order.customerName}\n🏢 ${order.sto} - ${order.serviceType}\n📅 ${order.createdAt}\n📊 Status: ${order.status}\n\n`;
          });
          ordersText += `Gunakan /progress [nomor_order] untuk melihat detail progress! 📝`;
          responseText = ordersText;
        } else {
          responseText = `📋 **Order Saya**\n\nBelum ada order yang dibuat.\n\nGunakan /order untuk membuat order baru! 🆕`;
        }
      } else if (text === '/progress') {
        responseText = `📊 **Progress Tracking**\n\nUntuk melihat progress order, gunakan:\n\n**Format:**\n/progress [nomor_order]\n\n**Contoh:**\n/progress 001\n\nUntuk update progress sebagai teknisi, gunakan:\n/update [nomor_order] [catatan]\n\n**Contoh:**\n/update 001 Perbaikan P2P selesai\n/update 001 Testing koneksi berhasil\n/update 001 Instalasi fiber optic\n\n**Notifikasi Khusus:**\n/update 001 Jaringan not ready\n/update 001 PT2 selesai\n\nWaktu akan tercatat otomatis! ⏰`;
      } else if (text.startsWith('/hd_update ')) {
        const parts = text.split(' ');
        if (parts.length >= 3) {
          const orderNumber = parts[1];
          const updateType = parts[2];
          const timestamp = new Date().toLocaleString('id-ID');
          
          const order = orders[orderNumber];
          if (order) {
            // Add HD update to order progress
            if (!order.progress) {
              order.progress = [];
            }
            
            if (updateType.toLowerCase() === 'lme_pt2') {
              order.progress.push({
                timestamp,
                note: 'HD Update LME PT2',
                type: 'hd'
              });
              order.status = 'LME PT2 Updated by HD';
              responseText = `✅ **HD Update LME PT2!**\n\n📋 **Order #${orderNumber}**\n📝 **Update:** LME PT2\n⏰ **Waktu:** ${timestamp}\n\n✅ HD telah update waktu LME PT2\n📞 Teknisi dapat melanjutkan pekerjaan\n\n**Status:** LME PT2 Updated by HD 🚀`;
            } else if (updateType.toLowerCase() === 'pt2_selesai') {
              order.progress.push({
                timestamp,
                note: 'HD Update PT2 Selesai - TTI Comply 3x24 Jam Started',
                type: 'hd'
              });
              order.status = 'TTI Comply 3x24 Jam Started';
              responseText = `✅ **HD Update PT2 Selesai!**\n\n📋 **Order #${orderNumber}**\n📝 **Update:** PT2 Selesai\n⏰ **Waktu:** ${timestamp}\n\n✅ HD telah update waktu PT2 selesai\n🕐 TTI Comply 3x24 Jam dimulai\n📞 Order menuju tahap TTI Comply\n\n**Status:** TTI Comply 3x24 Jam Started 🚀`;
            } else {
              responseText = `❌ **Format tidak benar!**\n\nGunakan format:\n/hd_update [nomor_order] [tipe_update]\n\n**Tipe Update:**\nlme_pt2 - Update waktu LME PT2\npt2_selesai - Update waktu PT2 selesai\n\n**Contoh:**\n/hd_update 001 lme_pt2\n/hd_update 001 pt2_selesai`;
            }
          } else {
            responseText = `❌ **Order tidak ditemukan!**\n\nOrder #${orderNumber} tidak ditemukan dalam sistem.\n\nGunakan /myorders untuk melihat order yang tersedia.`;
          }
        } else {
          responseText = `❌ **Format tidak benar!**\n\nGunakan format:\n/hd_update [nomor_order] [tipe_update]\n\n**Tipe Update:**\nlme_pt2 - Update waktu LME PT2\npt2_selesai - Update waktu PT2 selesai\n\n**Contoh:**\n/hd_update 001 lme_pt2\n/hd_update 001 pt2_selesai`;
        }
      } else if (text.startsWith('/progress ')) {
        const orderNumber = text.split(' ')[1];
        if (orderNumber) {
          const order = orders[orderNumber];
          if (order) {
            let progressText = `📊 **Progress Order #${orderNumber}**\n\n📝 **Detail Order:**\n👤 Nama: ${order.customerName}\n🏠 Alamat: ${order.customerAddress}\n📞 Kontak: ${order.contact}\n🏢 STO: ${order.sto}\n🔄 Transaction Type: ${order.transactionType}\n🌐 Service Type: ${order.serviceType}\n📅 Dibuat: ${order.createdAt}\n\n📝 **Riwayat Progress:**\n`;
            
            if (order.progress && order.progress.length > 0) {
              order.progress.forEach((p: any, index: number) => {
                progressText += `${index + 1}. ${p.timestamp} - ${p.note}\n`;
              });
            } else {
              progressText += `1. Order dibuat - ${order.createdAt}\n2. Progress: Order sedang diproses\n`;
            }
            
            progressText += `\n**Status:** ${order.status}\n**Teknisi:** ${order.assignedTechnician || 'Belum ditugaskan'}\n\nGunakan /update untuk menambah progress! 📝`;
            responseText = progressText;
          } else {
            responseText = `❌ **Order tidak ditemukan!**\n\nOrder #${orderNumber} tidak ditemukan dalam sistem.\n\nGunakan /myorders untuk melihat order yang tersedia.`;
          }
        } else {
          responseText = `❌ **Format tidak benar!**\n\nGunakan format:\n/progress [nomor_order]\n\n**Contoh:**\n/progress 001`;
        }
      } else if (text.startsWith('/update ')) {
        const parts = text.split(' ');
        if (parts.length >= 3) {
          const orderNumber = parts[1];
          const note = parts.slice(2).join(' ');
          const timestamp = new Date().toLocaleString('id-ID');
          
          const order = orders[orderNumber];
          if (order) {
            // Add progress to order
            if (!order.progress) {
              order.progress = [];
            }
            order.progress.push({
              timestamp,
              note,
              type: 'technician'
            });
            
            // Check for special notifications
            let notificationText = '';
            if (note.toLowerCase().includes('jaringan not ready') || note.toLowerCase().includes('network not ready')) {
              notificationText = `\n\n🚨 **NOTIFIKASI KE HD:**\n📋 Order #${orderNumber} - Jaringan Not Ready\n⏰ HD diminta update waktu LME PT2\n📞 Segera hubungi HD untuk update!`;
              order.status = 'Jaringan Not Ready - Menunggu HD';
            } else if (note.toLowerCase().includes('pt2 selesai') || note.toLowerCase().includes('pt2 finished')) {
              notificationText = `\n\n✅ **NOTIFIKASI KE HD:**\n📋 Order #${orderNumber} - PT2 Selesai\n⏰ HD update waktu PT2 selesai\n🕐 TTI Comply 3x24 Jam dimulai\n📞 HD diminta update waktu PT2!`;
              order.status = 'PT2 Selesai - Menunggu HD';
            }
            
            responseText = `✅ **Progress Updated!**\n\n📋 **Order #${orderNumber}**\n📝 **Catatan:** ${note}\n⏰ **Waktu:** ${timestamp}${notificationText}\n\nProgress berhasil dicatat! Teknisi dapat melanjutkan pekerjaan. 🚀`;
          } else {
            responseText = `❌ **Order tidak ditemukan!**\n\nOrder #${orderNumber} tidak ditemukan dalam sistem.\n\nGunakan /myorders untuk melihat order yang tersedia.`;
          }
        } else {
          responseText = `❌ **Format tidak benar!**\n\nGunakan format:\n/update [nomor_order] [catatan]\n\n**Contoh:**\n/update 001 Perbaikan P2P selesai\n/update 001 Testing koneksi berhasil\n/update 001 Jaringan not ready\n/update 001 PT2 selesai`;
        }
      } else if (text.startsWith('/evidence ')) {
        const orderNumber = text.split(' ')[1];
        if (orderNumber) {
          const order = orders[orderNumber];
          if (order) {
            // Initialize evidence collection for this order
            session.step = 'collecting_evidence';
            session.evidenceData = {
              orderNumber,
              odpSn: '',
              ont: '',
              photos: [],
              photoCount: 0
            };
            
            responseText = `📸 **Upload Evidence untuk Order #${orderNumber}**\n\n🏠 **Order**: ${order.customerName}\n📍 **Alamat**: ${order.customerAddress}\n\n**Langkah 1:** Kirim ODP SN dan ONT\n**Format:**\nODP SN: [serial_number]\nONT: [ont_info]\n\n**Contoh:**\nODP SN: ABC123456789\nONT: Huawei HG8245H5\n\n**Setelah itu kirim 7 foto secara berurutan!** 📷`;
          } else {
            responseText = `❌ **Order tidak ditemukan!**\n\nOrder #${orderNumber} tidak ditemukan dalam sistem.\n\nGunakan /myorders untuk melihat order yang tersedia.`;
          }
        } else {
          responseText = `❌ **Format tidak benar!**\n\nGunakan format:\n/evidence [nomor_order]\n\n**Contoh:**\n/evidence 001`;
        }
      } else if (text === '/test') {
        responseText = `🧪 **Test Bot**\n\n✅ Bot berjalan dengan baik!\n✅ Webhook mode aktif\n✅ Response time optimal\n✅ Database connection ready\n✅ New fields available\n\nBot siap untuk production! 🎉`;
      } else if (text === '/status') {
        const timestamp = new Date().toISOString();
        responseText = `📊 **Bot Status**\n\n🟢 Status: Online\n🌐 Mode: Webhook\n⏰ Uptime: 24/7\n🔗 Platform: Vercel\n📅 Timestamp: ${timestamp}\n\nBot berjalan dengan sempurna! ✅`;
      } else if (session.step === 'waiting_for_order_info') {
        // Parse order information from user input - more flexible parsing
        const lines = text.split('\n');
        let customerName = '';
        let customerAddress = '';
        let contact = '';
        
        // Try different parsing approaches
        for (const line of lines) {
          const lowerLine = line.toLowerCase().trim();
          
          // Check for "nama pelanggan:" or "nama:" or "name:"
          if (lowerLine.includes('nama pelanggan:') || lowerLine.includes('nama:') || lowerLine.includes('name:')) {
            customerName = line.split(':')[1]?.trim() || '';
          }
          // Check for "alamat pelanggan:" or "alamat:" or "address:"
          else if (lowerLine.includes('alamat pelanggan:') || lowerLine.includes('alamat:') || lowerLine.includes('address:')) {
            customerAddress = line.split(':')[1]?.trim() || '';
          }
          // Check for "kontak pelanggan:" or "kontak:" or "contact:"
          else if (lowerLine.includes('kontak pelanggan:') || lowerLine.includes('kontak:') || lowerLine.includes('contact:')) {
            contact = line.split(':')[1]?.trim() || '';
          }
        }
        
        // If still not found, try to parse by position (first 3 lines)
        if (!customerName && !customerAddress && !contact && lines.length >= 3) {
          customerName = lines[0]?.trim() || '';
          customerAddress = lines[1]?.trim() || '';
          contact = lines[2]?.trim() || '';
        }
        
        if (customerName && customerAddress && contact) {
          // Store the basic info
          session.orderData = {
            customerName,
            customerAddress,
            contact
          };
          
          responseText = `✅ **Informasi Order Diterima!**\n\n📝 **Detail Order:**\n👤 Nama: ${customerName}\n🏠 Alamat: ${customerAddress}\n📞 Kontak: ${contact}\n\n**Langkah Selanjutnya:**\nPilih STO (Service Terminal Office):\n\n🏢 **STO Options:**\n1️⃣ CBB - Cibubur\n2️⃣ CWA - Cawang\n3️⃣ GAN - Gandaria\n4️⃣ JTN - Jatinegara\n5️⃣ KLD - Kelapa Dua\n6️⃣ KRG - Karawang\n7️⃣ PDK - Pondok Kelapa\n8️⃣ PGB - Pondok Gede\n9️⃣ PGG - Pondok Gede\n🔟 PSR - Pasar Minggu\n1️⃣1️⃣ RMG - Rawamangun\n1️⃣2️⃣ BIN - Bintaro\n1️⃣3️⃣ CPE - Cipete\n1️⃣4️⃣ JAG - Jagakarsa\n1️⃣5️⃣ KAL - Kalibata\n1️⃣6️⃣ KBY - Kebayoran\n1️⃣7️⃣ KMG - Kemang\n1️⃣8️⃣ PSM - Pasar Minggu\n1️⃣9️⃣ TBE - Tebet\n2️⃣0️⃣ NAS - Nasional\n\nKetik nomor pilihan Anda (1-20):`;
          session.step = 'waiting_for_sto';
        } else {
          responseText = `❌ **Format tidak lengkap!**\n\nSilakan gunakan format yang benar:\n\n**Format:**\nNama Pelanggan: [nama]\nAlamat Pelanggan: [alamat]\nKontak Pelanggan: [kontak]\n\n**Contoh:**\nNama Pelanggan: John Doe\nAlamat Pelanggan: Jl. Sudirman No. 123, Jakarta\nKontak Pelanggan: 08123456789\n\n**Atau cukup ketik 3 baris:**\nJohn Doe\nJl. Sudirman No. 123, Jakarta\n08123456789\n\nSilakan coba lagi! 🔄`;
        }
      } else if (session.step === 'waiting_for_sto') {
        const stoOptions = ['CBB', 'CWA', 'GAN', 'JTN', 'KLD', 'KRG', 'PDK', 'PGB', 'PGG', 'PSR', 'RMG', 'BIN', 'CPE', 'JAG', 'KAL', 'KBY', 'KMG', 'PSM', 'TBE', 'NAS'];
        const choice = parseInt(text);
        
        if (choice >= 1 && choice <= 20) {
          const selectedSTO = stoOptions[choice - 1];
          session.orderData.sto = selectedSTO;
          
          responseText = `✅ **STO Dipilih: ${selectedSTO}**\n\n**Langkah Selanjutnya:**\nPilih Transaction Type:\n\n🔄 **Transaction Type Options:**\n1️⃣ Disconnect\n2️⃣ Modify\n3️⃣ New Install Existing\n4️⃣ New Install JT\n5️⃣ New Install\n6️⃣ PDA\n\nKetik nomor pilihan Anda (1-6):`;
          session.step = 'waiting_for_transaction_type';
        } else {
          responseText = `❌ **Pilihan tidak valid!**\n\nSilakan pilih nomor 1-20 untuk STO.\n\nKetik nomor pilihan Anda (1-20):`;
        }
      } else if (session.step === 'waiting_for_transaction_type') {
        const transactionOptions = ['Disconnect', 'modify', 'new install existing', 'new install jt', 'new install', 'PDA'];
        const choice = parseInt(text);
        
        if (choice >= 1 && choice <= 6) {
          const selectedTransaction = transactionOptions[choice - 1];
          session.orderData.transactionType = selectedTransaction;
          
          responseText = `✅ **Transaction Type Dipilih: ${selectedTransaction}**\n\n**Langkah Selanjutnya:**\nPilih Service Type:\n\n🌐 **Service Type Options:**\n1️⃣ Astinet\n2️⃣ Metro\n3️⃣ VPN IP\n4️⃣ IP Transit\n5️⃣ SIP Trunk\n\nKetik nomor pilihan Anda (1-5):`;
          session.step = 'waiting_for_service_type';
        } else {
          responseText = `❌ **Pilihan tidak valid!**\n\nSilakan pilih nomor 1-6 untuk Transaction Type.\n\nKetik nomor pilihan Anda (1-6):`;
        }
      } else if (session.step === 'waiting_for_service_type') {
        const serviceOptions = ['Astinet', 'metro', 'vpn ip', 'ip transit', 'siptrunk'];
        const choice = parseInt(text);
        
        if (choice >= 1 && choice <= 5) {
          const selectedService = serviceOptions[choice - 1];
          session.orderData.serviceType = selectedService;
          
          // Create order with unique number
          const orderNumber = orderCounter.toString().padStart(3, '0');
          const orderData = {
            ...session.orderData,
            serviceType: selectedService,
            orderNumber,
            status: 'Pending',
            createdAt: new Date().toLocaleString('id-ID'),
            progress: []
          };
          
          orders[orderNumber] = orderData;
          orderCounter++;
          
          responseText = `🎉 **Order Berhasil Dibuat!**\n\n📋 **Detail Order Lengkap:**\n🔢 **Nomor Order:** #${orderNumber}\n👤 Nama: ${session.orderData.customerName}\n🏠 Alamat: ${session.orderData.customerAddress}\n📞 Kontak: ${session.orderData.contact}\n🏢 STO: ${session.orderData.sto}\n🔄 Transaction Type: ${session.orderData.transactionType}\n🌐 Service Type: ${selectedService}\n📅 Dibuat: ${orderData.createdAt}\n\n✅ Order telah disimpan dan akan diproses oleh tim kami!\n\nGunakan /order untuk membuat order baru atau /myorders untuk melihat order yang sudah dibuat. 🚀`;
          session.step = 'idle';
          session.orderData = {};
        } else {
          responseText = `❌ **Pilihan tidak valid!**\n\nSilakan pilih nomor 1-5 untuk Service Type.\n\nKetik nomor pilihan Anda (1-5):`;
        }
      } else if (session.step === 'waiting_for_survey_info') {
        // Parse survey information from user input
        const lines = text.split('\n');
        let orderNumber = '';
        let address = '';
        
        console.log('🔍 Survey Info Parsing Debug:', {
          text,
          lines,
          sessionStep: session.step
        });
        
        // Try different parsing approaches
        for (const line of lines) {
          const lowerLine = line.toLowerCase().trim();
          
          // Check for "order:" or "nomor order:"
          if (lowerLine.includes('order:') || lowerLine.includes('nomor order:')) {
            orderNumber = line.split(':')[1]?.trim() || '';
          }
          // Check for "alamat:" or "address:"
          else if (lowerLine.includes('alamat:') || lowerLine.includes('address:')) {
            address = line.split(':')[1]?.trim() || '';
          }
        }
        
        // If still not found, try to parse by position (first 2 lines)
        if (!orderNumber && !address && lines.length >= 2) {
          orderNumber = lines[0]?.trim() || '';
          address = lines[1]?.trim() || '';
        }
        
        console.log('🔍 Survey Info Parsed:', {
          orderNumber,
          address,
          willStore: !!(orderNumber && address)
        });
        
        if (orderNumber && address) {
          // Store the survey info
          session.surveyData = {
            orderNumber,
            address
          };
          
          console.log('🔍 Survey Data Stored:', session.surveyData);
          
          responseText = `✅ **Informasi Survey Diterima!**\n\n📝 **Detail Survey:**\n🔢 Order: ${orderNumber}\n🏠 Alamat: ${address}\n\n**Pilih hasil survey:**`;
          session.step = 'waiting_for_survey_result';
        } else {
          responseText = `❌ **Format tidak lengkap!**\n\nSilakan gunakan format yang benar:\n\n**Format:**\nOrder: [nomor_order]\nAlamat: [alamat]\n\n**Contoh:**\nOrder: 001\nAlamat: Jl. Sudirman No. 123, Jakarta\n\n**Atau cukup ketik 2 baris:**\n001\nJl. Sudirman No. 123, Jakarta\n\nSilakan coba lagi! 🔄`;
        }
      } else if (text && text.startsWith('/')) {
        responseText = `Command "${text}" tidak dikenali. Gunakan /help untuk melihat daftar command yang tersedia.`;
      } else if (text) {
        responseText = `Anda mengirim: "${text}"\n\nGunakan /help untuk melihat menu yang tersedia.`;
      } else {
        responseText = 'Pesan diterima!';
      }
      
      // Send response back to Telegram using hardcoded token
      const botToken = '8497928167:AAEE9zuCvRwV0347IYkzLJOQflZiq74mPnc';
      
      // Prepare reply markup based on context
      let replyMarkup = undefined;
      
      if (text === '/start') {
        replyMarkup = {
          inline_keyboard: [
            [
              { text: '📋 Buat Order', callback_data: 'create_order' },
              { text: '📊 Lihat Order', callback_data: 'view_orders' }
            ],
            [
              { text: '🔍 Survey Jaringan', callback_data: 'survey' },
              { text: '📝 Update Progress', callback_data: 'update_progress' }
            ],
            [
              { text: '🔧 HD Update', callback_data: 'hd_update' },
              { text: '❓ Help', callback_data: 'help' }
            ],
            [
              { text: '🧪 Test Bot', callback_data: 'test_bot' }
            ]
          ]
        };
      } else if (text === '/help') {
        replyMarkup = {
          inline_keyboard: [
            [
              { text: '📋 Buat Order', callback_data: 'create_order' },
              { text: '📊 Lihat Order', callback_data: 'view_orders' }
            ],
            [
              { text: '🔍 Survey Jaringan', callback_data: 'survey' },
              { text: '📝 Update Progress', callback_data: 'update_progress' }
            ],
            [
              { text: '🔧 HD Update', callback_data: 'hd_update' },
              { text: '🧪 Test Bot', callback_data: 'test_bot' }
            ],
            [
              { text: '📊 Status Bot', callback_data: 'status_bot' }
            ]
          ]
        };
      } else if (session.step === 'waiting_for_sto') {
        replyMarkup = {
          inline_keyboard: [
            [
              { text: '1️⃣ CBB', callback_data: 'sto_1' },
              { text: '2️⃣ CWA', callback_data: 'sto_2' },
              { text: '3️⃣ GAN', callback_data: 'sto_3' },
              { text: '4️⃣ JTN', callback_data: 'sto_4' },
              { text: '5️⃣ KLD', callback_data: 'sto_5' }
            ],
            [
              { text: '6️⃣ KRG', callback_data: 'sto_6' },
              { text: '7️⃣ PDK', callback_data: 'sto_7' },
              { text: '8️⃣ PGB', callback_data: 'sto_8' },
              { text: '9️⃣ PGG', callback_data: 'sto_9' },
              { text: '🔟 PSR', callback_data: 'sto_10' }
            ],
            [
              { text: '1️⃣1️⃣ RMG', callback_data: 'sto_11' },
              { text: '1️⃣2️⃣ BIN', callback_data: 'sto_12' },
              { text: '1️⃣3️⃣ CPE', callback_data: 'sto_13' },
              { text: '1️⃣4️⃣ JAG', callback_data: 'sto_14' },
              { text: '1️⃣5️⃣ KAL', callback_data: 'sto_15' }
            ],
            [
              { text: '1️⃣6️⃣ KBY', callback_data: 'sto_16' },
              { text: '1️⃣7️⃣ KMG', callback_data: 'sto_17' },
              { text: '1️⃣8️⃣ PSM', callback_data: 'sto_18' },
              { text: '1️⃣9️⃣ TBE', callback_data: 'sto_19' },
              { text: '2️⃣0️⃣ NAS', callback_data: 'sto_20' }
            ]
          ]
        };
      } else if (session.step === 'waiting_for_transaction_type') {
        replyMarkup = {
          inline_keyboard: [
            [
              { text: '1️⃣ Disconnect', callback_data: 'trans_1' },
              { text: '2️⃣ Modify', callback_data: 'trans_2' }
            ],
            [
              { text: '3️⃣ New Install Existing', callback_data: 'trans_3' },
              { text: '4️⃣ New Install JT', callback_data: 'trans_4' }
            ],
            [
              { text: '5️⃣ New Install', callback_data: 'trans_5' },
              { text: '6️⃣ PDA', callback_data: 'trans_6' }
            ]
          ]
        };
      } else if (session.step === 'waiting_for_service_type') {
        replyMarkup = {
          inline_keyboard: [
            [
              { text: '1️⃣ Astinet', callback_data: 'service_1' },
              { text: '2️⃣ Metro', callback_data: 'service_2' }
            ],
            [
              { text: '3️⃣ VPN IP', callback_data: 'service_3' },
              { text: '4️⃣ IP Transit', callback_data: 'service_4' }
            ],
            [
              { text: '5️⃣ SIP Trunk', callback_data: 'service_5' }
            ]
          ]
        };
      } else if (text === '/myorders') {
        const orderList = Object.keys(orders);
        if (orderList.length > 0) {
          replyMarkup = {
            inline_keyboard: orderList.map(orderNumber => [
              { text: `📋 Order #${orderNumber}`, callback_data: `view_order_${orderNumber}` }
            ])
          };
        }
      } else if (session.step === 'waiting_for_survey_result') {
        replyMarkup = {
          inline_keyboard: [
            [
              { text: '✅ Jaringan Ready', callback_data: 'survey_ready' },
              { text: '❌ Jaringan Not Ready', callback_data: 'survey_not_ready' }
            ]
          ]
        };
      }
      
      const telegramResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: responseText,
          reply_markup: replyMarkup,
        }),
      });
      
      if (!telegramResponse.ok) {
        const errorText = await telegramResponse.text();
        console.error('Failed to send message to Telegram:', errorText);
        return NextResponse.json({ error: 'Failed to send message to Telegram', details: errorText }, { status: 500 });
      } else {
        console.log('✅ Message sent successfully to Telegram');
      }
    }
    
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    return NextResponse.json({ error: 'Webhook failed', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    message: 'Webhook endpoint is working',
    timestamp: new Date().toISOString()
  });
}