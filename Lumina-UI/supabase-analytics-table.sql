-- ==============================================================================
-- Lumina Dental Studio — Web Analytics & Visitor Engagement Schema
-- Tracks real-time page views, interactive clicks, and time spent per visit
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.site_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL CHECK (event_type IN ('page_view', 'click', 'session_ping', 'session_end')),
    page_path TEXT NOT NULL DEFAULT '/',
    element_id TEXT,
    element_text TEXT,
    duration_seconds INTEGER DEFAULT 0,
    session_id TEXT NOT NULL,
    referrer TEXT,
    user_agent TEXT,
    device_type TEXT DEFAULT 'desktop',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fast query indexes for Super Admin dashboard metrics
CREATE INDEX IF NOT EXISTS idx_site_analytics_event_type ON public.site_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_site_analytics_created_at ON public.site_analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_site_analytics_session_id ON public.site_analytics(session_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.site_analytics ENABLE ROW LEVEL SECURITY;

-- Safely drop existing policies if re-running
DROP POLICY IF EXISTS "Allow public insert to site_analytics" ON public.site_analytics;
DROP POLICY IF EXISTS "Allow service role full read access to site_analytics" ON public.site_analytics;
DROP POLICY IF EXISTS "Allow read access to site_analytics" ON public.site_analytics;

-- Allow anonymous public inserts from website visitors
CREATE POLICY "Allow public insert to site_analytics"
    ON public.site_analytics
    FOR INSERT
    TO anon, authenticated, service_role
    WITH CHECK (true);

-- Allow read access for Super Admin dashboard queries
CREATE POLICY "Allow read access to site_analytics"
    ON public.site_analytics
    FOR SELECT
    TO anon, authenticated, service_role
    USING (true);
