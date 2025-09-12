# 🚀 DEPLOYMENT BOT 24 JAM

## 📋 **Opsi Deployment untuk Bot 24 Jam:**

### **1. 🖥️ VPS/Cloud Server (Recommended)**

#### **A. DigitalOcean Droplet**
```bash
# Buat droplet Ubuntu 20.04 LTS
# Minimal: 1GB RAM, 1 CPU, 25GB SSD ($5/bulan)

# Setup server
sudo apt update
sudo apt install nodejs npm git

# Clone project
git clone https://github.com/your-repo/bot-next-js.git
cd bot-next-js

# Install dependencies
npm install

# Setup environment
cp env.example .env.local
# Edit .env.local dengan credentials Supabase dan Telegram

# Install PM2 untuk process management
sudo npm install -g pm2

# Start bot dengan PM2
pm2 start scripts/bot-fixed-workflow.js --name "telegram-bot"

# Setup PM2 untuk auto-restart
pm2 startup
pm2 save
```

#### **B. AWS EC2**
```bash
# Buat EC2 instance t2.micro (free tier)
# Ubuntu 20.04 LTS

# Setup sama seperti DigitalOcean
# Install PM2 untuk process management
```

#### **C. Google Cloud Platform**
```bash
# Buat Compute Engine instance
# f1-micro (free tier)

# Setup sama seperti DigitalOcean
```

### **2. ☁️ Cloud Platform Services**

#### **A. Railway**
```bash
# Deploy ke Railway
# Connect GitHub repository
# Set environment variables
# Auto-deploy dari GitHub
```

#### **B. Render**
```bash
# Deploy ke Render
# Connect GitHub repository
# Set environment variables
# Auto-deploy dari GitHub
```

#### **C. Heroku**
```bash
# Deploy ke Heroku
# Connect GitHub repository
# Set environment variables
# Auto-deploy dari GitHub
```

### **3. 🏠 Home Server/Raspberry Pi**

#### **A. Raspberry Pi**
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone project
git clone https://github.com/your-repo/bot-next-js.git
cd bot-next-js

# Install dependencies
npm install

# Setup environment
cp env.example .env.local

# Install PM2
sudo npm install -g pm2

# Start bot
pm2 start scripts/bot-fixed-workflow.js --name "telegram-bot"
pm2 startup
pm2 save
```

#### **B. Home Computer**
```bash
# Install Node.js
# Clone project
# Install dependencies
# Setup environment
# Install PM2
# Start bot
```

## 🔧 **Setup PM2 untuk Auto-Restart:**

### **1. Install PM2**
```bash
# Install PM2 globally
npm install -g pm2

# Atau dengan sudo jika diperlukan
sudo npm install -g pm2
```

### **2. Start Bot dengan PM2**
```bash
# Start bot
pm2 start scripts/bot-fixed-workflow.js --name "telegram-bot"

# Check status
pm2 status

# View logs
pm2 logs telegram-bot

# Restart bot
pm2 restart telegram-bot

# Stop bot
pm2 stop telegram-bot
```

### **3. Setup Auto-Start**
```bash
# Generate startup script
pm2 startup

# Save current process list
pm2 save

# Bot akan auto-start saat server reboot
```

### **4. PM2 Configuration File**
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'telegram-bot',
    script: 'scripts/bot-fixed-workflow.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    }
  }]
};
```

## 🌐 **Setup Domain dan SSL (Optional):**

### **1. Domain Setup**
```bash
# Point domain ke server IP
# A record: yourdomain.com → server_ip
# CNAME: www.yourdomain.com → yourdomain.com
```

### **2. SSL Certificate**
```bash
# Install Certbot
sudo apt install certbot

# Generate SSL certificate
sudo certbot certonly --standalone -d yourdomain.com
```

## 📱 **Environment Variables untuk Production:**

### **1. .env.local**
```bash
# Telegram Bot
TELEGRAM_BOT_TOKEN=your_bot_token_here

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Production settings
NODE_ENV=production
PORT=3000
```

### **2. Security Considerations**
```bash
# Firewall setup
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable

# Update system
sudo apt update
sudo apt upgrade
```

## 🔄 **Monitoring dan Maintenance:**

### **1. PM2 Monitoring**
```bash
# Monitor resources
pm2 monit

# View logs
pm2 logs telegram-bot

# Restart if needed
pm2 restart telegram-bot
```

### **2. Log Rotation**
```bash
# Install PM2 log rotate
pm2 install pm2-logrotate

# Configure log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

### **3. Health Check Script**
```javascript
// health-check.js
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config({ path: '.env.local' });

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });

// Send health check message
bot.sendMessage(process.env.ADMIN_CHAT_ID, 'Bot is running - ' + new Date().toISOString())
  .then(() => {
    console.log('Health check sent');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Health check failed:', error);
    process.exit(1);
  });
```

## 💰 **Cost Comparison:**

### **1. VPS/Cloud Server**
- **DigitalOcean**: $5/bulan (1GB RAM)
- **AWS EC2**: $0-5/bulan (free tier available)
- **Google Cloud**: $0-5/bulan (free tier available)

### **2. Cloud Platform Services**
- **Railway**: $5/bulan
- **Render**: $7/bulan
- **Heroku**: $7/bulan

### **3. Home Server**
- **Raspberry Pi**: $35 one-time + electricity
- **Home Computer**: Existing hardware + electricity

## 🚀 **Recommended Setup:**

### **Untuk Production:**
1. **DigitalOcean Droplet** ($5/bulan)
2. **PM2** untuk process management
3. **Domain + SSL** untuk webhook
4. **Monitoring** dengan PM2

### **Untuk Development:**
1. **Raspberry Pi** di rumah
2. **PM2** untuk process management
3. **ngrok** untuk webhook testing

## 📋 **Deployment Checklist:**

- [ ] Setup VPS/Cloud Server
- [ ] Install Node.js dan npm
- [ ] Clone project repository
- [ ] Install dependencies
- [ ] Setup environment variables
- [ ] Install PM2
- [ ] Start bot dengan PM2
- [ ] Setup auto-start
- [ ] Test bot functionality
- [ ] Setup monitoring
- [ ] Setup log rotation
- [ ] Setup health check

**Bot siap berjalan 24 jam!** 🎉

**Pilih opsi deployment yang sesuai dengan kebutuhan dan budget Anda!** 💰
