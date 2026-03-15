-- TOWER PULSE: UNIVERSAL DATABASE SETUP SCRIPT
-- This script sets up the entire schema for a new Tower instance.
-- Run this in the Supabase SQL Editor.

-- 1. CLEANUP (Optional - Use with caution)
-- DROP TABLE IF EXISTS comments;
-- DROP TABLE IF EXISTS complaints;
-- DROP TABLE IF EXISTS documents;
-- DROP TABLE IF EXISTS events;
-- DROP TABLE IF EXISTS notices;
-- DROP TABLE IF EXISTS admin_auth;

-- 2. CREATE TABLES

-- Admin Authentication Table
CREATE TABLE IF NOT EXISTS admin_auth (
    id UUID PRIMARY KEY DEFAULT auth.uid(),
    password_hash TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Notices Table
CREATE TABLE IF NOT EXISTS notices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_urgent BOOLEAN DEFAULT false,
    priority TEXT DEFAULT 'normal'
);

-- Events Table
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    date DATE NOT NULL,
    time TEXT NOT NULL,
    location TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Documents Table
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    url TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Complaints Table (Issues)
CREATE TABLE IF NOT EXISTS complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flat_no TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in-progress', 'resolved')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Comments Table (Committee Feed)
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_auth ENABLE ROW LEVEL SECURITY;

-- 4. CREATE POLICIES

-- Public Read Access
CREATE POLICY "Public Read Access: Notices" ON notices FOR SELECT USING (true);
CREATE POLICY "Public Read Access: Events" ON events FOR SELECT USING (true);
CREATE POLICY "Public Read Access: Documents" ON documents FOR SELECT USING (true);
CREATE POLICY "Public Read Access: Complaints" ON complaints FOR SELECT USING (true);
CREATE POLICY "Public Read Access: Comments" ON comments FOR SELECT USING (true);

-- Admin Write Access (Simulated - In production, use service_role or specific admin check)
-- For this MVP/Production Revamp, we assume admin operations are handled via Server Actions with internal checks.
-- For stricter security, add session-based policies here.
CREATE POLICY "Admin Write Access: Notices" ON notices ALL USING (true);
CREATE POLICY "Admin Write Access: Events" ON events ALL USING (true);
CREATE POLICY "Admin Write Access: Documents" ON documents ALL USING (true);
CREATE POLICY "Admin Write Access: Complaints" ON complaints ALL USING (true);
CREATE POLICY "Admin Write Access: Comments" ON comments ALL USING (true);

-- 5. HELPER TRIGGERS
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_admin_auth_updated_at BEFORE UPDATE ON admin_auth FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 6. INITIAL DATA (Optional)
-- INSERT INTO admin_auth (password_hash) VALUES ('$2b$10$vI8Z...your_hashed_password...');
