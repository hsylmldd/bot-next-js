# SQL Schema Step by Step

## 🚀 Database Setup - Step by Step

Jalankan setiap langkah di Supabase SQL Editor secara berurutan.

### Step 1: Enable UUID Extension

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Step 2: Create Users Table

```sql
CREATE TABLE users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    telegram_id VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(20) CHECK (role IN ('HD', 'Teknisi')) NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Step 3: Create Orders Table

```sql
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
```

### Step 4: Create Progress Table

```sql
CREATE TABLE progress (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    stage VARCHAR(20) CHECK (stage IN ('Survey', 'Penarikan', 'P2P', 'Instalasi', 'Catatan')) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('Ready', 'Not Ready', 'Selesai')) NOT NULL,
    note TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Step 5: Create Evidence Table

```sql
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
```

### Step 6: Create Indexes

```sql
CREATE INDEX idx_users_telegram_id ON users(telegram_id);
CREATE INDEX idx_orders_assigned_technician ON orders(assigned_technician);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_progress_order_id ON progress(order_id);
CREATE INDEX idx_progress_timestamp ON progress(timestamp);
CREATE INDEX idx_evidence_order_id ON evidence(order_id);
```

### Step 7: Create Triggers

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Step 8: Create RLS Policies

```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own data" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (true);

CREATE POLICY "HD can view all orders" ON orders FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = orders.assigned_technician AND users.role = 'HD')
    OR 
    EXISTS (SELECT 1 FROM users WHERE users.telegram_id = current_setting('request.jwt.claims', true)::json->>'telegram_id' AND users.role = 'HD')
);

CREATE POLICY "Teknisi can view assigned orders" ON orders FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE users.telegram_id = current_setting('request.jwt.claims', true)::json->>'telegram_id' AND users.id = orders.assigned_technician)
);

CREATE POLICY "Users can view progress for accessible orders" ON progress FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = progress.order_id AND (
        EXISTS (SELECT 1 FROM users WHERE users.id = orders.assigned_technician AND users.role = 'HD')
        OR 
        EXISTS (SELECT 1 FROM users WHERE users.telegram_id = current_setting('request.jwt.claims', true)::json->>'telegram_id' AND users.id = orders.assigned_technician)
    ))
);

CREATE POLICY "Users can view evidence for accessible orders" ON evidence FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = evidence.order_id AND (
        EXISTS (SELECT 1 FROM users WHERE users.id = orders.assigned_technician AND users.role = 'HD')
        OR 
        EXISTS (SELECT 1 FROM users WHERE users.telegram_id = current_setting('request.jwt.claims', true)::json->>'telegram_id' AND users.id = orders.assigned_technician)
    ))
);
```

### Step 9: Insert Sample Data

```sql
INSERT INTO users (telegram_id, role, name) VALUES 
('123456789', 'HD', 'Admin Helpdesk'),
('987654321', 'Teknisi', 'Teknisi 1'),
('111222333', 'Teknisi', 'Teknisi 2');
```

## 📋 How to Run

1. **Go to Supabase Dashboard**
2. **Open SQL Editor**
3. **Run each step one by one**
4. **After each step, test:**
   ```bash
   npm run simple:check
   ```
5. **Continue until all tables are created**

## ✅ Verification

After running all steps, you should see:

```
✅ users: accessible
✅ orders: accessible  
✅ progress: accessible
✅ evidence: accessible
✅ Storage accessible
```

## 🚨 Troubleshooting

- **Error: "relation already exists"** - Skip this step, table already exists
- **Error: "duplicate key value violates unique constraint"** - Skip this step, data already exists
- **Error: "permission denied"** - Make sure you're using Service Role Key

---

**After all steps complete, run: `npm run simple:check` to verify!** 🎉
