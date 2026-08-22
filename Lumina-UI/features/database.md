# Lumina Dental Studio — Backend Architecture & Automation Specification

## 1. System Overview & Tech Stack

The backend uses a hybrid event-driven architecture. **Next.js Route Handlers
(deployed on Vercel)** act as the API gateway, **Supabase** acts as the primary
relational database, and **n8n** handles external integrations (Google
Workspace, Email, and scheduled cron jobs).
