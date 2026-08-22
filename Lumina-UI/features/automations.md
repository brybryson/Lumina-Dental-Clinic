# Lumina Dental Clinic — Production n8n Automation Architecture & Guide

This document outlines the complete automation workflows, database schema
mapping, SQL query recipes, and node-by-node guides for powering Lumina Dental
Clinic's backend automations with **n8n** and **Supabase (PostgreSQL)**.

> **Revision note:** This is the revised version of the architecture, updated
> after a pre-build review. See `automation-revisions.md` for a full changelog
> of what was fixed and why.

---

## 1. Database Architecture & Table References

All automations interact directly with the Supabase PostgreSQL database or via
Lumina-API webhooks.

### Entity Relationship & Table Summary

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│    patients     │ 1   * │  appointments   │ 1   1 │ medical_intakes │
├─────────────────┼───────┼─────────────────┼───────┼─────────────────┤
│ id (UUID PK)    │◄──────│ patient_id (FK) │◄──────│ appointment_id  │
│ first_name      │       │ id (UUID PK)    │       │ id (UUID PK)    │
│ last_name       │       │ service_name    │       │ medical_conds[] │
│ email (UNIQUE)  │       │ appointment_date│       │ allergies[]     │
│ mobile          │       │ time_slot       │       │ medications     │
│ date_of_birth   │       │ status (ENUM)   │       │ hmo_provider    │
│ last_visit_date │       │ intake_token    │       │ consent_signed  │
│ recall_sent     │       │ intake_comp_at  │       │ submitted_at    │
└─────────────────┘       │ flag_manual_fu  │       │ alert_ack       │
                           └─────────────────┘       └─────────────────┘
                                  ▲
                                  │
                          ┌─────────────────┐
                          │    inquiries    │
                          ├─────────────────┤
                          │ id (UUID PK)    │
                          │ first_name      │
                          │ last_name       │
                          │ email           │
                          │ phone           │
                          │ service_of_int  │
                          │ message         │
                          │ status (ENUM)   │
                          └─────────────────┘
```

### Table 1: `patients`

Stores unique patient clinical profiles and recall timestamps.

| Column                  | Type          | Constraints                              | Description                                           |
| ----------------------- | ------------- | ---------------------------------------- | ----------------------------------------------------- |
| `id`                    | `UUID`        | `PRIMARY KEY, DEFAULT gen_random_uuid()` | Unique Patient ID                                     |
| `created_at`            | `TIMESTAMPTZ` | `DEFAULT NOW()`                          | Record registration date                              |
| `updated_at`            | `TIMESTAMPTZ` | `DEFAULT NOW()`                          | Last update timestamp                                 |
| `first_name`            | `TEXT`        | `NOT NULL`                               | Patient first name                                    |
| `last_name`             | `TEXT`        | `NOT NULL`                               | Patient last name                                     |
| `email`                 | `TEXT`        | `UNIQUE, NOT NULL`                       | Verified patient email address                        |
| `mobile`                | `TEXT`        | `NOT NULL`                               | Mobile number for SMS / WhatsApp                      |
| `date_of_birth`         | `DATE`        | `NULLABLE`                               | Patient birthdate                                     |
| `sex_assigned_at_birth` | `TEXT`        | `NULLABLE`                               | `'Female'` or `'Male'`                                |
| `last_visit_date`       | `DATE`        | `NULLABLE`                               | Date of last completed chairside procedure            |
| `recall_sent`           | `BOOLEAN`     | `DEFAULT FALSE`                          | Flag indicating if 6-month recall email was triggered |

---

### Table 2: `appointments`

Stores individual appointment reservations and pre-visit intake tokens.

| Column                     | Type                 | Constraints                                             | Description                                                                                                                                                                                             |
| -------------------------- | -------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                       | `UUID`               | `PRIMARY KEY, DEFAULT gen_random_uuid()`                | Unique Appointment ID                                                                                                                                                                                   |
| `created_at`               | `TIMESTAMPTZ`        | `DEFAULT NOW()`                                         | Booking timestamp                                                                                                                                                                                       |
| `patient_id`               | `UUID`               | `REFERENCES patients(id) ON DELETE CASCADE`             | Associated patient                                                                                                                                                                                      |
| `service_name`             | `TEXT`               | `NOT NULL`                                              | e.g. `'Laser Teeth Whitening'`, `'Root Canal Therapy'`                                                                                                                                                  |
| `appointment_date`         | `DATE`               | `NOT NULL`                                              | Scheduled date (YYYY-MM-DD)                                                                                                                                                                             |
| `time_slot`                | `TEXT`               | `NOT NULL`                                              | e.g. `'10:00 AM - 11:00 AM'`                                                                                                                                                                            |
| `patient_notes`            | `TEXT`               | `NULLABLE`                                              | Clinical notes or symptoms left by patient                                                                                                                                                              |
| `status`                   | `appointment_status` | `DEFAULT 'confirmed'`                                   | Enum: `'lead_captured'`, `'confirmed'`, `'intake_submitted'`, `'completed'`, `'cancelled'`, `'no_show'`                                                                                                 |
| `google_calendar_event_id` | `TEXT`               | `NULLABLE`                                              | Google Calendar synchronization ID                                                                                                                                                                      |
| `intake_token`             | `UUID`               | `DEFAULT gen_random_uuid()`                             | Unique secure token for digital intake form link                                                                                                                                                        |
| `intake_token_expires_at`  | `TIMESTAMPTZ`        | `DEFAULT NOW() + INTERVAL '14 days'`                    | **[NEW]** Token becomes invalid after this — prevents a forwarded/leaked link from working indefinitely                                                                                                 |
| `intake_completed_at`      | `TIMESTAMPTZ`        | `NULLABLE`                                              | Timestamp when intake form was submitted                                                                                                                                                                |
| `source_inquiry_id`        | `UUID`               | `REFERENCES inquiries(id) ON DELETE SET NULL, NULLABLE` | **[NEW]** Links a completed booking back to the inquiry/lead row it originated from, so recovery automation can tell converted leads apart from abandoned ones                                          |
| `flag_for_manual_followup` | `BOOLEAN`            | `DEFAULT FALSE`                                         | **[NEW]** Set by clinical staff chairside when a case is non-standard (complication, deviation from plan). When `TRUE`, Workflow 3's automated post-op sequence is skipped in favor of a staff callback |

---

### Table 3: `medical_intakes`

Stores pre-visit medical history, allergies, systemic conditions, and HMO
records.

| Column                    | Type          | Constraints                                             | Description                                                                                                                                                                                                                       |
| ------------------------- | ------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                      | `UUID`        | `PRIMARY KEY, DEFAULT gen_random_uuid()`                | Unique intake record ID                                                                                                                                                                                                           |
| `appointment_id`          | `UUID`        | `UNIQUE, REFERENCES appointments(id) ON DELETE CASCADE` | Associated appointment                                                                                                                                                                                                            |
| `submitted_at`            | `TIMESTAMPTZ` | `DEFAULT NOW()`                                         | Submission timestamp                                                                                                                                                                                                              |
| `date_of_birth`           | `DATE`        | `NULLABLE`                                              | Date of birth verification                                                                                                                                                                                                        |
| `emergency_contact_name`  | `TEXT`        | `NULLABLE`                                              | Emergency contact name                                                                                                                                                                                                            |
| `emergency_contact_phone` | `TEXT`        | `NULLABLE`                                              | Emergency contact telephone                                                                                                                                                                                                       |
| `medical_conditions`      | `TEXT[]`      | `DEFAULT '{}'`                                          | Array: e.g. `['Hypertension', 'Diabetes Type 2']`                                                                                                                                                                                 |
| `allergies`               | `TEXT[]`      | `DEFAULT '{}'`                                          | Array: e.g. `['Penicillin', 'Latex', 'Epinephrine']`                                                                                                                                                                              |
| `current_medications`     | `TEXT`        | `NULLABLE`                                              | Prescribed medications / anticoagulants                                                                                                                                                                                           |
| `hmo_provider`            | `TEXT`        | `NULLABLE`                                              | Dental Insurance / HMO provider                                                                                                                                                                                                   |
| `hmo_member_id`           | `TEXT`        | `NULLABLE`                                              | Insurance policy number                                                                                                                                                                                                           |
| `consent_signed`          | `BOOLEAN`     | `DEFAULT FALSE`                                         | **[CHANGED]** Electronic HIPAA / treatment consent. Was `DEFAULT TRUE` — corrected so a row can never read as "consented" unless the patient actually checked the box. The intake form must explicitly set this `TRUE` on submit. |
| `alert_acknowledged`      | `BOOLEAN`     | `DEFAULT FALSE`                                         | **[NEW]** Set `TRUE` once staff acknowledge the Workflow 2 clinical alert (via Slack reaction or reply)                                                                                                                           |
| `alert_acknowledged_by`   | `TEXT`        | `NULLABLE`                                              | **[NEW]** Staff member/Slack user who acknowledged                                                                                                                                                                                |
| `alert_acknowledged_at`   | `TIMESTAMPTZ` | `NULLABLE`                                              | **[NEW]** Timestamp of acknowledgment                                                                                                                                                                                             |

---

### Table 4: `inquiries`

General clinical inquiries submitted via the primary landing page contact modal
**and** early-stage booking-funnel leads (Step 1 of the booking engine).

| Column                | Type             | Constraints                              | Description                                                                                                                                                        |
| --------------------- | ---------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`                  | `UUID`           | `PRIMARY KEY, DEFAULT gen_random_uuid()` | Unique inquiry ID                                                                                                                                                  |
| `created_at`          | `TIMESTAMPTZ`    | `DEFAULT NOW()`                          | Submission timestamp                                                                                                                                               |
| `first_name`          | `TEXT`           | `NOT NULL`                               | Inquirer's first name                                                                                                                                              |
| `last_name`           | `TEXT`           | `NULLABLE`                               | Inquirer's last name — **[CHANGED]** now nullable, since Step 1 of the booking form only collects a single "Full Name" field, which may not cleanly split          |
| `email`               | `TEXT`           | `NOT NULL`                               | Inquirer's email                                                                                                                                                   |
| `phone`               | `TEXT`           | `NULLABLE`                               | Inquirer's phone number                                                                                                                                            |
| `service_of_interest` | `TEXT`           | `NULLABLE`                               | Service category (populated at Step 2 of the booking funnel if the lead continues; null for Step-1-only abandons)                                                  |
| `message`             | `TEXT`           | `NULLABLE`                               | **[CHANGED]** Was `NOT NULL` — now nullable, since booking-funnel leads don't submit a free-text message the way contact-modal inquiries do                        |
| `status`              | `inquiry_status` | `DEFAULT 'new'`                          | **[CHANGED]** Now an enum: `'new'`, `'lead_captured'`, `'in_review'`, `'replied'`, `'converted'`, `'archived'`. `'lead_captured'` is new — see note below.         |
| `source`              | `TEXT`           | `DEFAULT 'contact_modal'`                | **[NEW]** `'contact_modal'` or `'booking_funnel_step1'` — distinguishes an organic inquiry from a booking-funnel abandon so staff-facing views can tell them apart |

> **Why this table changed:** The original architecture had the booking form's
> Step 1 (`event: lead_captured`) firing straight into n8n with no defined
> destination table, while Workflow 5's recovery query read from `inquiries`.
> There was no path connecting the two. This revision makes `inquiries` the
> single landing table for _all_ pre-booking leads — organic contact-form
> inquiries and booking-funnel abandons alike — distinguished by `source` and
> `status`. When a lead completes the full booking, the resulting `appointments`
> row is linked back via `source_inquiry_id` and the inquiry's `status` is
> updated to `'converted'`, so recovery automation naturally excludes anyone who
> already booked.

---

### Table 5: `clinic_knowledge_docs` (pgvector Vector Store)

Stores vectorized clinical post-op care guidelines, HMO insurance coverage
rules, procedure pricing, and FAQs for RAG retrieval.

| Column          | Type           | Constraints                              | Description                                                                                                                                                                                                                                                                                                                                |
| --------------- | -------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`            | `UUID`         | `PRIMARY KEY, DEFAULT gen_random_uuid()` | Unique document chunk ID                                                                                                                                                                                                                                                                                                                   |
| `created_at`    | `TIMESTAMPTZ`  | `DEFAULT NOW()`                          | Record creation timestamp                                                                                                                                                                                                                                                                                                                  |
| `title`         | `TEXT`         | `NOT NULL`                               | Document title / section name                                                                                                                                                                                                                                                                                                              |
| `category`      | `TEXT`         | `NOT NULL`                               | `'post_op'`, `'pricing'`, `'insurance'`, `'faq'`, `'clinical_sop'`                                                                                                                                                                                                                                                                         |
| `content`       | `TEXT`         | `NOT NULL`                               | Raw text knowledge chunk                                                                                                                                                                                                                                                                                                                   |
| `metadata`      | `JSONB`        | `DEFAULT '{}'::jsonb`                    | Flexible key-value metadata (author, tags, url, file_id)                                                                                                                                                                                                                                                                                   |
| `embedding`     | `VECTOR(1536)` | `NULLABLE`                               | 1536-dimensional vector embedding (`text-embedding-3-small` / `ada-002`)                                                                                                                                                                                                                                                                   |
| `review_status` | `TEXT`         | `DEFAULT 'pending_review'`               | **[NEW]** `'pending_review'`, `'approved'`, `'rejected'`. Newly ingested chunks (Workflow 8) default to `pending_review` and are **excluded** from `match_clinic_knowledge` results until a staff member approves them — prevents a badly-chunked or outdated PDF from immediately feeding wrong answers to the AI concierge (Workflow 7). |

---

## 2. How to Install & Configure pgvector on Supabase

`pgvector` is natively supported on all Supabase PostgreSQL instances without
third-party plugins.

### Method A: One-Click SQL Editor (Recommended)

1. Open your **Supabase Project Dashboard**.
2. Click **SQL Editor** in the left sidebar.
3. Paste and run the following script:

```sql
-- 1. Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create the Knowledge Base Table
CREATE TABLE IF NOT EXISTS clinic_knowledge_docs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  title TEXT NOT NULL,
  category TEXT NOT NULL, -- 'post_op', 'pricing', 'insurance', 'faq', 'clinical_sop'
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  embedding VECTOR(1536), -- 1536 dimensions for OpenAI text-embedding-3-small
  review_status TEXT DEFAULT 'pending_review' -- 'pending_review', 'approved', 'rejected'
);

-- 3. Create high-performance HNSW index for ultra-fast vector search
CREATE INDEX IF NOT EXISTS idx_knowledge_embedding
ON clinic_knowledge_docs
USING hnsw (embedding vector_cosine_ops);

-- 4. Enable Row-Level Security
ALTER TABLE clinic_knowledge_docs ENABLE ROW LEVEL SECURITY;

-- [CHANGED] Original policy was `USING (true) WITH CHECK (true)`, which allows
-- ANY role with access to this table — not just the service role n8n uses — to
-- read and write clinical knowledge chunks, including pricing and post-op
-- guidance the AI concierge quotes to patients. Scoped explicitly to the
-- service role only:
DROP POLICY IF EXISTS "Service role full access on knowledge docs" ON clinic_knowledge_docs;
CREATE POLICY "Service role full access on knowledge docs"
ON clinic_knowledge_docs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 5. Create the Cosine Similarity Match Function for n8n / API RPC calls
-- [CHANGED] Now filters to review_status = 'approved' only — unreviewed or
-- rejected chunks can never surface in a live patient-facing answer.
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
  WHERE 1 - (clinic_knowledge_docs.embedding <=> query_embedding) > match_threshold
    AND clinic_knowledge_docs.review_status = 'approved'
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;
```

### Method B: Supabase Web GUI

1. Navigate to **Database** ➔ **Extensions** in your Supabase dashboard.
2. In the search box, type `vector`.
3. Locate `vector` (Vector data types and similarity metrics) and toggle the
   switch to **ON**.

---

## 3. Recommended n8n Workflows & Blueprint

Below are the 8 automation pipelines for Lumina Dental Clinic, in **recommended
build order** (see Section 3.1). Each entry notes whether it's fully automatable
or requires a human-in-the-loop checkpoint.

```
                 ┌────────────────────────────────────────────────────────┐
                 │              n8n AUTOMATION ORCHESTRATION              │
                 └────────────────────────────────────────────────────────┘
                                              │
     ┌───────────────────────┬────────────────┴───────────────────────┬───────────────────────┐
     ▼                       ▼                                        ▼                       ▼
1. Digital Intake       2. Allergy & Alert                     3. Post-Op Care         4. 6-Month Hygiene
 Dispatch Link        Staff Escalation (+ack)                   Pathways (+ HITL)        Recall Engine
(On Appointment)        (On Intake Submit)                     (On Completed)          (Daily Cron)
                                              │
                                              ▼
                                 7. 24/7 AI Clinical Concierge
                                    (RAG + Supabase pgvector)
```

### 3.1 Build Order & Human-in-the-Loop Summary

| # | Workflow                     | Fully Automated? | Human-in-the-Loop Checkpoint                                                                                                                                                                      |
| - | ---------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 | Digital Intake Dispatch      | ✅ Yes           | None                                                                                                                                                                                              |
| 6 | Google Calendar Sync         | ✅ Yes           | None (one-directional DB → Calendar; manual Calendar edits don't sync back — acceptable for v1)                                                                                                   |
| 2 | Allergy & Alert Escalation   | ⚠️ Mostly        | Requires staff acknowledgment (Slack reaction/reply) before the appointment — tracked via `alert_acknowledged`                                                                                    |
| 4 | 6-Month Recall Engine        | ✅ Yes           | None — include unsubscribe/opt-out link (recurring outbound email)                                                                                                                                |
| 5 | Abandoned Lead Recovery      | ✅ Yes           | None, once `inquiries`/`source` linkage is in place                                                                                                                                               |
| 3 | Post-Op Care Sequence        | ⚠️ Mostly        | Skips automatically if `flag_for_manual_followup = TRUE`; reply-to inbox must be monitored by staff, not left unmanaged                                                                           |
| 8 | Knowledge Ingestion Pipeline | ⚠️ Mostly        | New chunks land as `pending_review` and require staff approval before they're queryable                                                                                                           |
| 7 | AI Clinical Concierge (RAG)  | ⚠️ Mostly        | Conversation logs should be spot-reviewed by staff; strictly scoped to pricing/hours/insurance/FAQ, hard-routes anything symptom-adjacent to the emergency line; build last, after 1–6 are stable |

---

### Workflow 1: Pre-Appointment Digital Intake Dispatch

- **Objective:** Save 15 minutes of clinic waiting room time by delivering the
  digital medical intake link immediately upon booking confirmation.
- **Trigger:** Supabase Database Webhook on `appointments` table (`INSERT` where
  `status = 'confirmed'`), or n8n Polling Node.
- **[NEW]** Add a 1–2 minute **Wait Node** before sending, to absorb accidental
  double-submits from the booking form.
- **SQL Fetch Query:**
  ```sql
  SELECT
    a.id AS appointment_id,
    a.appointment_date,
    a.time_slot,
    a.service_name,
    a.intake_token,
    a.intake_token_expires_at,
    p.first_name,
    p.last_name,
    p.email,
    p.mobile
  FROM appointments a
  JOIN patients p ON a.patient_id = p.id
  WHERE a.id = '{{$json.appointment_id}}';
  ```
- **Execution Flow:**
  1. **Webhook Trigger / Supabase Node**: Receive new appointment ID.
  2. **Wait Node (1–2 min)**: Absorb accidental duplicate submissions.
  3. **Execute SQL Node**: Fetch patient details, `intake_token`, and
     `intake_token_expires_at`.
  4. **Format Email Node**: Generate link
     `https://luminaclinic.com/intake?token={{$json.intake_token}}`.
  5. **Send Official Clinic Email (from `care@luminaclinic.com` via Resend /
     SendGrid / SMTP)**:
     - **Subject:**
       `Confirming your visit + Pre-visit digital health history (Lumina Dental Clinic)`
     - **Body:**
       > _Hi {{first_name}},_
       >
       > _Your appointment for **{{service_name}}** is confirmed for
       > **{{appointment_date}} at {{time_slot}}**._
       >
       > _To save you 15 minutes in our lounge, please complete your secure
       > pre-visit medical intake form prior to arriving (link expires
       > {{intake_token_expires_at}}):_
       >
       > 👉
       > **[Complete Digital Intake Form](https://luminaclinic.com/intake?token={{intake_token}})**
       >
       > _Warm regards,_ _Dr. Lumina & Patient Care Team_ _Lumina Dental Clinic
       > | care@luminaclinic.com_
  6. **Internal Slack Notification (#new-appointments)**:
     > 📅 _New Booking Confirmed: {{first_name}} {{last_name}} for
     > {{service_name}} on {{appointment_date}} ({{time_slot}})._

---

### Workflow 2: Clinical Allergy & High-Risk Medical History Escalation

- **Objective:** Instantly flag high-risk patient conditions (Penicillin
  allergy, Latex allergy, bleeding disorders, cardiac conditions,
  anticoagulants) to the attending dentist before the patient arrives — **and
  confirm someone actually saw it.**
- **Trigger:** Supabase Webhook on `medical_intakes` (`INSERT` or `UPDATE`).
- **SQL Fetch Query:**
  ```sql
  SELECT
    m.id AS intake_id,
    m.medical_conditions,
    m.allergies,
    m.current_medications,
    m.emergency_contact_name,
    m.emergency_contact_phone,
    m.hmo_provider,
    p.first_name,
    p.last_name,
    p.mobile,
    a.service_name,
    a.appointment_date,
    a.time_slot
  FROM medical_intakes m
  JOIN appointments a ON m.appointment_id = a.id
  JOIN patients p ON a.patient_id = p.id
  WHERE m.id = '{{$json.intake_id}}';
  ```
- **Execution Flow:**
  1. **IF Node**: Check if `allergies.length > 0` OR
     `medical_conditions.length > 0`.
  2. **True Branch**:
     - Dispatch instant **Slack Notification to `#clinical-alerts`**:
       > ⚠️ **CLINICAL HEALTH ALERT — Patient: {{first_name}} {{last_name}}**
       >
       > - **Scheduled Service:** {{service_name}} on {{appointment_date}}
       >   ({{time_slot}})
       > - **Reported Allergies:** {{allergies.join(', ')}}
       > - **Conditions:** {{medical_conditions.join(', ')}}
       > - **Medications:** {{current_medications || 'None'}}
       > - **Emergency Contact:** {{emergency_contact_name}}
       >   ({{emergency_contact_phone}})
       >
       > _React ✅ or reply "ack" to confirm this has been reviewed._
  3. **[NEW] Slack Trigger Node (reaction_added / message reply on that
     thread)**:
     - Update `medical_intakes` row:
       ```sql
       UPDATE medical_intakes
       SET alert_acknowledged = TRUE,
           alert_acknowledged_by = '{{$json.user}}',
           alert_acknowledged_at = NOW()
       WHERE id = '{{$json.intake_id}}';
       ```
  4. **[NEW] Escalation Reminder**: If `alert_acknowledged = FALSE` within 3
     hours of the alert (Wait Node + IF check), re-post the alert to
     `#clinical-alerts` tagging the practice manager directly, so a missed alert
     doesn't silently fall through before the appointment.

---

### Workflow 3: Procedure-Specific Post-Operative Care Sequence

- **Objective:** Reduce anxiety and emergency call volume by dispatching
  procedure-tailored post-op instructions 2 hours after treatment, followed by a
  next-morning recovery check-in.
- **Trigger:** Supabase Webhook when `appointments.status` updates to
  `'completed'`.
- **[NEW] Human-in-the-loop gate:** If
  `appointments.flag_for_manual_followup = TRUE`, the automated sequence is
  skipped entirely and a Slack task is created for staff to personally follow up
  instead — non-standard cases (complications, deviation from plan) should not
  receive a generic templated email.
- **SQL Fetch Query:**
  ```sql
  SELECT
    a.id,
    a.service_name,
    a.appointment_date,
    a.flag_for_manual_followup,
    p.id AS patient_id,
    p.first_name,
    p.last_name,
    p.email,
    p.mobile
  FROM appointments a
  JOIN patients p ON a.patient_id = p.id
  WHERE a.id = '{{$json.appointment_id}}';
  ```
- **Execution Flow:**
  1. **IF Node**: `flag_for_manual_followup = TRUE`?
     - **True branch:** Post to `#clinical-alerts`:
       `⚠️ {{first_name}} {{last_name}} ({{service_name}}, {{appointment_date}}) flagged for manual follow-up — automated post-op sequence skipped.`
       Flow ends here.
     - **False branch:** continue below.
  2. **Update Patient Last Visit Date**:
     ```sql
     UPDATE patients
     SET last_visit_date = CURRENT_DATE, recall_sent = FALSE, updated_at = NOW()
     WHERE id = '{{$json.patient_id}}';
     ```
  3. **Wait Node (2 Hours)**:
  4. **Switch Node (by `service_name`)**:
     - **Case 'Root Canal Therapy' / 'Tooth Extraction' / 'Surgical'**:
       - Send Surgical Recovery PDF & Dos/Don'ts from `care@luminaclinic.com`
         (No hot liquids, no straws, soft diet, cold compress guidelines).
     - **Case 'Laser Teeth Whitening'**:
       - Send "White Diet" guidelines from `care@luminaclinic.com` (avoid
         coffee, wine, tomato sauce for 48 hours).
     - **Case Default (Routine Cleaning / Exam)**:
       - Send general oral hygiene maintenance tips from
         `care@luminaclinic.com`.
  5. **Wait Node (Until Next Morning at 9:00 AM)**:
  6. **Send Follow-up Email (from `care@luminaclinic.com`)**:
     - **Subject:**
       `Dr. Lumina Check-in: How are you feeling today, {{first_name}}?`
     - **Body:**
       > _Hi {{first_name}}, Dr. Lumina and the clinical team checking in! How
       > is your comfort level today? If you have any soreness, questions, or
       > need anything, reply directly to this email or call our desk at (415)
       > 555-0142._
     - **[NEW]** This reply-to inbox (`care@luminaclinic.com`) must route into a
       **monitored Slack channel or shared inbox with alerting** — a patient
       reply here could describe pain or a complication, and it must not sit
       unread in a generic mailbox.

---

### Workflow 4: 6-Month Preventive Hygiene Recall Engine

- **Objective:** Maximize patient lifetime value (LTV) and ensure continuous
  preventive oral health by automatically reaching out to patients due for their
  6-month cleaning.
- **Trigger:** **Daily Cron Schedule (Every morning at 09:00 AM)**
  (`0 9 * * *`).
- **SQL Fetch Query:**
  ```sql
  SELECT
    id AS patient_id,
    first_name,
    last_name,
    email,
    mobile,
    last_visit_date
  FROM patients
  WHERE
    last_visit_date <= CURRENT_DATE - INTERVAL '180 days'
    AND recall_sent = FALSE;
  ```
- **Execution Flow:**
  1. **Execute Query**: Find all eligible patients overdue for their semi-annual
     exam.
  2. **Loop Over Items**:
     - Dispatch recall email from `care@luminaclinic.com`:
       - **Subject:**
         `Time for your 6-month dental cleaning & checkup (Lumina Dental Clinic)`
       - **Body:**
         > _Hi {{first_name}}, it has been 6 months since your last dental
         > cleaning at Lumina Dental Clinic!_
         >
         > _Routine cleanings are essential for preventing plaque buildup and
         > preserving enamel health. Click below to view available chairside
         > times:_
         >
         > 📅
         > **[Schedule Your 6-Month Checkup](https://luminaclinic.com/#booking)**
         >
         > _[NEW] Prefer not to receive these reminders?
         > [Unsubscribe here](https://luminaclinic.com/unsubscribe?email={{email}})._
     - Mark patient record as recall sent:
       ```sql
       UPDATE patients
       SET recall_sent = TRUE, updated_at = NOW()
       WHERE id = '{{$json.patient_id}}';
       ```

---

### Workflow 5: Lead Recovery for Abandoned Squeeze Bookings & Inquiries

- **Objective:** Recover patients who submit an inquiry, or begin the booking
  funnel (Step 1: name/email/phone), but abandon before confirming a calendar
  slot.
- **[CHANGED] Trigger:** `inquiries` created with
  `status IN ('new', 'lead_captured')` without a linked appointment within 1
  hour. This now correctly covers **both** organic contact-modal inquiries and
  booking-funnel Step-1 abandons, since both land in `inquiries` (see Section 1,
  Table 4 note).
- **[CHANGED] SQL Query** (now uses `source_inquiry_id` for a reliable join
  instead of a fragile timestamp/email match):
  ```sql
  SELECT
    i.id,
    i.first_name,
    i.last_name,
    i.email,
    i.service_of_interest,
    i.message,
    i.source,
    i.created_at
  FROM inquiries i
  LEFT JOIN appointments a ON a.source_inquiry_id = i.id
  WHERE
    i.status IN ('new', 'lead_captured')
    AND i.created_at <= NOW() - INTERVAL '1 hour'
    AND a.id IS NULL;
  ```
- **Action:** Send gentle, conversational follow-up email from
  `care@luminaclinic.com`, tailored by `source`:
  - **If `source = 'booking_funnel_step1'`** (they started booking but didn't
    finish):
    - **Subject:**
      `Still there? Finish booking your visit at Lumina Dental Clinic`
    - **Body:**
      > _Hi {{first_name}}, looks like you started booking a visit with us but
      > didn't get to pick a date yet. Pick up right where you left off — it
      > only takes a minute:
      > [Finish Booking](https://luminaclinic.com/#booking). Have a question
      > first? Just reply to this email._
  - **If `source = 'contact_modal'`** (organic inquiry):
    - **Subject:** `Following up on your Lumina Dental Clinic inquiry`
    - **Body:**
      > _Hi {{first_name}}, we noticed you were looking into
      > {{service_of_interest || 'dental care'}} at Lumina Dental Clinic. Did
      > you have any questions about pricing, insurance coverage, or procedure
      > steps that our reception team can help clarify? You can reply directly
      > to this email anytime._
  - **Then:** Update `inquiries.status = 'in_review'` so this lead isn't
    re-queried on the next run.

---

### Workflow 6: Real-Time Google Calendar Synchronization

- **Objective:** Prevent double-booking across dentist chairs by syncing
  confirmed Lumina appointments directly into the clinic's Google Calendar.
- **Trigger:** Supabase `appointments` `INSERT` where `status = 'confirmed'`.
- **Node Steps:**
  1. **Google Calendar Node (Create Event)**:
     - **Calendar:** `Lumina Primary Surgery 1`
     - **Summary:**
       `[Lumina] {{service_name}} - {{patients.first_name}} {{patients.last_name}}`
     - **Start Time:** `{{appointment_date}}T{{formatSlotStart(time_slot)}}`
     - **End Time:** `{{appointment_date}}T{{formatSlotEnd(time_slot)}}`
     - **Description:**
       `Mobile: {{patients.mobile}} | Notes: {{patient_notes}} | Token: {{intake_token}}`
  2. **Supabase Update Node**: Store `google_calendar_event_id` back in
     `appointments` table.
  - **Known limitation (documented, not fixed in v1):** This sync is
    one-directional (Supabase → Calendar). If staff manually move or cancel an
    event directly in Google Calendar, it will not reflect back in Supabase.
    Acceptable for launch; flagged as a phase-2 improvement (Calendar webhook →
    Supabase update).

---

### Workflow 7: 24/7 AI Clinical Concierge & Dental Triage (RAG + pgvector)

- **Objective:** Provide instant, clinically grounded 24/7 answers to patient
  questions on pricing, HMO insurance coverage, post-op care, and emergency
  triage.
- **Build this last**, after Workflows 1–6 are live and stable.
- **Trigger:** Webhook from website live chat or inbound email to
  `care@luminaclinic.com`.
- **Node Steps in n8n:**
  1. **Webhook Trigger Node**: Receives incoming user question string (`query`).
  2. **Embeddings Node (OpenAI / Google Gemini)**: Generates 1536-dimensional
     vector embedding for the query.
  3. **Supabase Vector Store Node / Postgres RPC**:
     ```sql
     SELECT * FROM match_clinic_knowledge(
       query_embedding := '{{$json.embedding}}'::vector,
       match_threshold := 0.72,
       match_count := 3
     );
     ```
     _(As of the schema revision, this function only returns
     `review_status = 'approved'` chunks — see Section 2.)_
  4. **AI Agent / LLM Chain Node (`gpt-4o-mini` / `gemini-1.5-flash`)**:
     - **System Prompt:**
       > _You are the Lumina Dental Clinic Virtual Concierge. Answer the
       > patient's inquiry strictly using the provided context chunks. Be warm,
       > professional, reassuring, and precise. Answer only pricing, hours,
       > insurance/HMO, and general post-op/FAQ questions — never recommend or
       > rule out a specific treatment. If they ask about emergency symptoms
       > (uncontrolled bleeding, severe facial swelling, trauma), do not attempt
       > to advise — immediately direct them to urgent care and provide the
       > clinic phone: (415) 555-0142. Always invite them to book an appointment
       > with our direct booking link: https://luminaclinic.com/#booking._
  5. **Respond to Webhook / Send Email Node**: Dispatches the grounded AI
     response back to the patient via Web Chat or from `care@luminaclinic.com`.
  6. **[NEW] Logging Node**: Every conversation (query, retrieved chunks,
     response) is logged to a `concierge_conversations` table for staff
     spot-review — not just emergency-triggered ones. This is a
     human-in-the-loop safety net, not a blocker to response time.

---

### Workflow 8: Automated Google Drive Knowledge Ingestion & Vectorization Pipeline

- **Objective:** Allow clinic staff (dentists, practice manager) to simply drop
  PDFs/Word docs (Post-Op Guidelines, Pricing Sheets, HMO policies) into a
  dedicated Google Drive folder, and have n8n automatically extract the text,
  chunk it, generate embeddings, and upsert into Supabase
  `clinic_knowledge_docs` — **pending staff approval** before it's live.
- **Google Drive Folder Name:** `Lumina Dental SOPs & Knowledge Base`
- **Trigger:** **Google Drive Trigger Node in n8n**
  - **Event:** `File Created or Updated`
  - **Filter:** MIME types `application/pdf`,
    `application/vnd.google-apps.document`, `text/plain`, `.docx`.
- **Node Execution Flow in n8n:**
  ```
  [Google Drive Trigger] (File Created/Updated in Folder)
           │
           ▼
  [Download File Node] (Get Binary PDF / Doc)
           │
           ▼
  [Extract Text / PDF Parser] (Extract clinical text contents)
           │
           ▼
  [Delete Old Vectors Node] (If updating existing file, remove previous chunks by `metadata->>'file_id'`)
           │
           ▼
  [Text Splitter / Chunking Node] (Chunk size: 800 tokens, Overlap: 100 tokens)
           │
           ▼
  [OpenAI / Gemini Embeddings Node] (Generate 1536-dim vector for each chunk)
           │
           ▼
  [Supabase Insert Node] (Write chunks to `clinic_knowledge_docs` with review_status = 'pending_review')
           │
           ▼
  [Slack Staff Notification (#knowledge-updates)] ("🕓 New file awaiting review: Root_Canal_PostOp.pdf (6 chunks) — approve before it goes live: [link]")
           │
           ▼
  [NEW] [Staff Approval Step] (Staff reviews chunks in a lightweight admin view / Slack action, sets review_status = 'approved' or 'rejected')
  ```
- **SQL Clean-up & Upsert Query for n8n:**
  ```sql
  -- Step A: Delete previous chunks of this file to prevent duplicate / stale answers
  DELETE FROM clinic_knowledge_docs
  WHERE metadata->>'file_id' = '{{$json.id}}';

  -- Step B: Insert new vectorized chunk — lands as pending_review, NOT live
  INSERT INTO clinic_knowledge_docs (title, category, content, metadata, embedding, review_status)
  VALUES (
    '{{$json.name}}',
    '{{$json.category || "clinical_sop"}}',
    '{{$json.chunk_text}}',
    jsonb_build_object(
      'file_id', '{{$json.id}}',
      'web_view_link', '{{$json.webViewLink}}',
      'modified_time', '{{$json.modifiedTime}}'
    ),
    '{{$json.embedding}}'::vector,
    'pending_review'
  );

  -- Step C: [NEW] Staff approval action (run when staff approves in the admin view / Slack)
  UPDATE clinic_knowledge_docs
  SET review_status = 'approved'
  WHERE metadata->>'file_id' = '{{$json.file_id}}';
  ```

---

## 4. Environment Variables Reference for n8n & Backend

When configuring n8n credentials, use the following variables:

```bash
# Supabase PostgreSQL Direct Connection
POSTGRES_HOST=db.xxxxxxxxxxxxxxxxxxxx.supabase.co
POSTGRES_PORT=5432
POSTGRES_DATABASE=postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-super-secret-db-password

# Supabase REST API & Service Role (for Webhook triggers)
SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJh......

# AI & Embeddings (for RAG / Vector Store)
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxx
EMBEDDING_MODEL=text-embedding-3-small
LLM_MODEL=gpt-4o-mini

# Official Clinic Email Delivery (Resend / SendGrid / SMTP)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
CLINIC_SENDER_EMAIL=care@luminaclinic.com

# Internal Staff Alerts (Slack)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T00/B00/XXXXX
SLACK_CLINICAL_ALERTS_CHANNEL=#clinical-alerts
SLACK_NEW_APPOINTMENTS_CHANNEL=#new-appointments
SLACK_KNOWLEDGE_UPDATES_CHANNEL=#knowledge-updates

# Google Integrations
GOOGLE_CALENDAR_ID=care@luminaclinic.com
```

---

## 5. Deployment & Testing Checklist

- [ ] **Supabase Tables & RLS**: Ensure `schema.sql` (including `pgvector`,
      `clinic_knowledge_docs`, and all `[NEW]`/`[CHANGED]` columns above) is run
      in the Supabase SQL Editor.
- [ ] **Supabase Webhooks**: Enable Database Webhooks in Supabase Dashboard →
      Database → Webhooks pointing to your n8n Webhook URLs.
- [ ] **`consent_signed` default verified** as `FALSE`, and the intake form
      explicitly sets it `TRUE` on submit.
- [ ] **`intake_token_expires_at`** checked server-side on every intake-link
      access, not just set and ignored.
- [ ] **pgvector RLS policy** scoped to `service_role` only — confirmed no
      anon/authenticated key can read or write `clinic_knowledge_docs`.
- [ ] **Booking funnel Step 1** confirmed to insert into `inquiries` with
      `source = 'booking_funnel_step1'` and `status = 'lead_captured'`.
- [ ] **Slack channels created**: `#new-appointments`, `#clinical-alerts`,
      `#knowledge-updates`, plus an alerting path for the
      `care@luminaclinic.com` reply-to inbox.
- [ ] **Lumina-UI Hosting**: Deploy to Vercel / Netlify / Cloudflare Pages.
- [ ] **Lumina-API Hosting**: Deploy to Render / Railway / Fly.io with the
      appropriate `PORT`, `CORS_ORIGIN`, and Supabase env vars.
- [ ] **E2E Validation**: Run `npx playwright test` to verify zero UI
      regressions.
