-- Add hero_images column to tenants table
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS hero_images TEXT[] DEFAULT '{}';
