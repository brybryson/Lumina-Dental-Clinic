-- ============================================================================
-- LUMINA DENTAL STUDIO: STAFF & CLINICIANS RBAC TABLE
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/hhshukohvlustqsuqegq/sql)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.staff_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'doctor', 'front_desk')),
    specialization TEXT DEFAULT 'General Dentistry',
    license_number TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
    password_hash TEXT DEFAULT 'LuminaStudio2026!'
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.staff_users ENABLE ROW LEVEL SECURITY;

-- Allow Service Role full access to staff_users
CREATE POLICY "Allow service role full access to staff_users"
    ON public.staff_users
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Insert Default Practice Accounts
INSERT INTO public.staff_users (email, first_name, last_name, name, role, specialization, license_number, status)
VALUES
    (
        'bryantiversonmelliza03@gmail.com',
        'Bryant Iverson',
        'Melliza',
        'Bryant Iverson Melliza',
        'super_admin',
        'Owner',
        NULL,
        'active'
    ),
    (
        'doctor@luminaclinic.com',
        'Lumina',
        'DDS',
        'Dr. Lumina, DDS',
        'doctor',
        'Lead Attending Dentist',
        'PRC-098234',
        'active'
    ),
    (
        'admin@luminaclinic.com',
        'Care',
        'Coordinator',
        'Clinical Reception & Care Team',
        'front_desk',
        'Operations & Care Coordinator',
        NULL,
        'active'
    ),
    (
        'luminadentalclinic2026@gmail.com',
        'Studio',
        'Admin',
        'Lumina Dental Studio Administrator',
        'super_admin',
        'Practice Administrator',
        NULL,
        'active'
    )
ON CONFLICT (email) DO UPDATE
SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    specialization = EXCLUDED.specialization,
    license_number = EXCLUDED.license_number,
    status = EXCLUDED.status;
