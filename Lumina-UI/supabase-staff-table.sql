-- ============================================================================
-- LUMINA DENTAL STUDIO: STAFF & CLINICIANS RBAC SCHEMA & SEED
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/hhshukohvlustqsuqegq/sql/new)
-- ============================================================================

-- 1. Create or Update staff_users Table
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
    birthdate DATE,
    sex TEXT CHECK (sex IN ('Male', 'Female', 'Other', NULL)),
    age INTEGER,
    location TEXT DEFAULT 'Bonifacio Global City, Taguig',
    profile_completed BOOLEAN NOT NULL DEFAULT FALSE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
    password_hash TEXT NOT NULL DEFAULT 'pbkdf2$100000$a8f3b2c1d4e5f6789012345678abcdef$350a66711ceddf03b8519b78c63f7977130922655d2193ac96212ac57dfbb19f38af58c511c540e451dfd15a86fef5e09907672b52d13999a5aea2981c06bba8'
);

-- 2. Add columns if table already exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff_users' AND column_name = 'birthdate') THEN
        ALTER TABLE public.staff_users ADD COLUMN birthdate DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff_users' AND column_name = 'sex') THEN
        ALTER TABLE public.staff_users ADD COLUMN sex TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff_users' AND column_name = 'age') THEN
        ALTER TABLE public.staff_users ADD COLUMN age INTEGER;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff_users' AND column_name = 'location') THEN
        ALTER TABLE public.staff_users ADD COLUMN location TEXT DEFAULT 'Bonifacio Global City, Taguig';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff_users' AND column_name = 'profile_completed') THEN
        ALTER TABLE public.staff_users ADD COLUMN profile_completed BOOLEAN NOT NULL DEFAULT FALSE;
    END IF;
END $$;

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.staff_users ENABLE ROW LEVEL SECURITY;

-- 4. Allow Service Role full access to staff_users
DROP POLICY IF EXISTS "Allow service role full access to staff_users" ON public.staff_users;
CREATE POLICY "Allow service role full access to staff_users"
    ON public.staff_users
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 5. Insert Practice Accounts with Cryptographically Hashed Passwords
INSERT INTO public.staff_users (
    email,
    first_name,
    last_name,
    name,
    role,
    specialization,
    license_number,
    status,
    profile_completed,
    password_hash
)
VALUES
    (
        'bryantiversonmelliza03@gmail.com',
        'Bryant Iverson',
        'Melliza',
        'Bryant Iverson Melliza',
        'super_admin',
        'Owner',
        NULL,
        'active',
        FALSE,
        'pbkdf2$100000$a8f3b2c1d4e5f6789012345678abcdef$350a66711ceddf03b8519b78c63f7977130922655d2193ac96212ac57dfbb19f38af58c511c540e451dfd15a86fef5e09907672b52d13999a5aea2981c06bba8'
    ),
    (
        'doctor@luminaclinic.com',
        'Lumina',
        'DDS',
        'Dr. Lumina, DDS',
        'doctor',
        'Lead Attending Dentist',
        'PRC-098234',
        'active',
        FALSE,
        'pbkdf2$100000$a8f3b2c1d4e5f6789012345678abcdef$350a66711ceddf03b8519b78c63f7977130922655d2193ac96212ac57dfbb19f38af58c511c540e451dfd15a86fef5e09907672b52d13999a5aea2981c06bba8'
    ),
    (
        'admin@luminaclinic.com',
        'Care',
        'Coordinator',
        'Clinical Reception & Care Team',
        'front_desk',
        'Operations & Care Coordinator',
        NULL,
        'active',
        TRUE,
        'pbkdf2$100000$a8f3b2c1d4e5f6789012345678abcdef$350a66711ceddf03b8519b78c63f7977130922655d2193ac96212ac57dfbb19f38af58c511c540e451dfd15a86fef5e09907672b52d13999a5aea2981c06bba8'
    ),
    (
        'luminadentalclinic2026@gmail.com',
        'Studio',
        'Admin',
        'Lumina Dental Studio Administrator',
        'super_admin',
        'Practice Administrator',
        NULL,
        'active',
        TRUE,
        'pbkdf2$100000$a8f3b2c1d4e5f6789012345678abcdef$350a66711ceddf03b8519b78c63f7977130922655d2193ac96212ac57dfbb19f38af58c511c540e451dfd15a86fef5e09907672b52d13999a5aea2981c06bba8'
    )
ON CONFLICT (email) DO UPDATE
SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    specialization = EXCLUDED.specialization,
    license_number = EXCLUDED.license_number,
    status = EXCLUDED.status,
    password_hash = EXCLUDED.password_hash;
