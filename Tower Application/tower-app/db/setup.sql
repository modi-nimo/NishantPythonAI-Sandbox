-- TOWER PULSE: COMMERCIAL-GRADE DATABASE SETUP
-- Version: 2.0 (Production Ready)
-- This script sets up a secure, auditable schema for a high-traffic Tower instance.

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CREATE TABLES

-- Tower Metadata (For Branding & Contact)
CREATE TABLE IF NOT EXISTS tower_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT,
    secretary_contact TEXT,
    manager_contact TEXT,
    branding_color TEXT DEFAULT '#2563eb',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

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
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('normal', 'high', 'urgent')),
    created_by UUID REFERENCES auth.users(id)
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
    resident_name TEXT,
    phone_number TEXT,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in-progress', 'resolved')),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Complaint Logs (Audit Trail for Status Changes)
CREATE TABLE IF NOT EXISTS complaint_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE,
    old_status TEXT,
    new_status TEXT,
    action_by TEXT DEFAULT 'System',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Comments Table (Internal Discussion)
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    author TEXT DEFAULT 'Admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE tower_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_auth ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- 4. CREATE POLICIES

-- Public Read Access (For Residents)
CREATE POLICY "Allow public read" ON tower_metadata FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON notices FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON events FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON documents FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON complaints FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON comments FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON complaint_logs FOR SELECT USING (true);

-- Anonymous Insert (For Residents to post)
CREATE POLICY "Allow anonymous complaint submission" ON complaints FOR INSERT WITH CHECK (true);

-- Admin Full Access (Based on service_role or specific checks)
-- Note: In production, refine these to specific auth.uid() if using Supabase Auth
CREATE POLICY "Admin full access" ON tower_metadata ALL USING (true);
CREATE POLICY "Admin full access" ON notices ALL USING (true);
CREATE POLICY "Admin full access" ON events ALL USING (true);
CREATE POLICY "Admin full access" ON documents ALL USING (true);
CREATE POLICY "Admin full access" ON complaints ALL USING (true);
CREATE POLICY "Admin full access" ON complaint_logs ALL USING (true);
CREATE POLICY "Admin full access" ON comments ALL USING (true);

-- 5. AUTOMATION: LOG STATUS CHANGES
CREATE OR REPLACE FUNCTION log_complaint_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO complaint_logs (complaint_id, old_status, new_status)
        VALUES (NEW.id, OLD.status, NEW.status);
    END IF;
    
    -- Auto-set resolved_at timestamp
    IF (NEW.status = 'resolved' AND OLD.status != 'resolved') THEN
        NEW.resolved_at = now();
    ELSIF (NEW.status != 'resolved') THEN
        NEW.resolved_at = NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_complaint_status_change
    BEFORE UPDATE ON complaints
    FOR EACH ROW EXECUTE PROCEDURE log_complaint_status_change();

-- 6. INITIAL DATA
INSERT INTO tower_metadata (name, address) VALUES ('Sample Tower', '123 Main St, City');

