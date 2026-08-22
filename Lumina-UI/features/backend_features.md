Using Supabase (PostgreSQL) alongside n8n, Google Sheets, Google Calendar, and
Resend/SendGrid gives you a robust, type-safe architecture. Supabase acts as
your secure system-of-record, while Google Sheets serves as the reception desk
UI.

File Output: BACKEND_ARCHITECTURE.md Markdown

# Lumina Dental Studio — Backend Architecture & Automation Specification

## 1. System Overview & Tech Stack

The backend uses a hybrid event-driven architecture. **Next.js Route Handlers
(deployed on Vercel)** act as the API gateway, **Supabase** acts as the primary
relational database, and **n8n** handles external integrations (Google
Workspace, Email, and scheduled cron jobs).

[ Next.js Frontend (Vercel) ] │ ▼ (HTTPS / JSON POST) [ Next.js API Routes /
Server Actions ] │ │ ▼ (Direct DB Connection) ▼ (Webhook Trigger) [ Supabase
(PostgreSQL) ] [ n8n Automation Engine ] ├── Google Calendar API ├── Google
Sheets API (Reception Desk UI) └── Resend / SendGrid (Transactional Email)

### Tech Stack:

- **Hosting / Edge Runtime:** Vercel (Next.js App Router Serverless Functions)
- **Primary Database & Auth:** Supabase (PostgreSQL with Row-Level Security)
- **Workflow Automation:** n8n (Self-hosted on Docker/VPS or n8n Cloud)
- **Reception Portal:** Google Sheets (Synchronized via n8n for non-technical
  clinic staff)
- **Calendar & Scheduling:** Google Calendar API
- **Transactional Email Delivery:** Resend or SendGrid (Clean HTML templates,
  zero emojis)

---

## 2. Supabase Database Schema (PostgreSQL)

Execute the following SQL queries in your Supabase SQL Editor to set up the
relational structure, enums, and indexes:

```sql
-- 1. Create Enums for Strict Type Safety
CREATE TYPE appointment_status AS ENUM (
  'lead_captured',
  'confirmed',
  'intake_submitted',
  'completed',
  'cancelled',
  'no_show'
);

CREATE TYPE time_slot_enum AS ENUM (
  'morning',
  'early_afternoon',
  'late_afternoon'
);

-- 2. Patients Table
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  last_visit_date DATE,
  recall_sent BOOLEAN DEFAULT FALSE
);

-- 3. Appointments Table
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  service_slug TEXT NOT NULL,
  service_name TEXT NOT NULL,
  appointment_date DATE NOT NULL,
  time_slot time_slot_enum NOT NULL,
  patient_notes TEXT,
  status appointment_status DEFAULT 'lead_captured',
  google_calendar_event_id TEXT,
  intake_token UUID DEFAULT gen_random_uuid(),
  intake_completed_at TIMESTAMPTZ
);

-- 4. Medical Intake Records Table (Pre-Visit Medical History)
CREATE TABLE medical_intakes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID UNIQUE REFERENCES appointments(id) ON DELETE CASCADE,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  date_of_birth DATE NOT NULL,
  emergency_contact_name TEXT NOT NULL,
  emergency_contact_phone TEXT NOT NULL,
  medical_conditions TEXT[], -- Array of strings (e.g., ['Hypertension', 'Diabetes'])
  allergies TEXT[],          -- Array of strings (e.g., ['Penicillin', 'Latex'])
  current_medications TEXT,
  hmo_provider TEXT,
  hmo_member_id TEXT,
  consent_signed BOOLEAN NOT NULL DEFAULT FALSE
);

-- 5. Create Performance Indexes
CREATE INDEX idx_patients_email ON patients(email);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_intake_token ON appointments(intake_token);
3. API Endpoints Specification (Next.js Route Handlers)
Create these API routes inside your Next.js /app/api/ directory:

Endpoint 1: /api/leads/capture
Method: POST

Purpose: Fired on Step 1 of the funnel form. Captures partial lead for recovery.

Request Body:

JSON
{
  "fullName": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+639171234567"
}
Logic:

Upserts patient record in Supabase patients table by email.

Creates an appointment draft with status lead_captured.

Dispatches payload to n8n Webhook: WEBHOOK_LEAD_ABANDONED_RECOVERY.

Response: 200 OK with { "appointmentId": "uuid-here" }.

Endpoint 2: /api/appointments/confirm
Method: POST

Purpose: Fired on Step 3 of the booking form to finalize the booking.

Request Body:

JSON
{
  "appointmentId": "uuid-here",
  "serviceSlug": "routine-prophylaxis",
  "serviceName": "Routine Prophylaxis & Polish",
  "appointmentDate": "2026-08-28",
  "timeSlot": "morning",
  "notes": "Mild tooth sensitivity on lower left molar"
}
Logic:

Updates Supabase appointment record status to confirmed.

Dispatches payload to n8n Webhook: WEBHOOK_BOOKING_CONFIRMED.

Response: 200 OK with { "success": true, "intakeUrl": "/intake?token=..." }.

Endpoint 3: /api/intake/submit
Method: POST

Purpose: Fired from the /intake page when the patient submits their medical history.

Request Body:

JSON
{
  "intakeToken": "uuid-token-from-url",
  "dateOfBirth": "1998-05-14",
  "emergencyContactName": "John Doe",
  "emergencyContactPhone": "+639181234567",
  "medicalConditions": ["High Blood Pressure"],
  "allergies": ["Penicillin"],
  "currentMedications": "None",
  "hmoProvider": "Maxicare",
  "hmoMemberId": "MAX-9821382",
  "consentSigned": true
}
Logic:

Validates intakeToken against Supabase.

Inserts record into medical_intakes and updates appointment status to intake_submitted.

Dispatches payload to n8n Webhook: WEBHOOK_INTAKE_SYNC.

Response: 200 OK with { "success": true }.

4. n8n Automation Workflows
Configure 5 modular workflows inside your n8n workspace:

Workflow 1: Abandoned Booking Lead Recovery
Trigger: Webhook (POST /webhook/lead-captured)

Nodes:

Webhook: Receives email, fullName, appointmentId.

Wait: Delay for 60 Minutes.

Supabase Query: Check appointments status where id = appointmentId.

IF Node: If status is STILL 'lead_captured' (user never finalized Step 3):

Resend / SendGrid: Dispatch recovery email with link to resume booking (https://yourdomain.com/#booking-section?email=...).

Workflow 2: Booking Confirmation, Google Calendar & Google Sheets Sync
Trigger: Webhook (POST /webhook/booking-confirmed)

Nodes:

Google Calendar: Create Event -> Date: appointmentDate, Title: Lumina Dental: [Patient Name] - [Service], Description includes notes and contact info.

Google Sheets: Append Row to Reception Sheet:

Columns: Timestamp | Patient Name | Email | Phone | Service | Date | Slot | Status (Confirmed) | Intake Status (Pending).

Resend / SendGrid: Send HTML Confirmation Email with:

Attached .ics calendar invitation file.

Direct button linking to pre-visit medical intake: https://yourdomain.com/intake?token=[intakeToken].

Workflow 3: Post-Treatment Care Sequences & Google Reviews
Trigger: Google Sheets Trigger (Node watches for row status change) OR Webhook from internal staff tool.

Trigger Condition: Staff changes row status dropdown to Completed - [Service Name].

Nodes:

Supabase Update: Update appointments status to completed and set patients.last_visit_date = CURRENT_DATE.

Wait: Delay for 2 Hours.

Email Node (Post-Care): Send service-specific recovery guidelines (e.g., extraction care, teeth whitening diet).

Wait: Delay for 24 Hours.

Email Node (Review Engine): Send automated Google Review link request.

Workflow 4: 6-Month Routine Cleaning Recall Engine
Trigger: Schedule Cron Node (Runs daily at 08:00 AM PST).

Nodes:

Supabase Query:

SQL
SELECT p.id, p.full_name, p.email, p.last_visit_date
FROM patients p
WHERE p.last_visit_date <= NOW() - INTERVAL '180 days'
  AND p.recall_sent = FALSE;
Item Lists: Loop over eligible patients.

Resend / SendGrid: Send personalized 6-month cleaning recall email.

Supabase Update: Mark recall_sent = TRUE for processed IDs.

5. Environment Variables Configuration
Set these environment variables in your Vercel Project Settings and your .env.local file:

Code snippet
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=[https://your-project.supabase.co](https://your-project.supabase.co)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi... # Server-side only (never expose to client)

# n8n Webhook URLs
N8N_WEBHOOK_LEAD_CAPTURE=[https://n8n.yourdomain.com/webhook/lead-captured](https://n8n.yourdomain.com/webhook/lead-captured)
N8N_WEBHOOK_BOOKING_CONFIRM=[https://n8n.yourdomain.com/webhook/booking-confirmed](https://n8n.yourdomain.com/webhook/booking-confirmed)
N8N_WEBHOOK_INTAKE_SUBMIT=[https://n8n.yourdomain.com/webhook/intake-submit](https://n8n.yourdomain.com/webhook/intake-submit)

# Security
API_SECRET_KEY=your_random_generated_secret_string

<ElicitationsGroup message="Next steps to complete the backend:">
  <Elicitation label="Generate Next.js API route code (/api/appointments)" query="Write the complete TypeScript Next.js API Route Handlers for /api/leads/capture and /api/appointments/confirm using the Supabase JS client."/>
  <Elicitation label="Export ready-to-import n8n workflow JSON" query="Provide the full n8n workflow JSON file for Workflow 2 (Google Calendar, Google Sheets, and Email confirmation)."/>
  <Elicitation label="Generate Supabase client helper and TypeScript types" query="Write the TypeScript database types and Supabase server-client helper for Next.js App Router."/>
</ElicitationsGroup>
```
