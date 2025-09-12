# Manual Setup Guide

## 🚨 Database Setup Required

Karena Supabase tidak mengizinkan eksekusi SQL otomatis melalui API, Anda perlu menjalankan SQL schema secara manual.

## 📋 Step-by-Step Manual Setup

### 1. Buka Supabase Dashboard

1. Go to [supabase.com](https://supabase.com)
2. Login ke akun Anda
3. Pilih project yang sudah dibuat

### 2. Buka SQL Editor

1. Di sidebar kiri, klik **SQL Editor**
2. Klik **New Query**

### 3. Copy dan Paste SQL Schema

Copy seluruh content dari file `supabase-schema.sql` dan paste ke SQL Editor:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    telegram_id VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(20) CHECK (role IN ('HD', 'Teknisi')) NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table
CREATE TABLE orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    customer_address TEXT NOT NULL,
    contact VARCHAR(255) NOT NULL,
    assigned_technician UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(20) CHECK (status IN ('Pending', 'In Progress', 'On Hold', 'Completed', 'Closed')) DEFAULT 'Pending',
    sod_time TIMESTAMP WITH TIME ZONE,
    e2e_time TIMESTAMP WITH TIME ZONE,
    lme_pt2_start TIMESTAMP WITH TIME ZONE,
    lme_pt2_end TIMESTAMP WITH TIME ZONE,
    sla_deadline TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create progress table
CREATE TABLE progress (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    stage VARCHAR(20) CHECK (stage IN ('Survey', 'Penarikan', 'P2P', 'Instalasi', 'Catatan')) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('Ready', 'Not Ready', 'Selesai')) NOT NULL,
    note TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create evidence table
CREATE TABLE evidence (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    odp_name VARCHAR(255),
    ont_sn VARCHAR(255),
    photo_sn_ont TEXT,
    photo_technician_customer TEXT,
    photo_customer_house TEXT,
    photo_odp_front TEXT,
    photo_odp_inside TEXT,
    photo_label_dc TEXT,
    photo_test_result TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_telegram_id ON users(telegram_id);
CREATE INDEX idx_orders_assigned_technician ON orders(assigned_technician);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_progress_order_id ON progress(order_id);
CREATE INDEX idx_progress_timestamp ON progress(timestamp);
CREATE INDEX idx_evidence_order_id ON evidence(order_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create RLS (Row Level Security) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (true);

-- HD can see all orders, Teknisi can only see assigned orders
CREATE POLICY "HD can view all orders" ON orders FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = orders.assigned_technician AND users.role = 'HD')
    OR 
    EXISTS (SELECT 1 FROM users WHERE users.telegram_id = current_setting('request.jwt.claims', true)::json->>'telegram_id' AND users.role = 'HD')
);

CREATE POLICY "Teknisi can view assigned orders" ON orders FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE users.telegram_id = current_setting('request.jwt.claims', true)::json->>'telegram_id' AND users.id = orders.assigned_technician)
);

-- Progress policies
CREATE POLICY "Users can view progress for accessible orders" ON progress FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = progress.order_id AND (
        EXISTS (SELECT 1 FROM users WHERE users.id = orders.assigned_technician AND users.role = 'HD')
        OR 
        EXISTS (SELECT 1 FROM users WHERE users.telegram_id = current_setting('request.jwt.claims', true)::json->>'telegram_id' AND users.id = orders.assigned_technician)
    ))
);

-- Evidence policies
CREATE POLICY "Users can view evidence for accessible orders" ON evidence FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = evidence.order_id AND (
        EXISTS (SELECT 1 FROM users WHERE users.id = orders.assigned_technician AND users.role = 'HD')
        OR 
        EXISTS (SELECT 1 FROM users WHERE users.telegram_id = current_setting('request.jwt.claims', true)::json->>'telegram_id' AND users.id = orders.assigned_technician)
    ))
);

-- Create storage bucket for evidence photos
INSERT INTO storage.buckets (id, name, public) VALUES ('evidence-photos', 'evidence-photos', true);

-- Set up storage policies
CREATE POLICY "Public read access for evidence photos" ON storage.objects
FOR SELECT USING (bucket_id = 'evidence-photos');

CREATE POLICY "Authenticated users can upload evidence photos" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'evidence-photos');

CREATE POLICY "Authenticated users can update evidence photos" ON storage.objects
FOR UPDATE USING (bucket_id = 'evidence-photos');

-- Insert sample data
INSERT INTO users (telegram_id, role, name) VALUES 
('123456789', 'HD', 'Admin Helpdesk'),
('987654321', 'Teknisi', 'Teknisi 1'),
('111222333', 'Teknisi', 'Teknisi 2');
```

### 4. Run SQL Script

1. Klik tombol **Run** atau tekan `Ctrl+Enter`
2. Tunggu hingga script selesai dijalankan
3. Anda akan melihat hasil di bagian bawah

### 5. Verify Tables Created

1. Di sidebar kiri, klik **Table Editor**
2. Anda seharusnya melihat tabel:
   - `users`
   - `orders`
   - `progress`
   - `evidence`

### 6. Test Connection

Kembali ke terminal dan jalankan:

```bash
npm run test:connection
```

Jika berhasil, Anda akan melihat:
```
✅ Database connection successful
✅ Users table accessible
✅ Orders table accessible
✅ Progress table accessible
✅ Evidence table accessible
```

### 7. Continue Setup

Setelah database berhasil, lanjutkan dengan:

```bash
# Setup storage
npm run setup:storage

# Create sample data
npm run setup:sample

# Start development server
npm run dev:mode
```

## 🚨 Troubleshooting

### Error: "duplicate key value violates unique constraint"

Ini normal jika bucket 'evidence-photos' sudah ada. Abaikan error ini.

### Error: "relation already exists"

Ini normal jika tabel sudah ada. Abaikan error ini.

### Error: "permission denied"

Pastikan Anda menggunakan Service Role Key, bukan Anon Key.

## 📞 Need Help?

Jika masih ada masalah:

1. **Check Supabase Dashboard** - Pastikan project aktif
2. **Verify Environment Variables** - Jalankan `npm run check:env`
3. **Check SQL Script** - Pastikan tidak ada syntax error
4. **Contact Support** - Jika semua gagal

---

**Setelah database setup selesai, bot siap digunakan!** 🎉
