# Lumina Dental Studio: Comprehensive System Features Architecture

> **Document Scope:** Full functional and technical documentation of the application codebase covering the Public Patient Portal, Booking Funnel, Digital Medical Intake Engine, Clinical Operations Hub, RBAC Directory, and Account Security Profile. *(Excludes external n8n automation webhook configurations).*

---

## 1. Public Patient Portal & Booking Funnel (`/`)

### A. Luxury Brand Experience & Design System
* **Curated Design Palette:** Built using Lumina Deep Teal (`#0f766e`), Electric Teal (`#0d9488`), Crisp Slate (`#0f172a`), Soft Off-White backgrounds (`#f8fafc`), and glassmorphism backdrops (`backdrop-blur-md`).
* **Typography:** Modern serif display typography (`Playfair Display` / `display font-extrabold`) paired with high-legibility sans-serif body text (`Inter` / `Plus Jakarta Sans`).
* **Responsive Breakpoints:** Fully responsive layouts for Mobile (320px–640px), Tablet (768px–1024px), Desktop (1280px), and Ultra-wide Displays (1600px+).

### B. Multi-Step Interactive Booking Engine
* **Step 1: Patient Information & Service Selection:**
  * First Name & Last Name (with auto title-casing and validation).
  * Email Address & Philippine Mobile Number (`+63 9XX` format).
  * Clinical Service Selector (e.g. *Comprehensive Dental Exam*, *Laser Teeth Whitening*, *Invisalign Consult*, *Dental Veneers*, *Root Canal Therapy*).
  * Optional patient treatment notes and dental concerns.
  * **Lead Capture Event:** Captures contact details as an inquiry to prevent lead loss if the user drops off before final confirmation.
* **Step 2: Date & Dynamic Time Slot Selection:**
  * Real-time date picker adhering to Asia/Manila PST working hours.
  * Dynamic slot generator calculating available 60-minute clinical intervals (e.g., 09:00 AM – 10:00 AM, 10:00 AM – 11:00 AM).
  * Auto-disables booked slots to eliminate double-booking.
* **Step 3: Clinical Booking Confirmation:**
  * Generates unique appointment record in Supabase `appointments` and `patients` tables.
  * Issues a cryptographically unique `intake_token` with 14-day expiration for pre-visit medical intake.
  * Displays visual confirmation card with appointment details and quick-launch button to the digital intake form.

### C. Direct Patient Inquiry & Lead Capture
* **Floating & Embedded Contact Modals:** Enables prospective patients to submit questions regarding cosmetic procedures, pricing, and insurance eligibility.
* **Database Ingestion:** Ingests inquiry records into Supabase `inquiries` table with source attribution (`landing_page`, `booking_funnel_step1`).

### D. Patient Communication Preferences Portal (`/unsubscribe`)
* Dedicated token-verified portal allowing patients to manage email communication preferences or opt-out of marketing/recall emails while retaining essential appointment notifications.

---

## 2. Pre-Visit Digital Medical Intake Engine (`/intake`)

### A. Token-Secured Access (Zero Password Required)
* **Secure URL Scheme:** Accessed via `/intake?token=<secure-intake-token>`.
* **Verification Logic:** Validates token against Supabase `appointments` table; checks token expiration and prevents duplicate intake re-submissions if already completed.

### B. Comprehensive Health & Allergy Screening
* **Patient Demographics:** Date of Birth, Sex Assigned at Birth, Age.
* **Allergy Escalation Matrix:**
  * Multi-select allergy checklist including *Penicillin / Amoxicillin*, *Latex*, *Local Anesthetics (Lidocaine/Epinephrine)*, *Aspirin / NSAIDs*, *Sulfa Drugs*, *Codeine*, *Dental Metals / Nickel*.
  * Free-text field for other environmental or pharmaceutical allergies.
* **Pre-Existing Medical History:** Multi-select screening for *Cardiovascular Conditions / Hypertension*, *Diabetes*, *Bleeding Disorders / Anticoagulant Therapy*, *Dental Anxiety / Phobia*, *Artificial Heart Valves / Joint Replacements*, *Asthma / Respiratory Conditions*, *Pregnancy*.
* **Active Medications:** Free-form input to list ongoing prescription drugs, dosages, and supplements.
* **Emergency Contact Information:** Primary contact name, relationship, and contact phone number.
* **HMO & Insurance Details:** Insurance carrier selection (*Delta Dental*, *Maxicare*, *Intellicare*, *Medicard*, *PhilCare*, *Private Pay*) and Member ID.

### C. Legal Digital Consent & E-Signature
* **Informed Clinical Consent:** Clear legal terms consenting to routine clinical diagnosis, X-ray imaging, and local anesthesia.
* **Submission Handling:**
  * Stores record in `medical_intakes` table linked to `appointment_id`.
  * Sets `intake_completed_at` timestamp on `appointments` table.
  * Renders visual completion state reassuring the patient that their chart is ready for the dentist.

---

## 3. Clinical Operations & Doctor Hub (`/admin`)

### A. Top Navigation & Live Telemetry
* **Brand Header:** Clickable Lumina Dental Studio logo keeping staff safely within `/admin`.
* **Live Asia/Manila Clock:** Real-time ticking 12-hour clock with PST time zone indicator.
* **Active Profile Badge:** Displays logged-in staff full name and clinical specialization (e.g. *Bryant Iverson Melliza • Owner*).
* **Settings Gear Dropdown:**
  * **My Account Profile** link with amber notification badge (`!`) if profile demographics are incomplete.
  * **Log Out** button opening an executive confirmation modal.

### B. Executive Dashboard Metrics (Uniform Lumina Palette)
Standardized metric cards with soft teal borders and modern Lucide icons:
1. **`TOTAL VISITS`** (`<CalendarDays />`): Total number of active reservations.
2. **`COMPLETED`** (`<CheckCheck />`): Visited patients with post-op sequence triggered.
3. **`INTAKES PENDING`** (`<ClipboardList />`): Appointments awaiting pre-visit health form completion.
4. **`FOLLOW-UP ALERTS`** (`<BellRing />`): Procedures flagged with clinical complications requiring personalized staff phone check-ins.

### C. Chairside Clinical Schedule & Patient Cards
* **Quick Date Filters:** `All Visits`, `Aug 25`, `Aug 26`, and custom status filters (`Confirmed`, `Checked In`, `Completed`, `Cancelled`).
* **Live Search:** Instant patient search by first name, last name, email, or service name.
* **Patient Card Breakdown:**
  * Patient full name, sex assigned at birth, and appointment date/time slot.
  * **Live Status Badges:** `Confirmed`, `Intake Submitted`, `Checked In / In Lobby`, `Completed`, `Cancelled`.
  * **Pre-Visit Medical Intake Pill:** One-click modal viewer displaying allergies (highlighted in prominent red badges), medical conditions, current medications, emergency contacts, and HMO insurance.
  * **Patient Arrival Fast Action (`[ Check In ]`):** Enables front desk to mark a patient as arrived in the clinic lobby in a single click.
  * **Chairside Treatment Mark-off (`[ Complete Visit ]` / `[ Action ]`):** Opens the procedure completion modal.

### D. Chairside Treatment Mark-off & Complication Triage Modal
* **Clinical Outcome Options:**
  * **Standard Visit (Normal Recovery):** Triggers standard aftercare email instructions and morning comfort check-in.
  * **Complication Encountered:** Bypasses automated emails, sets `flag_for_manual_followup = true`, and dispatches an urgent alert for personalized care team phone outreach.
* **Doctor / Staff Clinical Notes:** Textarea to log prescriptions (e.g. *Amoxicillin 500mg*), sutures, and next appointment recommendations.

### E. Interactive Lumina Calendar & 2026 Philippine Holidays
* **Header Controls:** Month dropdown (January–December), Year dropdown (2025–2030), `<` / `>` step buttons, and **`Today`** quick-jump button.
* **Accurate Dynamic Today Indicator:** Computes current Manila PST date (`2026-08-26`) and highlights the active date cell.
* **Full Month Matrix (35/42 Grid):** Displays full calendar month with trailing previous and next month days in muted styling.
* **Philippine Official Holidays:** Visual badges for all official 2026 PH holidays (*New Year's, Chinese New Year, EDSA Day, Holy Week, Labor Day, Independence Day, Ninoy Aquino Day, National Heroes Day, Bonifacio Day, Christmas, Rizal Day*).
* **Google Calendar-Style Event Chips:** Stacked top-to-bottom appointment chips with compact time formatting (`10am`, `1pm`), service name, and patient name.
* **Daily Clinical Schedule Modal:** Clicking any day cell opens a clean, scrollable schedule modal showing all visits for that date with quick check-in and treatment mark-off buttons.

### F. Clinical Inquiries & Abandoned Lead Recovery Manager
* Lists all captured leads from website modals and Step 1 booking abandonments.
* Displays contact details, date captured, service of interest, and patient message.
* Status management actions: **`Mark Converted`** and **`Archive`**.

### G. Super Admin Staff & Doctor Directory (RBAC)
* **Access Control:** Exclusively visible to users with role `super_admin`.
* **Multi-Column Cards Grid:** Clean 3-column card layout (`grid-cols-1 md:grid-cols-2 xl:grid-cols-3`) displaying:
  * Role Badge (`Super Admin`, `Attending Doctor`, `Front Desk & Staff`) & `Active` badge.
  * Staff Name in bold title with specialization subtitle.
  * Email address, assigned clinic branch location, and PRC Medical/Dental license number.
  * Profile status indicator (`Profile Verified` or `Profile Incomplete`).
* **Live Supabase Sync:** Reads and syncs directly with Supabase `staff_users` table using `select('*')`.
* **"Add New Doctor / Staff" Modal:**
  * Auto title-cases first name, last name, and specialization on typing.
  * Role selector (`doctor`, `front_desk`, `super_admin`).
  * Cryptographically hashes initial passwords with PBKDF2 before storing.
  * `<Eye>` / `<EyeOff>` password visibility toggle.
* **Custom Removal Confirmation Modal:** Custom inline modal to revoke staff portal access without browser alert popups.

---

## 4. Staff Account & Security Profile Portal (`/admin/account` & `/admin/login`)

### A. Staff Authentication Gateway (`/admin/login`)
* **Clean & Minimalist Interface:** Proper labels, placeholders, and single **`Sign In`** button without demo preset distractions.
* **Cryptographic Verification:** Validates passwords using **PBKDF2 with SHA-512 and salt** (`verifyPassword`) against Supabase `staff_users`.
* **HTTP-Only Session Cookies:** Issues secure base64-encoded session tokens stored in `lumina_admin_session` cookies.

### B. Account Profile & Security Settings (`/admin/account`)
* **Widescreen Layout:** Full `max-w-[1600px]` width matching the clinical dashboard.
* **Unified Top Navigation:** Identical top navigation bar to `/admin` with live Manila clock, user profile, and Settings dropdown.
* **Incomplete Profile Prompt:** Displays an amber alert banner on first login if demographics are incomplete.
* **Section 1: Personal & Clinical Information:**
  * First Name & Last Name (with auto title-casing).
  * Read-only Email Address.
  * Clinical Specialization and PRC License Number (for doctors).
* **Section 2: Demographics & Clinic Branch Location:**
  * Date of Birth picker with auto-computed age.
  * Sex Assigned at Birth dropdown (`Male`, `Female`, `Other`).
  * Age input with validation (18–100).
  * **Clinic Branch Location Dropdown:**
    1. `Bonifacio Global City, Taguig (Flagship Studio)`
    2. `Makati CBD, Metro Manila (Ayala Triangle Studio)`
    3. `Ortigas Center, Pasig City (San Antonio Studio)`
    4. `Alabang, Muntinlupa City (Filinvest City Branch)`
    5. `Cebu IT Park, Cebu City (Visayas Hub)`
* **Section 3: Security & Password Updates (Real-Time Inline Validation):**
  * Current Password verification with `<Eye>` toggle.
  * **New Password:** Real-time feedback showing red alert (`< 8 chars`) or green checkmark (`>= 8 chars`).
  * **Confirm Password:** Real-time feedback showing red mismatch alert or green checkmark when matching.
* **Save & Auto-Redirect Workflow:**
  * Upserts all updated fields directly into Supabase `staff_users`.
  * Displays success confirmation banner and smoothly redirects to `/admin` after 1.2 seconds.
* **Route Protection:** Direct unauthenticated access automatically redirects to `/admin/login`.

---

## 5. Summary Matrix of Database Entities (Supabase PostgreSQL)

| Table Name | Primary Purpose | Key Fields |
| :--- | :--- | :--- |
| **`staff_users`** | Clinical staff credentials, roles, and profile demographics | `id`, `email`, `name`, `first_name`, `last_name`, `role`, `specialization`, `license_number`, `birthdate`, `sex`, `age`, `location`, `profile_completed`, `status`, `password_hash` |
| **`patients`** | Core patient medical identity & contact registry | `id`, `first_name`, `last_name`, `email`, `mobile`, `date_of_birth`, `sex_assigned_at_birth`, `last_visit_date`, `recall_sent` |
| **`appointments`** | Clinical reservations and chairside schedule | `id`, `patient_id`, `service_name`, `appointment_date`, `time_slot`, `patient_notes`, `status`, `google_calendar_event_id`, `intake_token`, `intake_completed_at`, `flag_for_manual_followup` |
| **`medical_intakes`** | Pre-visit health screening, allergies, and legal consents | `id`, `appointment_id`, `submitted_at`, `medical_conditions`, `allergies`, `current_medications`, `emergency_contact_name`, `emergency_contact_phone`, `hmo_provider`, `hmo_member_id`, `consent_signed` |
| **`inquiries`** | Inbound leads from website modals and funnel drop-offs | `id`, `first_name`, `last_name`, `email`, `phone`, `service_of_interest`, `message`, `status`, `source`, `created_at` |

---

*Authored for Lumina Dental Studio System Architecture Documentation.*
