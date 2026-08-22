# Lumina Dental Clinic — automation.md Revisions

This document explains everything that changed between the original
`automation.md` you provided and the updated version, and why. Nothing here was
invented for its own sake — each change traces back to a specific gap or risk
found during review.

---

## 1. Schema Changes

### `medical_intakes.consent_signed`

- **Before:** `BOOLEAN DEFAULT TRUE`
- **After:** `BOOLEAN DEFAULT FALSE`
- **Why:** As written, any row inserted without explicitly setting this field
  reads as "patient consented" — including rows created by a bug, a partial
  submit, or a future automation that doesn't set it. Consent should only ever
  be `TRUE` because the patient affirmatively checked a box. This is a liability
  issue, not a style preference.

### `medical_intakes` — new acknowledgment fields

- **Added:** `alert_acknowledged BOOLEAN DEFAULT FALSE`,
  `alert_acknowledged_by TEXT`, `alert_acknowledged_at TIMESTAMPTZ`
- **Why:** Workflow 2 (allergy/high-risk escalation) fired a Slack alert but
  nothing tracked whether a human ever saw it. These fields let the workflow
  confirm acknowledgment and escalate again if nobody responds — closing the
  loop instead of a fire-and-forget notification.

### `appointments.intake_token_expires_at`

- **Added:** `TIMESTAMPTZ DEFAULT NOW() + INTERVAL '14 days'`
- **Why:** The original `intake_token` had no expiry, so a leaked or forwarded
  intake link would work forever. This gives it a shelf life that must be
  checked server-side when the link is accessed.

### `appointments.flag_for_manual_followup`

- **Added:** `BOOLEAN DEFAULT FALSE`
- **Why:** Workflow 3 auto-sends post-op instructions the moment a visit is
  marked `completed`, with no way to signal "this case was non-standard." This
  flag, set by clinical staff chairside, lets Workflow 3 skip the templated
  automation and route to a real staff callback instead.

### `appointments.source_inquiry_id`

- **Added:** `UUID REFERENCES inquiries(id) ON DELETE SET NULL`
- **Why:** Needed to reliably link a completed booking back to the lead it came
  from (see the `inquiries` fix below) — replaces a fragile email/timestamp
  match with a proper foreign key.

### `inquiries` table — several changes

- `last_name`: `NOT NULL` → `NULLABLE` (the booking funnel's Step 1 only
  captures one "Full Name" field, which may not split cleanly into first/last)
- `message`: `NOT NULL` → `NULLABLE` (booking-funnel leads don't submit free
  text the way a contact-form inquiry does)
- `status`: plain `TEXT` → enum including a new `'lead_captured'` and
  `'converted'` value
- **Added:** `source TEXT DEFAULT 'contact_modal'` (`'contact_modal'` or
  `'booking_funnel_step1'`)
- **Why — this is the main structural fix:** In the original architecture, the
  landing-page booking form's Step 1 fired an n8n webhook
  (`event: lead_captured`) with no defined destination table, while Workflow 5's
  recovery query read from `inquiries`, which is only ever written to by the
  contact modal. There was no connection between the two — Workflow 5 as
  originally written would never actually catch a booking-funnel abandoner, only
  organic inquiries. Making `inquiries` the single landing table for all
  pre-booking leads (distinguished by `source`) closes that gap and makes
  Workflow 5 do what it was actually meant to do.

### `clinic_knowledge_docs.review_status`

- **Added:** `TEXT DEFAULT 'pending_review'` (`'pending_review'`, `'approved'`,
  `'rejected'`)
- **Why:** Workflow 8 previously vectorized and inserted new chunks straight
  into the live table — a badly-chunked or outdated pricing/insurance PDF would
  immediately start feeding the AI concierge (Workflow 7) wrong information with
  zero review. Chunks now default to `pending_review` and must be explicitly
  approved before `match_clinic_knowledge` will return them.

---

## 2. `pgvector` / RLS Changes

### Row-Level Security policy on `clinic_knowledge_docs`

- **Before:** `CREATE POLICY ... USING (true) WITH CHECK (true)` with no role
  scoping.
- **After:** Same policy, but explicitly scoped `FOR ALL TO service_role`.
- **Why:** As originally written, the policy grants read/write access to _any_
  role that can reach the table, not just the n8n service role — meaning an anon
  or authenticated key elsewhere in the stack could read or overwrite the
  clinical knowledge base your AI concierge quotes from (pricing, post-op
  guidance, insurance rules). Scoping it to `service_role` closes that hole
  while keeping n8n's access exactly as it was.

### `match_clinic_knowledge()` function

- **Changed:** Added `AND clinic_knowledge_docs.review_status = 'approved'` to
  the `WHERE` clause.
- **Why:** Direct consequence of the `review_status` addition above — ensures
  unreviewed or rejected content can never be surfaced in a live patient-facing
  answer, even if it's sitting in the table.

---

## 3. Workflow-Level Changes

### Workflow 1 (Digital Intake Dispatch)

- Added a 1–2 minute Wait Node before sending, to absorb accidental
  double-submits from the booking form.
- Email copy now references the intake link's expiry date.
- No change to necessity or automation level — this one was fine as designed,
  just tightened.

### Workflow 2 (Allergy & High-Risk Escalation)

- Added an acknowledgment step: staff react/reply to the Slack alert, which
  writes back to the new `alert_acknowledged*` fields.
- Added a 3-hour escalation reminder that re-posts and tags the practice manager
  if nobody has acknowledged.
- **Why:** The original workflow was a one-way notification with no way to know
  if it was ever seen. A missed Slack message before a high-risk appointment is
  exactly the kind of failure this system exists to prevent.

### Workflow 3 (Post-Op Care Sequence)

- Added an `IF` gate on `flag_for_manual_followup` at the very start of the flow
  — if `TRUE`, the automated sequence is skipped and a staff task is posted to
  Slack instead.
- Added an explicit note that the `care@luminaclinic.com` reply-to inbox on the
  next-morning check-in must be actively monitored/alerted, since a reply here
  could describe a real complication.
- **Why:** This is the workflow with the highest chance of a genuinely bad
  outcome if left fully automated — it's the one place patients are most likely
  to report something going wrong, and the original design had no branch for
  "this wasn't a standard case" or "someone actually needs to see replies."

### Workflow 4 (6-Month Recall Engine)

- Added an unsubscribe/opt-out link to the recall email.
- **Why:** This is a recurring outbound marketing-adjacent email; it should
  respect opt-outs even though it wasn't flagged as a risk otherwise. No change
  to automation level.

### Workflow 5 (Abandoned Lead Recovery)

- Rewrote the trigger and SQL query to read from the now-unified `inquiries`
  table (`status IN ('new', 'lead_captured')`), joined to `appointments` via the
  new `source_inquiry_id` foreign key instead of a fragile timestamp/email
  match.
- Split the follow-up email copy into two variants based on `source` — a "finish
  booking" nudge for funnel abandoners vs. the original "did you have questions"
  nudge for organic inquiries.
- Added a status update to `'in_review'` after the follow-up is sent, so the
  same lead isn't re-queried on every run.
- **Why:** This is the fix for the structural gap described above — as
  originally written, this workflow could not have caught a booking-funnel
  abandoner at all.

### Workflow 6 (Google Calendar Sync)

- No functional changes. Added an explicit documented note that sync is
  one-directional and manual Calendar edits won't reflect back to Supabase —
  flagged as an acceptable v1 limitation and a phase-2 candidate, not silently
  left undocumented.

### Workflow 7 (AI Clinical Concierge)

- Tightened the system prompt to explicitly forbid treatment recommendations and
  to hard-route any symptom-adjacent question to the emergency line, rather than
  attempting an answer.
- Added a logging node: every conversation (not just emergency-flagged ones) is
  written to a `concierge_conversations` table for staff spot-review.
- Reconfirmed as the last workflow to build, after 1–6 are stable.
- **Why:** This is the workflow most likely to put incorrect information
  directly in front of a patient in real time, so it gets the most conservative
  scope and an audit trail.

### Workflow 8 (Knowledge Ingestion Pipeline)

- Inserts now default new chunks to `review_status = 'pending_review'` instead
  of going live immediately.
- Added a staff approval step (admin view or Slack action) before a chunk
  becomes queryable, plus an approval SQL statement.
- Slack notification copy changed from "successfully vectorized" to "awaiting
  review."
- **Why:** Direct consequence of the `review_status` schema change — prevents a
  bad PDF upload from immediately corrupting what the AI concierge tells
  patients.

---

## 4. Structural / Documentation-Only Additions

- Added a **Section 3.1 build-order and human-in-the-loop summary table** at the
  top of the workflows section, consolidating what was previously scattered
  across the conversation into the document itself: which workflows are fully
  automated vs. which need a checkpoint, and in what order to build them (1 → 6
  → 2 → 4 → 5 → 3 → 8 → 7).
- Added new Slack channel environment variables
  (`SLACK_CLINICAL_ALERTS_CHANNEL`, `SLACK_NEW_APPOINTMENTS_CHANNEL`,
  `SLACK_KNOWLEDGE_UPDATES_CHANNEL`) since the workflows now reference specific
  channels by name.
- Expanded the deployment checklist with items specific to the fixes above
  (consent default, token expiry, RLS scope, booking-funnel `source` field,
  monitored Slack channels).

---

## 5. Nothing Removed

No original workflow, table, or objective was cut. Every change above is
additive (new column, new step, new gate) or a correction to a default/policy
value. The original 8-workflow structure, the pgvector/RAG design, and the
email/Slack channel strategy are all preserved as designed.
