-- Update foreign key relationships untuk progress dan evidence tables
-- Jalankan script ini di Supabase SQL Editor step by step

-- Step 1: Drop existing foreign key constraints
ALTER TABLE progress DROP CONSTRAINT IF EXISTS progress_order_id_fkey;
ALTER TABLE evidence DROP CONSTRAINT IF EXISTS evidence_order_id_fkey;

-- Step 2: Update progress table - ubah order_id dari UUID ke VARCHAR dan isi dengan order_id yang sesuai
-- Backup data progress terlebih dahulu
CREATE TABLE progress_backup AS SELECT * FROM progress;

-- Update order_id di progress table dengan nilai order_id dari orders table
UPDATE progress 
SET order_id = (
    SELECT orders.order_id 
    FROM orders 
    WHERE orders.id::text = progress.order_id::text
)
WHERE EXISTS (
    SELECT 1 
    FROM orders 
    WHERE orders.id::text = progress.order_id::text
);

-- Ubah tipe data order_id di progress table menjadi VARCHAR
ALTER TABLE progress ALTER COLUMN order_id TYPE VARCHAR(255);

-- Step 3: Update evidence table - ubah order_id dari UUID ke VARCHAR dan isi dengan order_id yang sesuai
-- Backup data evidence terlebih dahulu
CREATE TABLE evidence_backup AS SELECT * FROM evidence;

-- Update order_id di evidence table dengan nilai order_id dari orders table
UPDATE evidence 
SET order_id = (
    SELECT orders.order_id 
    FROM orders 
    WHERE orders.id::text = evidence.order_id::text
)
WHERE EXISTS (
    SELECT 1 
    FROM orders 
    WHERE orders.id::text = evidence.order_id::text
);

-- Ubah tipe data order_id di evidence table menjadi VARCHAR
ALTER TABLE evidence ALTER COLUMN order_id TYPE VARCHAR(255);

-- Step 4: Tambahkan foreign key constraints yang baru
ALTER TABLE progress 
ADD CONSTRAINT progress_order_id_fkey 
FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE;

ALTER TABLE evidence 
ADD CONSTRAINT evidence_order_id_fkey 
FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE;

-- Step 5: Verifikasi hasil
SELECT 'Progress table' as table_name, COUNT(*) as record_count FROM progress
UNION ALL
SELECT 'Evidence table' as table_name, COUNT(*) as record_count FROM evidence;

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