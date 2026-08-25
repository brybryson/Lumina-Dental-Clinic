-- ==============================================================================
-- Lumina Dental Studio: Appointments Lifecycle & Timestamp Tracking Migration
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/hhshukohvlustqsuqegq/sql/new
-- ==============================================================================

-- 1. Add 'checked_in' enum value to appointment_status (if using postgres enum)
DO $$
BEGIN
    ALTER TYPE appointment_status ADD VALUE IF NOT EXISTS 'checked_in';
EXCEPTION
    WHEN duplicate_object THEN null;
    WHEN undefined_object THEN null;
END $$;

-- 2. Add lifecycle timestamp tracking columns to appointments table
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS no_show_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

-- 3. Create index on status and timestamps for optimal dashboard querying
CREATE INDEX IF NOT EXISTS idx_appointments_status_date ON appointments(status, appointment_date);
