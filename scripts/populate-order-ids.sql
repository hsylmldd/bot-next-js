-- Populate order_id values for existing records
-- Run this in Supabase SQL Editor after adding the order_id column

-- Update existing records with order_id values
UPDATE orders 
SET order_id = 'ORD-' || LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::text, 4, '0')
WHERE order_id IS NULL;

-- Verify the update
SELECT order_id, customer_name, created_at 
FROM orders 
ORDER BY created_at;