# 🖥️ WINDOWS 24/7 BOT SETUP

## ✅ **Bot Sudah Berjalan 24/7!**

Bot Anda sudah berjalan dengan PM2 dan akan tetap aktif selama komputer menyala.

### **Status Bot:**
```
┌────┬────────────────────┬──────────┬──────┬───────────┬──────────┬──────────┐
│ id │ name               │ mode     │ ↺    │ status    │ cpu      │ memory   │
├────┼────────────────────┼──────────┼──────┼───────────┼──────────┼──────────┤
│ 0  │ telegram-bot       │ cluster  │ 0    │ online    │ 0%       │ 73.1mb   │
└────┴────────────────────┴──────────┴──────┴───────────┴──────────┴──────────┘
```

## 🔧 **Management Commands:**

### **1. Check Bot Status:**
```bash
npm run pm2:status
# atau
pm2 status
```

### **2. View Bot Logs:**
```bash
npm run pm2:logs
# atau
pm2 logs telegram-bot
```

### **3. Restart Bot:**
```bash
npm run pm2:restart
# atau
pm2 restart telegram-bot
```

### **4. Stop Bot:**
```bash
npm run pm2:stop
# atau
pm2 stop telegram-bot
```

### **5. Start Bot:**
```bash
npm run pm2:start
# atau
pm2 start ecosystem.config.js
```

### **6. Monitor Bot Resources:**
```bash
npm run pm2:monit
# atau
pm2 monit
```

### **7. Health Check:**
```bash
npm run health:check
# atau
node scripts/health-check.js
```

## 🚀 **Untuk Production 24/7:**

### **1. VPS/Cloud Server (Recommended)**
- **DigitalOcean**: $5/bulan
- **AWS EC2**: Free tier available
- **Google Cloud**: Free tier available

### **2. Home Server Setup**
- **Raspberry Pi**: $35 one-time
- **Old Computer**: Existing hardware

### **3. Windows Service (Advanced)**
```bash
# Install PM2 Windows Service
npm install -g pm2-windows-service

# Install as Windows Service
pm2-service-install

# Bot will start automatically on Windows boot
```

## 📱 **Test Bot:**

### **1. Send /start to your bot**
### **2. Test workflow:**
- Survey jaringan
- Time tracking
- Evidence close
- Photo upload

### **3. Check logs if needed:**
```bash
npm run pm2:logs
```

## 🔄 **Auto-Restart Features:**

### **1. PM2 Auto-Restart:**
- ✅ Bot auto-restart jika crash
- ✅ Bot auto-restart jika memory limit exceeded
- ✅ Bot auto-restart jika error

### **2. Windows Auto-Start:**
- ❌ PM2 startup tidak support Windows
- ✅ Bot tetap berjalan selama komputer menyala
- ✅ Bot auto-restart jika crash

## 📊 **Monitoring:**

### **1. Real-time Monitoring:**
```bash
npm run pm2:monit
```

### **2. Log Files:**
- **Error logs**: `logs/err.log`
- **Output logs**: `logs/out.log`
- **Combined logs**: `logs/combined.log`

### **3. Health Check:**
```bash
npm run health:check
```

## 🛠️ **Troubleshooting:**

### **1. Bot Tidak Responsif:**
```bash
npm run pm2:restart
```

### **2. Bot Crash:**
```bash
npm run pm2:logs
# Check error logs
npm run pm2:start
```

### **3. Memory Issues:**
```bash
npm run pm2:monit
# Check memory usage
npm run pm2:restart
```

### **4. Bot Tidak Start:**
```bash
# Check environment variables
cat .env.local

# Check dependencies
npm install

# Start manually
npm run pm2:start
```

## 📋 **Daily Maintenance:**

### **1. Check Status:**
```bash
npm run pm2:status
```

### **2. Check Logs:**
```bash
npm run pm2:logs
```

### **3. Health Check:**
```bash
npm run health:check
```

### **4. Restart if Needed:**
```bash
npm run pm2:restart
```

## 🎉 **Bot Features:**

- ✅ **24/7 Operation**: Bot berjalan terus menerus
- ✅ **Auto-Restart**: Bot restart otomatis jika crash
- ✅ **Memory Management**: Bot restart jika memory limit exceeded
- ✅ **Log Management**: Logs tersimpan dengan baik
- ✅ **Health Check**: Monitoring bot status
- ✅ **Easy Management**: Commands sederhana untuk management

## 🚀 **Next Steps:**

1. **Test bot functionality** dengan mengirim `/start`
2. **Monitor logs** dengan `npm run pm2:logs`
3. **Setup VPS** untuk production jika diperlukan
4. **Configure domain** untuk webhook jika diperlukan

**Bot Anda sudah berjalan 24/7!** 🎉

**Gunakan commands di atas untuk management bot!** 🔧
