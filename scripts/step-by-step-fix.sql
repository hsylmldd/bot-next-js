-- LANGKAH DEMI LANGKAH untuk memperbaiki foreign key relationships
-- Jalankan satu per satu di Supabase SQL Editor

-- ========================================
-- STEP 1: Pastikan order_id di tabel orders terisi
-- ========================================
UPDATE orders 
SET order_id = 'ORD-' || LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::text, 4, '0')
WHERE order_id IS NULL OR order_id = '';

-- Verifikasi step 1
SELECT order_id, customer_name FROM orders LIMIT 5;

-- ========================================
-- STEP 2: Backup data progress dan evidence
-- ========================================
DROP TABLE IF EXISTS progress_backup;
CREATE TABLE progress_backup AS SELECT * FROM progress;

DROP TABLE IF EXISTS evidence_backup;
CREATE TABLE evidence_backup AS SELECT * FROM evidence;

-- ========================================
-- STEP 3: Drop foreign key constraints
-- ========================================
ALTER TABLE progress DROP CONSTRAINT IF EXISTS progress_order_id_fkey;
ALTER TABLE evidence DROP CONSTRAINT IF EXISTS evidence_order_id_fkey;

-- ========================================
-- STEP 4: Tambah kolom sementara untuk progress
-- ========================================
ALTER TABLE progress ADD COLUMN IF NOT EXISTS new_order_id VARCHAR(255);

-- Update kolom sementara dengan order_id yang benar
UPDATE progress 
SET new_order_id = (
    SELECT orders.order_id 
    FROM orders 
    WHERE orders.id = progress.order_id::uuid
)
WHERE EXISTS (
    SELECT 1 
    FROM orders 
    WHERE orders.id = progress.order_id::uuid
);

-- Verifikasi step 4
SELECT order_id, new_order_id FROM progress LIMIT 5;

-- ========================================
-- STEP 5: Replace kolom order_id di progress
-- ========================================
ALTER TABLE progress DROP COLUMN order_id;
ALTER TABLE progress RENAME COLUMN new_order_id TO order_id;

-- ========================================
-- STEP 6: Tambah kolom sementara untuk evidence
-- ========================================
ALTER TABLE evidence ADD COLUMN IF NOT EXISTS new_order_id VARCHAR(255);

-- Update kolom sementara dengan order_id yang benar
UPDATE evidence 
SET new_order_id = (
    SELECT orders.order_id 
    FROM orders 
    WHERE orders.id = evidence.order_id::uuid
)
WHERE EXISTS (
    SELECT 1 
    FROM orders 
    WHERE orders.id = evidence.order_id::uuid
);

-- Verifikasi step 6
SELECT order_id, new_order_id FROM evidence LIMIT 5;

-- ========================================
-- STEP 7: Replace kolom order_id di evidence
-- ========================================
ALTER TABLE evidence DROP COLUMN order_id;
ALTER TABLE evidence RENAME COLUMN new_order_id TO order_id;

-- ========================================
-- STEP 8: Tambah foreign key constraints baru
-- ========================================
ALTER TABLE progress 
ADD CONSTRAINT progress_order_id_fkey 
FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE;

ALTER TABLE evidence 
ADD CONSTRAINT evidence_order_id_fkey 
FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE;

-- ========================================
-- STEP 9: Verifikasi hasil akhir
-- ========================================
-- Cek jumlah record
SELECT 'Progress table' as table_name, COUNT(*) as record_count FROM progress
UNION ALL
SELECT 'Evidence table' as table_name, COUNT(*) as record_count FROM evidence;

-- Test join relationships
SELECT 
    p.order_id,
    o.customer_name,
    p.stage,
    p.status
FROM progress p
JOIN orders o ON p.order_id = o.order_id
LIMIT 3;

SELECT 
    e.order_id,
    o.customer_name,
    e.odp_name,
    e.ont_sn
FROM evidence e
JOIN orders o ON e.order_id = o.order_id
LIMIT 3;