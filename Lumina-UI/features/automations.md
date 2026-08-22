# Lumina Dental Clinic — Production n8n Automation Architecture & Guide

This document outlines the complete automation workflows, database schema mapping, SQL query recipes, and node-by-node guides for powering Lumina Dental Clinic's backend automations with **n8n** and **Supabase (PostgreSQL)**.

---

## 1. Database Architecture & Table References

All automations interact directly with the Supabase PostgreSQL database or via Lumina-API webhooks.

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
 └─────────────────┘       └─────────────────┘       └─────────────────┘
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
                           │ status          │
                           └─────────────────┘
```

### Table 1: `patients`
Stores unique patient clinical profiles and recall timestamps.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY, DEFAULT gen_random_uuid()` | Unique Patient ID |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Record registration date |
| `updated_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Last update timestamp |
| `first_name` | `TEXT` | `NOT NULL` | Patient first name |
| `last_name` | `TEXT` | `NOT NULL` | Patient last name |
| `email` | `TEXT` | `UNIQUE, NOT NULL` | Verified patient email address |
| `mobile` | `TEXT` | `NOT NULL` | Mobile number for SMS / WhatsApp |
| `date_of_birth` | `DATE` | `NULLABLE` | Patient birthdate |
| `sex_assigned_at_birth` | `TEXT` | `NULLABLE` | `'Female'` or `'Male'` |
| `last_visit_date` | `DATE` | `NULLABLE` | Date of last completed chairside procedure |
| `recall_sent` | `BOOLEAN` | `DEFAULT FALSE` | Flag indicating if 6-month recall email was triggered |

---

### Table 2: `appointments`
Stores individual appointment reservations and pre-visit intake tokens.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY, DEFAULT gen_random_uuid()` | Unique Appointment ID |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Booking timestamp |
| `patient_id` | `UUID` | `REFERENCES patients(id) ON DELETE CASCADE` | Associated patient |
| `service_name` | `TEXT` | `NOT NULL` | e.g. `'Laser Teeth Whitening'`, `'Root Canal Therapy'` |
| `appointment_date` | `DATE` | `NOT NULL` | Scheduled date (YYYY-MM-DD) |
| `time_slot` | `TEXT` | `NOT NULL` | e.g. `'10:00 AM - 11:00 AM'` |
| `patient_notes` | `TEXT` | `NULLABLE` | Clinical notes or symptoms left by patient |
| `status` | `appointment_status` | `DEFAULT 'confirmed'` | Enum: `'lead_captured'`, `'confirmed'`, `'intake_submitted'`, `'completed'`, `'cancelled'`, `'no_show'` |
| `google_calendar_event_id` | `TEXT` | `NULLABLE` | Google Calendar synchronization ID |
| `intake_token` | `UUID` | `DEFAULT gen_random_uuid()` | Unique secure token for digital intake form link |
| `intake_completed_at` | `TIMESTAMPTZ` | `NULLABLE` | Timestamp when intake form was submitted |

---

### Table 3: `medical_intakes`
Stores pre-visit medical history, allergies, systemic conditions, and HMO records.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY, DEFAULT gen_random_uuid()` | Unique intake record ID |
| `appointment_id` | `UUID` | `UNIQUE, REFERENCES appointments(id) ON DELETE CASCADE` | Associated appointment |
| `submitted_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Submission timestamp |
| `date_of_birth` | `DATE` | `NULLABLE` | Date of birth verification |
| `emergency_contact_name` | `TEXT` | `NULLABLE` | Emergency contact name |
| `emergency_contact_phone` | `TEXT` | `NULLABLE` | Emergency contact telephone |
| `medical_conditions` | `TEXT[]` | `DEFAULT '{}'` | Array: e.g. `['Hypertension', 'Diabetes Type 2']` |
| `allergies` | `TEXT[]` | `DEFAULT '{}'` | Array: e.g. `['Penicillin', 'Latex', 'Epinephrine']` |
| `current_medications` | `TEXT` | `NULLABLE` | Prescribed medications / anticoagulants |
| `hmo_provider` | `TEXT` | `NULLABLE` | Dental Insurance / HMO provider |
| `hmo_member_id` | `TEXT` | `NULLABLE` | Insurance policy number |
| `consent_signed` | `BOOLEAN` | `DEFAULT TRUE` | Electronic HIPAA / treatment consent |

---

### Table 4: `inquiries`
General clinical inquiries submitted via the primary landing page contact modal.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY, DEFAULT gen_random_uuid()` | Unique inquiry ID |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Submission timestamp |
| `first_name` | `TEXT` | `NOT NULL` | Inquirer's first name |
| `last_name` | `TEXT` | `NOT NULL` | Inquirer's last name |
| `email` | `TEXT` | `NOT NULL` | Inquirer's email |
| `phone` | `TEXT` | `NULLABLE` | Inquirer's phone number |
| `service_of_interest` | `TEXT` | `NULLABLE` | Service category |
| `message` | `TEXT` | `NOT NULL` | Clinical question or inquiry text |
| `status` | `TEXT` | `DEFAULT 'new'` | `'new'`, `'in_review'`, `'replied'`, `'archived'` |

---

## 2. Recommended n8n Workflows & Blueprint

Below are the 7 high-impact automation pipelines for Lumina Dental Clinic:

```
                  ┌────────────────────────────────────────────────────────┐
                  │              n8n AUTOMATION ORCHESTRATION              │
                  └────────────────────────────────────────────────────────┘
                                               │
      ┌───────────────────────┬────────────────┴───────────────────────┬───────────────────────┐
      ▼                       ▼                                        ▼                       ▼
 1. Digital Intake       2. Allergy & Alert                     3. Post-Op Care         4. 6-Month Hygiene
  Dispatch Link           Staff Escalation                       Pathways                Recall Engine
 (On Appointment)        (On Intake Submit)                     (On Completed)          (Daily Cron)
```

---

### Workflow 1: Pre-Appointment Digital Intake Dispatch
- **Objective:** Save 15 minutes of clinic waiting room time by delivering the digital medical intake link immediately upon booking confirmation.
- **Trigger:** Supabase Database Webhook on `appointments` table (`INSERT` where `status = 'confirmed'`), or n8n Polling Node.
- **SQL Fetch Query:**
  ```sql
  SELECT 
    a.id AS appointment_id,
    a.appointment_date,
    a.time_slot,
    a.service_name,
    a.intake_token,
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
  2. **Execute SQL Node**: Fetch patient details and `intake_token`.
  3. **Format Email Node**: Generate link `https://luminaclinic.com/intake?token={{$json.intake_token}}`.
  4. **Send Email (Resend / SendGrid / Gmail)**:
     - **Subject:** `Confirming your visit + Pre-visit digital health history (Lumina Dental Clinic)`
     - **Body:**
       > *Hi {{first_name}},*
       > 
       > *Your appointment for **{{service_name}}** is confirmed for **{{appointment_date}} at {{time_slot}}**.*
       > 
       > *To save you 15 minutes in our lounge, please complete your secure pre-visit medical intake form prior to arriving:*
       > 
       > 👉 **[Complete Digital Intake Form](https://luminaclinic.com/intake?token={{intake_token}})**
  5. **Send SMS / WhatsApp (Twilio)**:
     > *Lumina Dental: Hi {{first_name}}, please fill your pre-visit health history before your {{service_name}} visit on {{appointment_date}}: https://luminaclinic.com/intake?token={{intake_token}}*

---

### Workflow 2: Clinical Allergy & High-Risk Medical History Escalation
- **Objective:** Instantly flag high-risk patient conditions (Penicillin allergy, Latex allergy, bleeding disorders, cardiac conditions, anticoagulants) to the attending dentist before the patient arrives.
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
  1. **IF Node**: Check if `allergies.length > 0` OR `medical_conditions.length > 0`.
  2. **True Branch**:
     - Dispatch instant **Slack / Discord / Clinic WhatsApp Alert**:
       > ⚠️ **CLINICAL HEALTH ALERT — Patient: {{first_name}} {{last_name}}**
       > - **Scheduled Service:** {{service_name}} on {{appointment_date}} ({{time_slot}})
       > - **Reported Allergies:** {{allergies.join(', ')}}
       > - **Conditions:** {{medical_conditions.join(', ')}}
       > - **Medications:** {{current_medications || 'None'}}
       > - **Emergency Contact:** {{emergency_contact_name}} ({{emergency_contact_phone}})
  3. **Sync to Google Sheets / Notion Dental Chart**: Update the patient's record with a colored 🔴 badge.

---

### Workflow 3: Procedure-Specific Post-Operative Care Sequence
- **Objective:** Reduce anxiety and emergency call volume by dispatching procedure-tailored post-op instructions 2 hours after treatment, followed by a next-morning recovery check-in.
- **Trigger:** Supabase Webhook when `appointments.status` updates to `'completed'`.
- **SQL Fetch Query:**
  ```sql
  SELECT 
    a.id,
    a.service_name,
    a.appointment_date,
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
  1. **Update Patient Last Visit Date**:
     ```sql
     UPDATE patients 
     SET last_visit_date = CURRENT_DATE, recall_sent = FALSE, updated_at = NOW() 
     WHERE id = '{{$json.patient_id}}';
     ```
  2. **Wait Node (2 Hours)**:
  3. **Switch Node (by `service_name`)**:
     - **Case 'Root Canal Therapy' / 'Tooth Extraction' / 'Surgical'**:
       - Send Surgical Recovery PDF & Dos/Don'ts (No hot liquids, no straws, soft diet, cold compress guidelines).
     - **Case 'Laser Teeth Whitening'**:
       - Send "White Diet" guidelines (avoid coffee, wine, tomato sauce for 48 hours).
     - **Case Default (Routine Cleaning / Exam)**:
       - Send general oral hygiene maintenance tips.
  4. **Wait Node (Until Next Morning at 9:00 AM)**:
  5. **Send Follow-up Email / SMS**:
     > *Hi {{first_name}}, Dr. Lumina team checking in! How is your comfort level today? If you have any soreness or questions, reply to this message directly or call our clinic desk.*

---

### Workflow 4: Automated 5-Star Google Reviews & Reputation Engine
- **Objective:** Systematically grow Google Maps ranking and social proof by soliciting reviews from verified, completed patients 24 hours post-treatment.
- **Trigger:** 24 hours after an appointment is marked `'completed'`.
- **Execution Flow:**
  1. **Fetch Patient Details** (Ensure patient had no recorded complaints).
  2. **Send Personalized Review Request**:
     - **Subject:** *How was your visit with Dr. Lumina yesterday, {{first_name}}?*
     - **Body:**
       > *Hi {{first_name}},*
       > 
       > *Thank you for choosing Lumina Dental Clinic for your {{service_name}}. Our team strives to deliver the gentlest, highest-standard dental care.*
       > 
       > *If you had a comfortable experience, would you take 30 seconds to share your feedback on Google? It means the world to our staff:*
       > 
       > ⭐⭐⭐⭐⭐ **[Leave a 5-Star Review on Google Maps](https://g.page/r/your-google-review-link/review)**

---

### Workflow 5: 6-Month Preventive Hygiene Recall Engine
- **Objective:** Maximize patient lifetime value (LTV) and ensure continuous preventive oral health by automatically reaching out to patients due for their 6-month cleaning.
- **Trigger:** **Daily Cron Schedule (Every morning at 09:00 AM)** (`0 9 * * *`).
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
  1. **Execute Query**: Find all eligible patients overdue for their semi-annual exam.
  2. **Loop Over Items**:
     - Dispatch recall email:
       > *Hi {{first_name}}, it has been 6 months since your last dental cleaning at Lumina Dental Clinic!*
       > 
       > *Routine cleanings are essential for preventing plaque buildup and preserving enamel health. Click below to view available chairside times:*
       > 
       > 📅 **[Schedule Your 6-Month Checkup](https://luminaclinic.com/#booking)**
     - Mark patient record as recall sent:
       ```sql
       UPDATE patients 
       SET recall_sent = TRUE, updated_at = NOW() 
       WHERE id = '{{$json.patient_id}}';
       ```

---

### Workflow 6: Lead Recovery for Abandoned Squeeze Bookings & Inquiries
- **Objective:** Recover patients who submit an inquiry or begin filling their name/email but abandon before confirming a calendar slot.
- **Trigger:** `inquiries` created with `status = 'new'` without an appointment booked within 2 hours.
- **SQL Query:**
  ```sql
  SELECT 
    i.id,
    i.first_name,
    i.last_name,
    i.email,
    i.service_of_interest,
    i.message,
    i.created_at
  FROM inquiries i
  LEFT JOIN patients p ON p.email = i.email
  LEFT JOIN appointments a ON a.patient_id = p.id AND a.created_at >= i.created_at
  WHERE 
    i.status = 'new'
    AND i.created_at <= NOW() - INTERVAL '1 hour'
    AND a.id IS NULL;
  ```
- **Action:** Send gentle, conversational follow-up email:
  > *Hi {{first_name}}, we noticed you were looking into {{service_of_interest || 'dental care'}} at Lumina Dental Clinic. Did you have any questions about pricing, insurance coverage, or procedure steps that our reception team can help clarify?*

---

### Workflow 7: Real-Time Google Calendar Synchronization
- **Objective:** Prevent double-booking across dentist chairs by syncing confirmed Lumina appointments directly into the clinic's Google Calendar.
- **Trigger:** Supabase `appointments` `INSERT` where `status = 'confirmed'`.
- **Node Steps:**
  1. **Google Calendar Node (Create Event)**:
     - **Calendar:** `Lumina Primary Surgery 1`
     - **Summary:** `[Lumina] {{service_name}} - {{patients.first_name}} {{patients.last_name}}`
     - **Start Time:** `{{appointment_date}}T{{formatSlotStart(time_slot)}}`
     - **End Time:** `{{appointment_date}}T{{formatSlotEnd(time_slot)}}`
     - **Description:** `Mobile: {{patients.mobile}} | Notes: {{patient_notes}} | Token: {{intake_token}}`
  2. **Supabase Update Node**: Store `google_calendar_event_id` back in `appointments` table.

---

## 3. Environment Variables Reference for n8n & Backend

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

# Clinical Email Delivery (Resend / SendGrid)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
CLINIC_SENDER_EMAIL=care@luminaclinic.com

# SMS & WhatsApp Notifications (Twilio)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+14155550142

# Google Integrations
GOOGLE_CALENDAR_ID=care@luminaclinic.com
GOOGLE_REVIEW_LINK=https://g.page/r/your-google-place-id/review
```

---

## 4. Deployment & Testing Checklist

- [ ] **Supabase Tables & RLS**: Ensure `schema.sql` is run in the Supabase SQL Editor.
- [ ] **Supabase Webhooks**: Enable Database Webhooks in Supabase Dashboard -> Database -> Webhooks pointing to your n8n Webhook URLs.
- [ ] **Lumina-UI Hosting**: Deploy to Vercel / Netlify / Cloudflare Pages.
- [ ] **Lumina-API Hosting**: Deploy to Render / Railway / Fly.io with the appropriate `PORT`, `CORS_ORIGIN`, and Supabase env vars.
- [ ] **E2E Validation**: Run `npx playwright test` to verify zero UI regressions.
