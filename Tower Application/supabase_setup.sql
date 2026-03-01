-- Tower Communication & Complaint Management System
-- Database Schema & RLS Setup

-- 1. Create Tables
CREATE TABLE IF NOT EXISTS complaints (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    flat_no TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Lift', 'Water', 'Electricity', 'Security', 'Other')),
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in-progress', 'resolved')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- MIGRATION: Update existing complaints table if it already exists
DO $$ 
BEGIN 
    -- Update status check constraint
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'complaints_status_check') THEN
        ALTER TABLE complaints DROP CONSTRAINT complaints_status_check;
    END IF;
    ALTER TABLE complaints ADD CONSTRAINT complaints_status_check CHECK (status IN ('open', 'in-progress', 'resolved'));
END $$;

CREATE TABLE IF NOT EXISTS comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal', 'urgent')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    file_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Admin Table (Custom Auth)
CREATE TABLE IF NOT EXISTS admins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL, -- BCrypt hash (DO NOT STORE PLAIN TEXT)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable Row Level Security (RLS) on all tables
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- 4. Create Indices for Performance
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_comments_complaint_id ON comments(complaint_id);
CREATE INDEX IF NOT EXISTS idx_notices_created_at ON notices(created_at DESC);

-- 5. RLS Policies

-- ADMINS TABLE (Secure by default, only internal queries)
DROP POLICY IF EXISTS "Admins are private" ON admins;
CREATE POLICY "Admins are private" ON admins FOR ALL USING (false);

-- COMPLAINTS
DROP POLICY IF EXISTS "Public can insert complaints" ON complaints;
CREATE POLICY "Public can insert complaints" ON complaints
FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can view complaints" ON complaints;
CREATE POLICY "Anyone can view complaints" ON complaints
FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Admins can update complaints" ON complaints;
CREATE POLICY "Admins can update complaints" ON complaints
FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Admins can delete complaints" ON complaints;
CREATE POLICY "Admins can delete complaints" ON complaints
FOR DELETE USING (true);

-- COMMENTS
DROP POLICY IF EXISTS "Admins can insert comments" ON comments;
CREATE POLICY "Admins can insert comments" ON comments
FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can view comments" ON comments;
CREATE POLICY "Anyone can view comments" ON comments
FOR SELECT TO public USING (true);

-- NOTICES
DROP POLICY IF EXISTS "Public can view notices" ON notices;
CREATE POLICY "Public can view notices" ON notices
FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Admins can manage notices" ON notices;
CREATE POLICY "Admins can manage notices" ON notices
FOR ALL USING (true) WITH CHECK (true);

-- EVENTS
DROP POLICY IF EXISTS "Public can view events" ON events;
CREATE POLICY "Public can view events" ON events
FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Admins can manage events" ON events;
CREATE POLICY "Admins can manage events" ON events
FOR ALL USING (true) WITH CHECK (true);

-- DOCUMENTS
DROP POLICY IF EXISTS "Public can view documents" ON documents;
CREATE POLICY "Public can view documents" ON documents
FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Admins can manage documents" ON documents;
CREATE POLICY "Admins can manage documents" ON documents
FOR ALL USING (true) WITH CHECK (true);
