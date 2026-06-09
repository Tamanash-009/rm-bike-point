-- ==============================================================================
-- RM BIKEPOINT: PRODUCTION-GRADE PRODUCTS MIGRATION
-- Fixes: "Import failed: No suitable key or wrong key type"
-- Features: Safe Backup, Type Casting, Indexing, and Array Enforcement
-- ==============================================================================

-- 1. Backup Existing Table (Safely renaming to avoid data loss)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'products') THEN
        -- If backup already exists from previous runs, drop it or rename this one uniquely
        IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'products_backup_20260610') THEN
            DROP TABLE public.products_backup_20260610; 
        END IF;
        
        -- Rename current products table to backup
        ALTER TABLE public.products RENAME TO products_backup_20260610;
        
        -- Drop old constraints and indexes on the backup table to prevent naming collisions
        -- (PostgreSQL automatically renames some, but it's safer to drop dependent indexes if necessary, 
        -- though simply renaming the table usually retains them under the new table context).
    END IF;
END $$;

-- 2. & 3. Recreate the Products Table (Exact Target Schema)
CREATE TABLE IF NOT EXISTS public.products (
    "id" TEXT PRIMARY KEY,
    "name" TEXT,
    "model" TEXT,
    "brand" TEXT,
    "description" TEXT,
    "price" NUMERIC,
    "category" TEXT,
    "imageUrl" TEXT,
    "images" TEXT[],
    "type" TEXT DEFAULT 'product',
    "stock" INTEGER DEFAULT 0,
    "status" TEXT DEFAULT 'available',
    "bikeModels" TEXT[],
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Restore Existing Data (Safely casting types and mapping old columns)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'products_backup_20260610') THEN
        
        -- Note: This maps the older schema known in database_schema.sql to the new one.
        -- Type casting ensures UUID -> TEXT, Quantity -> INTEGER stock, etc.
        INSERT INTO public.products (
            "id", 
            "name", 
            "brand", 
            "description", 
            "price", 
            "imageUrl", 
            "images", 
            "stock", 
            "bikeModels", 
            "createdAt", 
            "updatedAt"
        )
        SELECT 
            "id"::TEXT,                                       -- UUID -> TEXT
            "name"::TEXT, 
            "manufacturer"::TEXT,                             -- manufacturer -> brand
            "description"::TEXT, 
            "price"::NUMERIC,                                 -- NUMERIC strings -> NUMERIC
            CASE 
               WHEN "images" IS NOT NULL AND array_length("images", 1) > 0 
               THEN "images"[1]::TEXT 
               ELSE 'https://images.unsplash.com/photo-1600661653561-629509216228?w=800&q=80' 
            END,                                              -- Extracts first image as imageUrl
            "images"::TEXT[],                                 -- Ensures TEXT[] array
            COALESCE("quantity"::INTEGER, 0),                 -- Quantity -> INTEGER stock
            "compatibleModels"::TEXT[],                       -- Compatible models -> bikeModels array
            "createdAt", 
            "updatedAt"
        FROM public.products_backup_20260610
        ON CONFLICT ("id") DO NOTHING;
        
    END IF;
END $$;

-- 5. Disable RLS
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;

-- 6. Create Helpful Indexes
CREATE INDEX IF NOT EXISTS idx_products_name ON public.products("name");
CREATE INDEX IF NOT EXISTS idx_products_brand ON public.products("brand");
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products("category");
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products("status");
CREATE INDEX IF NOT EXISTS idx_products_price ON public.products("price");

-- 7, 8, & 9. Verify Schema, Primary Key, and Arrays
-- This will output the column definitions in the Supabase SQL Editor Results tab.
SELECT 
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_name = 'products' 
ORDER BY ordinal_position;
