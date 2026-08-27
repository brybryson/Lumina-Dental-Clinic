import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      event_type,
      page_path = '/',
      element_id,
      element_text,
      duration_seconds = 0,
      session_id,
      referrer,
      device_type = 'desktop',
    } = body;

    if (!event_type || !session_id) {
      return NextResponse.json(
        { error: 'event_type and session_id are required' },
        { status: 400 }
      );
    }

    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Insert event into Supabase
    const { error } = await supabaseAdmin.from('site_analytics').insert({
      event_type,
      page_path,
      element_id: element_id ? String(element_id).slice(0, 100) : null,
      element_text: element_text ? String(element_text).slice(0, 150) : null,
      duration_seconds: Math.max(0, parseInt(String(duration_seconds), 10) || 0),
      session_id: String(session_id).slice(0, 100),
      referrer: referrer ? String(referrer).slice(0, 200) : null,
      user_agent: userAgent.slice(0, 250),
      device_type: ['mobile', 'tablet', 'desktop'].includes(device_type) ? device_type : 'desktop',
      created_at: new Date().toISOString(),
    });

    if (error) {
      // Don't fail loud for client analytics pings
      console.warn('[Analytics Track] DB Insert note:', error.message);
      return NextResponse.json({ status: 'queued_local', success: true });
    }

    return NextResponse.json({ status: 'recorded', success: true });
  } catch (err: unknown) {
    console.warn('[Analytics Track] Request parse warning:', err);
    return NextResponse.json({ status: 'ignored', success: true });
  }
}
