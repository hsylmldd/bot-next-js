# Quick Setup Guide

## 🚀 One-Command Setup

Jalankan command berikut untuk setup otomatis:

```bash
npm run quick-setup
```

Command ini akan:
1. ✅ Setup environment file (.env.local)
2. ✅ Validasi environment variables
3. ✅ Test koneksi database
4. ✅ Setup storage bucket
5. ✅ Buat sample data
6. ✅ Setup bot webhook

## 📋 Manual Setup (Jika Quick Setup Gagal)

### 1. Setup Environment
```bash
npm run setup:env
```

### 2. Check Environment
```bash
npm run check:env
```

### 3. Test Database
```bash
npm run test:db
```

### 4. Setup Storage
```bash
npm run setup:storage
```

### 5. Create Sample Data
```bash
npm run setup:sample
```

### 6. Setup Bot
```bash
npm run setup:bot
```

## 🎯 Start Development

Setelah setup selesai:

```bash
# Start development server
npm run dev

# Initialize services (di terminal lain)
curl http://localhost:3000/api/init
```

## 🔧 Troubleshooting

### Error: "Missing Supabase credentials"
- Pastikan file `.env.local` sudah dibuat
- Jalankan `npm run setup:env` untuk membuat file environment

### Error: "Database connection failed"
- Pastikan Supabase project sudah dibuat
- Jalankan SQL schema di Supabase dashboard
- Check kredensial Supabase di `.env.local`

### Error: "Storage bucket not found"
- Jalankan `npm run setup:storage`
- Pastikan Supabase Storage sudah diaktifkan

## 📱 Test Bot

1. Buka Telegram
2. Cari bot Anda
3. Kirim `/start`
4. Test fitur-fitur bot

## 🌐 Admin Dashboard

Akses: `http://localhost:3000`

- Manage users
- View orders
- Monitor system

## 🚀 Production Deployment

1. Deploy ke Vercel/Railway
2. Update environment variables
3. Setup webhook URL
4. Initialize services

---

**Need help?** Check the main README.md for detailed documentation.
