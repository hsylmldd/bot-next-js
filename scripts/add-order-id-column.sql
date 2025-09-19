-- Add order_id column to orders table
-- Run this in Supabase SQL Editor

-- Step 1: Add order_id column
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_id VARCHAR(255);

-- Step 2: Update existing records with order_id values
-- This will generate ORD-0001, ORD-0002, etc. based on creation order
UPDATE orders 
SET order_id = 'ORD-' || LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::text, 4, '0')
WHERE order_id IS NULL;

-- Step 3: Make order_id unique (optional, but recommended)
ALTER TABLE orders ADD CONSTRAINT orders_order_id_unique UNIQUE (order_id);

-- Step 4: Create index for better performance
CREATE INDEX IF NOT EXISTS idx_orders_order_id ON orders(order_id);

-- Step 5: Update progress table to use VARCHAR for order_id
ALTER TABLE progress ALTER COLUMN order_id TYPE VARCHAR(255);

-- Step 6: Update evidence table to use VARCHAR for order_id  
ALTER TABLE evidence ALTER COLUMN order_id TYPE VARCHAR(255);

-- Verify the changes
SELECT order_id, customer_name, created_at FROM orders ORDER BY created_at;