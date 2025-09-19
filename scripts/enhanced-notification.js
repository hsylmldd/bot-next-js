// Enhanced notification functions for HD when network not ready
// This file contains improved notification logic with TTI Comply system

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
    
    // Save notification record to database for tracking
    const notificationData = {
      order_id: orderId,
      type: 'jaringan_not_ready',
      message: 'Teknisi melaporkan jaringan not ready',
      timestamp: new Date().toISOString(),
      status: 'sent'
    };
    
    try {
      await supabase
        .from('notifications')
        .insert(notificationData);
    } catch (notifError) {
      console.log('Notification tracking failed (table may not exist):', notifError.message);
    }
    
    // Create inline keyboard for HD actions
    const hdKeyboard = {
      inline_keyboard: [
        [
          { text: '⏰ Update LME PT2', callback_data: `update_lme_pt2_${orderId}` },
          { text: '✅ PT2 Selesai', callback_data: `update_pt2_selesai_${orderId}` }
        ],
        [
          { text: '📋 Lihat Detail Order', callback_data: `view_order_${orderId}` }
        ]
      ]
    };
    
    // Notify all HD users with enhanced message and action buttons
    for (const hd of hdUsers) {
      if (hd.telegram_id) {
        bot.sendMessage(hd.telegram_id, 
          `🚨 **URGENT: Jaringan Not Ready**\n\n` +
          `📋 **Order ID**: #${order.id}\n` +
          `👤 **Pelanggan**: ${order.customer_name}\n` +
          `🏠 **Alamat**: ${order.customer_address}\n` +
          `📞 **Kontak**: ${order.customer_phone || 'N/A'}\n` +
          `🔧 **Teknisi**: ${order.users?.name || 'Unknown'}\n` +
          `📊 **Status**: Jaringan Not Ready - Menunggu HD\n` +
          `⏰ **Waktu Laporan**: ${new Date().toLocaleString('id-ID')}\n\n` +
          `🎯 **Action Required:**\n` +
          `• Update waktu LME PT2 jika diperlukan\n` +
          `• Atau langsung set PT2 Selesai jika sudah ready\n` +
          `• TTI Comply 3x24 jam akan dimulai setelah PT2 selesai\n\n` +
          `⚠️ **Prioritas**: HIGH - Segera ambil tindakan!`,
          { 
            parse_mode: 'Markdown',
            reply_markup: hdKeyboard
          }
        );
      }
    }
    
    console.log(`✅ HD notification sent for order ${orderId} - Jaringan Not Ready`);
    
  } catch (error) {
    console.error('Error notifying HD about network not ready:', error);
  }
}

// Enhanced TTI Comply system with 3x24 hours logic
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
    
    // Get order details for notification
    const { data: order } = await supabase
      .from('orders')
      .select('*, users!assigned_technician(*)')
      .eq('id', orderId)
      .single();
    
    // Get all HD users
    const { data: hdUsers } = await supabase
      .from('users')
      .select('telegram_id, name')
      .eq('role', 'HD');
    
    // Notify HD about TTI Comply start
    for (const hd of hdUsers) {
      if (hd.telegram_id) {
        bot.sendMessage(hd.telegram_id, 
          `⏰ **TTI COMPLY DIMULAI**\n\n` +
          `📋 **Order ID**: #${order.id}\n` +
          `👤 **Pelanggan**: ${order.customer_name}\n` +
          `🏠 **Alamat**: ${order.customer_address}\n` +
          `🔧 **Teknisi**: ${order.users?.name || 'Unknown'}\n\n` +
          `⏰ **Waktu Mulai**: ${startTime.toLocaleString('id-ID')}\n` +
          `⏰ **Deadline**: ${deadlineTime.toLocaleString('id-ID')}\n` +
          `⏳ **Sisa Waktu**: 72 jam (3x24 jam)\n\n` +
          `🎯 **TTI harus comply sebelum deadline!**\n` +
          `📊 Status akan dimonitor otomatis.`,
          { parse_mode: 'Markdown' }
        );
      }
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
      .eq('id', orderId)
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
          `📋 **Order ID**: #${order.id}\n` +
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

// Enhanced PT2 completion notification with TTI Comply start
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
      .eq('id', orderId)
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
          `📋 **Order ID**: #${order.id}\n` +
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

module.exports = {
  notifyHDAboutNetworkNotReady,
  startTTIComplyCountdown,
  scheduleTTIReminders,
  sendTTIReminder,
  notifyHDPT2SelesaiWithTTI
};