-- Update foreign key relationships untuk progress dan evidence tables (FIXED VERSION)
-- Jalankan script ini di Supabase SQL Editor step by step

-- PENTING: Pastikan kolom order_id di tabel orders sudah terisi terlebih dahulu!
-- Jalankan ini dulu jika belum:
-- UPDATE orders SET order_id = 'ORD-' || LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::text, 4, '0') WHERE order_id IS NULL OR order_id = '';

-- Step 1: Drop existing foreign key constraints
ALTER TABLE progress DROP CONSTRAINT IF EXISTS progress_order_id_fkey;
ALTER TABLE evidence DROP CONSTRAINT IF EXISTS evidence_order_id_fkey;

-- Step 2: Backup data terlebih dahulu
CREATE TABLE progress_backup AS SELECT * FROM progress;
CREATE TABLE evidence_backup AS SELECT * FROM evidence;

-- Step 3: Update progress table
-- Pertama, ubah tipe data kolom order_id menjadi VARCHAR
ALTER TABLE progress ALTER COLUMN order_id TYPE VARCHAR(255) USING order_id::VARCHAR(255);

-- Kemudian update nilai order_id dengan nilai dari orders.order_id
UPDATE progress 
SET order_id = (
    SELECT orders.order_id 
    FROM orders 
    WHERE orders.id::text = progress.order_id
)
WHERE EXISTS (
    SELECT 1 
    FROM orders 
    WHERE orders.id::text = progress.order_id
    AND orders.order_id IS NOT NULL 
    AND orders.order_id != ''
);

-- Step 4: Update evidence table
-- Pertama, ubah tipe data kolom order_id menjadi VARCHAR
ALTER TABLE evidence ALTER COLUMN order_id TYPE VARCHAR(255) USING order_id::VARCHAR(255);

-- Kemudian update nilai order_id dengan nilai dari orders.order_id
UPDATE evidence 
SET order_id = (
    SELECT orders.order_id 
    FROM orders 
    WHERE orders.id::text = evidence.order_id
)
WHERE EXISTS (
    SELECT 1 
    FROM orders 
    WHERE orders.id::text = evidence.order_id
    AND orders.order_id IS NOT NULL 
    AND orders.order_id != ''
);

-- Step 5: Tambahkan foreign key constraints yang baru
ALTER TABLE progress 
ADD CONSTRAINT progress_order_id_fkey 
FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE;

ALTER TABLE evidence 
ADD CONSTRAINT evidence_order_id_fkey 
FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE;

-- Step 6: Verifikasi hasil
SELECT 'Progress table' as table_name, COUNT(*) as record_count FROM progress
UNION ALL
SELECT 'Evidence table' as table_name, COUNT(*) as record_count FROM evidence;

-- Cek apakah ada record yang order_id-nya masih UUID (belum terupdate)
SELECT 'Progress with UUID order_id' as issue, COUNT(*) as count 
FROM progress 
WHERE order_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
UNION ALL
SELECT 'Evidence with UUID order_id' as issue, COUNT(*) as count 
FROM evidence 
WHERE order_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Cek foreign key relationships
SELECT 
    p.order_id,
    o.customer_name,
    p.stage,
    p.status
FROM progress p
JOIN orders o ON p.order_id = o.order_id
LIMIT 5;

SELECT 
    e.order_id,
    o.customer_name,
    e.odp_name,
    e.ont_sn
FROM evidence e
JOIN orders o ON e.order_id = o.order_id
LIMIT 5;