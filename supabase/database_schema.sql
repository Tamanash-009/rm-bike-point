-- ==============================================================================
-- R.M BIKE POINT - COMPLETE SUPABASE SCHEMA
-- Run this entire script in your Supabase SQL Editor.
-- It recreates all tables with exact camelCase column names matching the React app.
-- ==============================================================================

-- 1. BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS public.bookings (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "userName" TEXT,
    "userEmail" TEXT,
    "bikeModel" TEXT,
    "serviceType" TEXT,
    "phone" TEXT,
    "date" TEXT,
    "time" TEXT,
    "notes" TEXT,
    "serviceInterval" TEXT,
    "status" TEXT DEFAULT 'pending',
    "pointsRedeemed" NUMERIC DEFAULT 0,
    "discountAmount" NUMERIC DEFAULT 0,
    "nextServiceDate" TEXT,
    "reminderSent" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PRODUCTS TABLE (MARKETPLACE)
CREATE TABLE IF NOT EXISTS public.products (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "slug" TEXT UNIQUE,
    "name" TEXT NOT NULL,
    "manufacturer" TEXT,
    "partNumber" TEXT,
    "compatibleModels" TEXT[],
    "yearRange" TEXT,
    "bsStage" TEXT,
    "condition" TEXT DEFAULT 'New',
    "quantity" INTEGER DEFAULT 0,
    "stockStatus" TEXT,
    "oldPrice" NUMERIC,
    "price" NUMERIC NOT NULL,
    "gst" NUMERIC DEFAULT 18,
    "description" TEXT,
    "images" TEXT[],
    "searchKeywords" TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "userName" TEXT,
    "userEmail" TEXT,
    "items" JSONB NOT NULL,
    "totalAmount" NUMERIC NOT NULL,
    "shippingAddress" JSONB,
    "status" TEXT DEFAULT 'pending',
    "paymentMethod" TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CHAT SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public."chatSessions" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "lastMessage" TEXT,
    "lastMessageAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CHAT MESSAGES TABLE
-- In Firebase this was a subcollection. In Supabase, we map it via session_id
CREATE TABLE IF NOT EXISTS public."chatSessions_messages" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "chatSessions_id" UUID REFERENCES public."chatSessions"("id") ON DELETE CASCADE,
    "senderId" TEXT,
    "senderName" TEXT,
    "text" TEXT,
    "isAdmin" BOOLEAN DEFAULT false,
    "isAI" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 6. USERS TABLE (Profiles)
CREATE TABLE IF NOT EXISTS public.users (
    "id" TEXT PRIMARY KEY,
    "displayName" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "role" TEXT DEFAULT 'user',
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 7. LOYALTY POINTS TABLE
CREATE TABLE IF NOT EXISTS public."loyalty_points" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "points" INTEGER DEFAULT 0,
    "totalEarned" INTEGER DEFAULT 0,
    "totalRedeemed" INTEGER DEFAULT 0,
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- SET UP ROW LEVEL SECURITY (RLS) - OPEN FOR NOW
ALTER TABLE public.bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."chatSessions" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."chatSessions_messages" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."loyalty_points" DISABLE ROW LEVEL SECURITY;

-- 8. AI USAGE TABLE (Rate limiting: 1 message per user per day)
CREATE TABLE IF NOT EXISTS public.ai_usage (
    "id"           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId"       TEXT NOT NULL,
    "date"         TEXT NOT NULL,        -- Format: YYYY-MM-DD
    "messageCount" INTEGER DEFAULT 0,
    UNIQUE ("userId", "date")
);
ALTER TABLE public.ai_usage DISABLE ROW LEVEL SECURITY;
