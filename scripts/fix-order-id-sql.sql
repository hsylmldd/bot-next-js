-- Alternative approach to add order_id column
-- Run this step by step in Supabase SQL Editor

-- Step 1: Add order_id column with default value to avoid null constraint issues
ALTER TABLE orders ADD COLUMN order_id VARCHAR(255) DEFAULT '';

-- Step 2: Update all existing records with proper order_id values
UPDATE orders 
SET order_id = 'ORD-' || LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::text, 4, '0')
WHERE order_id = '' OR order_id IS NULL;

-- Step 3: Now make it unique (after all records have values)
ALTER TABLE orders ADD CONSTRAINT orders_order_id_unique UNIQUE (order_id);

-- Step 4: Remove default value (optional)
ALTER TABLE orders ALTER COLUMN order_id DROP DEFAULT;

-- Step 5: Create index for performance
CREATE INDEX IF NOT EXISTS idx_orders_order_id ON orders(order_id);

-- Verify the results
SELECT order_id, customer_name, created_at FROM orders ORDER BY created_at;