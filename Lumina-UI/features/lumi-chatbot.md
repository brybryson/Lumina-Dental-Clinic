# 🤖 Lumi — 24/7 AI Clinical Concierge & Dental Triage

> **System Component:** Workflow 7 (`Lumina - Workflow 7 - AI Clinical Concierge`)  
> **Status:** 🟢 Live & Production Ready  
> **Webhook Endpoint:** `POST https://dummyaccountbry.app.n8n.cloud/webhook/concierge-chat`  
> **Interface:** Floating Web Chat Widget (`https://luminadentalcarestudio.vercel.app`)

---

## 1. Executive Summary

**Lumi** is Lumina Dental Studio’s public-facing 24/7 AI Clinical Concierge. Powered by a deterministic Retrieval-Augmented Generation (RAG) architecture using **Google Gemini 768-dim embeddings (`models/gemini-embedding-001`)**, **Supabase Vector Storage (`pgvector`)**, and **Groq LLM inference (`openai/gpt-oss-20b`)**, Lumi provides instant, zero-hallucination answers to prospective and existing patients regarding clinic services, pricing schedules, HMO insurance coverage, clinic operating hours, and post-operative care guidelines.

---

## 2. Core Architecture & Data Flow

```mermaid
flowchart TD
    A[Patient / Website Visitor] -->|POST /webhook/concierge-chat| B[1. Sanitize & Guard Input\n300-char max buffer guard]
    B --> C[2. Generate Vector via Google Gemini\n768-dim embeddings]
    C --> D[3. Supabase RPC: match_clinic_knowledge\nCosine Similarity | review_status = 'approved'\nTop 2 Chunks truncated for Token Economy]
    D --> E[4. Groq Ultra-Fast Inference\nopenai/gpt-oss-20b | Sub-500ms TTFT\nStrict System Guardrails & Fallbacks]
    E --> F[5. Audit Logging & Response Dispatch\nInserts trace to concierge_conversations\nReturns JSON response to frontend widget]
    F --> A
```

```
[ Patient / Website Visitor ]
              │
              ▼ (POST /webhook/concierge-chat)
┌────────────────────────────────────────────────────────┐
│ 1. Sanitize & Guard Input (300-char max buffer guard) │
└─────────────────────────────┬──────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────┐
│ 2. Generate Vector via Google Gemini (768-dim)         │
└─────────────────────────────┬──────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────┐
│ 3. Supabase RPC match_clinic_knowledge()               │
│ • Cosine Similarity search                             │
│ • STRICT FILTER: review_status = 'approved' only       │
│ • Top 2 Chunks truncated for Token Economy             │
└─────────────────────────────┬──────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────┐
│ 4. Groq Ultra-Fast Inference (openai/gpt-oss-20b)      │
│ • Sub-500ms TTFT (Time-to-First-Token)                 │
│ • Strict System Guardrails & Fallbacks                 │
│ • Max Output: 600 tokens                               │
└─────────────────────────────┬──────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────┐
│ 5. Audit Logging & Response Dispatch                   │
│ • Inserts trace to concierge_conversations             │
│ • Returns JSON response to frontend widget             │
└────────────────────────────────────────────────────────┘
```

---

## 3. Clinical Safety, Guardrails & Token Management

### 🛡️ Strict Grounding & Zero Hallucination
Lumi answers patient inquiries **strictly** from verified, staff-approved SOP and pricing documentation ingested via Workflow 8. If an inquiry falls outside the approved context or discusses services outside Lumina Dental Studio's scope, Lumi replies verbatim:

> _"I can only answer questions related to Lumina Dental Studio's services, pricing, HMO coverage, and dental care policies. For direct inquiries, please contact our reception team at (02) 8888-LUMI (5864)."_

### 🚨 Emergency Triage Hard-Routing
Lumi is programmatically barred from providing definitive medical diagnoses or prescribing medication dosages. If severe acute red-flag symptoms are detected (uncontrolled bleeding, severe traumatic facial swelling, airway compromise, broken jaw):
* **Immediate Redirection:** Instructs the patient to seek urgent care immediately.
* **Hotline Dispatch:** Displays the **24/7 Clinical Emergency Line**: `(02) 8888-LUMI (5864)` / `+63 917 123 4567`.

### ⚡ Token Management & Performance Tuning
* **Input Buffer Capping:** User queries are sanitized and truncated to 300 characters to prevent buffer overflow attacks and prompt injection.
* **Defensive Context Injection:** Only the top 2 matched vector chunks (trimmed to ~500 characters each) are injected into the prompt.
* **Compact System Prompt:** Reduced by ~45% to save ~120 input tokens per query without sacrificing clinical voice.
* **Low-Latency Synthesis:** Uses `openai/gpt-oss-20b` on Groq, delivering sub-500ms responses at ~1,000 tokens/second.

---

## 4. Database Schema & RPC Integration

### `concierge_conversations` (Audit Log Table)
Every patient interaction is logged for clinical oversight and quality auditing:

```sql
CREATE TABLE IF NOT EXISTS concierge_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT,
  user_query TEXT NOT NULL,
  retrieved_context TEXT,
  ai_response TEXT NOT NULL,
  tokens_used INT DEFAULT 0,
  model_used TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `match_clinic_knowledge()` (Vector Search RPC)

```sql
CREATE OR REPLACE FUNCTION match_clinic_knowledge (
  query_embedding VECTOR(768),
  match_threshold FLOAT DEFAULT 0.55,
  match_count INT DEFAULT 2
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

---

## 5. API Specification

### Request
`POST https://dummyaccountbry.app.n8n.cloud/webhook/concierge-chat`

```json
{
  "query": "What should I do if bleeding continues after my wisdom tooth extraction?",
  "session_id": "session-abc-123"
}
```

### Response (`HTTP 200 OK`)

```json
{
  "status": "success",
  "bot_name": "Lumi",
  "reply": "If light bleeding continues after your wisdom tooth extraction, keep firm, steady pressure on a clean gauze pad for 45 to 60 minutes or use a moistened black tea bag over the site for 30 minutes. If severe or persistent bleeding continues, please call our 24/7 Clinical Emergency Line at (02) 8888-LUMI (5864) immediately.",
  "matched_chunks": 2,
  "session_id": "session-abc-123"
}
```

---

## 6. Frontend Integration Reference

```typescript
// Example fetch call inside Lumi chat widget
const sendMessage = async (message: string, sessionId: string) => {
  const response = await fetch("https://dummyaccountbry.app.n8n.cloud/webhook/concierge-chat", {
    method: "POST",
    headers: { 
      "Content-Type": "application/json" 
    },
    body: JSON.stringify({
      query: message,
      session_id: sessionId
    })
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data.reply;
};
```

---

## 7. Operational Roles & Scope Separation

| Patient Need | Handler Workflow | Mechanism |
| :--- | :--- | :--- |
| **General, Pricing, & Post-Op Inquiries** | **Workflow 7 (Lumi Concierge)** | 24/7 reactive AI web chat grounded in approved SOPs |
| **New Appointment Booking** | **Workflow 1 + Web Portal** | Redirects to `#booking` portal; sends booking confirmation |
| **Scheduled Post-Op Outreach** | **Workflow 3 (Post-Op Sequence)** | Proactive automated email check-in (2h and 24h post-treatment) |
| **Pre-Appointment Reminders** | **Workflow 4 (Reminders)** | Automated SMS/Email at T-24h and T-2h before appointment |
| **SOP Document Ingestion & Approval** | **Workflow 8 + Workflow 2** | Google Drive PDF parsing $\rightarrow$ 768-dim Gemini vectorization $\rightarrow$ Slack approval gate |
