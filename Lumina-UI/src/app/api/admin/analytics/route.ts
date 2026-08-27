import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('lumina_staff_session');

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized: Session missing' }, { status: 401 });
    }

    let session: { id?: string; role?: string; email?: string } | null = null;
    try {
      session = JSON.parse(sessionCookie.value);
    } catch {
      return NextResponse.json({ error: 'Invalid session cookie' }, { status: 401 });
    }

    // Strictly enforce Super Admin access only
    if (!session || session.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Forbidden: Analytics is reserved exclusively for Super Admin' },
        { status: 403 }
      );
    }

    // Query real analytics events from Supabase
    const { data: events, error } = await supabaseAdmin
      .from('site_analytics')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1000);

    if (error) {
      console.warn('[Admin Analytics] Supabase query note:', error.message);
      return NextResponse.json({
        total_page_views: 0,
        total_clicks: 0,
        unique_visitors: 0,
        avg_duration_seconds: 0,
        bounce_rate: '0.0%',
        top_clicked_elements: [],
        device_breakdown: { desktop: 0, mobile: 0 },
        recent_events: [],
        is_live: false,
        error_message: 'Table site_analytics pending creation in Supabase SQL editor.',
      });
    }

    const allEvents = events || [];

    // Pure real metrics
    const pageViews = allEvents.filter((e) => e.event_type === 'page_view').length;
    const clicks = allEvents.filter((e) => e.event_type === 'click').length;
    const uniqueSessionIds = new Set(allEvents.map((e) => e.session_id));
    const uniqueVisitors = uniqueSessionIds.size;

    // Real average duration
    const sessionsWithDuration = allEvents.filter((e) => e.duration_seconds && e.duration_seconds > 0);
    const totalDuration = sessionsWithDuration.reduce((acc, curr) => acc + (curr.duration_seconds || 0), 0);
    const avgDurationSeconds =
      sessionsWithDuration.length > 0
        ? Math.round(totalDuration / sessionsWithDuration.length)
        : 0;

    // Real top clicked elements
    const clickEvents = allEvents.filter((e) => e.event_type === 'click' && (e.element_text || e.element_id));
    const clickCounts: Record<string, number> = {};

    clickEvents.forEach((c) => {
      const label = c.element_text || c.element_id || 'Interactive CTA';
      clickCounts[label] = (clickCounts[label] || 0) + 1;
    });

    const totalClicksCount = Math.max(1, clicks);
    const topClickedElements = Object.entries(clickCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count]) => ({
        name,
        count,
        percentage: `${Math.round((count / totalClicksCount) * 100)}%`,
      }));

    // Real device breakdown
    const mobileCount = allEvents.filter((e) => e.device_type === 'mobile').length;
    const desktopCount = allEvents.filter((e) => e.device_type === 'desktop').length;
    const totalDevices = mobileCount + desktopCount;

    const desktopPercent = totalDevices > 0 ? Math.round((desktopCount / totalDevices) * 100) : 0;
    const mobilePercent = totalDevices > 0 ? Math.round((mobileCount / totalDevices) * 100) : 0;

    // Bounce rate: % of sessions that only had 1 pageview and 0 clicks
    const sessionEventCounts: Record<string, number> = {};
    allEvents.forEach((e) => {
      sessionEventCounts[e.session_id] = (sessionEventCounts[e.session_id] || 0) + 1;
    });
    const singleEventSessions = Object.values(sessionEventCounts).filter((cnt) => cnt <= 1).length;
    const calculatedBounceRate =
      uniqueVisitors > 0 ? `${Math.round((singleEventSessions / uniqueVisitors) * 100)}%` : '0.0%';

    return NextResponse.json({
      total_page_views: pageViews,
      total_clicks: clicks,
      unique_visitors: uniqueVisitors,
      avg_duration_seconds: avgDurationSeconds,
      bounce_rate: calculatedBounceRate,
      top_clicked_elements: topClickedElements,
      device_breakdown: {
        desktop: desktopPercent,
        mobile: mobilePercent,
      },
      recent_events: allEvents.slice(0, 20),
      is_live: true,
    });
  } catch (err: unknown) {
    console.error('[Admin Analytics API] Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
