-- ====================================================================
-- Lumina Dental Studio — Complete Supabase PostgreSQL Schema
-- Aligned 100% with Frontend Forms (Inquiries, Bookings, & Medical Intake)
-- ====================================================================

-- 1. Create Enums for Strict Type Safety
DO $$ BEGIN
  CREATE TYPE appointment_status AS ENUM (
    'lead_captured',
    'confirmed',
    'intake_submitted',
    'completed',
    'cancelled',
    'no_show'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. General & Clinical Inquiries Table (Mode 1 on Landing Page)
CREATE TABLE IF NOT EXISTS inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  service_of_interest TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new' -- 'new', 'in_review', 'replied', 'archived'
);

-- 3. Patients Table (Mode 2: Step 1 Personal & Clinical Details)
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  mobile TEXT NOT NULL,
  date_of_birth DATE,
  sex_assigned_at_birth TEXT, -- 'Female' or 'Male'
  last_visit_date DATE,
  recall_sent BOOLEAN DEFAULT FALSE
);

-- 4. Appointments Table (Mode 2: Step 2 Treatment + Step 3 Slot & Notes)
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  appointment_date DATE NOT NULL,
  time_slot TEXT NOT NULL,
  patient_notes TEXT,
  status appointment_status DEFAULT 'confirmed',
  google_calendar_event_id TEXT,
  intake_token UUID DEFAULT gen_random_uuid(),
  intake_completed_at TIMESTAMPTZ
);

-- 5. Medical Intake Records Table (Pre-Visit Medical History Form)
CREATE TABLE IF NOT EXISTS medical_intakes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID UNIQUE REFERENCES appointments(id) ON DELETE CASCADE,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  date_of_birth DATE,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  medical_conditions TEXT[] DEFAULT '{}', -- e.g. ARRAY['Hypertension', 'Diabetes']
  allergies TEXT[] DEFAULT '{}',          -- e.g. ARRAY['Penicillin', 'Latex']
  current_medications TEXT,
  hmo_provider TEXT,
  hmo_member_id TEXT,
  consent_signed BOOLEAN NOT NULL DEFAULT TRUE
);

-- 6. Performance Indexes for Fast Queries
CREATE INDEX IF NOT EXISTS idx_inquiries_email ON inquiries(email);
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_patients_email ON patients(email);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_intake_token ON appointments(intake_token);

-- 7. Enable Row Level Security (RLS) & Allow Service Role Admin Access
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_intakes ENABLE ROW LEVEL SECURITY;

-- Allow Service Role key unrestricted full access
DROP POLICY IF EXISTS "Service role full access on inquiries" ON inquiries;
CREATE POLICY "Service role full access on inquiries" ON inquiries USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on patients" ON patients;
CREATE POLICY "Service role full access on patients" ON patients USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on appointments" ON appointments;
CREATE POLICY "Service role full access on appointments" ON appointments USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on medical_intakes" ON medical_intakes;
CREATE POLICY "Service role full access on medical_intakes" ON medical_intakes USING (true) WITH CHECK (true);
