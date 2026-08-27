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

-- Indexes for lightning-fast super-admin queries
CREATE INDEX IF NOT EXISTS idx_site_analytics_event_type ON public.site_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_site_analytics_created_at ON public.site_analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_site_analytics_session_id ON public.site_analytics(session_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.site_analytics ENABLE ROW LEVEL SECURITY;

-- Allow anonymous public inserts from website visitors
CREATE POLICY "Allow public insert to site_analytics"
    ON public.site_analytics
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Allow service role full read access (for Super Admin dashboard)
CREATE POLICY "Allow service role full read access to site_analytics"
    ON public.site_analytics
    FOR SELECT
    TO service_role
    USING (true);

-- Seed some realistic baseline analytics for demonstration
INSERT INTO public.site_analytics (event_type, page_path, element_id, element_text, duration_seconds, session_id, device_type, created_at)
VALUES
    ('page_view', '/', NULL, NULL, 0, 'seed-session-1', 'desktop', NOW() - INTERVAL '4 hours'),
    ('click', '/', 'button-book-now', 'Book Appointment', 0, 'seed-session-1', 'desktop', NOW() - INTERVAL '3 hours 58 minutes'),
    ('session_end', '/', NULL, NULL, 185, 'seed-session-1', 'desktop', NOW() - INTERVAL '3 hours 55 minutes'),
    ('page_view', '/', NULL, NULL, 0, 'seed-session-2', 'mobile', NOW() - INTERVAL '3 hours'),
    ('click', '/', 'lumi-chat-orb', 'Ask Lumi AI', 0, 'seed-session-2', 'mobile', NOW() - INTERVAL '2 hours 55 minutes'),
    ('session_end', '/', NULL, NULL, 240, 'seed-session-2', 'mobile', NOW() - INTERVAL '2 hours 50 minutes'),
    ('page_view', '/', NULL, NULL, 0, 'seed-session-3', 'desktop', NOW() - INTERVAL '1 hour'),
    ('click', '/', 'treatment-whitening', 'Laser Teeth Whitening', 0, 'seed-session-3', 'desktop', NOW() - INTERVAL '55 minutes'),
    ('session_end', '/', NULL, NULL, 310, 'seed-session-3', 'desktop', NOW() - INTERVAL '50 minutes');
