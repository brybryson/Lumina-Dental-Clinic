-- ====================================================================
-- Lumina Dental Clinic — Production Supabase PostgreSQL Schema
-- Aligned 100% with Frontend Forms, Automations, & RAG Concierge
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

DO $$ BEGIN
  CREATE TYPE inquiry_status AS ENUM (
    'new',
    'lead_captured',
    'in_review',
    'replied',
    'converted',
    'archived'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. General & Clinical Inquiries / Funnel Leads Table
CREATE TABLE IF NOT EXISTS inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  first_name TEXT NOT NULL,
  last_name TEXT, -- Nullable to accommodate single full-name inputs
  email TEXT NOT NULL,
  phone TEXT,
  service_of_interest TEXT,
  message TEXT, -- Nullable for booking-funnel step 1 lead captures
  source TEXT DEFAULT 'contact_modal', -- 'contact_modal' or 'booking_funnel_step1'
  status inquiry_status DEFAULT 'new'
);

-- 3. Patients Table (Step 1 Personal & Clinical Details)
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

-- 4. Appointments Table (Treatment, Time Slot, Notes & Intake Token)
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
  intake_token_expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
  intake_completed_at TIMESTAMPTZ,
  source_inquiry_id UUID REFERENCES inquiries(id) ON DELETE SET NULL,
  flag_for_manual_followup BOOLEAN DEFAULT FALSE
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
  consent_signed BOOLEAN NOT NULL DEFAULT FALSE, -- Default FALSE for legal consent integrity
  alert_acknowledged BOOLEAN DEFAULT FALSE,
  alert_acknowledged_by TEXT,
  alert_acknowledged_at TIMESTAMPTZ
);

-- 6. Performance Indexes for Fast Queries
CREATE INDEX IF NOT EXISTS idx_inquiries_email ON inquiries(email);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_patients_email ON patients(email);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_intake_token ON appointments(intake_token);
CREATE INDEX IF NOT EXISTS idx_appointments_source_inquiry ON appointments(source_inquiry_id);

-- 7. Enable Row Level Security (RLS) & Scope Service Role Admin Access
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_intakes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access on inquiries" ON inquiries;
CREATE POLICY "Service role full access on inquiries" ON inquiries FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on patients" ON patients;
CREATE POLICY "Service role full access on patients" ON patients FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on appointments" ON appointments;
CREATE POLICY "Service role full access on appointments" ON appointments FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on medical_intakes" ON medical_intakes;
CREATE POLICY "Service role full access on medical_intakes" ON medical_intakes FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ====================================================================
-- 8. Enable pgvector & Knowledge Base for AI RAG / Clinical Concierge
-- ====================================================================

-- Enable the pgvector extension to work with embedding vectors
CREATE EXTENSION IF NOT EXISTS vector;

-- Table to store clinic SOPs, FAQs, post-op instructions, and insurance rules
CREATE TABLE IF NOT EXISTS clinic_knowledge_docs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  title TEXT NOT NULL,
  category TEXT NOT NULL, -- 'post_op', 'pricing', 'insurance', 'faq', 'clinical_sop'
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  embedding VECTOR(1536), -- 1536-dim standard (OpenAI text-embedding-3-small / ada-002)
  review_status TEXT DEFAULT 'pending_review' -- 'pending_review', 'approved', 'rejected'
);

-- Table for logging AI Concierge conversations & clinical audits
CREATE TABLE IF NOT EXISTS concierge_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  patient_email TEXT,
  session_id TEXT,
  user_query TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  matched_knowledge_ids UUID[],
  flagged_for_review BOOLEAN DEFAULT FALSE
);

-- Performance HNSW index for high-speed sub-millisecond similarity searches
CREATE INDEX IF NOT EXISTS idx_knowledge_embedding 
ON clinic_knowledge_docs 
USING hnsw (embedding vector_cosine_ops);

-- Enable RLS for Knowledge Docs & Concierge Conversations
ALTER TABLE clinic_knowledge_docs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access on knowledge docs" ON clinic_knowledge_docs;
CREATE POLICY "Service role full access on knowledge docs" ON clinic_knowledge_docs FOR ALL TO service_role USING (true) WITH CHECK (true);

ALTER TABLE concierge_conversations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access on concierge conversations" ON concierge_conversations;
CREATE POLICY "Service role full access on concierge conversations" ON concierge_conversations FOR ALL TO service_role USING (true) WITH CHECK (true);

-- RPC Function for Cosine Similarity Vector Search (Strictly Approved Knowledge)
CREATE OR REPLACE FUNCTION match_clinic_knowledge (
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.75,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  category TEXT,
  content TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    clinic_knowledge_docs.id,
    clinic_knowledge_docs.title,
    clinic_knowledge_docs.category,
    clinic_knowledge_docs.content,
    1 - (clinic_knowledge_docs.embedding <=> query_embedding) AS similarity
  FROM clinic_knowledge_docs
  WHERE 
    clinic_knowledge_docs.review_status = 'approved'
    AND 1 - (clinic_knowledge_docs.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;
